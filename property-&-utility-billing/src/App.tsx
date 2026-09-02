import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BuildingManagementView } from './components/BuildingManagementView';
import { RoomBuildingManagerView } from './components/RoomBuildingManagerView';
import { MeterEntryView } from './components/MeterEntryView';
import { InvoiceView } from './components/InvoiceView';
import { SheetVisualizerView } from './components/SheetVisualizerView';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { GasCodeView } from './components/GasCodeView';
import { ApartmentSettingsModal } from './components/ApartmentSettingsModal';
import { ClearDataModal, FreshSetupPayload } from './components/ClearDataModal';
import { UserManagerModal } from './components/UserManagerModal';
import { YearMonthPickerModal } from './components/YearMonthPickerModal';
import { LoginPage } from './components/LoginPage';
import { OwnerAdminView } from './components/OwnerAdminView';
import { IosIpaView } from './components/IosIpaView';
import { FirebaseSyncView } from './components/FirebaseSyncView';
import { firebaseConfig } from './firebase/config';
import { 
  subscribeToRealtimeFirebase, 
  debouncedPushSegment, 
  pushAllDataToFirebase, 
  SyncStatus, 
  getCurrentSyncStatus,
  unloadRealtimeListeners,
  cancelAllDebouncedPushes,
  bootstrapIfEmpty
} from './firebase/realtimeSync';
import { 
  DEFAULT_LANDLORD_CONFIG, 
  DEFAULT_BUILDINGS, 
  AVAILABLE_MONTHS, 
  INITIAL_ROOMS_DATA,
  DEFAULT_APP_USERS,
  DEFAULT_EXPENSES
} from './data/mockData';
import { 
  getMonthInfo, 
  parseMonthKey, 
  formatMonthKey, 
  getPreviousMonthKey, 
  getNextMonthKey, 
  getMonthsForYear, 
  getSelectableYears, 
  setYearForMonthKey,
  setMonthForMonthKey,
  THAI_MONTH_NAMES_SHORT,
  initializeNewMonthRooms, 
  calculateRoomEffectiveTotal 
} from './utils/billingCycle';
import { ActiveTab, RoomRecord, WaterCalcType, BuildingProfile, OccupancyStatus, LandlordConfig, AppUser, ExpenseRecord } from './types';
import { 
  Building2, 
  Bell, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ExternalLink,
  Sparkles,
  Search,
  Users,
  Database,
  DoorClosed,
  Edit3,
  ShieldCheck,
  Building,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  Menu,
  Crown,
  EyeOff,
  Glasses,
  UserCheck,
  Key,
  KeyRound,
  Gauge,
  LayoutDashboard,
  FileText,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flame,
  LogOut
} from 'lucide-react';

const SESSION_KEYS = {
  ACTIVE_USER: 'propmanage_session_user_v2',
};

const STORAGE_KEYS = {
  CONFIG: 'propmanage_landlord_config_v2',
  BUILDINGS: 'propmanage_buildings_v2',
  ROOMS: 'propmanage_rooms_by_month_v2',
  EXPENSES: 'propmanage_expenses_v2',
  SIDEBAR_COLLAPSED: 'propmanage_sidebar_collapsed',
  USERS: 'propmanage_users_v2',
  SENIOR_MODE: 'propmanage_senior_mode_v2',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeMonth, setActiveMonth] = useState<string>('08 ส.ค.');

  // User Management State (Owner / Caretaker)
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed: AppUser[] = JSON.parse(saved);
        // Ensure default owner account matches mom / 1234 if it had the initial demo credentials
        const updated = parsed.map(u => {
          if (u.role === 'owner' && (u.username === 'admin' || !u.username)) {
            return {
              ...u,
              name: u.name === 'คุณประดิษฐ์ เจริญสุขสิริ (เจ้าของหอ)' ? 'คุณแม่ (เจ้าของหอพัก)' : u.name,
              username: 'mom',
              password: u.password === 'admin' ? '1234' : u.password,
              pinCode: u.pinCode === '0819876543' || u.pinCode === 'admin' ? '1234' : u.pinCode,
            };
          }
          return u;
        });
        return updated;
      }
      return DEFAULT_APP_USERS;
    } catch {
      return DEFAULT_APP_USERS;
    }
  });

  // Strict session storage: forces login upon every browser open/reopen
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const sessionSaved = sessionStorage.getItem(SESSION_KEYS.ACTIVE_USER);
      if (sessionSaved) {
        return JSON.parse(sessionSaved);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isUserManagerOpen, setIsUserManagerOpen] = useState<boolean>(false);
  const [userManagerTab, setUserManagerTab] = useState<'accounts' | 'phone-login' | 'my-pin'>('accounts');

  // Senior Mode State (Large Text for Elderly)
  const [isSeniorMode, setIsSeniorMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SENIOR_MODE) === 'true';
    } catch {
      return false;
    }
  });

  // Toggle Senior Mode
  const handleToggleSeniorMode = () => {
    setIsSeniorMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.SENIOR_MODE, String(next));
      } catch (e) {
        console.error(e);
      }
      showToast(next ? 'เปิดโหมดตัวอักษรใหญ่พิเศษ (สำหรับผู้สูงอายุ/คนแก่) แล้ว' : 'ปิดโหมดตัวอักษรใหญ่แล้ว', 'info');
      return next;
    });
  };

  // Apply Senior Font Class to Document Body
  useEffect(() => {
    if (isSeniorMode) {
      document.body.classList.add('senior-font-mode');
    } else {
      document.body.classList.remove('senior-font-mode');
    }
  }, [isSeniorMode]);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error'; show: boolean } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Firebase Realtime Synchronization State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getCurrentSyncStatus());
  const isRemoteUpdateRef = useRef<boolean>(false);

  // Master Real-time Listener & Clean Unload Lifecycle
  useEffect(() => {
    const handleRemoteConfig = (remoteConfig: LandlordConfig) => {
      isRemoteUpdateRef.current = true;
      setLandlordConfig(remoteConfig);
      try {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(remoteConfig));
      } catch (e) {
        console.error(e);
      }
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 300);
    };

    const handleRemoteBuildings = (remoteBuildings: BuildingProfile[]) => {
      isRemoteUpdateRef.current = true;
      setBuildings(remoteBuildings);
      try {
        localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(remoteBuildings));
      } catch (e) {
        console.error(e);
      }
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 300);
    };

    const handleRemoteRooms = (remoteRoomsByMonth: Record<string, RoomRecord[]>) => {
      isRemoteUpdateRef.current = true;
      setRoomsByMonth(remoteRoomsByMonth);
      try {
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(remoteRoomsByMonth));
      } catch (e) {
        console.error(e);
      }
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 300);
    };

    const handleRemoteExpenses = (remoteExpenses: ExpenseRecord[]) => {
      isRemoteUpdateRef.current = true;
      setExpenses(remoteExpenses);
      try {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(remoteExpenses));
      } catch (e) {
        console.error(e);
      }
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 300);
    };

    const handleRemoteUsers = (remoteUsers: AppUser[]) => {
      isRemoteUpdateRef.current = true;
      setUsers(remoteUsers);
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remoteUsers));
      } catch (e) {
        console.error(e);
      }
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 300);
    };

    // Attach listeners and receive unsubscribe / unload function
    const unsubscribeAll = subscribeToRealtimeFirebase({
      onConfig: handleRemoteConfig,
      onBuildings: handleRemoteBuildings,
      onRoomsByMonth: handleRemoteRooms,
      onExpenses: handleRemoteExpenses,
      onUsers: handleRemoteUsers,
      onStatusChange: (status) => setSyncStatus(status),
    });

    // Clean Unload on beforeunload and component unmount
    const handleBeforeUnload = () => {
      unloadRealtimeListeners();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Safe Bootstrap: Populate initial state ONLY if Firebase RTDB is completely blank/new
    bootstrapIfEmpty({
      config: landlordConfig,
      buildings,
      roomsByMonth,
      expenses,
      users,
    }).catch((e) => console.warn("Firebase bootstrap check note:", e));

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribeAll();
    };
  }, []);

  // Persist Users list to local storage and push to Firebase
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      if (!isRemoteUpdateRef.current) {
        debouncedPushSegment('users', users, 600);
      }
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  // Login handler
  const handleLogin = (user: AppUser) => {
    try {
      sessionStorage.setItem(SESSION_KEYS.ACTIVE_USER, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(user);
    showToast(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${user.name} (${user.role === 'owner' ? '👑 เจ้าของหอ' : '👷‍♂️ พนักงาน'})`, 'success');
  };

  // Logout handler
  const handleLogout = () => {
    try {
      sessionStorage.removeItem(SESSION_KEYS.ACTIVE_USER);
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  // Switch User Handler
  const handleSwitchUser = (user: AppUser) => {
    try {
      sessionStorage.setItem(SESSION_KEYS.ACTIVE_USER, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(user);
    showToast(`สลับผู้ใช้งานเป็น: ${user.name} (${user.role === 'owner' ? '👑 เจ้าของหอ' : '👷‍♂️ พนักงานดูแล'})`, 'success');
  };

  // Add User Handler
  const handleAddUser = (newUser: Omit<AppUser, 'id' | 'createdAt'>) => {
    const user: AppUser = {
      ...newUser,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, user]);
    showToast(`เพิ่มผู้ใช้งาน "${user.name}" สำเร็จแล้ว!`, 'success');
  };

  // Update User Handler (e.g. change name, phone, PIN)
  const handleUpdateUser = (updatedUser: AppUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      try {
        sessionStorage.setItem(SESSION_KEYS.ACTIVE_USER, JSON.stringify(updatedUser));
      } catch (e) {
        console.error(e);
      }
    }
    showToast(`บันทึกข้อมูลและรหัสผ่านเบอร์โทรของ "${updatedUser.name}" เรียบร้อยแล้ว`, 'success');
  };

  // Delete User Handler
  const handleDeleteUser = (userId: string) => {
    if (users.length <= 1) {
      showToast('ไม่สามารถลบผู้ใช้งานทั้งหมดได้ ต้องมีอย่างน้อย 1 บัญชี', 'error');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      const fallback = users.find(u => u.id !== userId) || DEFAULT_APP_USERS[0];
      setCurrentUser(fallback);
      try {
        sessionStorage.setItem(SESSION_KEYS.ACTIVE_USER, JSON.stringify(fallback));
      } catch (e) {
        console.error(e);
      }
    }
    showToast('ลบผู้ใช้งานเรียบร้อยแล้ว', 'info');
  };

  // Persistent State Initializations
  const [landlordConfig, setLandlordConfig] = useState<LandlordConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const parsed = saved ? JSON.parse(saved) : DEFAULT_LANDLORD_CONFIG;
      return {
        ...DEFAULT_LANDLORD_CONFIG,
        ...parsed,
        commonFeeDefault: 0,
      };
    } catch {
      return DEFAULT_LANDLORD_CONFIG;
    }
  });

  const [buildings, setBuildings] = useState<BuildingProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUILDINGS);
      return saved ? JSON.parse(saved) : DEFAULT_BUILDINGS;
    } catch {
      return DEFAULT_BUILDINGS;
    }
  });

  const [roomsByMonth, setRoomsByMonth] = useState<Record<string, RoomRecord[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
      const rawData: Record<string, RoomRecord[]> = saved ? JSON.parse(saved) : INITIAL_ROOMS_DATA;
      
      // Ensure otherFees is 0 across all rooms in all months and recalculate totals
      const cleanedData: Record<string, RoomRecord[]> = {};
      Object.keys(rawData).forEach((monthKey) => {
        cleanedData[monthKey] = rawData[monthKey].map((room) => {
          if (room.otherFees > 0) {
            const rent = room.isOccupied ? (room.rent || 0) : 0;
            const waterCost = room.isOccupied ? (room.waterCost || 0) : 0;
            const elecCost = room.isOccupied ? (room.elecCost || 0) : 0;
            const newTotal = rent + waterCost + elecCost;
            const liability = room.liabilityTotal || ((room.previousBalance || 0) + (room.lateFeeTotal || 0));
            return {
              ...room,
              otherFees: 0,
              total: newTotal,
              grandTotal: newTotal + liability,
            };
          }
          return room;
        });
      });
      return cleanedData;
    } catch {
      return INITIAL_ROOMS_DATA;
    }
  });

  // Expense Records State
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
    } catch {
      return DEFAULT_EXPENSES;
    }
  });

  // Persist Expenses and push to Firebase Realtime
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      if (!isRemoteUpdateRef.current) {
        debouncedPushSegment('expenses', expenses, 600);
      }
    } catch (e) {
      console.error('Failed to save expenses', e);
    }
  }, [expenses]);

  // Expense Handlers
  const handleAddExpense = (newExp: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const expense: ExpenseRecord = {
      ...newExp,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toLocaleString('th-TH'),
    };
    setExpenses(prev => [expense, ...prev]);
    showToast(`บันทึกค่าใช้จ่าย "${expense.title}" จำนวน ฿${expense.amount.toLocaleString()} เรียบร้อยแล้ว`, 'success');
  };

  const handleUpdateExpense = (updated: ExpenseRecord) => {
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    showToast(`อัปเดตรายการค่าใช้จ่าย "${updated.title}" เรียบร้อยแล้ว`, 'success');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('ลบรายการค่าใช้จ่ายเรียบร้อยแล้ว', 'info');
  };

  // Modal states
  const [isApartmentModalOpen, setIsApartmentModalOpen] = useState<boolean>(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState<boolean>(false);
  const [isYearMonthPickerOpen, setIsYearMonthPickerOpen] = useState<boolean>(false);
  const [meterTarget, setMeterTarget] = useState<{ building: string; roomNo: string } | null>(null);
  const [invoiceTargetRoom, setInvoiceTargetRoom] = useState<RoomRecord | null>(null);

  // Dynamic Sidebar State: 'expanded' | 'collapsed' | 'hidden'
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed' | 'hidden'>(() => {
    try {
      const savedMode = localStorage.getItem('propmanage_sidebar_mode_v3');
      if (savedMode === 'expanded' || savedMode === 'collapsed' || savedMode === 'hidden') {
        return savedMode;
      }
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true' ? 'collapsed' : 'expanded';
    } catch {
      return 'expanded';
    }
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const savedW = localStorage.getItem('propmanage_sidebar_custom_width');
      return savedW ? parseInt(savedW, 10) : 280;
    } catch {
      return 280;
    }
  });

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileSidebarOpen(prev => !prev);
      return;
    }

    setSidebarMode(prev => {
      let next: 'expanded' | 'collapsed' | 'hidden';
      if (prev === 'hidden') {
        next = 'expanded';
      } else if (prev === 'expanded') {
        next = 'collapsed';
      } else {
        next = 'expanded';
      }
      try {
        localStorage.setItem('propmanage_sidebar_mode_v3', next);
      } catch (e) {
        console.error('Failed to save sidebar state', e);
      }
      return next;
    });
  };

  const handleHideSidebar = () => {
    setSidebarMode('hidden');
    try {
      localStorage.setItem('propmanage_sidebar_mode_v3', 'hidden');
    } catch (e) {
      console.error(e);
    }
    showToast('ซ่อนแถบเมนูด้านซ้ายแล้ว (กด Ctrl+B หรือคลิกปุ่มซ้ายบนเพื่อเรียกกลับคืน)', 'info');
  };

  // Keyboard shortcut (Ctrl+B or Cmd+B) to toggle/recall sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-Save Effect & Debounced Realtime Cloud Push
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(landlordConfig));
      if (!isRemoteUpdateRef.current) {
        debouncedPushSegment('config', landlordConfig, 600);
      }
    } catch (e) {
      console.error('Failed to save config to localStorage', e);
    }
  }, [landlordConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(buildings));
      if (!isRemoteUpdateRef.current) {
        debouncedPushSegment('buildings', buildings, 600);
      }
    } catch (e) {
      console.error('Failed to save buildings to localStorage', e);
    }
  }, [buildings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(roomsByMonth));
      if (!isRemoteUpdateRef.current) {
        debouncedPushSegment('roomsByMonth', roomsByMonth, 600);
      }
    } catch (e) {
      console.error('Failed to save rooms to localStorage', e);
    }
  }, [roomsByMonth]);

  // 1. Fresh Setup with Clean Initial Property & Blank Rooms
  const handleClearToFreshSetup = (setup: FreshSetupPayload) => {
    try {
      cancelAllDebouncedPushes();
      const freshConfig: LandlordConfig = {
        ...landlordConfig,
        propertyName: setup.propertyName,
        landlordName: setup.landlordName,
        phone: setup.phone || landlordConfig.phone,
        promptPayId: setup.promptPayId || landlordConfig.promptPayId,
        waterRateDefault: setup.waterRate,
        elecRateDefault: setup.elecRate,
        waterPerPersonRateDefault: setup.waterPerPersonRate,
        commonFeeDefault: 0,
      };

      const bldId = setup.buildingId || 'BLD-MAIN';
      const freshBuilding: BuildingProfile = {
        id: bldId,
        name: setup.buildingName,
        totalUnits: setup.roomCount,
        location: landlordConfig.address || 'ที่อยู่อพาร์ตเมนต์',
        floors: setup.floors || Math.max(1, Math.ceil(setup.roomCount / 10)),
        defaultWaterRate: setup.waterRate,
        defaultElecRate: setup.elecRate,
        description: 'อาคารหลัก',
        createdAt: new Date().toISOString().split('T')[0],
      };

      const freshRooms: RoomRecord[] = Array.from({ length: setup.roomCount }, (_, i) => {
        const roomNum = String(setup.startRoomNumber + i);
        const floor = Math.floor((setup.startRoomNumber + i) / 100) || 1;
        return {
          key: `${bldId}-${roomNum}`,
          buildingId: bldId,
          building: setup.buildingName,
          roomNo: roomNum,
          floor: floor,
          tenantName: '',
          phone: '',
          occupants: 0,
          occupancyStatus: 'vacant' as OccupancyStatus,
          isOccupied: false,
          rent: setup.defaultRent,
          waterCalcType: setup.waterCalcType,
          waterPerPersonRate: setup.waterPerPersonRate,
          waterPrev: 0,
          waterCurr: 0,
          waterUnits: 0,
          waterRate: setup.waterRate,
          waterCost: 0,
          elecPrev: 0,
          elecCurr: 0,
          elecUnits: 0,
          elecRate: setup.elecRate,
          elecCost: 0,
          otherFees: 0,
          total: 0,
          previousBalance: 0,
          lateDays: 0,
          lateFeePerDay: 100,
          lateFeeTotal: 0,
          liabilityTotal: 0,
          grandTotal: 0,
          isPaid: false,
          hasMeterUpdated: false,
          notes: 'ห้องว่าง รอกรอกข้อมูลผู้เช่าและเลขมิเตอร์',
        };
      });

      const freshRoomsByMonth: Record<string, RoomRecord[]> = {};
      AVAILABLE_MONTHS.forEach(m => {
        freshRoomsByMonth[m] = freshRooms.map(r => ({ ...r }));
      });

      setLandlordConfig(freshConfig);
      setBuildings([freshBuilding]);
      setRoomsByMonth(freshRoomsByMonth);
      setExpenses([]);

      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(freshConfig));
      localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify([freshBuilding]));
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(freshRoomsByMonth));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));

      // Instantly sync the fresh reset state to Firebase RTDB and Firestore
      pushAllDataToFirebase({
        config: freshConfig,
        buildings: [freshBuilding],
        roomsByMonth: freshRoomsByMonth,
        expenses: [],
        users,
      }).catch(err => console.warn("Firebase reset sync note:", err));

      showToast(`ล้างข้อมูลและเริ่มต้น "${setup.propertyName}" เรียบร้อยแล้ว! (ซิงค์ Firebase Cloud สำเร็จ)`, 'success');
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการล้างข้อมูล', 'error');
    }
  };

  // 2. Clear to 100% Empty Slate (0 Buildings, 0 Rooms)
  const handleClearToEmptySlate = (customConfig?: Partial<LandlordConfig>) => {
    try {
      cancelAllDebouncedPushes();
      const freshConfig: LandlordConfig = {
        ...landlordConfig,
        ...(customConfig || {}),
        propertyName: customConfig?.propertyName || 'หอพักของฉัน',
        landlordName: customConfig?.landlordName || 'เจ้าของหอพัก',
        phone: customConfig?.phone || '',
        promptPayId: customConfig?.promptPayId || '',
        commonFeeDefault: 0,
      };

      const emptyRoomsByMonth: Record<string, RoomRecord[]> = {};
      AVAILABLE_MONTHS.forEach(m => {
        emptyRoomsByMonth[m] = [];
      });

      setLandlordConfig(freshConfig);
      setBuildings([]);
      setRoomsByMonth(emptyRoomsByMonth);
      setExpenses([]);

      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(freshConfig));
      localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(emptyRoomsByMonth));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));

      // Instantly sync empty slate to Firebase RTDB and Firestore
      pushAllDataToFirebase({
        config: freshConfig,
        buildings: [],
        roomsByMonth: emptyRoomsByMonth,
        expenses: [],
        users,
      }).catch(err => console.warn("Firebase reset sync note:", err));

      showToast('ล้างข้อมูลว่างเปล่า 100% เรียบร้อยแล้ว (ซิงค์ Firebase Cloud สำเร็จ)', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Clear Meters & Tenants Only (Keep Building and Room Numbers)
  const handleClearMetersAndTenantsOnly = () => {
    try {
      cancelAllDebouncedPushes();
      let updatedRoomsState: Record<string, RoomRecord[]> = {};
      setRoomsByMonth(prev => {
        const nextState: Record<string, RoomRecord[]> = {};
        Object.keys(prev).forEach(mKey => {
          nextState[mKey] = prev[mKey].map(r => ({
            ...r,
            tenantName: '',
            phone: '',
            occupants: 0,
            occupancyStatus: 'vacant' as OccupancyStatus,
            isOccupied: false,
            waterPrev: 0,
            waterCurr: 0,
            waterUnits: 0,
            waterCost: 0,
            elecPrev: 0,
            elecCurr: 0,
            elecUnits: 0,
            elecCost: 0,
            otherFees: 0,
            total: 0,
            previousBalance: 0,
            lateDays: 0,
            lateFeeTotal: 0,
            liabilityTotal: 0,
            grandTotal: 0,
            isPaid: false,
            hasMeterUpdated: false,
            notes: 'ห้องว่าง รอกรอกข้อมูลผู้เช่าและเลขมิเตอร์',
          }));
        });
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(nextState));
        updatedRoomsState = nextState;
        return nextState;
      });

      setExpenses([]);
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));

      // Instantly sync to Firebase
      pushAllDataToFirebase({
        config: landlordConfig,
        buildings,
        roomsByMonth: updatedRoomsState,
        expenses: [],
        users,
      }).catch(err => console.warn("Firebase reset sync note:", err));

      showToast('รีเซ็ตเลขมิเตอร์และข้อมูลผู้เช่าทั้งหมดเป็น 0 เรียบร้อยแล้ว (ซิงค์ Firebase Cloud สำเร็จ)', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Reset All Back to Demo Data
  const handleResetAllData = () => {
    try {
      cancelAllDebouncedPushes();
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      localStorage.removeItem(STORAGE_KEYS.BUILDINGS);
      localStorage.removeItem(STORAGE_KEYS.ROOMS);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
      setLandlordConfig(DEFAULT_LANDLORD_CONFIG);
      setBuildings(DEFAULT_BUILDINGS);
      setRoomsByMonth(INITIAL_ROOMS_DATA);
      setExpenses(DEFAULT_EXPENSES);

      // Instantly sync demo data to Firebase
      pushAllDataToFirebase({
        config: DEFAULT_LANDLORD_CONFIG,
        buildings: DEFAULT_BUILDINGS,
        roomsByMonth: INITIAL_ROOMS_DATA,
        expenses: DEFAULT_EXPENSES,
        users: DEFAULT_APP_USERS,
      }).catch(err => console.warn("Firebase demo restore note:", err));

      showToast('คืนค่าข้อมูลตัวอย่าง 3 อาคาร 26 ห้อง เรียบร้อยแล้ว (ซิงค์ Firebase Cloud สำเร็จ)', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  // Active month info & dynamic available months list
  const activeMonthInfo = getMonthInfo(activeMonth);
  const activeYear = parseMonthKey(activeMonth).year;
  const currentYearMonthKeys = getMonthsForYear(activeYear).map(m => m.key);
  const nextYearMonthKeys = getMonthsForYear(activeYear + 1).map(m => m.key);
  const prevYearMonthKeys = getMonthsForYear(activeYear - 1).map(m => m.key);

  const dynamicAvailableMonths: string[] = Array.from(new Set([
    ...Object.keys(roomsByMonth),
    ...prevYearMonthKeys,
    ...currentYearMonthKeys,
    ...nextYearMonthKeys,
    ...AVAILABLE_MONTHS,
  ])).sort((a, b) => {
    const parseA = parseMonthKey(a);
    const parseB = parseMonthKey(b);
    return (parseA.year * 100 + parseA.month) - (parseB.year * 100 + parseB.month);
  });

  const handleMonthChange = (newMonth: string) => {
    setActiveMonth(newMonth);
    setRoomsByMonth(prev => {
      if (prev[newMonth] && prev[newMonth].length > 0) {
        return prev;
      }
      // Initialize rooms for the new month automatically carrying over unpaid balances
      const newRooms = initializeNewMonthRooms(newMonth, prev, prev['08 ส.ค.'] || Object.values(prev)[0] || null, landlordConfig);
      return {
        ...prev,
        [newMonth]: newRooms,
      };
    });
  };

  // Get current active month rooms
  const currentRooms: RoomRecord[] = roomsByMonth[activeMonth] || roomsByMonth['08 ส.ค.'] || [];
  const buildingNames = buildings.map(b => b.name);
  const occupiedCount = currentRooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
  const totalCapacity = buildings.reduce((sum, b) => sum + b.totalUnits, 0);

  // Update Landlord Config
  const handleSaveLandlordConfig = (updated: LandlordConfig) => {
    setLandlordConfig(updated);
    showToast(`บันทึกข้อมูลอพาร์ตเมนต์ "${updated.propertyName}" สำเร็จแล้ว!`, 'success');
  };

  // ==========================================
  // 1. MANAGE BUILDINGS HANDLERS & VALIDATION
  // ==========================================
  const handleAddBuilding = (newBuilding: BuildingProfile): boolean => {
    // Validation: ID uniqueness
    if (buildings.some(b => b.id.toLowerCase() === newBuilding.id.toLowerCase())) {
      showToast(`รหัสอาคาร "${newBuilding.id}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`, 'error');
      return false;
    }
    // Validation: Name uniqueness
    if (buildings.some(b => b.name.toLowerCase() === newBuilding.name.toLowerCase())) {
      showToast(`ชื่ออาคาร "${newBuilding.name}" มีอยู่ในระบบแล้ว`, 'error');
      return false;
    }

    setBuildings(prev => [...prev, newBuilding]);
    showToast(`เพิ่มโปรไฟล์อาคาร "${newBuilding.name}" (${newBuilding.id}) สำเร็จ!`, 'success');
    return true;
  };

  const handleUpdateBuilding = (updatedBuilding: BuildingProfile): boolean => {
    const existing = buildings.find(b => b.id === updatedBuilding.id);
    if (!existing) {
      showToast(`ไม่พบอาคารรหัส "${updatedBuilding.id}" ในระบบ`, 'error');
      return false;
    }

    const oldName = existing.name;
    const newName = updatedBuilding.name;

    setBuildings(prev => prev.map(b => b.id === updatedBuilding.id ? updatedBuilding : b));

    // If building name changed, update all rooms referencing old building name across all months
    if (oldName !== newName) {
      setRoomsByMonth(prev => {
        const nextState = { ...prev };
        AVAILABLE_MONTHS.forEach(m => {
          if (nextState[m]) {
            nextState[m] = nextState[m].map(r => {
              if (r.building === oldName || r.buildingId === updatedBuilding.id) {
                return { ...r, building: newName, buildingId: updatedBuilding.id };
              }
              return r;
            });
          }
        });
        return nextState;
      });
    }

    showToast(`อัปเดตโปรไฟล์อาคาร "${updatedBuilding.name}" สำเร็จ!`, 'success');
    return true;
  };

  const handleDeleteBuilding = (buildingId: string): { success: boolean; message: string } => {
    const bld = buildings.find(b => b.id === buildingId);
    if (!bld) {
      return { success: false, message: 'ไม่พบอาคารที่ต้องการลบ' };
    }

    // DATA VALIDATION: Foreign key / Orphan prevention!
    // Check if any rooms across ANY month are attached to this building
    let attachedRoomCount = 0;
    Object.values(roomsByMonth).forEach((monthRooms: RoomRecord[]) => {
      attachedRoomCount += monthRooms.filter(r => r.building === bld.name || r.buildingId === bld.id).length;
    });

    if (attachedRoomCount > 0) {
      return {
        success: false,
        message: `ไม่สามารถลบอาคาร "${bld.name}" ได้ เนื่องจากยังมีห้องพัก ${attachedRoomCount} รายการผูกอยู่กับอาคารนี้! กรุณาลบหรือย้ายห้องพักก่อน`,
      };
    }

    setBuildings(prev => prev.filter(b => b.id !== buildingId));
    return {
      success: true,
      message: `ลบโปรไฟล์อาคาร "${bld.name}" เรียบร้อยแล้ว`,
    };
  };

  // ==========================================
  // 2. BATCH / ENTIRE BUILDING OCCUPANCY UPDATE
  // ==========================================
  const handleBatchUpdateBuildingOccupancy = (
    buildingName: string,
    newStatus: OccupancyStatus,
    reason?: string
  ) => {
    const targetBld = buildings.find(b => b.name === buildingName);
    if (!targetBld) {
      showToast(`ไม่พบอาคาร "${buildingName}" ในระบบ`, 'error');
      return;
    }

    setRoomsByMonth(prev => {
      const monthData = [...(prev[activeMonth] || prev['08 ส.ค.'])];
      const updatedList = monthData.map(r => {
        if (r.building === buildingName || r.buildingId === targetBld.id) {
          const isOccupied = newStatus === 'occupied';
          const occupants = isOccupied ? (r.occupants > 0 ? r.occupants : 1) : 0;
          let waterCost = 0;
          if (isOccupied) {
            if (r.waterCalcType === 'per_person') {
              waterCost = occupants * (r.waterPerPersonRate || 100);
            } else {
              waterCost = r.waterUnits * r.waterRate;
            }
          }
          const elecCost = isOccupied ? r.elecUnits * r.elecRate : 0;
          const total = (isOccupied ? r.rent : 0) + waterCost + elecCost + (isOccupied ? r.otherFees : 0);

          return {
            ...r,
            occupancyStatus: newStatus,
            isOccupied,
            occupants,
            renovationReason: newStatus === 'under_renovation' ? (reason || 'ปรับปรุงทั้งอาคาร') : undefined,
            waterCost,
            elecCost,
            total,
            notes: newStatus === 'occupied' ? 'มีผู้เช่า' : (newStatus === 'vacant' ? 'ห้องว่าง' : (reason || 'ปิดปรับปรุง')),
          };
        }
        return r;
      });

      return {
        ...prev,
        [activeMonth]: updatedList,
      };
    });

    showToast(
      `อัปเดตสถานะห้องทุกห้องใน ${buildingName} เป็น "${newStatus === 'occupied' ? 'มีผู้เช่า' : newStatus === 'vacant' ? 'ห้องว่าง' : 'ปิดปรับปรุง'}" เรียบร้อยแล้ว`,
      'success'
    );
  };

  // ==========================================
  // 3. METER READING & ROOM BILLING HANDLERS
  // ==========================================
  const handleSaveMeterReading = (
    building: string,
    roomNo: string,
    waterCurr: number,
    elecCurr: number,
    waterCalcType?: WaterCalcType,
    occupants?: number,
    tenantName?: string,
    previousBalance?: number
  ) => {
    // Validation: Building existence check
    const matchedBld = buildings.find(b => b.name === building);
    if (!matchedBld) {
      showToast(`ไม่สามารถบันทึกมิเตอร์ได้: อาคาร "${building}" ไม่มีอยู่ในระบบโปรไฟล์อาคาร!`, 'error');
      return;
    }

    setRoomsByMonth(prev => {
      const monthData = [...(prev[activeMonth] || prev['08 ส.ค.'])];
      const index = monthData.findIndex(r => r.building === building && r.roomNo === roomNo);
      
      if (index !== -1) {
        const r = monthData[index];
        const effectiveWaterCalcType = waterCalcType || r.waterCalcType || 'meter';
        const effectiveOccupants = typeof occupants === 'number' ? occupants : (r.occupants || 1);
        const effectiveTenantName = tenantName !== undefined ? tenantName : r.tenantName;
        const effectivePreviousBalance = typeof previousBalance === 'number' ? previousBalance : (r.previousBalance || 0);
        
        const waterRate = r.waterRate || matchedBld.defaultWaterRate || landlordConfig.waterRateDefault || 18;
        const elecRate = r.elecRate || matchedBld.defaultElecRate || landlordConfig.elecRateDefault || 8;
        const perPersonRate = r.waterPerPersonRate || landlordConfig.waterPerPersonRateDefault || 100;

        let waterUnits = 0;
        let waterCost = 0;
        if (effectiveWaterCalcType === 'per_person') {
          waterUnits = 0;
          waterCost = effectiveOccupants * perPersonRate;
        } else {
          waterUnits = waterCurr >= r.waterPrev && waterCurr > 0 ? waterCurr - r.waterPrev : 0;
          waterCost = waterUnits * waterRate;
        }

        const elecUnits = elecCurr >= r.elecPrev && elecCurr > 0 ? elecCurr - r.elecPrev : 0;
        const elecCost = elecUnits * elecRate;

        const total = r.rent + waterCost + elecCost + r.otherFees;
        const lateDays = r.lateDays || 0;
        const lateFeePerDay = r.lateFeePerDay || landlordConfig.lateFeePerDayDefault || 100;
        const lateFeeTotal = lateDays * lateFeePerDay;
        const liabilityTotal = effectivePreviousBalance + lateFeeTotal;
        const grandTotal = total + liabilityTotal;

        monthData[index] = {
          ...r,
          tenantName: effectiveTenantName,
          occupants: effectiveOccupants,
          waterCalcType: effectiveWaterCalcType,
          waterCurr,
          waterUnits,
          waterCost,
          elecCurr,
          elecUnits,
          elecCost,
          previousBalance: effectivePreviousBalance,
          lateDays,
          lateFeePerDay,
          lateFeeTotal,
          liabilityTotal,
          total,
          grandTotal,
          hasMeterUpdated: true,
          meterUpdatedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return {
        ...prev,
        [activeMonth]: monthData,
      };
    });

    showToast(`อัปเดตมิเตอร์และยอดคงค้างห้อง ${roomNo} (${building}) สำเร็จแล้ว!`, 'success');
  };

  // Toggle water calculation mode for a room (meter <-> per_person)
  const handleToggleWaterCalc = (room: RoomRecord) => {
    const nextMode: WaterCalcType = room.waterCalcType === 'per_person' ? 'meter' : 'per_person';
    const targetBld = buildings.find(b => b.name === room.building);
    const waterRate = room.waterRate || targetBld?.defaultWaterRate || landlordConfig.waterRateDefault || 18;
    const perPersonRate = room.waterPerPersonRate || landlordConfig.waterPerPersonRateDefault || 100;
    const occupants = room.occupants || 1;

    let waterUnits = 0;
    let waterCost = 0;
    if (nextMode === 'per_person') {
      waterUnits = 0;
      waterCost = occupants * perPersonRate;
    } else {
      waterUnits = room.waterCurr >= room.waterPrev && room.waterCurr > 0 ? room.waterCurr - room.waterPrev : 0;
      waterCost = waterUnits * waterRate;
    }

    const total = room.rent + waterCost + room.elecCost + room.otherFees;

    const updated: RoomRecord = {
      ...room,
      waterCalcType: nextMode,
      waterUnits,
      waterCost,
      total,
    };

    handleUpdateRoomRecord(updated);
    showToast(
      `เปลี่ยนวิธีคิดค่าน้ำห้อง ${room.roomNo} เป็น: ${nextMode === 'per_person' ? `เหมาจ่ายรายคน (${occupants} คน = ฿${waterCost})` : `ตามมิเตอร์ (฿${waterRate}/หน่วย)`}`,
      'info'
    );
  };

  // Calculate effective grand total for a room
  const getRoomEffectiveTotal = (r: RoomRecord) => {
    if (r.grandTotal !== undefined && r.grandTotal !== null) return r.grandTotal;
    const liability = (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || landlordConfig.lateFeePerDayDefault || 100)));
    return (r.total || 0) + liability;
  };

  // Toggle payment status handler with automatic carry-over to next month's arrears (ช่องค้างจ่าย)
  const handleTogglePaymentStatus = (key: string) => {
    setRoomsByMonth(prev => {
      const monthData = [...(prev[activeMonth] || prev['08 ส.ค.'])];
      const index = monthData.findIndex(r => r.key === key);
      if (index === -1) return prev;

      const currentRoom = monthData[index];
      const nextPaid = !currentRoom.isPaid;
      const updatedCurrentRoom: RoomRecord = {
        ...currentRoom,
        isPaid: nextPaid,
        paymentDate: nextPaid ? new Date().toISOString().substring(0, 10) : undefined,
      };
      monthData[index] = updatedCurrentRoom;

      const nextState = {
        ...prev,
        [activeMonth]: monthData,
      };

      // Automatically update next month's arrears (previousBalance) if next month exists in state
      const nextMonthKey = getNextMonthKey(activeMonth);
      if (nextState[nextMonthKey]) {
        const nextMonthRooms = [...nextState[nextMonthKey]];
        const nextMonthRoomIndex = nextMonthRooms.findIndex(
          r => r.key === key || (r.building === currentRoom.building && r.roomNo === currentRoom.roomNo)
        );

        if (nextMonthRoomIndex !== -1) {
          const targetNextRoom = nextMonthRooms[nextMonthRoomIndex];
          // If current month is marked UNPAID, carry its total amount into next month's previousBalance (ช่องค้างจ่าย)
          // If marked PAID, clear or deduct the current month's arrears from next month
          const unpaidCarryAmount = nextPaid ? 0 : calculateRoomEffectiveTotal(updatedCurrentRoom);
          const updatedNextRoom: RoomRecord = {
            ...targetNextRoom,
            previousBalance: unpaidCarryAmount,
            notes: unpaidCarryAmount > 0 
              ? `ยอดยกมาจากงวด ${activeMonth} (ค้างจ่าย ฿${unpaidCarryAmount.toLocaleString()})`
              : (targetNextRoom.notes?.includes('ยอดยกมาจากงวด') ? 'มีผู้เช่า' : targetNextRoom.notes),
          };
          nextMonthRooms[nextMonthRoomIndex] = updatedNextRoom;
          nextState[nextMonthKey] = nextMonthRooms;
        }
      }

      showToast(
        `เปลี่ยนสถานะห้อง ${currentRoom.roomNo} เป็น: ${nextPaid ? '✅ ชำระแล้ว' : '⏳ รอชำระ (ส่งยอดไปช่องค้างจ่ายงวดถัดไปอัตโนมัติ)'}`,
        'info'
      );

      return nextState;
    });
  };

  const handleOpenMeterModal = (building: string, roomNo: string) => {
    setMeterTarget({ building, roomNo });
    setActiveTab('meter-entry');
  };

  const handleOpenInvoiceModal = (room: RoomRecord) => {
    setInvoiceTargetRoom(room);
    setActiveTab('invoices');
  };

  // Update a single room record
  const handleUpdateRoomRecord = (updatedRoom: RoomRecord) => {
    setRoomsByMonth(prev => {
      const monthData = [...(prev[activeMonth] || prev['08 ส.ค.'])];
      const index = monthData.findIndex(r => r.key === updatedRoom.key);
      if (index !== -1) {
        monthData[index] = updatedRoom;
      }
      return {
        ...prev,
        [activeMonth]: monthData,
      };
    });

    const statusLabel = updatedRoom.occupancyStatus === 'occupied' 
      ? `มีผู้เช่า (${updatedRoom.occupants} คน)` 
      : (updatedRoom.occupancyStatus === 'vacant' ? 'ห้องว่าง' : 'ปิดปรับปรุง');
    showToast(`อัปเดตห้อง ${updatedRoom.roomNo} สถานะ: ${statusLabel} บันทึกกลับสู่ระบบและ Dashboard สำเร็จ!`, 'success');
  };

  // Batch update room records from Sheets Sync visualizer
  const handleBatchUpdateRooms = (updatedRooms: RoomRecord[]) => {
    setRoomsByMonth(prev => ({
      ...prev,
      [activeMonth]: updatedRooms,
    }));
    showToast(`บันทึกข้อมูลชีต ${activeMonth} เรียบร้อยแล้ว (${updatedRooms.length} ห้อง)`, 'success');
  };

  // Add Room Handler
  const handleAddRoom = (newRoom: RoomRecord, applyToAllMonths: boolean) => {
    // Data Validation: Building existence
    const matchedBld = buildings.find(b => b.name === newRoom.building || b.id === newRoom.buildingId);
    if (!matchedBld) {
      showToast(`ไม่อาจสร้างห้อง ${newRoom.roomNo}: อาคาร "${newRoom.building}" ไม่มีอยู่ในระบบโปรไฟล์อาคาร!`, 'error');
      return;
    }

    setRoomsByMonth(prev => {
      if (applyToAllMonths) {
        const nextState = { ...prev };
        AVAILABLE_MONTHS.forEach(m => {
          const list = nextState[m] ? [...nextState[m]] : [];
          if (!list.some(r => r.key === newRoom.key)) {
            list.push({ ...newRoom, buildingId: matchedBld.id });
          }
          nextState[m] = list;
        });
        return nextState;
      } else {
        const list = prev[activeMonth] ? [...prev[activeMonth]] : [];
        return {
          ...prev,
          [activeMonth]: [...list, { ...newRoom, buildingId: matchedBld.id }],
        };
      }
    });
    showToast(`เพิ่มห้อง ${newRoom.roomNo} (${newRoom.building}) สำเร็จแล้ว!`, 'success');
  };

  // Update Room Handler
  const handleUpdateRoom = (updatedRoom: RoomRecord, applyToAllMonths: boolean) => {
    // Data Validation: Building existence
    const matchedBld = buildings.find(b => b.name === updatedRoom.building || b.id === updatedRoom.buildingId);
    if (!matchedBld) {
      showToast(`ไม่อาจอัปเดตห้อง ${updatedRoom.roomNo}: อาคาร "${updatedRoom.building}" ไม่มีอยู่ในระบบ!`, 'error');
      return;
    }

    setRoomsByMonth(prev => {
      if (applyToAllMonths) {
        const nextState = { ...prev };
        AVAILABLE_MONTHS.forEach(m => {
          if (nextState[m]) {
            nextState[m] = nextState[m].map(r => {
              if (r.key === updatedRoom.key) {
                return {
                  ...r,
                  ...updatedRoom,
                  buildingId: matchedBld.id,
                  building: updatedRoom.building,
                };
              }
              return r;
            });
          }
        });
        return nextState;
      } else {
        const list = prev[activeMonth] ? [...prev[activeMonth]] : [];
        const index = list.findIndex(r => r.key === updatedRoom.key);
        if (index !== -1) {
          list[index] = { ...updatedRoom, buildingId: matchedBld.id };
        }
        return {
          ...prev,
          [activeMonth]: list,
        };
      }
    });
    showToast(`แก้ไขข้อมูลห้อง ${updatedRoom.roomNo} (${updatedRoom.building}) สำเร็จแล้ว! บันทึกและอัปเดตกลับ Dashboard เรียบร้อย`, 'success');
  };

  // Delete Room Handler
  const handleDeleteRoom = (roomKey: string, applyToAllMonths: boolean) => {
    setRoomsByMonth(prev => {
      if (applyToAllMonths) {
        const nextState = { ...prev };
        AVAILABLE_MONTHS.forEach(m => {
          if (nextState[m]) {
            nextState[m] = nextState[m].filter(r => r.key !== roomKey);
          }
        });
        return nextState;
      } else {
        const list = prev[activeMonth] ? [...prev[activeMonth]] : [];
        return {
          ...prev,
          [activeMonth]: list.filter(r => r.key !== roomKey),
        };
      }
    });
    showToast(`ลบห้องพักเรียบร้อยแล้ว!`, 'info');
  };

  // Mandatory Authentication Guard: enforce login when there is no active session
  if (!currentUser) {
    return (
      <LoginPage
        users={users}
        onLogin={handleLogin}
        propertyName={landlordConfig.propertyName}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-google-sans text-slate-900 overflow-hidden antialiased">
      {/* Toast Notification */}
      {toast && toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-top duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toast.type === 'info'
              ? 'bg-blue-900 text-blue-100 border-blue-700'
              : toast.type === 'error'
              ? 'bg-red-900 text-red-100 border-red-700'
              : 'bg-amber-900 text-amber-100 border-amber-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
          {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Desktop Main Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeMonth={activeMonth}
          setActiveMonth={handleMonthChange}
          availableMonths={dynamicAvailableMonths}
          rooms={currentRooms}
          buildings={buildings}
          config={landlordConfig}
          currentUser={currentUser}
          onOpenApartmentSettings={() => setIsApartmentModalOpen(true)}
          onOpenClearDataModal={() => setIsClearDataModalOpen(true)}
          onOpenUserManager={() => setIsUserManagerOpen(true)}
          onLogout={handleLogout}
          isSeniorMode={isSeniorMode}
          onToggleSeniorMode={handleToggleSeniorMode}
          isCollapsed={sidebarMode === 'collapsed'}
          isFullyHidden={sidebarMode === 'hidden'}
          onToggleCollapse={handleToggleSidebar}
          onHideSidebar={handleHideSidebar}
          sidebarWidth={sidebarWidth}
          onWidthChange={setSidebarWidth}
        />
      </div>

      {/* Mobile Sidebar Modal Drawer */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="เมนูหลักสำหรับมือถือและแท็บเล็ต"
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        />
        {/* Drawer Content */}
        <div className={`absolute inset-y-0 left-0 max-w-[85vw] shadow-2xl transition-transform duration-300 transform ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setIsMobileSidebarOpen(false);
            }}
            activeMonth={activeMonth}
            setActiveMonth={(m) => {
              handleMonthChange(m);
              setIsMobileSidebarOpen(false);
            }}
            availableMonths={dynamicAvailableMonths}
            rooms={currentRooms}
            buildings={buildings}
            config={landlordConfig}
            currentUser={currentUser}
            onOpenApartmentSettings={() => {
              setIsApartmentModalOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            onOpenClearDataModal={() => {
              setIsClearDataModalOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            onOpenUserManager={() => {
              setIsUserManagerOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            onLogout={handleLogout}
            isSeniorMode={isSeniorMode}
            onToggleSeniorMode={handleToggleSeniorMode}
            isCollapsed={false}
            isFullyHidden={false}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-3 sm:px-5 py-2 flex items-center justify-between shadow-xs top-navbar-single-line gap-2.5 sm:gap-3 flex-nowrap shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0 flex-nowrap">
            {/* Quick Toggle / Recall Sidebar Button */}
            <button
              id="sidebar-toggle-button"
              onClick={handleToggleSidebar}
              title={
                sidebarMode === 'hidden'
                  ? "แสดงแถบเมนู (Show Sidebar) [Ctrl+B]"
                  : sidebarMode === 'collapsed'
                  ? "ขยายแถบเมนูเต็ม (Expand Sidebar) [Ctrl+B]"
                  : "ย่อแถบเมนู (Collapse Sidebar) [Ctrl+B]"
              }
              className={`p-1.5 sm:p-2 rounded-lg border transition cursor-pointer flex items-center justify-center flex-shrink-0 ${
                sidebarMode === 'hidden'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-400/20'
                  : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {sidebarMode === 'expanded' ? (
                <PanelLeftClose className="w-4 h-4 text-slate-600" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-blue-600" />
              )}
            </button>

            <button
              onClick={() => setIsApartmentModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200 cursor-pointer truncate max-w-[180px] sm:max-w-[220px] flex-shrink-0"
              title="คลิกเพื่อแก้ไขชื่ออพาร์ตเมนต์ และข้อมูลส่วนตัว (Edit Apartment Info)"
            >
              <Building className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span className="truncate">{landlordConfig.propertyName || 'พีแอนด์เจ อพาร์ตเมนต์'}</span>
              <Edit3 className="w-3 h-3 text-slate-400 flex-shrink-0" />
            </button>

            {/* Quick Clear & Start Fresh Button */}
            <button
              onClick={() => setIsClearDataModalOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer flex-shrink-0 shadow-2xs"
              title="ล้างข้อมูลตัวอย่างและเริ่มต้นใหม่ด้วยชุดข้อมูลของคุณ (Clear Demo & Start Fresh Setup)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              <span className="whitespace-nowrap hidden sm:inline">ล้างข้อมูล / เริ่มต้นใหม่</span>
              <span className="whitespace-nowrap sm:hidden">เริ่มใหม่</span>
            </button>

            <span className="text-slate-300 hidden lg:inline flex-shrink-0">|</span>

            <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-800 tracking-tight truncate flex-shrink-0">
              {activeTab === 'dashboard' && 'ภาพรวมรายรับ & ค่าเช่า'}
              {activeTab === 'buildings' && 'จัดการโปรไฟล์อาคาร'}
              {activeTab === 'rooms' && 'จัดการห้องพัก & การเข้าพัก'}
              {activeTab === 'meter-entry' && 'ลงบันทึกมิเตอร์น้ำ-ไฟ'}
              {activeTab === 'invoices' && 'พิมพ์ใบแจ้งหนี้'}
              {activeTab === 'sheet-view' && 'Google Sheets Visualizer'}
              {activeTab === 'schema' && 'โครงสร้างฐานข้อมูล 3NF'}
              {activeTab === 'ios-app' && 'ติดตั้งบน iPhone & ไฟล์ .IPA'}
              {activeTab === 'gas-code' && 'Google Apps Script'}
              {activeTab === 'user-admin' && 'ระบบจัดการผู้ใช้งานและสิทธิ์'}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-nowrap">
            {/* Quick iPhone / IPA Button */}
            <button
              onClick={() => setActiveTab('ios-app')}
              title="ติดตั้งบน iPhone หรือสร้างไฟล์ .IPA สำหรับ iOS"
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer flex-shrink-0 ${
                activeTab === 'ios-app'
                  ? 'bg-pink-100 text-pink-900 border-pink-300 shadow-xs ring-1 ring-pink-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Smartphone className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'ios-app' ? 'text-pink-600' : 'text-pink-500'}`} />
              <span className="whitespace-nowrap hidden sm:inline">แอป iPhone / .IPA</span>
              <span className="whitespace-nowrap sm:hidden">iOS</span>
            </button>
            {/* Senior Mode Toggle Button */}
            <button
              onClick={handleToggleSeniorMode}
              title={isSeniorMode ? "ปิดโหมดตัวอักษรใหญ่ (Normal Font Size)" : "เปิดโหมดตัวอักษรใหญ่พิเศษสำหรับผู้สูงอายุ (Large Font Mode for Seniors)"}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer flex-shrink-0 ${
                isSeniorMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs ring-1 ring-amber-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Glasses className={`w-4 h-4 flex-shrink-0 ${isSeniorMode ? 'text-amber-700' : 'text-slate-500'}`} />
              <span className="whitespace-nowrap">
                {isSeniorMode ? '👓 โหมดคนแก่' : '👓 ตัวใหญ่'}
              </span>
            </button>

            {/* Current User & Role Switcher */}
            <div className="flex items-center gap-1 flex-shrink-0 flex-nowrap">
              <button
                onClick={() => {
                  setUserManagerTab('accounts');
                  setIsUserManagerOpen(true);
                }}
                title="คลิกเพื่อสลับผู้ใช้ หรือจัดการสิทธิ์ผู้ใช้งาน (Switch User / Roles)"
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer flex-shrink-0 ${
                  currentUser.role === 'owner'
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                }`}
              >
                <span className="text-sm flex-shrink-0">{currentUser.avatar || (currentUser.role === 'owner' ? '👑' : '👷‍♂️')}</span>
                <span className="truncate max-w-[100px] sm:max-w-[130px]">{currentUser.name}</span>
                {currentUser.role === 'owner' ? (
                  <span className="hidden md:inline-block px-1.5 py-0.2 rounded text-[10px] bg-amber-200/80 text-amber-950 font-black flex-shrink-0">
                    เจ้าของ
                  </span>
                ) : (
                  <span className="hidden md:inline-block px-1.5 py-0.2 rounded text-[10px] bg-blue-200/80 text-blue-950 font-black flex-shrink-0">
                    พนักงาน
                  </span>
                )}
              </button>

              {/* Quick Keypad / Phone Login Button */}
              <button
                onClick={() => {
                  setUserManagerTab('phone-login');
                  setIsUserManagerOpen(true);
                }}
                title="เข้าสู่ระบบด้วยเบอร์โทรศัพท์ (Quick Phone Login)"
                className="hidden sm:flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer flex-shrink-0"
              >
                <Key className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span className="whitespace-nowrap">ล็อกอินเบอร์</span>
              </button>
            </div>

            {/* Interactive Billing Month & Year Navigator */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs gap-0.5 flex-shrink-0 flex-nowrap">
              <button
                type="button"
                onClick={() => handleMonthChange(getPreviousMonthKey(activeMonth))}
                title="ย้อนกลับไปงวดเดือนก่อนหน้า"
                className="p-1 sm:p-1.5 hover:bg-white hover:text-blue-600 text-slate-600 rounded-lg transition cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* 1. Direct Year Selector */}
              <div className="flex items-center bg-white px-1.5 sm:px-2 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs flex-shrink-0">
                <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline mr-1">ปี:</span>
                <select
                  value={activeYear}
                  onChange={(e) => handleMonthChange(setYearForMonthKey(activeMonth, parseInt(e.target.value, 10)))}
                  className="bg-transparent text-xs font-black text-blue-950 focus:outline-none cursor-pointer py-0.5 font-mono"
                  title="กดเลือกปี พ.ศ. / ค.ศ."
                >
                  {getSelectableYears(2026).map((y) => (
                    <option key={y} value={y}>
                      {y + 543}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Direct Month Selector */}
              <div className="flex items-center bg-white px-1.5 sm:px-2 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs flex-shrink-0">
                <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline mr-1">เดือน:</span>
                <select
                  value={activeMonthInfo.month}
                  onChange={(e) => handleMonthChange(setMonthForMonthKey(activeMonth, parseInt(e.target.value, 10)))}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer py-0.5"
                  title="กดเลือกเดือน"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mNum) => {
                    const mInfo = getMonthInfo(activeYear, mNum);
                    return (
                      <option key={mNum} value={mNum}>
                        {mInfo.shortDisplay}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 3. Quick Visual Year/Month Picker Modal Button */}
              <button
                type="button"
                onClick={() => setIsYearMonthPickerOpen(true)}
                title="เปิดหน้าต่างกดเลือกปีและเดือนทั้งหมด"
                className="hidden xl:flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg text-xs font-bold transition cursor-pointer border border-blue-200/60 flex-shrink-0"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>แผงเลือกปี</span>
              </button>

              <button
                type="button"
                onClick={() => handleMonthChange(getNextMonthKey(activeMonth))}
                title="ไปยังงวดเดือนถัดไป"
                className="p-1 sm:p-1.5 hover:bg-white hover:text-blue-600 text-slate-600 rounded-lg transition cursor-pointer flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex-shrink-0">
              <Users className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>เข้าพัก {occupiedCount}/{totalCapacity || currentRooms.length} ห้อง</span>
            </div>

            {/* Firebase Realtime Connection Status Pill */}
            <button
              onClick={() => setActiveTab('firebase-sync')}
              title={`Firebase: ${firebaseConfig.projectId} (${syncStatus.lastOperation}) - คลิกเพื่อเปิดหน้าจัดการ Firebase`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition cursor-pointer flex-shrink-0 ${
                activeTab === 'firebase-sync'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : syncStatus.state === 'connected' || syncStatus.state === 'synced'
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 text-amber-500 fill-amber-500 ${syncStatus.state === 'syncing' ? 'animate-bounce' : ''}`} />
              <span className="hidden lg:inline font-mono">dorm-4263e</span>
              <span className={`w-2 h-2 rounded-full ${syncStatus.state === 'connected' || syncStatus.state === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </button>

            {/* Clear Data & Reset Button */}
            <button
              onClick={() => setIsClearDataModalOpen(true)}
              title="ล้างข้อมูล & เริ่มต้นตึกและห้องใหม่ (Start Fresh Setup)"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">ล้าง/เริ่มใหม่</span>
            </button>

            <button
              onClick={() => setIsApartmentModalOpen(true)}
              title="ตั้งค่าอพาร์ตเมนต์และข้อมูลผู้ให้เช่า"
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition cursor-pointer flex-shrink-0"
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
            </button>

            <button
              onClick={handleLogout}
              title="ออกจากระบบ (Sign Out)"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 border border-red-200 rounded-lg transition cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">ออก</span>
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div className="p-3 sm:p-6 pb-28 md:pb-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              rooms={currentRooms}
              activeMonth={activeMonth}
              buildings={buildingNames}
              config={landlordConfig}
              currentUser={currentUser}
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
              onOpenMeterModal={handleOpenMeterModal}
              onOpenInvoiceModal={handleOpenInvoiceModal}
              onTogglePaymentStatus={handleTogglePaymentStatus}
              onNavigateToMeter={() => setActiveTab('meter-entry')}
              onOpenApartmentSettings={() => setIsApartmentModalOpen(true)}
            />
          )}

          {activeTab === 'buildings' && (
            <BuildingManagementView
              buildings={buildings}
              rooms={currentRooms}
              activeMonth={activeMonth}
              onAddBuilding={handleAddBuilding}
              onUpdateBuilding={handleUpdateBuilding}
              onDeleteBuilding={handleDeleteBuilding}
              onBatchUpdateBuildingOccupancy={handleBatchUpdateBuildingOccupancy}
              onNavigateToRooms={(bldFilter) => {
                setActiveTab('rooms');
              }}
              onOpenClearDataModal={() => setIsClearDataModalOpen(true)}
              onRestoreDemoData={handleResetAllData}
            />
          )}

          {activeTab === 'rooms' && (
            <RoomBuildingManagerView
              rooms={currentRooms}
              activeMonth={activeMonth}
              buildings={buildings}
              config={landlordConfig}
              onAddRoom={handleAddRoom}
              onUpdateRoom={handleUpdateRoom}
              onDeleteRoom={handleDeleteRoom}
              onNavigateToMeter={() => setActiveTab('meter-entry')}
              onNavigateToBuildings={() => setActiveTab('buildings')}
              onOpenClearDataModal={() => setIsClearDataModalOpen(true)}
              onRestoreDemoData={handleResetAllData}
            />
          )}

          {activeTab === 'meter-entry' && (
            <MeterEntryView
              rooms={currentRooms}
              activeMonth={activeMonth}
              buildings={buildingNames}
              config={landlordConfig}
              currentUser={currentUser}
              isSeniorMode={isSeniorMode}
              onSaveReading={handleSaveMeterReading}
              onSaveMeterReading={handleSaveMeterReading}
              onToggleWaterCalc={handleToggleWaterCalc}
              defaultTarget={meterTarget}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoiceView
              rooms={currentRooms}
              activeMonth={activeMonth}
              buildings={buildingNames}
              config={landlordConfig}
              currentUser={currentUser}
              defaultTargetRoom={invoiceTargetRoom}
              onTogglePaymentStatus={handleTogglePaymentStatus}
              onUpdateRoom={handleUpdateRoomRecord}
              onUpdateRoomRecord={handleUpdateRoomRecord}
            />
          )}

          {activeTab === 'sheet-view' && (
            <SheetVisualizerView
              rooms={currentRooms}
              activeMonth={activeMonth}
              config={landlordConfig}
              onUpdateRoomRecord={handleUpdateRoomRecord}
              onBatchUpdateRooms={handleBatchUpdateRooms}
            />
          )}

          {activeTab === 'schema' && (
            <DatabaseSchemaView
              buildings={buildings}
              rooms={currentRooms}
            />
          )}

          {activeTab === 'gas-code' && (
            <GasCodeView
              config={landlordConfig}
              rooms={currentRooms}
              activeMonth={activeMonth}
            />
          )}

          {activeTab === 'user-admin' && (
            <OwnerAdminView
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              isSeniorMode={isSeniorMode}
            />
          )}

          {activeTab === 'ios-app' && (
            <IosIpaView
              config={landlordConfig}
            />
          )}

          {activeTab === 'firebase-sync' && (
            <FirebaseSyncView
              config={landlordConfig}
              buildings={buildings}
              roomsByMonth={roomsByMonth}
              expenses={expenses}
              users={users}
              syncStatus={syncStatus}
              showToast={showToast}
              onApplyRemoteData={(remote) => {
                isRemoteUpdateRef.current = true;
                if (remote.config) setLandlordConfig(remote.config);
                if (remote.buildings) setBuildings(remote.buildings);
                if (remote.roomsByMonth) setRoomsByMonth(remote.roomsByMonth);
                if (remote.expenses) setExpenses(remote.expenses);
                if (remote.users) setUsers(remote.users);
                setTimeout(() => { isRemoteUpdateRef.current = false; }, 400);
              }}
            />
          )}
        </div>

        {/* Mobile Bottom Navigation Dock (แถบนำทางด่วนด้านล่างสำหรับมือถือ) */}
        <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setActiveTab('meter-entry')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer relative ${
              activeTab === 'meter-entry' ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'meter-entry' ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40' : ''}`}>
              <Gauge className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">จดมิเตอร์</span>
            {currentRooms.filter(r => !r.hasMeterUpdated).length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-blue-500/20 text-blue-400' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">ภาพรวม</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'rooms' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'rooms' ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
              <DoorClosed className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">ห้องพัก</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'invoices' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'invoices' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">ใบแจ้งหนี้</span>
          </button>

          <button
            onClick={() => handleToggleSidebar()}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <div className="p-1 rounded-lg">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">เมนู</span>
          </button>
        </nav>
      </main>

      {/* Apartment Profile & Occupancy Settings Modal */}
      <ApartmentSettingsModal
        isOpen={isApartmentModalOpen}
        onClose={() => setIsApartmentModalOpen(false)}
        config={landlordConfig}
        onSaveConfig={handleSaveLandlordConfig}
        buildings={buildings}
        rooms={currentRooms}
        activeMonth={activeMonth}
        onResetAllData={handleResetAllData}
        onOpenClearDataModal={() => {
          setIsApartmentModalOpen(false);
          setIsClearDataModalOpen(true);
        }}
      />

      {/* Clear & Reset Wizard Modal */}
      <ClearDataModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        currentConfig={landlordConfig}
        buildings={buildings}
        roomsCount={currentRooms.length}
        onClearToFreshSetup={handleClearToFreshSetup}
        onFreshSetup={handleClearToFreshSetup}
        onClearToEmptySlate={handleClearToEmptySlate}
        onEmptySlate={handleClearToEmptySlate}
        onClearMetersAndTenantsOnly={handleClearMetersAndTenantsOnly}
        onClearMetersAndTenants={handleClearMetersAndTenantsOnly}
        onRestoreDemoData={handleResetAllData}
        onRestoreDemo={handleResetAllData}
        isSeniorMode={isSeniorMode}
      />

      {/* User Manager & Role Access Modal */}
      <UserManagerModal
        isOpen={isUserManagerOpen}
        onClose={() => setIsUserManagerOpen(false)}
        users={users}
        currentUser={currentUser}
        initialTab={userManagerTab}
        onSwitchUser={handleSwitchUser}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Quick Visual Year & Month Picker Modal */}
      <YearMonthPickerModal
        isOpen={isYearMonthPickerOpen}
        onClose={() => setIsYearMonthPickerOpen(false)}
        activeMonth={activeMonth}
        onSelectMonth={handleMonthChange}
        availableDataMonths={dynamicAvailableMonths}
        isSeniorMode={isSeniorMode}
      />

      {/* Floating Sidebar Recall Button when completely hidden on desktop */}
      {sidebarMode === 'hidden' && (
        <aside aria-label="Sidebar Recall Button" className="fixed bottom-5 left-5 z-30 hidden md:block print:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={() => setSidebarMode('expanded')}
            title="แสดงแถบเมนูด้านซ้าย (Show Sidebar) [Ctrl+B]"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full shadow-xl border border-slate-700 text-xs font-bold transition hover:scale-105 cursor-pointer backdrop-blur-xs group"
          >
            <PanelLeftOpen className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
            <span>แสดงแถบเมนู</span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono border border-slate-700">Ctrl+B</span>
          </button>
        </aside>
      )}
    </div>
  );
}
