import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Gauge, 
  FileText, 
  TableProperties, 
  Code2, 
  Building2, 
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  DoorClosed,
  Layers,
  ShieldCheck,
  Edit3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  Users,
  Eye,
  EyeOff,
  Crown,
  Type,
  Glasses,
  Check,
  X,
  Maximize2,
  Minimize2,
  Sliders,
  Sparkle,
  Smartphone,
  LogOut
} from 'lucide-react';
import { ActiveTab, RoomRecord, BuildingProfile, LandlordConfig, AppUser } from '../types';
import { 
  getMonthInfo, 
  getPreviousMonthKey, 
  getNextMonthKey, 
  getSelectableYears, 
  parseMonthKey,
  setYearForMonthKey,
  setMonthForMonthKey,
  THAI_MONTH_NAMES_SHORT,
  THAI_MONTH_NAMES_FULL
} from '../utils/billingCycle';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  availableMonths: string[];
  rooms: RoomRecord[];
  buildings: BuildingProfile[];
  config: LandlordConfig;
  currentUser: AppUser;
  onOpenApartmentSettings: () => void;
  onOpenClearDataModal?: () => void;
  onOpenUserManager?: () => void;
  onLogout?: () => void;
  isSeniorMode?: boolean;
  onToggleSeniorMode?: () => void;
  isCollapsed?: boolean;
  isFullyHidden?: boolean;
  onToggleCollapse?: () => void;
  onHideSidebar?: () => void;
  onCloseMobile?: () => void;
  sidebarWidth?: number;
  onWidthChange?: (width: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeMonth,
  setActiveMonth,
  availableMonths,
  rooms,
  buildings,
  config,
  currentUser,
  onOpenApartmentSettings,
  onOpenClearDataModal,
  onOpenUserManager,
  onLogout,
  isSeniorMode = false,
  onToggleSeniorMode,
  isCollapsed = false,
  isFullyHidden = false,
  onToggleCollapse,
  onHideSidebar,
  onCloseMobile,
  sidebarWidth = 280,
  onWidthChange,
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
  // Resizable left panel state on desktop
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    if (isSeniorMode) return Math.max(sidebarWidth, 320);
    return sidebarWidth;
  });

  // State for collapsible "รอบบิล & ปี" section inside sidebar
  const [isYearMonthCollapsed, setIsYearMonthCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('propmanage_yearmonth_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // State for collapsible "ผู้ใช้งาน & โหมดตัวใหญ่" section
  const [isUserSectionCollapsed, setIsUserSectionCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('propmanage_usersection_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // State for collapsible "อาคารในระบบ" section
  const [isBuildingsCollapsed, setIsBuildingsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('propmanage_buildings_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Handle panel resizing on desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const minW = isSeniorMode ? 290 : 230;
      const maxW = 480;
      const newWidth = Math.min(Math.max(e.clientX, minW), maxW);
      setPanelWidth(newWidth);
      if (onWidthChange) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        try {
          localStorage.setItem('propmanage_sidebar_custom_width', String(panelWidth));
        } catch (e) {
          console.error(e);
        }
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, panelWidth, isSeniorMode, onWidthChange]);

  const toggleYearMonthCollapsed = () => {
    setIsYearMonthCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('propmanage_yearmonth_collapsed', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const toggleUserSectionCollapsed = () => {
    setIsUserSectionCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('propmanage_usersection_collapsed', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const toggleBuildingsCollapsed = () => {
    setIsBuildingsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('propmanage_buildings_collapsed', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const currentMonthInfo = getMonthInfo(activeMonth);
  const selectableYears = getSelectableYears(currentMonthInfo.year);

  const completedMeters = rooms.filter(r => r.hasMeterUpdated).length;
  const totalRooms = rooms.length;
  const meterProgress = totalRooms > 0 ? Math.round((completedMeters / totalRooms) * 100) : 0;
  
  const occupiedCount = rooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
  const isCaretaker = currentUser.role === 'caretaker';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: isCaretaker ? 'Dashboard (สถานะหอพัก)' : 'Dashboard (ภาพรวมรายรับ)',
      seniorLabel: '📊 ภาพรวมและสรุปยอดเงิน',
      shortLabel: 'ภาพรวม',
      icon: LayoutDashboard,
      iconColor: isSeniorMode ? 'text-amber-300' : 'text-blue-400',
    },
    {
      id: 'meter-entry' as ActiveTab,
      label: 'Meter Entry (ลงมาตรวัดน้ำ-ไฟ)',
      seniorLabel: '💧 จดมิเตอร์น้ำ & ไฟฟ้า',
      shortLabel: 'จดมิเตอร์',
      icon: Gauge,
      iconColor: isSeniorMode ? 'text-cyan-300' : 'text-cyan-400',
      badge: meterProgress < 100 ? `${meterProgress}%` : 'ครบ',
      badgeColor: meterProgress < 100 
        ? (isSeniorMode ? 'bg-amber-400 text-black font-black px-2 py-0.5' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30') 
        : (isSeniorMode ? 'bg-emerald-400 text-black font-black px-2 py-0.5' : 'bg-emerald-500/20 text-emerald-300'),
    },
    {
      id: 'rooms' as ActiveTab,
      label: 'ห้อง & สถานะการเช่า (Rooms)',
      seniorLabel: '🚪 รายชื่อห้อง & ผู้พักอาศัย',
      shortLabel: 'ห้องพัก',
      icon: DoorClosed,
      iconColor: isSeniorMode ? 'text-emerald-300' : 'text-emerald-400',
      badge: `${rooms.length} ห้อง`,
      badgeColor: isSeniorMode ? 'bg-emerald-400 text-black font-black' : 'bg-emerald-500/20 text-emerald-300',
    },
    {
      id: 'buildings' as ActiveTab,
      label: 'จัดการอาคาร (Buildings)',
      seniorLabel: '🏢 จัดการอาคารในระบบ',
      shortLabel: 'อาคาร',
      icon: Building2,
      iconColor: isSeniorMode ? 'text-blue-300' : 'text-blue-400',
      badge: `${buildings.length} อาคาร`,
      badgeColor: isSeniorMode ? 'bg-blue-400 text-black font-black' : 'bg-blue-500/20 text-blue-300',
    },
    {
      id: 'invoices' as ActiveTab,
      label: isCaretaker ? 'Invoices (ใบแจ้งหนี้ 🔒)' : 'Invoices (ใบแจ้งหนี้ 4/แผ่น)',
      seniorLabel: isCaretaker ? '🔒 ใบแจ้งหนี้ (สิทธิ์เจ้าของ)' : '📄 พิมพ์ใบแจ้งหนี้ค่าเช่า',
      shortLabel: 'ใบแจ้งหนี้',
      icon: FileText,
      iconColor: isCaretaker ? 'text-slate-500' : (isSeniorMode ? 'text-amber-300' : 'text-amber-400'),
      badge: isCaretaker ? 'เจ้าของ' : `${rooms.length} ใบ`,
      badgeColor: isCaretaker ? 'bg-slate-800 text-amber-300' : (isSeniorMode ? 'bg-amber-400 text-black font-black' : 'bg-slate-800 text-slate-300'),
    },
    {
      id: 'sheet-view' as ActiveTab,
      label: 'Sheets Sync (ตารางชีต)',
      seniorLabel: '📑 ตารางข้อมูล Google Sheets',
      shortLabel: 'Sync ชีต',
      icon: TableProperties,
      iconColor: isSeniorMode ? 'text-emerald-300' : 'text-emerald-400',
    },
    {
      id: 'schema' as ActiveTab,
      label: 'ฐานข้อมูล (DB Schema & 3NF)',
      seniorLabel: '🗄️ โครงสร้างฐานข้อมูล (DB)',
      shortLabel: 'ฐานข้อมูล',
      icon: Database,
      iconColor: isSeniorMode ? 'text-indigo-300' : 'text-indigo-400',
      badge: '3NF',
      badgeColor: isSeniorMode ? 'bg-indigo-400 text-black font-bold' : 'bg-indigo-500/20 text-indigo-300 font-mono',
    },
    {
      id: 'ios-app' as ActiveTab,
      label: 'แอป iPhone / ไฟล์ .IPA 📱',
      seniorLabel: '📱 ติดตั้งบน iPhone & ไฟล์ IPA',
      shortLabel: 'iOS / IPA',
      icon: Smartphone,
      iconColor: isSeniorMode ? 'text-pink-300' : 'text-pink-400',
      badge: 'iOS',
      badgeColor: isSeniorMode ? 'bg-pink-400 text-black font-black' : 'bg-pink-500/20 text-pink-300 font-bold',
    },
    {
      id: 'gas-code' as ActiveTab,
      label: 'Code.gs & Google Sheets',
      seniorLabel: '⚡ รหัสเชื่อมต่อ Apps Script',
      shortLabel: 'GAS Code',
      icon: Code2,
      iconColor: isSeniorMode ? 'text-purple-300' : 'text-purple-400',
      badge: 'GAS',
      badgeColor: isSeniorMode ? 'bg-purple-400 text-black font-bold' : 'bg-blue-500/20 text-blue-300',
    },
    ...(currentUser.role === 'owner' ? [
      {
        id: 'user-admin' as ActiveTab,
        label: 'จัดการผู้ใช้ (User Admin 👑)',
        seniorLabel: '👑 จัดการบัญชีผู้ใช้ & สิทธิ์',
        shortLabel: 'ผู้ใช้งาน',
        icon: Users,
        iconColor: isSeniorMode ? 'text-amber-300' : 'text-amber-400',
        badge: 'Owner',
        badgeColor: isSeniorMode ? 'bg-amber-400 text-black font-black' : 'bg-amber-500/20 text-amber-300',
      }
    ] : []),
  ];

  // Width determination
  const computedWidth = isCollapsed 
    ? 76 
    : isSeniorMode 
      ? Math.max(panelWidth, 310) 
      : panelWidth;

  return (
    <aside 
      id="app-sidebar"
      role="navigation"
      aria-label="เมนูหลักระบบจัดการหอพัก"
      style={{
        width: isFullyHidden ? 0 : `${computedWidth}px`,
      }}
      className={`flex flex-col flex-shrink-0 h-screen max-h-screen sticky top-0 border-r shadow-2xl z-30 font-google-sans print:hidden select-none transition-[width,opacity,transform] duration-200 ease-in-out relative ${
        isSeniorMode 
          ? 'bg-[#0a0f1d] text-white border-amber-500/40 ring-1 ring-amber-500/20' 
          : 'bg-[#111827] text-white border-slate-800'
      } ${
        isFullyHidden
          ? 'w-0 -translate-x-full md:w-0 overflow-hidden pointer-events-none opacity-0'
          : 'translate-x-0 opacity-100'
      }`}
    >
      {/* 1. Header / Brand & Dual-Mode Controller */}
      <div className={`flex flex-col border-b flex-shrink-0 ${
        isSeniorMode ? 'border-amber-500/30 bg-[#0f172a]' : 'border-slate-800 bg-[#111827]'
      } ${isCollapsed ? 'p-2.5 items-center' : 'p-3.5'}`}>
        
        {/* Top Row: Brand & Hide/Collapse Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "ขยายแถบเมนูเต็ม (Expand Sidebar)" : config.propertyName}
              title={isCollapsed ? "คลิกเพื่อขยายเมนู (Expand Sidebar)" : config.propertyName}
              className={`rounded-xl flex items-center justify-center font-black text-white shadow-md flex-shrink-0 cursor-pointer transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
                isSeniorMode 
                  ? 'w-11 h-11 bg-amber-500 text-slate-950 hover:bg-amber-400 ring-2 ring-amber-300' 
                  : 'w-9 h-9 bg-blue-600 hover:bg-blue-500'
              }`}
            >
              <Building2 className={isSeniorMode ? "w-6 h-6 text-slate-950" : "w-5 h-5"} />
            </button>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className={`font-black tracking-tight truncate ${
                  isSeniorMode ? 'text-base text-amber-300 leading-tight' : 'text-xs text-white'
                }`}>
                  {config.propertyName || 'พีแอนด์เจ อพาร์ตเมนต์'}
                </span>
                <span className={`font-semibold truncate flex items-center gap-1 ${
                  isSeniorMode ? 'text-xs text-slate-300' : 'text-[10px] text-blue-400'
                }`}>
                  <span>{isSeniorMode ? 'ระบบจัดการหอพัก (โหมดอ่านง่าย)' : 'ระบบบริหารหอพัก & มาตรวัด'}</span>
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons: Collapse, Hide, Close Mobile */}
          {!isCollapsed && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  aria-label="ย่อเป็นไอคอนขนาดเล็ก (Ctrl+B)"
                  title="ย่อเป็นไอคอนขนาดเล็ก (Mini Icons) [Ctrl+B]"
                  className={`p-1.5 rounded-lg transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    isSeniorMode 
                      ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
              {onHideSidebar && (
                <button
                  type="button"
                  onClick={onHideSidebar}
                  aria-label="ซ่อนแถบเมนูด้านซ้ายชั่วคราว"
                  title="ซ่อนแถบเมนูด้านซ้ายทั้งหมด (Full Screen Focus Mode)"
                  className={`p-1.5 rounded-lg transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    isSeniorMode 
                      ? 'text-slate-300 hover:text-amber-300 bg-slate-800 hover:bg-slate-700 border border-slate-700' 
                      : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                  }`}
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              )}
              {onCloseMobile && (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="ปิดเมนูหน้าต่างนี้"
                  title="ปิดเมนู (Close Menu)"
                  className="md:hidden p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dedicated Viewing Mode Toggle: Standard Mode vs Elderly-Friendly Mode */}
        {!isCollapsed && onToggleSeniorMode && (
          <div className="mt-3">
            <button
              type="button"
              onClick={onToggleSeniorMode}
              aria-pressed={isSeniorMode}
              aria-label={isSeniorMode ? "สลับกลับเป็นโหมดมาตรฐาน (Standard Mode)" : "เปิดโหมดผู้สูงอายุ ตัวหนังสือใหญ่พิเศษ (Elderly-Friendly Mode)"}
              className={`w-full rounded-xl transition flex items-center justify-between border cursor-pointer select-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
                isSeniorMode
                  ? 'p-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-lg ring-2 ring-amber-300/60 font-black'
                  : 'p-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700 font-bold text-xs'
              }`}
              title="กดสลับระหว่างโหมดมาตรฐาน และโหมดผู้สูงอายุ (ตัวหนังสือใหญ่ อ่านง่าย คอนทราสต์สูง)"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Glasses className={isSeniorMode ? "w-5 h-5 text-slate-950 flex-shrink-0" : "w-4 h-4 text-amber-400 flex-shrink-0"} />
                <div className="flex flex-col text-left min-w-0">
                  <span className={isSeniorMode ? "text-sm font-extrabold text-slate-950 leading-tight" : "text-xs font-bold text-slate-200"}>
                    {isSeniorMode ? '👓 โหมดผู้สูงอายุ (เปิดอยู่)' : '👓 สลับเป็นโหมดคนแก่ (ตัวใหญ่)'}
                  </span>
                  <span className={isSeniorMode ? "text-[11px] text-slate-900 font-semibold truncate" : "text-[10px] text-slate-400 truncate"}>
                    {isSeniorMode ? 'ตัวหนังสือใหญ่พิเศษ • คอนทราสต์สูง' : 'WCAG AAA Accessibility'}
                  </span>
                </div>
              </div>

              <div className={`px-2 py-1 rounded-lg text-xs font-black shrink-0 flex items-center gap-1 ${
                isSeniorMode ? 'bg-slate-950 text-amber-300 shadow-xs' : 'bg-slate-700 text-slate-300'
              }`}>
                {isSeniorMode ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{isSeniorMode ? 'เปิด' : 'ปกติ'}</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 2. Scrollable Middle Area with Independent Vertical Scroll */}
      <div className={`flex-1 flex flex-col overflow-y-auto ${
        isSeniorMode ? 'senior-scrollbar bg-[#0b0f19]' : 'custom-scrollbar bg-[#111827]'
      }`}>
        
        {/* User Role Card (Collapsible Section) */}
        {!isCollapsed && (
          <div className={`px-3 pt-2.5 pb-2 border-b flex-shrink-0 ${
            isSeniorMode ? 'border-amber-500/20 bg-slate-950/60' : 'border-slate-800/80 bg-slate-900/40'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isSeniorMode ? 'text-xs text-amber-300 font-black' : 'text-[10px] text-slate-400'
              }`}>
                <ShieldCheck className={isSeniorMode ? "w-3.5 h-3.5 text-amber-400" : "w-3 h-3 text-indigo-400"} />
                <span>บัญชีผู้ใช้งาน</span>
              </span>
              <button
                type="button"
                onClick={toggleUserSectionCollapsed}
                aria-label={isUserSectionCollapsed ? "แสดงข้อมูลบัญชี" : "ซ่อนข้อมูลบัญชี"}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer transition"
              >
                {isUserSectionCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isUserSectionCollapsed && (
              <div 
                onClick={currentUser.role === 'owner' ? onOpenUserManager : undefined}
                className={`rounded-xl border transition flex items-center justify-between ${
                  isSeniorMode
                    ? 'p-3 bg-slate-900 border-2 border-amber-500/50 hover:border-amber-400 shadow-md cursor-pointer'
                    : 'p-2.5 bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/40 hover:border-amber-400 cursor-pointer'
                }`}
                title={currentUser.role === 'owner' ? "คลิกเพื่อสลับผู้ใช้งาน หรือเพิ่มพนักงาน" : "สิทธิ์พนักงานดูแล (ห้ามสลับเป็นเจ้าของ)"}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={isSeniorMode ? "text-2xl" : "text-xl"}>
                    {currentUser.avatar || (currentUser.role === 'owner' ? '👩‍💼' : '👷‍♂️')}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black text-white truncate ${isSeniorMode ? 'text-sm' : 'text-xs'}`}>
                        {currentUser.name}
                      </span>
                      {currentUser.isMom && (
                        <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded font-black">
                          Mom
                        </span>
                      )}
                    </div>
                    <span className={`font-bold flex items-center gap-1 ${
                      isSeniorMode 
                        ? (currentUser.role === 'owner' ? 'text-amber-300 text-xs' : 'text-cyan-300 text-xs') 
                        : (currentUser.role === 'owner' ? 'text-amber-300 text-[10px]' : 'text-cyan-300 text-[10px]')
                    }`}>
                      {currentUser.role === 'owner' ? (
                        <>
                          <Crown className="w-3 h-3" /> เจ้าของ (สิทธิ์เต็ม)
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> พนักงาน (ซ่อนเงิน)
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {currentUser.role === 'owner' && (
                  <div className={`px-2 py-1 rounded-lg font-bold shrink-0 border ${
                    isSeniorMode 
                      ? 'bg-amber-400 text-slate-950 border-amber-300 text-xs font-black shadow-xs' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-[10px]'
                  }`}>
                    สลับผู้ใช้
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Billing Month & Year Direct Selector */}
        {!isCollapsed ? (
          <div className={`p-3 border-b flex-shrink-0 ${
            isSeniorMode ? 'border-amber-500/20 bg-slate-950/80' : 'border-slate-800 bg-slate-900/60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isSeniorMode ? 'text-xs text-amber-300 font-black' : 'text-[10px] text-slate-400'
              }`}>
                <Calendar className={isSeniorMode ? "w-4 h-4 text-amber-400" : "w-3 h-3 text-blue-400"} />
                <span>{isSeniorMode ? 'รอบบิลเดือนและปี' : 'รอบบิล & ปี'}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveMonth(getPreviousMonthKey(activeMonth))}
                  aria-label="ย้อนกลับไปงวดเดือนก่อนหน้า"
                  title="ย้อนกลับ 1 เดือน"
                  className={`p-1.5 rounded transition cursor-pointer ${
                    isSeniorMode ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMonth(getNextMonthKey(activeMonth))}
                  aria-label="ไปยังงวดเดือนถัดไป"
                  title="ไปเดือนถัดไป (นำยอดค้างจ่ายไปงวดหน้าอัตโนมัติ)"
                  className={`p-1.5 rounded transition cursor-pointer ${
                    isSeniorMode ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleYearMonthCollapsed}
                  aria-label={isYearMonthCollapsed ? "ขยายแผงเลือกปี/เดือน" : "ย่อแผงเลือกปี/เดือน"}
                  title={isYearMonthCollapsed ? "ขยายแผงเลือกปี/เดือน" : "ย่อแผงเลือกปี/เดือน"}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer ml-0.5"
                >
                  {isYearMonthCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isYearMonthCollapsed ? (
              <div className="space-y-2.5">
                {/* Year Selection */}
                <div className={`p-2.5 rounded-xl border ${
                  isSeniorMode ? 'bg-slate-900 border-2 border-amber-500/40' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={isSeniorMode ? "text-xs font-bold text-amber-200" : "text-[10px] text-slate-400 font-semibold"}>
                      เลือกปี พ.ศ.:
                    </span>
                    <select
                      value={currentMonthInfo.year}
                      onChange={(e) => setActiveMonth(setYearForMonthKey(activeMonth, parseInt(e.target.value, 10)))}
                      className={`rounded px-2 py-0.5 font-black font-mono focus:outline-none cursor-pointer border ${
                        isSeniorMode 
                          ? 'bg-amber-400 text-slate-950 border-amber-300 text-xs' 
                          : 'bg-slate-800 border-slate-700 text-emerald-400 text-[10px]'
                      }`}
                      title="เลือกปีที่ต้องการ"
                    >
                      {selectableYears.map((y) => (
                        <option key={y} value={y}>
                          พ.ศ. {y + 543} ({y})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clickable Quick Year Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2024, 2025, 2026, 2027].map((y) => {
                      const isYearActive = currentMonthInfo.year === y;
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setActiveMonth(setYearForMonthKey(activeMonth, y))}
                          className={`py-1.5 px-1 rounded-lg font-black font-mono transition cursor-pointer text-center ${
                            isSeniorMode ? 'text-xs min-h-[38px]' : 'text-[10px]'
                          } ${
                            isYearActive
                              ? (isSeniorMode ? 'bg-amber-400 text-slate-950 ring-2 ring-white shadow-md' : 'bg-blue-600 text-white ring-1 ring-blue-400')
                              : (isSeniorMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300')
                          }`}
                          title={`กดเลือกปี พ.ศ. ${y + 543} (${y})`}
                        >
                          {y + 543}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 12-Month Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isSeniorMode ? "text-xs font-bold text-slate-300" : "text-[10px] text-slate-400"}>
                      เลือกเดือน:
                    </span>
                    <span className={`font-black font-mono ${isSeniorMode ? 'text-xs text-amber-300' : 'text-[10px] text-emerald-400'}`}>
                      {currentMonthInfo.shortDisplay} {currentMonthInfo.yearThai}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {THAI_MONTH_NAMES_SHORT.map((mName, idx) => {
                      const mNum = idx + 1;
                      const isCurrentMonthActive = currentMonthInfo.month === mNum;
                      return (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => setActiveMonth(setMonthForMonthKey(activeMonth, mNum))}
                          className={`py-2 px-1 rounded-lg transition cursor-pointer text-center font-bold ${
                            isSeniorMode ? 'text-xs min-h-[42px] border-2' : 'text-[10px] py-1'
                          } ${
                            isCurrentMonthActive
                              ? (isSeniorMode ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-black shadow-md' : 'bg-emerald-600 text-white ring-1 ring-emerald-400')
                              : (isSeniorMode ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300')
                          }`}
                          title={`เลือกเดือน ${mNum.toString().padStart(2, '0')} ${mName} ${currentMonthInfo.yearThai}`}
                        >
                          {mName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl border font-bold font-mono ${
                isSeniorMode ? 'bg-slate-900 border-amber-500/40 text-amber-300 text-sm' : 'bg-slate-950/60 border-slate-800 text-emerald-400 text-xs'
              }`}>
                <span>{currentMonthInfo.shortDisplay} {currentMonthInfo.yearThai}</span>
                <span className="text-[10px] text-slate-400 font-normal">รอบบิลปัจจุบัน</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 border-b border-slate-800 flex flex-col items-center gap-1">
            <div 
              title={`งวดปัจจุบัน: ${currentMonthInfo.displayName}`}
              className="px-2 py-1 bg-slate-800 rounded text-xs font-bold text-emerald-400 font-mono text-center"
            >
              <div>{currentMonthInfo.shortDisplay}</div>
              <div className="text-[10px] text-slate-400">{currentMonthInfo.yearThai}</div>
            </div>
          </div>
        )}

        {/* Navigation List - Large Touch Targets in Elderly Mode */}
        <nav 
          aria-label="รายการเมนู"
          className={`p-2.5 space-y-1.5 ${isSeniorMode ? 'space-y-2' : 'space-y-1'}`}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            const itemDisplayLabel = isSeniorMode ? item.seniorLabel : item.label;

            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? itemDisplayLabel : undefined}
                  className={`w-full flex items-center rounded-xl transition-all cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    isCollapsed 
                      ? 'justify-center p-3' 
                      : (isSeniorMode 
                          ? 'px-3.5 py-3 min-h-[52px] justify-between gap-3 border-2' 
                          : 'px-3 py-2.5 justify-between gap-3 border')
                  } ${
                    isActive
                      ? (isSeniorMode 
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-lg ring-2 ring-amber-300' 
                          : 'bg-blue-600 text-white border-blue-500 shadow-md font-bold')
                      : (isSeniorMode
                          ? 'bg-slate-900/90 text-white border-slate-800 hover:border-amber-400/60 hover:bg-slate-850 font-bold'
                          : 'bg-transparent text-slate-300 border-transparent hover:bg-slate-800 hover:text-white font-semibold text-xs')
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`flex-shrink-0 ${
                      isActive 
                        ? (isSeniorMode ? 'text-slate-950 w-6 h-6' : 'text-white w-4 h-4') 
                        : (isSeniorMode ? `${item.iconColor} w-6 h-6` : `${item.iconColor} w-4 h-4`)
                    }`} />
                    {!isCollapsed && (
                      <span className={`truncate ${isSeniorMode ? 'text-sm font-extrabold text-left' : 'text-xs'}`}>
                        {itemDisplayLabel}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && item.badge !== undefined && (
                    <span className={`rounded-full font-mono font-bold flex-shrink-0 ${
                      isSeniorMode ? 'text-xs px-2.5 py-0.5' : 'text-[10px] px-1.5 py-0.5'
                    } ${
                      isActive && isSeniorMode 
                        ? 'bg-slate-950 text-amber-300' 
                        : item.badgeColor
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && isActive && (
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-xs"></span>
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Mode */}
                {isCollapsed && hoveredTab === item.id && (
                  <div className="absolute left-[80px] top-1/2 -translate-y-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xl border border-slate-700 whitespace-nowrap flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-left-1 duration-150">
                    <span>{itemDisplayLabel}</span>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Buildings Summary List (Collapsible) */}
        {!isCollapsed && (
          <div className={`p-3 mx-3 my-2 rounded-xl border flex-shrink-0 transition-all ${
            isSeniorMode 
              ? 'bg-slate-900 border-2 border-slate-800' 
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div 
              onClick={toggleBuildingsCollapsed}
              className="flex items-center justify-between cursor-pointer select-none group"
              title={isBuildingsCollapsed ? "คลิกเพื่อขยายดูรายชื่ออาคารและจำนวนยูนิต" : "คลิกเพื่อย่อส่วนอาคารในระบบ"}
            >
              <span className={`flex items-center gap-2 font-bold transition ${
                isSeniorMode ? 'text-xs text-amber-300' : 'text-[11px] text-slate-300 group-hover:text-white'
              }`}>
                <Building2 className={isSeniorMode ? "w-4 h-4 text-amber-400" : "w-3.5 h-3.5 text-blue-400"} />
                <span>อาคารในระบบ ({buildings.length})</span>
              </span>
              <button
                type="button"
                className="p-1 text-slate-400 group-hover:text-white hover:bg-slate-700 rounded transition"
                aria-label={isBuildingsCollapsed ? "ขยายรายชื่ออาคาร" : "ย่อรายชื่ออาคาร"}
              >
                {isBuildingsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isBuildingsCollapsed && (
              <div className="mt-2.5 pt-2 border-t border-slate-700/60 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {buildings.map((b) => {
                  const bRooms = rooms.filter(r => r.building === b.name || r.buildingId === b.id);
                  const bOccupied = bRooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
                  return (
                    <div key={b.id} className="flex justify-between items-center text-slate-200 text-xs hover:text-white transition">
                      <span className="truncate max-w-[130px] font-medium" title={b.name}>{b.name}</span>
                      <span className={`font-bold font-mono ${isSeniorMode ? 'text-xs text-amber-300' : 'text-[10px] text-slate-400'}`}>
                        {bOccupied}/{b.totalUnits} ยูนิต
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer / Profile & Settings (Fixed at bottom) */}
      <div className={`border-t flex-shrink-0 ${
        isSeniorMode ? 'border-amber-500/30 bg-[#0f172a]' : 'border-slate-800 bg-[#111827]'
      } ${isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div 
              onClick={currentUser.role === 'owner' ? onOpenUserManager : undefined}
              className={`flex items-center gap-2.5 min-w-0 ${
                currentUser.role === 'owner' ? 'cursor-pointer hover:opacity-90 transition' : 'cursor-default'
              }`}
              title={currentUser.role === 'owner' ? "จัดการผู้ใช้งาน" : "สิทธิ์พนักงานดูแล"}
            >
              <div className={`rounded-full flex items-center justify-center font-bold text-white shadow-xs flex-shrink-0 ${
                isSeniorMode ? 'w-9 h-9 bg-amber-500 text-slate-950 text-base font-black' : 'w-8 h-8 bg-indigo-600 text-sm'
              }`}>
                {currentUser.avatar || '👤'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-black text-white truncate ${isSeniorMode ? 'text-xs' : 'text-xs'}`}>
                  {currentUser.name}
                </span>
                <span className={`truncate ${isSeniorMode ? 'text-[11px] text-amber-300 font-bold' : 'text-[10px] text-slate-400'}`}>
                  {currentUser.role === 'owner' ? '👑 เจ้าของหอพัก' : '👷‍♂️ พนักงานดูแล'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {onOpenClearDataModal && (
                <button
                  type="button"
                  onClick={onOpenClearDataModal}
                  aria-label="ล้างข้อมูลและเริ่มต้นใหม่"
                  title="ล้างข้อมูลและเริ่มต้นใหม่ (Start Fresh Setup)"
                  className={`p-2 rounded-lg transition cursor-pointer border ${
                    isSeniorMode 
                      ? 'bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border-indigo-700 shadow-xs' 
                      : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/60 border-transparent'
                  }`}
                >
                  <Sparkles className={isSeniorMode ? "w-5 h-5" : "w-4 h-4"} />
                </button>
              )}

              <button
                type="button"
                onClick={onOpenApartmentSettings}
                aria-label="ตั้งค่าระบบอพาร์ตเมนต์"
                title="ตั้งค่าอพาร์ตเมนต์ (Settings)"
                className={`p-2 rounded-lg transition cursor-pointer border ${
                  isSeniorMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 shadow-xs' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'
                }`}
              >
                <Settings className={isSeniorMode ? "w-5 h-5" : "w-4 h-4"} />
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="ออกจากระบบ (Sign Out)"
                  title="ออกจากระบบ (Sign Out)"
                  className={`p-2 rounded-lg transition cursor-pointer border ${
                    isSeniorMode
                      ? 'bg-red-950/60 hover:bg-red-900 text-red-300 border-red-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-red-400 hover:bg-red-950/50 border-transparent'
                  }`}
                >
                  <LogOut className={isSeniorMode ? "w-5 h-5" : "w-4 h-4"} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={currentUser.role === 'owner' ? onOpenUserManager : undefined}
              title={currentUser.role === 'owner' ? `สลับผู้ใช้งาน: ${currentUser.name}` : `พนักงานดูแล: ${currentUser.name}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition text-base ${
                currentUser.role === 'owner' ? 'bg-indigo-900/60 hover:bg-indigo-800 cursor-pointer' : 'bg-slate-800 cursor-default opacity-80'
              }`}
            >
              {currentUser.avatar || '👤'}
            </button>
            <button
              type="button"
              onClick={onOpenApartmentSettings}
              title={`ตั้งค่า: ${config.propertyName}`}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="ออกจากระบบ (Sign Out)"
                className="w-10 h-10 rounded-xl bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="ขยายเมนู (Expand)"
                className="w-10 h-10 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* 4. Desktop Drag-Resize Handle on the right edge */}
      {!isCollapsed && !isFullyHidden && (
        <div 
          onMouseDown={() => setIsResizing(true)}
          title="ลากเพื่อปรับความกว้างของเมนูด้านซ้าย (Drag to Resize)"
          aria-label="ตัวปรับขนาดความกว้างแถบเมนู"
          className="hidden md:block absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-amber-400/50 active:bg-amber-500 transition-colors z-40 group"
        >
          <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-amber-400 absolute top-1/2 right-0.5 -translate-y-1/2 rounded-full" />
        </div>
      )}
    </aside>
  );
};
