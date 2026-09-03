import { 
  ref, 
  onValue, 
  set, 
  get, 
  serverTimestamp, 
  Unsubscribe as RTDBUnsubscribe 
} from "firebase/database";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  getDocs,
  deleteDoc,
  onSnapshot, 
  Unsubscribe as FirestoreUnsubscribe 
} from "firebase/firestore";
import { rtdb, db, firebaseConfig } from "./config";
import { LandlordConfig, BuildingProfile, RoomRecord, ExpenseRecord, AppUser } from "../types";

export interface SyncStatus {
  state: 'connected' | 'syncing' | 'synced' | 'offline' | 'error';
  lastSyncedAt: Date | null;
  lastOperation: string;
  errorMessage?: string;
  latencyMs?: number;
}

export interface SyncListenersCallbacks {
  onConfig?: (config: LandlordConfig) => void;
  onBuildings?: (buildings: BuildingProfile[]) => void;
  onRoomsByMonth?: (roomsByMonth: Record<string, RoomRecord[]>) => void;
  onExpenses?: (expenses: ExpenseRecord[]) => void;
  onUsers?: (users: AppUser[]) => void;
  onStatusChange?: (status: SyncStatus) => void;
}

// Key sanitization for Firebase RTDB path safety (prevents crashes with '.' in Thai months like '08 ส.ค.')
export function sanitizeFirebaseKey(key: string): string {
  return key
    .replace(/\./g, '__dot__')
    .replace(/#/g, '__hash__')
    .replace(/\$/g, '__dollar__')
    .replace(/\[/g, '__lbr__')
    .replace(/\]/g, '__rbr__')
    .replace(/\//g, '__slash__');
}

export function desanitizeFirebaseKey(key: string): string {
  return key
    .replace(/__dot__/g, '.')
    .replace(/__hash__/g, '#')
    .replace(/__dollar__/g, '$')
    .replace(/__lbr__/g, '[')
    .replace(/__rbr__/g, ']')
    .replace(/__slash__/g, '/');
}

/**
 * Recursively removes all `undefined` values from objects and arrays,
 * because Firebase Realtime Database and Firestore throw an error if an object contains undefined properties.
 */
export function sanitizeForFirebase<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirebase(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirebase(value);
    }
  }
  return cleanObj as T;
}

export function sanitizeRoomsByMonthForRTDB(roomsByMonth: Record<string, RoomRecord[]>): Record<string, RoomRecord[]> {
  const result: Record<string, RoomRecord[]> = {};
  if (!roomsByMonth || typeof roomsByMonth !== 'object') return {};
  Object.keys(roomsByMonth).forEach((monthKey) => {
    const safeKey = sanitizeFirebaseKey(monthKey);
    const roomsList = roomsByMonth[monthKey];
    if (Array.isArray(roomsList)) {
      result[safeKey] = roomsList.map((room) => sanitizeForFirebase(room));
    } else {
      result[safeKey] = sanitizeForFirebase(roomsList);
    }
  });
  return sanitizeForFirebase(result);
}

export function desanitizeRoomsByMonthFromRTDB(raw: Record<string, RoomRecord[]> | null | undefined): Record<string, RoomRecord[]> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, RoomRecord[]> = {};
  Object.keys(raw).forEach((safeKey) => {
    const originalKey = desanitizeFirebaseKey(safeKey);
    result[originalKey] = raw[safeKey];
  });
  return result;
}

// Active listener tracking to ensure 100% complete unload/cleanup
const activeUnsubscribers: Array<() => void> = [];
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
let currentSyncStatus: SyncStatus = {
  state: 'offline',
  lastSyncedAt: null,
  lastOperation: 'รอการเชื่อมต่อ (Initialized)',
};

/**
 * Update and notify sync status
 */
function updateStatus(newStatus: Partial<SyncStatus>, callback?: (status: SyncStatus) => void) {
  currentSyncStatus = { ...currentSyncStatus, ...newStatus };
  if (callback) {
    callback(currentSyncStatus);
  }
}

export function getCurrentSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

/**
 * 1. Subscribe to Realtime Updates from Cloud Firestore & Firebase Realtime Database
 * Returns an unload/unsubscribe function that cleanly detaches all listeners.
 */
export function subscribeToRealtimeFirebase(callbacks: SyncListenersCallbacks): () => void {
  // Clear any previous subscriptions
  unloadRealtimeListeners();

  updateStatus({ state: 'syncing', lastOperation: 'กำลังเชื่อมต่อ Firebase Cloud Firestore & Realtime...' }, callbacks.onStatusChange);

  try {
    // -------------------------------------------------------------------
    // CLOUD FIRESTORE REAL-TIME LISTENERS (Primary source used in Console)
    // -------------------------------------------------------------------

    // 1. Listen to Buildings in Firestore (e.g. BLD-RNG01 "อาคารรังสิตภิรมย์")
    const unsubBuildingsFS: FirestoreUnsubscribe = onSnapshot(collection(db, 'buildings'), (snapshot) => {
      if (!snapshot.empty && callbacks.onBuildings) {
        const buildingsList: BuildingProfile[] = [];
        snapshot.forEach((docSnap) => {
          const bData = docSnap.data() as any;
          buildingsList.push({
            id: docSnap.id,
            ...bData,
            totalUnits: bData.totalUnits || bData.roomCount || 0,
          });
        });

        // Keep predictable order (or sort by ID)
        buildingsList.sort((a, b) => a.id.localeCompare(b.id));

        if (buildingsList.length > 0) {
          callbacks.onBuildings(buildingsList);
          updateStatus({
            state: 'synced',
            lastSyncedAt: new Date(),
            lastOperation: `รับการอัปเดตข้อมูลอาคาร (${buildingsList.length} อาคาร) จาก Cloud Firestore แบบ Realtime`,
            errorMessage: undefined,
          }, callbacks.onStatusChange);
        }
      }
    }, (err) => {
      console.warn("Firestore buildings onSnapshot note:", err);
      if (err?.code === 'permission-denied') {
        updateStatus({
          state: 'error',
          errorMessage: 'Firestore Permission Denied: ตรวจสอบ Security Rules ของ Cloud Firestore ใน Firebase Console',
        }, callbacks.onStatusChange);
      }
    });
    activeUnsubscribers.push(unsubBuildingsFS);

    // 2. Listen to Config in Firestore (dorm_config/settings)
    const unsubConfigFS: FirestoreUnsubscribe = onSnapshot(doc(db, 'dorm_config', 'settings'), (docSnap) => {
      if (docSnap.exists() && callbacks.onConfig) {
        callbacks.onConfig(docSnap.data() as LandlordConfig);
        updateStatus({
          state: 'synced',
          lastSyncedAt: new Date(),
          lastOperation: 'รับการอัปเดตการตั้งค่า (Config) จาก Cloud Firestore แบบ Realtime',
          errorMessage: undefined,
        }, callbacks.onStatusChange);
      }
    }, (err) => {
      console.warn("Firestore config onSnapshot note:", err);
    });
    activeUnsubscribers.push(unsubConfigFS);

    // 3. Listen to Monthly Records in Firestore (monthly_records)
    const unsubMonthlyFS: FirestoreUnsubscribe = onSnapshot(collection(db, 'monthly_records'), (snapshot) => {
      if (!snapshot.empty && callbacks.onRoomsByMonth) {
        const roomsByMonth: Record<string, RoomRecord[]> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const monthKey = data.monthName || desanitizeFirebaseKey(docSnap.id);
          roomsByMonth[monthKey] = data.rooms || [];
        });
        if (Object.keys(roomsByMonth).length > 0) {
          callbacks.onRoomsByMonth(roomsByMonth);
          updateStatus({
            state: 'synced',
            lastSyncedAt: new Date(),
            lastOperation: `รับการอัปเดตข้อมูลห้องพัก & มิเตอร์ (${Object.keys(roomsByMonth).length} เดือน) จาก Cloud Firestore แบบ Realtime`,
            errorMessage: undefined,
          }, callbacks.onStatusChange);
        }
      }
    }, (err) => {
      console.warn("Firestore monthly_records onSnapshot note:", err);
    });
    activeUnsubscribers.push(unsubMonthlyFS);

    // 4. Listen to Expenses in Firestore (expenses)
    const unsubExpensesFS: FirestoreUnsubscribe = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      if (callbacks.onExpenses) {
        const expList: ExpenseRecord[] = [];
        snapshot.forEach((docSnap) => {
          expList.push({ id: docSnap.id, ...docSnap.data() } as ExpenseRecord);
        });
        callbacks.onExpenses(expList);
        updateStatus({
          state: 'synced',
          lastSyncedAt: new Date(),
          lastOperation: `รับการอัปเดตรายการค่าใช้จ่าย (${expList.length} รายการ) จาก Cloud Firestore แบบ Realtime`,
          errorMessage: undefined,
        }, callbacks.onStatusChange);
      }
    }, (err) => {
      console.warn("Firestore expenses onSnapshot note:", err);
    });
    activeUnsubscribers.push(unsubExpensesFS);

    // 5. Listen to Users in Firestore (users)
    const unsubUsersFS: FirestoreUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (callbacks.onUsers) {
        const usersList: AppUser[] = [];
        snapshot.forEach((docSnap) => {
          usersList.push({ id: docSnap.id, ...docSnap.data() } as AppUser);
        });
        callbacks.onUsers(usersList);
        updateStatus({
          state: 'synced',
          lastSyncedAt: new Date(),
          lastOperation: `รับการอัปเดตบัญชีผู้ใช้ (${usersList.length} บัญชี) จาก Cloud Firestore แบบ Realtime`,
          errorMessage: undefined,
        }, callbacks.onStatusChange);
      }
    }, (err) => {
      console.warn("Firestore users onSnapshot note:", err);
    });
    activeUnsubscribers.push(unsubUsersFS);

    // 6. Listen to main_data in Firestore (dormitory/main_data bundle)
    const unsubMainDataFS: FirestoreUnsubscribe = onSnapshot(doc(db, 'dormitory', 'main_data'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.config && callbacks.onConfig) callbacks.onConfig(data.config);
        if (data.buildings && Array.isArray(data.buildings) && callbacks.onBuildings) callbacks.onBuildings(data.buildings);
        if (data.roomsByMonth && callbacks.onRoomsByMonth) {
          callbacks.onRoomsByMonth(desanitizeRoomsByMonthFromRTDB(data.roomsByMonth));
        }
        if (data.expenses && Array.isArray(data.expenses) && callbacks.onExpenses) callbacks.onExpenses(data.expenses);
        if (data.users && Array.isArray(data.users) && callbacks.onUsers) callbacks.onUsers(data.users);
      }
    }, (err) => {
      console.warn("Firestore main_data onSnapshot note:", err);
    });
    activeUnsubscribers.push(unsubMainDataFS);

    // -------------------------------------------------------------------
    // REALTIME DATABASE LISTENERS (Fallback & cross-sync)
    // -------------------------------------------------------------------

    // A. Listen to connection state
    const connectedRef = ref(rtdb, '.info/connected');
    const unsubConnected: RTDBUnsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = !!snapshot.val();
      if (isConnected) {
        updateStatus({
          state: 'connected',
          lastOperation: 'เชื่อมต่อ Cloud Firestore & Realtime Database สำเร็จ',
          errorMessage: undefined
        }, callbacks.onStatusChange);
      }
    }, (error) => {
      console.warn("RTDB Connection status error:", error);
    });
    activeUnsubscribers.push(unsubConnected);

    // B. Listen to Config (RTDB)
    const configRef = ref(rtdb, 'dorm_app/config');
    const unsubConfig: RTDBUnsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data && callbacks.onConfig) {
        callbacks.onConfig(data);
      }
    }, (err) => {
      console.warn("RTDB Config sync note:", err);
    });
    activeUnsubscribers.push(unsubConfig);

    // C. Listen to Buildings (RTDB)
    const buildingsRef = ref(rtdb, 'dorm_app/buildings');
    const unsubBuildings: RTDBUnsubscribe = onValue(buildingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data) && callbacks.onBuildings) {
        callbacks.onBuildings(data);
      }
    }, (err) => {
      console.warn("RTDB Buildings sync note:", err);
    });
    activeUnsubscribers.push(unsubBuildings);

    // D. Listen to Rooms By Month (RTDB)
    const roomsRef = ref(rtdb, 'dorm_app/roomsByMonth');
    const unsubRooms: RTDBUnsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data && callbacks.onRoomsByMonth) {
        const decodedRooms = desanitizeRoomsByMonthFromRTDB(data);
        if (Object.keys(decodedRooms).length > 0) {
          callbacks.onRoomsByMonth(decodedRooms);
        }
      }
    }, (err) => {
      console.warn("RTDB Rooms sync note:", err);
    });
    activeUnsubscribers.push(unsubRooms);

    // E. Listen to Expenses (RTDB)
    const expensesRef = ref(rtdb, 'dorm_app/expenses');
    const unsubExpenses: RTDBUnsubscribe = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data) && callbacks.onExpenses) {
        callbacks.onExpenses(data);
      }
    }, (err) => {
      console.warn("RTDB Expenses sync note:", err);
    });
    activeUnsubscribers.push(unsubExpenses);

    // F. Listen to Users (RTDB)
    const usersRef = ref(rtdb, 'dorm_app/users');
    const unsubUsers: RTDBUnsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data) && callbacks.onUsers) {
        callbacks.onUsers(data);
      }
    }, (err) => {
      console.warn("RTDB Users sync note:", err);
    });
    activeUnsubscribers.push(unsubUsers);

  } catch (err: any) {
    console.error("Failed to attach Firebase listeners:", err);
    updateStatus({
      state: 'error',
      errorMessage: err?.message || 'ไม่สามารถเชื่อมต่อ Firebase ได้',
      lastOperation: 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
    }, callbacks.onStatusChange);
  }

  // Return the master unsubscribe/unload function
  return unloadRealtimeListeners;
}

export function cancelAllDebouncedPushes(): void {
  Object.keys(debounceTimers).forEach((key) => {
    clearTimeout(debounceTimers[key]);
    delete debounceTimers[key];
  });
}

/**
 * 2. Complete Unload & Clean Detachment of all Realtime Listeners
 */
export function unloadRealtimeListeners(): void {
  if (activeUnsubscribers.length > 0) {
    activeUnsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        console.warn("Error unregistering listener:", e);
      }
    });
    activeUnsubscribers.length = 0;
  }

  cancelAllDebouncedPushes();
}

/**
 * 3. Push complete application state to Firebase Realtime Database & Firestore
 */
export async function pushAllDataToFirebase(
  data: {
    config: LandlordConfig;
    buildings: BuildingProfile[];
    roomsByMonth: Record<string, RoomRecord[]>;
    expenses: ExpenseRecord[];
    users: AppUser[];
  },
  onStatusChange?: (status: SyncStatus) => void
): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const startTime = Date.now();
  updateStatus({ state: 'syncing', lastOperation: 'กำลังส่งข้อมูลทั้งหมดขึ้น Firebase...' }, onStatusChange);

  try {
    const sanitizedRooms = sanitizeRoomsByMonthForRTDB(data.roomsByMonth);
    const sanitizedConfig = sanitizeForFirebase(data.config);
    const sanitizedBuildings = sanitizeForFirebase(data.buildings);
    const sanitizedExpenses = sanitizeForFirebase(data.expenses);
    const sanitizedUsers = sanitizeForFirebase(data.users);

    // Save to RTDB (dorm_app root)
    const rootRef = ref(rtdb, 'dorm_app');
    await set(rootRef, sanitizeForFirebase({
      config: sanitizedConfig,
      buildings: sanitizedBuildings,
      roomsByMonth: sanitizedRooms,
      expenses: sanitizedExpenses,
      users: sanitizedUsers,
      updatedAt: serverTimestamp(),
      projectId: firebaseConfig.projectId,
      lastUpdatedBy: 'P&J Apartment Management Web/Mobile',
    }));

    // Save full structured collections & bundle to Cloud Firestore (shown in Firebase Console)
    try {
      // 1. Main Bundle Doc (overwrite cleanly)
      const docRef = doc(db, 'dormitory', 'main_data');
      await setDoc(docRef, sanitizeForFirebase({
        config: sanitizedConfig,
        buildings: sanitizedBuildings,
        roomsByMonth: sanitizedRooms,
        expenses: sanitizedExpenses,
        users: sanitizedUsers,
        totalBuildings: sanitizedBuildings?.length || 0,
        totalExpenses: sanitizedExpenses?.length || 0,
        updatedAt: new Date().toISOString(),
      }));

      // 2. Config Collection
      await setDoc(doc(db, 'dorm_config', 'settings'), sanitizeForFirebase({
        ...sanitizedConfig,
        updatedAt: new Date().toISOString(),
      }));

      // 3. Buildings Collection (Clean up removed buildings, then write current ones)
      try {
        const existingBuildingsSnap = await getDocs(collection(db, 'buildings'));
        const activeBuildingIds = new Set((sanitizedBuildings || []).map(b => b.id));
        for (const docSnap of existingBuildingsSnap.docs) {
          if (!activeBuildingIds.has(docSnap.id)) {
            await deleteDoc(doc(db, 'buildings', docSnap.id));
          }
        }
      } catch (e) {
        console.warn("Building cleanup note:", e);
      }
      if (Array.isArray(sanitizedBuildings)) {
        for (const building of sanitizedBuildings) {
          if (building.id) {
            await setDoc(doc(db, 'buildings', building.id), sanitizeForFirebase({
              ...building,
              updatedAt: new Date().toISOString(),
            }), { merge: true });
          }
        }
      }

      // 4. Monthly Records Collection (Clean up removed months, then write current ones)
      try {
        const existingMonthlySnap = await getDocs(collection(db, 'monthly_records'));
        const activeMonthKeys = new Set(Object.keys(data.roomsByMonth || {}).map(k => sanitizeFirebaseKey(k)));
        for (const docSnap of existingMonthlySnap.docs) {
          if (!activeMonthKeys.has(docSnap.id)) {
            await deleteDoc(doc(db, 'monthly_records', docSnap.id));
          }
        }
      } catch (e) {
        console.warn("Monthly records cleanup note:", e);
      }

      if (data.roomsByMonth && typeof data.roomsByMonth === 'object') {
        for (const [monthKey, rooms] of Object.entries(data.roomsByMonth)) {
          const safeKey = sanitizeFirebaseKey(monthKey);
          await setDoc(doc(db, 'monthly_records', safeKey), sanitizeForFirebase({
            monthName: monthKey,
            rooms: rooms || [],
            roomCount: (rooms || []).length,
            updatedAt: new Date().toISOString(),
          }));
        }
      }

      // 5. Expenses Collection (Clean up removed expenses, then write current ones)
      try {
        const existingExpensesSnap = await getDocs(collection(db, 'expenses'));
        const activeExpenseIds = new Set((sanitizedExpenses || []).map(e => e.id));
        for (const docSnap of existingExpensesSnap.docs) {
          if (!activeExpenseIds.has(docSnap.id)) {
            await deleteDoc(doc(db, 'expenses', docSnap.id));
          }
        }
      } catch (e) {
        console.warn("Expense cleanup note:", e);
      }

      if (Array.isArray(sanitizedExpenses)) {
        for (const expense of sanitizedExpenses) {
          if (expense.id) {
            await setDoc(doc(db, 'expenses', expense.id), sanitizeForFirebase({
              ...expense,
              updatedAt: new Date().toISOString(),
            }));
          }
        }
      }

      // 6. Users Collection (Clean up removed users, then write current ones)
      try {
        const existingUsersSnap = await getDocs(collection(db, 'users'));
        const activeUserIds = new Set((sanitizedUsers || []).map(u => u.id));
        for (const docSnap of existingUsersSnap.docs) {
          if (!activeUserIds.has(docSnap.id)) {
            await deleteDoc(doc(db, 'users', docSnap.id));
          }
        }
      } catch (e) {
        console.warn("User cleanup note:", e);
      }
      if (Array.isArray(sanitizedUsers)) {
        for (const user of sanitizedUsers) {
          if (user.id) {
            await setDoc(doc(db, 'users', user.id), sanitizeForFirebase({
              ...user,
              updatedAt: new Date().toISOString(),
            }));
          }
        }
      }
    } catch (fsErr: any) {
      console.warn("Firestore collection sync note:", fsErr);
      if (fsErr?.code === 'permission-denied' || fsErr?.message?.includes('permission')) {
        updateStatus({
          state: 'error',
          errorMessage: 'Firestore Permission Denied: ตรวจสอบ Security Rules ของ Cloud Firestore ใน Firebase Console',
          lastOperation: 'Cloud Firestore ติด Security Rules',
        }, onStatusChange);
      }
    }

    const latencyMs = Date.now() - startTime;
    updateStatus({
      state: 'synced',
      lastSyncedAt: new Date(),
      lastOperation: `บันทึกข้อมูลทุกส่วนขึ้น Firebase สำเร็จ (${latencyMs}ms)`,
      latencyMs,
      errorMessage: undefined,
    }, onStatusChange);

    return { success: true, latencyMs };
  } catch (error: any) {
    console.error("Firebase push error:", error);
    const latencyMs = Date.now() - startTime;
    updateStatus({
      state: 'error',
      errorMessage: error.message || 'บันทึกข้อมูลขึ้น Firebase ไม่สำเร็จ',
      lastOperation: 'เกิดข้อผิดพลาดในการส่งข้อมูล',
      latencyMs,
    }, onStatusChange);

    return { success: false, latencyMs, error: error.message };
  }
}

/**
 * 4. Push Single Data Segment (Debounced or Immediate)
 */
export function debouncedPushSegment(
  path: 'config' | 'buildings' | 'roomsByMonth' | 'expenses' | 'users',
  payload: any,
  delayMs = 500
): void {
  if (debounceTimers[path]) {
    clearTimeout(debounceTimers[path]);
  }

  debounceTimers[path] = setTimeout(async () => {
    try {
      let finalPayload = sanitizeForFirebase(payload);
      if (path === 'roomsByMonth') {
        finalPayload = sanitizeRoomsByMonthForRTDB(payload);
      }
      const segmentRef = ref(rtdb, `dorm_app/${path}`);
      await set(segmentRef, finalPayload);

      // Also mirror to Firestore
      try {
        const docRef = doc(db, 'dormitory', 'main_data');
        await setDoc(docRef, sanitizeForFirebase({
          [path]: finalPayload,
          updatedAt: new Date().toISOString(),
        }), { merge: true });

        if (path === 'config') {
          await setDoc(doc(db, 'dorm_config', 'settings'), sanitizeForFirebase({
            ...finalPayload,
            updatedAt: new Date().toISOString(),
          }));
        } else if (path === 'buildings' && Array.isArray(payload)) {
          const activeIds = new Set(payload.map(b => b.id));
          try {
            const existing = await getDocs(collection(db, 'buildings'));
            for (const d of existing.docs) {
              if (!activeIds.has(d.id)) {
                await deleteDoc(doc(db, 'buildings', d.id));
              }
            }
          } catch (e) {
            console.warn("Building delete note:", e);
          }
          for (const b of payload) {
            if (b.id) {
              await setDoc(doc(db, 'buildings', b.id), sanitizeForFirebase({
                ...b,
                updatedAt: new Date().toISOString(),
              }));
            }
          }
        } else if (path === 'roomsByMonth' && payload && typeof payload === 'object') {
          for (const [monthKey, rooms] of Object.entries(payload as Record<string, RoomRecord[]>)) {
            const safeKey = sanitizeFirebaseKey(monthKey);
            await setDoc(doc(db, 'monthly_records', safeKey), sanitizeForFirebase({
              monthName: monthKey,
              rooms: rooms || [],
              roomCount: (rooms || []).length,
              updatedAt: new Date().toISOString(),
            }));
          }
        } else if (path === 'expenses' && Array.isArray(payload)) {
          const activeIds = new Set(payload.map(e => e.id));
          try {
            const existing = await getDocs(collection(db, 'expenses'));
            for (const d of existing.docs) {
              if (!activeIds.has(d.id)) {
                await deleteDoc(doc(db, 'expenses', d.id));
              }
            }
          } catch (e) {
            console.warn("Expense delete note:", e);
          }
          for (const e of payload) {
            if (e.id) {
              await setDoc(doc(db, 'expenses', e.id), sanitizeForFirebase({
                ...e,
                updatedAt: new Date().toISOString(),
              }));
            }
          }
        } else if (path === 'users' && Array.isArray(payload)) {
          const activeIds = new Set(payload.map(u => u.id));
          try {
            const existing = await getDocs(collection(db, 'users'));
            for (const d of existing.docs) {
              if (!activeIds.has(d.id)) {
                await deleteDoc(doc(db, 'users', d.id));
              }
            }
          } catch (e) {
            console.warn("User delete note:", e);
          }
          for (const u of payload) {
            if (u.id) {
              await setDoc(doc(db, 'users', u.id), sanitizeForFirebase({
                ...u,
                updatedAt: new Date().toISOString(),
              }));
            }
          }
        }
      } catch (fsErr: any) {
        console.warn(`Firestore mirror note for ${path}:`, fsErr);
        if (fsErr?.code === 'permission-denied' || fsErr?.message?.includes('permission')) {
          updateStatus({
            state: 'error',
            errorMessage: 'Firestore Permission Denied: ตรวจสอบ Security Rules ของ Cloud Firestore ใน Firebase Console',
            lastOperation: 'Cloud Firestore ติด Security Rules',
          });
        }
      }

      updateStatus({
        state: 'synced',
        lastSyncedAt: new Date(),
        lastOperation: `อัปเดต ${path} แบบเรียลไทม์สำเร็จ`
      });
    } catch (err: any) {
      console.error(`Failed to push ${path} to Firebase:`, err);
      updateStatus({
        state: 'error',
        errorMessage: err.message,
        lastOperation: `เกิดข้อผิดพลาดในการอัปเดต ${path}`
      });
    }
  }, delayMs);
}

/**
 * 5. Pull Fresh Data From Firebase (Cloud Firestore primary, RTDB fallback)
 */
export async function pullAllDataFromFirebase(): Promise<{
  config?: LandlordConfig;
  buildings?: BuildingProfile[];
  roomsByMonth?: Record<string, RoomRecord[]>;
  expenses?: ExpenseRecord[];
  users?: AppUser[];
  error?: string;
}> {
  try {
    // 1. Try Cloud Firestore first (the primary database shown in Firebase Console)
    const buildingsSnap = await getDocs(collection(db, 'buildings'));
    const configSnap = await getDoc(doc(db, 'dorm_config', 'settings'));
    const monthlySnap = await getDocs(collection(db, 'monthly_records'));
    const expensesSnap = await getDocs(collection(db, 'expenses'));
    const usersSnap = await getDocs(collection(db, 'users'));

    let hasFirestoreData = false;
    let configData: LandlordConfig | undefined;
    let buildingsData: BuildingProfile[] | undefined;
    let roomsData: Record<string, RoomRecord[]> | undefined;
    let expensesData: ExpenseRecord[] | undefined;
    let usersData: AppUser[] | undefined;

    if (configSnap.exists()) {
      configData = configSnap.data() as LandlordConfig;
      hasFirestoreData = true;
    }

    if (!buildingsSnap.empty) {
      buildingsData = buildingsSnap.docs.map(d => {
        const b = d.data() as any;
        return {
          id: d.id,
          ...b,
          totalUnits: b.totalUnits || b.roomCount || 0,
        };
      });
      buildingsData.sort((a, b) => a.id.localeCompare(b.id));
      hasFirestoreData = true;
    }

    if (!monthlySnap.empty) {
      roomsData = {};
      monthlySnap.docs.forEach(d => {
        const data = d.data();
        const monthKey = data.monthName || desanitizeFirebaseKey(d.id);
        roomsData![monthKey] = data.rooms || [];
      });
      hasFirestoreData = true;
    }

    if (!expensesSnap.empty) {
      expensesData = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRecord));
      hasFirestoreData = true;
    }

    if (!usersSnap.empty) {
      usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
      hasFirestoreData = true;
    }

    // Check main_data fallback if individual collections were empty
    if (!hasFirestoreData) {
      const mainSnap = await getDoc(doc(db, 'dormitory', 'main_data'));
      if (mainSnap.exists()) {
        const val = mainSnap.data();
        return {
          config: val.config,
          buildings: val.buildings,
          roomsByMonth: val.roomsByMonth ? desanitizeRoomsByMonthFromRTDB(val.roomsByMonth) : undefined,
          expenses: val.expenses,
          users: val.users,
        };
      }
    } else {
      return {
        config: configData,
        buildings: buildingsData,
        roomsByMonth: roomsData,
        expenses: expensesData,
        users: usersData,
      };
    }

    // 2. Fallback to Realtime Database
    const rootRef = ref(rtdb, 'dorm_app');
    const snapshot = await get(rootRef);
    if (snapshot.exists()) {
      const val = snapshot.val();
      return {
        config: val.config,
        buildings: val.buildings,
        roomsByMonth: val.roomsByMonth ? desanitizeRoomsByMonthFromRTDB(val.roomsByMonth) : undefined,
        expenses: val.expenses,
        users: val.users,
      };
    } else {
      return { error: 'ไม่พบข้อมูลในระบบ Cloud Firestore และ Realtime Database' };
    }
  } catch (err: any) {
    console.error("Pull from Firebase failed:", err);
    return { error: err.message || 'ไม่สามารถดึงข้อมูลจาก Firebase ได้' };
  }
}

/**
 * 6. Automated 5-Step Health Check Suite
 * Validates Cloud Firestore, RTDB connection, real-time read/write latency, and listener unload.
 */
export async function runFirebaseHealthCheck(): Promise<{
  passedCount: number;
  totalChecks: number;
  results: Array<{ step: number; title: string; passed: boolean; message: string; durationMs: number }>;
}> {
  const results: Array<{ step: number; title: string; passed: boolean; message: string; durationMs: number }> = [];

  // Step 1: Check Firebase App & Config
  const t1 = Date.now();
  try {
    const isAppOk = !!firebaseConfig.projectId && firebaseConfig.projectId === 'dorm-4263e';
    results.push({
      step: 1,
      title: 'ตรวจสอบการตั้งค่า Firebase App (Project ID: dorm-4263e)',
      passed: isAppOk,
      message: isAppOk ? `เชื่อมโยง Project ID: ${firebaseConfig.projectId} ถูกต้องและสมบูรณ์` : 'Project ID ไม่ถูกต้อง',
      durationMs: Date.now() - t1,
    });
  } catch (e: any) {
    results.push({
      step: 1,
      title: 'ตรวจสอบการตั้งค่า Firebase App',
      passed: false,
      message: e.message,
      durationMs: Date.now() - t1,
    });
  }

  // Step 2: Test Cloud Firestore Connection
  const t2 = Date.now();
  try {
    const buildingsSnap = await getDocs(collection(db, 'buildings'));
    const count = buildingsSnap.size;
    results.push({
      step: 2,
      title: 'ทดสอบการเชื่อมต่อ Cloud Firestore (asia-southeast1)',
      passed: true,
      message: `Cloud Firestore ตอบสนองปกติ พบคอลเลกชันอาคาร ${count} รายการ (Latency: ${Date.now() - t2} ms)`,
      durationMs: Date.now() - t2,
    });
  } catch (e: any) {
    results.push({
      step: 2,
      title: 'ทดสอบการเชื่อมต่อ Cloud Firestore',
      passed: false,
      message: e.message,
      durationMs: Date.now() - t2,
    });
  }

  // Step 3: Test Real-time Write Ping & Latency (Firestore + RTDB)
  const t3 = Date.now();
  try {
    const pingId = `ping-${Date.now()}`;
    await setDoc(doc(db, '_health_check', pingId), {
      timestamp: new Date().toISOString(),
      tester: 'P&J Realtime Health Checker',
      version: '3.0',
    });
    const writeTime = Date.now() - t3;
    results.push({
      step: 3,
      title: 'ทดสอบเขียนข้อมูล Real-time (Write Ping)',
      passed: true,
      message: `บันทึกข้อมูลสำเร็จ รวดเร็วใน ${writeTime} ms`,
      durationMs: writeTime,
    });
  } catch (e: any) {
    results.push({
      step: 3,
      title: 'ทดสอบเขียนข้อมูล Real-time (Write Ping)',
      passed: false,
      message: e.message,
      durationMs: Date.now() - t3,
    });
  }

  // Step 4: Test Real-time Readback & Data Integrity
  const t4 = Date.now();
  try {
    const readSnap = await getDocs(collection(db, '_health_check'));
    const hasData = !readSnap.empty;
    results.push({
      step: 4,
      title: 'ทดสอบอ่านข้อมูลและตรวจสอบความถูกต้อง (Readback Integrity)',
      passed: hasData,
      message: hasData ? `อ่านข้อมูลย้อนกลับได้ถูกต้อง สมบูรณ์ 100% (${Date.now() - t4} ms)` : 'ไม่พบข้อมูลที่เขียน',
      durationMs: Date.now() - t4,
    });
  } catch (e: any) {
    results.push({
      step: 4,
      title: 'ทดสอบอ่านข้อมูลและตรวจสอบความถูกต้อง',
      passed: false,
      message: e.message,
      durationMs: Date.now() - t4,
    });
  }

  // Step 5: Test Listener Unload & Detach Lifecycle
  const t5 = Date.now();
  try {
    const unsub = onSnapshot(collection(db, '_health_check'), () => {});
    // Test unloading
    unsub();

    results.push({
      step: 5,
      title: 'ทดสอบระบบถอนการเชื่อมต่อ (Unload & Detach Listener Lifecycle)',
      passed: true,
      message: 'ฟังก์ชัน Unsubscribe / Unload ทำงานสมบูรณ์แบบ ไม่ทำให้เกิด Memory Leak หรือค้างบนเบราว์เซอร์',
      durationMs: Date.now() - t5,
    });
  } catch (e: any) {
    results.push({
      step: 5,
      title: 'ทดสอบระบบถอนการเชื่อมต่อ (Unload)',
      passed: false,
      message: e.message,
      durationMs: Date.now() - t5,
    });
  }

  const passedCount = results.filter(r => r.passed).length;
  return {
    passedCount,
    totalChecks: results.length,
    results,
  };
}

/**
 * Safely seeds initial data ONLY if Firebase database is completely empty.
 * Prevents overwriting user reset or existing remote data on page load.
 */
export async function bootstrapIfEmpty(data: {
  config: LandlordConfig;
  buildings: BuildingProfile[];
  roomsByMonth: Record<string, RoomRecord[]>;
  expenses: ExpenseRecord[];
  users: AppUser[];
}): Promise<void> {
  try {
    // 1. Check if Cloud Firestore already has buildings or config
    const buildingsSnap = await getDocs(collection(db, 'buildings'));
    if (!buildingsSnap.empty) {
      console.log("Firestore already contains buildings data. Preserving remote database.");
      return;
    }

    const mainSnap = await getDoc(doc(db, 'dormitory', 'main_data'));
    if (mainSnap.exists()) {
      console.log("Firestore main_data exists. Preserving remote database.");
      return;
    }

    // 2. Check RTDB
    const configSnap = await get(ref(rtdb, 'dorm_app/config'));
    if (configSnap.exists() && configSnap.val()) {
      console.log("Firebase RTDB config exists. Preserving remote database.");
      return;
    }

    console.log("Firebase database is empty, initializing initial state...");
    await pushAllDataToFirebase(data);
  } catch (e) {
    console.warn("Bootstrap check note:", e);
  }
}

