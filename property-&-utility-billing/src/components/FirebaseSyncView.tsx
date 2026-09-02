import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Database, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  Zap, 
  Server, 
  Radio, 
  Play, 
  Check, 
  X,
  ExternalLink,
  Layers,
  Copy,
  FolderSync
} from 'lucide-react';
import { firebaseConfig } from '../firebase/config';
import { 
  pushAllDataToFirebase, 
  pullAllDataFromFirebase, 
  runFirebaseHealthCheck, 
  SyncStatus, 
  getCurrentSyncStatus,
  unloadRealtimeListeners
} from '../firebase/realtimeSync';
import { LandlordConfig, BuildingProfile, RoomRecord, ExpenseRecord, AppUser } from '../types';

interface FirebaseSyncViewProps {
  config: LandlordConfig;
  buildings: BuildingProfile[];
  roomsByMonth: Record<string, RoomRecord[]>;
  expenses: ExpenseRecord[];
  users: AppUser[];
  onApplyRemoteData: (data: {
    config?: LandlordConfig;
    buildings?: BuildingProfile[];
    roomsByMonth?: Record<string, RoomRecord[]>;
    expenses?: ExpenseRecord[];
    users?: AppUser[];
  }) => void;
  syncStatus: SyncStatus;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const FirebaseSyncView: React.FC<FirebaseSyncViewProps> = ({
  config,
  buildings,
  roomsByMonth,
  expenses,
  users,
  onApplyRemoteData,
  syncStatus,
  showToast,
}) => {
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isHealthChecking, setIsHealthChecking] = useState<boolean>(false);
  const [healthResults, setHealthResults] = useState<{
    passedCount: number;
    totalChecks: number;
    results: Array<{ step: number; title: string; passed: boolean; message: string; durationMs: number }>;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<Array<{ id: string; time: string; action: string; status: 'ok' | 'err'; detail: string }>>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString('th-TH'),
      action: 'เริ่มต้นเชื่อมต่อ Firebase',
      status: 'ok',
      detail: `เชื่อมโยง Firebase Project: ${firebaseConfig.projectId} (${firebaseConfig.authDomain})`
    }
  ]);

  // Calculate stats
  const totalMonthsCount = Object.keys(roomsByMonth).length;
  const totalRoomsCount = (Object.values(roomsByMonth)[0] as RoomRecord[] | undefined)?.length || 0;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`คัดลอก ${label} แล้ว`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run 5-step Health Check
  const handleRunHealthCheck = async () => {
    setIsHealthChecking(true);
    try {
      const res = await runFirebaseHealthCheck();
      setHealthResults(res);
      
      const newLog = {
        id: `check-${Date.now()}`,
        time: new Date().toLocaleTimeString('th-TH'),
        action: `ทดสอบระบบ 5 ขั้นตอน (ผ่าน ${res.passedCount}/${res.totalChecks})`,
        status: (res.passedCount === res.totalChecks ? 'ok' : 'err') as 'ok' | 'err',
        detail: res.passedCount === res.totalChecks 
          ? 'ระบบ Realtime & Unload ทำงานถูกต้องสมบูรณ์ 100%' 
          : 'พบข้อควรระวังในการทดสอบบางขั้นตอน'
      };
      setSyncHistory(prev => [newLog, ...prev.slice(0, 19)]);
      
      if (res.passedCount === res.totalChecks) {
        showToast('การทดสอบ 5 ขั้นตอนผ่านฉลุย 100% เชื่อมต่อ Realtime สมบูรณ์!', 'success');
      } else {
        showToast(`ผลการทดสอบ: ผ่าน ${res.passedCount}/${res.totalChecks} ขั้นตอน`, 'warning');
      }
    } catch (e: any) {
      showToast('เกิดข้อผิดพลาดในการทดสอบ: ' + e.message, 'error');
    } finally {
      setIsHealthChecking(false);
    }
  };

  // Push all local data to Firebase
  const handlePushAll = async () => {
    setIsPushing(true);
    try {
      const res = await pushAllDataToFirebase({
        config,
        buildings,
        roomsByMonth,
        expenses,
        users,
      });

      if (res.success) {
        const newLog = {
          id: `push-${Date.now()}`,
          time: new Date().toLocaleTimeString('th-TH'),
          action: 'ส่งข้อมูลขึ้น Firebase Realtime Database',
          status: 'ok' as const,
          detail: `อัปโหลด ${buildings.length} อาคาร, ${totalRoomsCount} ห้อง, ${totalMonthsCount} งวดเดือน, ${expenses.length} ค่าใช้จ่าย (${res.latencyMs}ms)`
        };
        setSyncHistory(prev => [newLog, ...prev.slice(0, 19)]);
        showToast(`ซิงค์ข้อมูลขึ้น Firebase Realtime สำเร็จใน ${res.latencyMs} ms!`, 'success');
      } else {
        showToast('ไม่สามารถส่งข้อมูลได้: ' + (res.error || 'Unknown error'), 'error');
      }
    } catch (e: any) {
      showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    } finally {
      setIsPushing(false);
    }
  };

  // Pull data from Firebase
  const handlePullAll = async () => {
    setIsPulling(true);
    try {
      const res = await pullAllDataFromFirebase();
      if (res.error) {
        showToast(res.error, 'warning');
      } else {
        onApplyRemoteData(res);
        const newLog = {
          id: `pull-${Date.now()}`,
          time: new Date().toLocaleTimeString('th-TH'),
          action: 'ดึงข้อมูลล่าสุดจาก Firebase',
          status: 'ok' as const,
          detail: 'อัปเดตข้อมูลในเครื่องด้วยข้อมูลล่าสุดจากคลาวด์'
        };
        setSyncHistory(prev => [newLog, ...prev.slice(0, 19)]);
        showToast('ดึงข้อมูลล่าสุดจาก Firebase สำเร็จแล้ว!', 'success');
      }
    } catch (e: any) {
      showToast('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + e.message, 'error');
    } finally {
      setIsPulling(false);
    }
  };

  // Auto-run initial health check on component mount
  useEffect(() => {
    handleRunHealthCheck();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-google-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-amber-600/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Flame className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/30">
              <Flame className="w-4 h-4 text-amber-200 fill-amber-200" />
              <span>Firebase Cloud Synchronization</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              เชื่อมต่อ Firebase บัญชีของคุณ (Realtime)
            </h1>

            <p className="text-sm text-amber-100 max-w-2xl">
              ระบบเชื่อมต่อกับบัญชี Firebase Realtime Database ของคุณที่โปรเจกต์ <strong>{firebaseConfig.projectId}</strong> ข้อมูลเลขมิเตอร์ ค่าเช่า อาคาร และค่าใช้จ่ายจะถูกซิงค์สดอัตโนมัติแบบเรียลไทม์ทุกอุปกรณ์
            </p>
          </div>

          {/* Quick Push / Pull buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePushAll}
              disabled={isPushing}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-amber-50 text-amber-900 text-sm font-bold rounded-2xl shadow-lg shadow-black/10 transition cursor-pointer disabled:opacity-50"
            >
              <ArrowUpRight className={`w-4 h-4 text-amber-600 ${isPushing ? 'animate-spin' : ''}`} />
              <span>{isPushing ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลขึ้น Cloud (Push)'}</span>
            </button>

            <button
              onClick={handlePullAll}
              disabled={isPulling}
              className="inline-flex items-center gap-2 px-5 py-3 bg-amber-800/80 hover:bg-amber-800 text-white text-sm font-bold rounded-2xl border border-amber-400/40 backdrop-blur-md transition cursor-pointer disabled:opacity-50"
            >
              <ArrowDownLeft className={`w-4 h-4 text-amber-200 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลจาก Cloud (Pull)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status & Live Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Connection Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">สถานะการเชื่อมต่อ</span>
            <div className={`w-3 h-3 rounded-full ${syncStatus.state === 'connected' || syncStatus.state === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black ${syncStatus.state === 'connected' || syncStatus.state === 'synced' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {syncStatus.state === 'connected' || syncStatus.state === 'synced' ? 'ออนไลน์ Realtime 🟢' : 'กำลังซิงค์... 🔄'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate" title={syncStatus.lastOperation}>
              {syncStatus.lastOperation}
            </p>
          </div>
          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
            <span>Project ID:</span>
            <strong className="font-mono text-slate-700">{firebaseConfig.projectId}</strong>
          </div>
        </div>

        {/* Card 2: Realtime Database URL */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Realtime Database</span>
            <Database className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-black text-slate-900">
              asia-southeast1
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono truncate" title={firebaseConfig.databaseURL}>
              {firebaseConfig.databaseURL}
            </p>
          </div>
          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
            <span>Region:</span>
            <span className="font-bold text-emerald-700">สิงคโปร์ (ความเร็วสูงสุดในไทย)</span>
          </div>
        </div>

        {/* Card 3: Storage Bucket */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cloud Storage</span>
            <Cloud className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-black text-slate-900 truncate">
              {firebaseConfig.storageBucket}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              รองรับจัดเก็บรูปสลิปโอนเงิน & ภาพถ่ายมิเตอร์
            </p>
          </div>
          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
            <span>App ID:</span>
            <span className="font-mono text-slate-700 truncate max-w-[120px]" title={firebaseConfig.appId}>
              {firebaseConfig.appId}
            </span>
          </div>
        </div>

        {/* Card 4: Local Synced Assets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ข้อมูลในระบบปัจจุบัน</span>
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900">
              {buildings.length} อาคาร / {totalRoomsCount} ห้อง
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {totalMonthsCount} งวดเดือน, {expenses.length} ค่าใช้จ่าย, {users.length} ผู้ใช้
            </p>
          </div>
          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
            <span>Sync Status:</span>
            <span className="text-emerald-600 font-bold">พร้อมซิงค์ Realtime</span>
          </div>
        </div>
      </div>

      {/* 5-Step Health Check Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>5-Step Realtime & Unload Verification Suite</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              การตรวจสอบความพร้อมของระบบ Realtime & Listener Unload 5 ขั้นตอน
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ตรวจสอบการ Initialize, การเชื่อมต่อ Realtime Database, การทดสอบ Ping เขียน-อ่าน และการถอน Listener เมื่อเปลี่ยนหน้า (Unload Lifecycle)
            </p>
          </div>

          <button
            onClick={handleRunHealthCheck}
            disabled={isHealthChecking}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isHealthChecking ? 'animate-spin' : ''}`} />
            <span>{isHealthChecking ? 'กำลังทดสอบ...' : 'รันทดสอบ 5 ขั้นตอนอีกครั้ง'}</span>
          </button>
        </div>

        {/* Health Check Checklist */}
        <div className="grid grid-cols-1 gap-3">
          {healthResults ? (
            healthResults.results.map((res) => (
              <div 
                key={res.step}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  res.passed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                    res.passed ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {res.passed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        ขั้นตอนที่ {res.step}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{res.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{res.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center shrink-0 pl-11 sm:pl-0">
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {res.durationMs} ms
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    res.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {res.passed ? 'ผ่านฉลุย (PASSED)' : 'ล้มเหลว (FAILED)'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-amber-500" />
              <p className="text-sm font-medium">กำลังดำเนินการทดสอบทั้ง 5 ขั้นตอน...</p>
            </div>
          )}
        </div>
      </div>

      {/* Account Configuration Details & Sync History Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Account Credentials Info */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Server className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">ข้อมูลการเชื่อมโยง Firebase Config</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Project ID:</span>
              <div className="flex items-center gap-2">
                <code className="font-mono font-bold text-slate-800">{firebaseConfig.projectId}</code>
                <button
                  onClick={() => copyToClipboard(firebaseConfig.projectId, 'Project ID')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Auth Domain:</span>
              <div className="flex items-center gap-2">
                <code className="font-mono font-bold text-slate-800">{firebaseConfig.authDomain}</code>
                <button
                  onClick={() => copyToClipboard(firebaseConfig.authDomain, 'Auth Domain')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Database URL:</span>
              <div className="flex items-center gap-2">
                <code className="font-mono font-bold text-slate-800 max-w-[200px] truncate" title={firebaseConfig.databaseURL}>
                  {firebaseConfig.databaseURL}
                </code>
                <button
                  onClick={() => copyToClipboard(firebaseConfig.databaseURL, 'Database URL')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Storage Bucket:</span>
              <div className="flex items-center gap-2">
                <code className="font-mono font-bold text-slate-800">{firebaseConfig.storageBucket}</code>
                <button
                  onClick={() => copyToClipboard(firebaseConfig.storageBucket, 'Storage Bucket')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Messaging Sender ID:</span>
              <div className="flex items-center gap-2">
                <code className="font-mono font-bold text-slate-800">{firebaseConfig.messagingSenderId}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Sync History Logs */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">ประวัติและเหตุการณ์ซิงค์ข้อมูล (Live Log)</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {syncHistory.length} รายการ
              </span>
            </div>

            <div className="space-y-2 mt-4 max-h-[260px] overflow-y-auto scrollbar-thin pr-1 divide-y divide-slate-100">
              {syncHistory.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      {item.status === 'ok' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      )}
                      <span>{item.action}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 pl-5">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>💡 ข้อมูลมีการแคชในเครื่องอัตโนมัติ (Offline First)</span>
            <button
              onClick={() => setSyncHistory([])}
              className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              ล้างประวัติ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
