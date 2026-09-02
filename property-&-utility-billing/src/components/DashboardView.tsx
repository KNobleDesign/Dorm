import React, { useState } from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Droplet, 
  Zap, 
  Building, 
  ArrowUpRight, 
  Search, 
  Filter, 
  PencilLine, 
  FileText,
  Check,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Download,
  AlertTriangle,
  X,
  UserX,
  ArrowRight,
  Printer
} from 'lucide-react';
import { RoomRecord, BuildingSummary, LandlordConfig, AppUser, ExpenseRecord } from '../types';
import { Edit3, Building as BuildingIcon, Users, DoorClosed, Home, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ExpenseDashboardSection } from './ExpenseDashboardSection';
import { DashboardPdfExportModal } from './DashboardPdfExportModal';

interface DashboardViewProps {
  rooms: RoomRecord[];
  activeMonth: string;
  buildings: string[];
  config: LandlordConfig;
  currentUser?: AppUser;
  expenses: ExpenseRecord[];
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
  onOpenMeterModal: (building: string, roomNo: string) => void;
  onOpenInvoiceModal: (room: RoomRecord) => void;
  onTogglePaymentStatus: (key: string) => void;
  onNavigateToMeter: () => void;
  onOpenApartmentSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  rooms,
  activeMonth,
  buildings,
  config,
  currentUser,
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onOpenMeterModal,
  onOpenInvoiceModal,
  onTogglePaymentStatus,
  onNavigateToMeter,
  onOpenApartmentSettings,
}) => {
  const isCaretaker = currentUser?.role === 'caretaker';
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('ALL');

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUnpaidModal, setShowUnpaidModal] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Effective room total calculation with liabilities
  const getRoomEffectiveTotal = (r: RoomRecord) => {
    if (r.grandTotal !== undefined && r.grandTotal !== null) return r.grandTotal;
    const liability = (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || config.lateFeePerDayDefault || 100)));
    return (r.total || 0) + liability;
  };

  // Unpaid rooms calculation
  const unpaidRooms = rooms.filter(r => !r.isPaid && (r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)));
  const totalUnpaidAmount = unpaidRooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);

  // Calculations
  const totalRevenue = rooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const collectedRevenue = rooms.filter(r => r.isPaid).reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const pendingRevenue = totalRevenue - collectedRevenue;
  const totalLiability = rooms.reduce((sum, r) => sum + (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || config.lateFeePerDayDefault || 100))), 0);

  const totalRent = rooms.reduce((sum, r) => sum + (r.rent || 0), 0);
  const totalWaterUnits = rooms.reduce((sum, r) => sum + (r.waterUnits || 0), 0);
  const totalWaterCost = rooms.reduce((sum, r) => sum + (r.waterCost || 0), 0);
  const totalElecUnits = rooms.reduce((sum, r) => sum + (r.elecUnits || 0), 0);
  const totalElecCost = rooms.reduce((sum, r) => sum + (r.elecCost || 0), 0);

  const completedMeters = rooms.filter(r => r.hasMeterUpdated).length;
  const meterProgress = rooms.length > 0 ? Math.round((completedMeters / rooms.length) * 100) : 0;
  const paidCount = rooms.filter(r => r.isPaid).length;

  const occupiedRooms = rooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
  const vacantRooms = rooms.filter(r => r.occupancyStatus === 'vacant').length;
  const renoRooms = rooms.filter(r => r.occupancyStatus === 'under_renovation').length;
  const totalOccupants = rooms.reduce((sum, r) => sum + (r.occupants || 0), 0);
  const occupancyPercent = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    if (selectedBuildingFilter !== 'ALL' && r.building !== selectedBuildingFilter) return false;
    if (selectedStatusFilter === 'PAID' && !r.isPaid) return false;
    if (selectedStatusFilter === 'UNPAID' && r.isPaid) return false;
    if (selectedStatusFilter === 'METER_PENDING' && r.hasMeterUpdated) return false;
    if (selectedStatusFilter === 'LIABILITY') {
      const liab = (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || 100)));
      if (liab <= 0) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoom = r.roomNo.toLowerCase().includes(q);
      const matchTenant = r.tenantName.toLowerCase().includes(q);
      const matchBuilding = r.building.toLowerCase().includes(q);
      return matchRoom || matchTenant || matchBuilding;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-google-sans">
      {/* Top Banner / Apartment Name & Cycle bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
              งวดประจำเดือน {activeMonth}
            </span>
            <span className="text-xs text-slate-500 font-medium">Google Spreadsheet Sync Active</span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              🏢 {config.propertyName || 'พีแอนด์เจ อพาร์ตเมนต์'}
            </h2>
            <button
              onClick={onOpenApartmentSettings}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
              title="แก้ไขชื่ออพาร์ตเมนต์และข้อมูลผู้ให้เช่า"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไขชื่อ / ข้อมูล</span>
            </button>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            ผู้จัดการ: <strong className="text-slate-700">{config.landlordName}</strong> | ติดต่อ: <span className="font-mono">{config.phone}</span> | เข้าพัก {occupiedRooms}/{rooms.length} ห้อง ({occupancyPercent}%)
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-none flex-nowrap shrink-0">
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer flex-shrink-0 whitespace-nowrap"
            title="ส่งออกรายงานสรุปผลประกอบการประจำเดือนเป็นไฟล์ PDF"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>ส่งออก PDF (Export PDF)</span>
          </button>

          <button
            onClick={onOpenApartmentSettings}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition border border-slate-200 cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <BuildingIcon className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <span>ตั้งค่าอพาร์ตเมนต์</span>
          </button>

          <button
            onClick={onNavigateToMeter}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <PencilLine className="w-4 h-4 flex-shrink-0" />
            <span>บันทึกมิเตอร์น้ำ-ไฟ</span>
          </button>
        </div>
      </div>

      {/* Top Notice for Caretaker */}
      {isCaretaker && (
        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <EyeOff className="w-4 h-4 text-amber-700" />
            <span>โหมดพนักงานดูแล (Caretaker Mode): ซ่อนข้อมูลรายรับการเงิน แสดงเฉพาะข้อมูลการเข้าพักและงานจดมิเตอร์น้ำไฟ</span>
          </div>
          <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded font-bold">
            เข้าถึงเฉพาะมิเตอร์ & ห้องพัก
          </span>
        </div>
      )}

      {/* 4 Major KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue (Owner) / Occupancy (Caretaker) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isCaretaker ? 'สถานะห้องพัก (Occupancy)' : 'ยอดรวมทั้งสิ้น (Total Revenue)'}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                isCaretaker ? 'bg-blue-50 text-blue-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {isCaretaker ? <Users className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {isCaretaker ? `${occupiedRooms}/${rooms.length} ห้อง` : `฿${totalRevenue.toLocaleString()}`}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span>{isCaretaker ? `ว่าง ${rooms.length - occupiedRooms} ห้อง` : `ค่าเช่า: ฿${totalRent.toLocaleString()}`}</span>
            <span className="text-emerald-600 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> {isCaretaker ? `${occupancyPercent}% เข้าพัก` : '100%'}
            </span>
          </div>
        </div>

        {/* Card 2: Collected (Owner) / Meter Progress (Caretaker) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isCaretaker ? 'บันทึกมิเตอร์แล้ว' : 'ชำระแล้ว (Collected)'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                {isCaretaker ? <Zap className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-2">
              {isCaretaker ? `${meterProgress}%` : `฿${collectedRevenue.toLocaleString()}`}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span>{isCaretaker ? `เสร็จ ${completedMeters}/${rooms.length} ห้อง` : `${paidCount}/${rooms.length} ห้องชำระแล้ว`}</span>
            <span className="text-green-600 font-bold">
              {isCaretaker ? `${rooms.length - completedMeters} รอกรอก` : `${totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : 0}%`}
            </span>
          </div>
        </div>

        {/* Card 3: Pending (Owner) / Water Units (Caretaker) */}
        <div className={`bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-between transition ${
          !isCaretaker && unpaidRooms.length > 0 ? 'border-red-200 bg-linear-to-b from-white to-red-50/20' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isCaretaker ? 'การใช้น้ำรวม (Water Units)' : 'ยอดค้างชำระ (Pending)'}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isCaretaker ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
              }`}>
                {isCaretaker ? <Droplet className="w-4 h-4 text-blue-600" /> : <Clock className="w-4 h-4" />}
              </div>
            </div>
            <div className={`text-2xl font-bold mt-2 ${isCaretaker ? 'text-blue-600' : 'text-red-600'}`}>
              {isCaretaker ? `${totalWaterUnits.toLocaleString()} หน่วย` : `฿${pendingRevenue.toLocaleString()}`}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span>{isCaretaker ? 'ใช้น้ำประปารวม' : `${unpaidRooms.length} ห้องยังไม่ชำระ`}</span>
            {!isCaretaker && unpaidRooms.length > 0 ? (
              <button
                onClick={() => setShowUnpaidModal(true)}
                className="text-red-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5 text-xs"
                title="คลิกเพื่อดูรายชื่อห้องที่ยังไม่ชำระเงิน และยอดที่จะยกยอดไปเดือนถัดไป"
              >
                <span>ดูสรุปค้างจ่าย ({unpaidRooms.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className={isCaretaker ? 'text-blue-600 font-bold' : 'text-emerald-600 font-medium'}>
                {isCaretaker ? 'งวดนี้' : 'ครบถ้วนแล้ว'}
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Progress (Owner) / Elec Units (Caretaker) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isCaretaker ? 'การใช้ไฟรวม (Electricity)' : 'บันทึกมิเตอร์แล้ว'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-2">
              {isCaretaker ? `${totalElecUnits.toLocaleString()} หน่วย` : `${meterProgress}%`}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            {isCaretaker ? (
              <>
                <span>ใช้ไฟฟ้ารวม</span>
                <span className="text-amber-600 font-bold">งวดนี้</span>
              </>
            ) : (
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${meterProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Utility Consumption Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Water Consumption */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">การใช้น้ำประปา (Water Supply)</h4>
              <p className="text-xs text-slate-500">รวมทุกอาคารประจำงวด {activeMonth}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">{totalWaterUnits.toLocaleString()} หน่วย</div>
            {!isCaretaker && <div className="text-xs font-medium text-slate-500">รวม ฿{totalWaterCost.toLocaleString()}</div>}
          </div>
        </div>

        {/* Electricity Consumption */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">การใช้ไฟฟ้า (Electricity)</h4>
              <p className="text-xs text-slate-500">รวมทุกอาคารประจำงวด {activeMonth}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-amber-600">{totalElecUnits.toLocaleString()} หน่วย</div>
            {!isCaretaker && <div className="text-xs font-medium text-slate-500">รวม ฿{totalElecCost.toLocaleString()}</div>}
          </div>
        </div>
      </div>

      {/* Buildings Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          <span>{isCaretaker ? 'สรุปข้อมูลแยกรายอาคาร (Building Profiles & Units)' : 'สรุปยอดแยกรายอาคาร (Building Revenue Breakdown)'}</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {buildings.map((b) => {
            const bRooms = rooms.filter(r => r.building === b);
            const bTotal = bRooms.reduce((sum, r) => sum + r.total, 0);
            const bPaid = bRooms.filter(r => r.isPaid).reduce((sum, r) => sum + r.total, 0);
            const bPending = bTotal - bPaid;
            const bWater = bRooms.reduce((sum, r) => sum + r.waterUnits, 0);
            const bElec = bRooms.reduce((sum, r) => sum + r.elecUnits, 0);

            return (
              <div key={b} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{b}</h4>
                    <span className="text-xs text-slate-500">
                      {bRooms.length} ห้อง ({bRooms.filter(r => r.hasMeterUpdated).length} บันทึกมิเตอร์แล้ว)
                    </span>
                  </div>
                  {!isCaretaker ? (
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                      ฿{bTotal.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {bRooms.length} ห้อง
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-200">
                  <div className="bg-white p-2.5 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-0.5">{isCaretaker ? 'จดมิเตอร์แล้ว / ทั้งหมด:' : 'ชำระแล้ว / ค้างชำระ:'}</span>
                    {!isCaretaker ? (
                      <>
                        <span className="font-semibold text-green-600">฿{bPaid.toLocaleString()}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="font-semibold text-red-600">฿{bPending.toLocaleString()}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-amber-600">{bRooms.filter(r => r.hasMeterUpdated).length} ห้อง</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="font-semibold text-slate-600">{bRooms.length} ห้อง</span>
                      </>
                    )}
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-0.5">หน่วยน้ำ / หน่วยไฟ:</span>
                    <span className="font-semibold text-blue-600">{bWater} หน่วย</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="font-semibold text-amber-600">{bElec} หน่วย</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense Management & Financial Graphs Section */}
      {!isCaretaker && (
        <ExpenseDashboardSection
          expenses={expenses}
          rooms={rooms}
          buildings={buildings}
          activeMonth={activeMonth}
          currentUser={currentUser}
          onAddExpense={onAddExpense}
          onUpdateExpense={onUpdateExpense}
          onDeleteExpense={onDeleteExpense}
        />
      )}

      {/* Main Room Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">รายการห้องพักและสถานะมิเตอร์ประจำงวด</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงข้อมูลเลขมิเตอร์น้ำ-ไฟ {isCaretaker ? 'และสถานะการเข้าพัก' : 'ค่าเช่า และการชำระเงิน'} ทั้งหมด {filteredRooms.length} ห้อง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาห้อง, ผู้เช่า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Building Filter */}
            <select
              value={selectedBuildingFilter}
              onChange={(e) => setSelectedBuildingFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="ALL">ทุกอาคาร ({buildings.length})</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="PAID">ชำระแล้ว (Paid)</option>
              <option value="UNPAID">ค้างชำระ (Pending)</option>
              <option value="LIABILITY">⚠️ มียอดค้าง / ค่าปรับล่าช้า</option>
              <option value="METER_PENDING">รอกรอกมิเตอร์</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">อาคาร / ห้อง</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ชื่อผู้เช่า / สถานะ</th>
                {!isCaretaker && <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">ค่าเช่า</th>}
                {isCaretaker && <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">วิธีคิดค่าน้ำ</th>}
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">มิเตอร์น้ำ</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">มิเตอร์ไฟ</th>
                {!isCaretaker && <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">ยอดรวมสุทธิ</th>}
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะมิเตอร์</th>
                {!isCaretaker && <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะการชำระ</th>}
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={isCaretaker ? 7 : 9} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลห้องพักที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredRooms.map((r) => {
                  const roomLiability = (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || 100)));
                  const roomGrandTotal = getRoomEffectiveTotal(r);

                  return (
                    <tr key={r.key} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 text-xs">
                          {r.roomNo}
                        </span>
                        <div className="text-[11px] text-slate-400">{r.building}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>{r.tenantName || <span className="text-slate-400 italic">ห้องว่าง</span>}</span>
                          {r.occupancyStatus === 'vacant' && (
                            <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-700 font-semibold">ห้องว่าง</span>
                          )}
                          {r.occupancyStatus === 'under_renovation' && (
                            <span className="text-[9px] px-1 rounded bg-purple-100 text-purple-700 font-semibold">ปรับปรุง</span>
                          )}
                          {!isCaretaker && roomLiability > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                              ⚠️ ค้าง/ปรับ +฿{roomLiability.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {r.phone && <div className="text-[10px] text-slate-400">{r.phone}</div>}
                      </td>

                      {!isCaretaker ? (
                        <td className="py-3 px-4 text-right font-medium text-slate-900">
                          ฿{r.rent.toLocaleString()}
                        </td>
                      ) : (
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.waterCalcType === 'per_person' ? 'bg-cyan-100 text-cyan-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {r.waterCalcType === 'per_person' ? `เหมาจ่าย (${r.occupants || 1} คน)` : 'ตามมิเตอร์'}
                          </span>
                        </td>
                      )}

                      {/* Water Meter */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span>{r.waterPrev}</span>
                          <span>&rarr;</span>
                          <span className={r.waterCurr > 0 ? 'font-semibold text-slate-900' : 'text-amber-600'}>
                            {r.waterCurr > 0 ? r.waterCurr : 'รอกรอก'}
                          </span>
                        </div>
                        <div className="text-blue-600 font-semibold text-[11px]">
                          {r.waterUnits} หน่วย {!isCaretaker && `(฿${r.waterCost.toLocaleString()})`}
                        </div>
                      </td>

                      {/* Electricity Meter */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span>{r.elecPrev}</span>
                          <span>&rarr;</span>
                          <span className={r.elecCurr > 0 ? 'font-semibold text-slate-900' : 'text-amber-600'}>
                            {r.elecCurr > 0 ? r.elecCurr : 'รอกรอก'}
                          </span>
                        </div>
                        <div className="text-amber-600 font-semibold text-[11px]">
                          {r.elecUnits} หน่วย {!isCaretaker && `(฿${r.elecCost.toLocaleString()})`}
                        </div>
                      </td>

                      {/* Grand Total (Owner Only) */}
                      {!isCaretaker && (
                        <td className="py-3 px-4 text-right font-bold text-xs text-slate-900">
                          <span className="text-slate-900 font-black">฿{roomGrandTotal.toLocaleString()}</span>
                          {roomLiability > 0 && (
                            <div className="text-[10px] text-amber-700 font-normal">
                              (รวมค้าง/ปรับ +฿{roomLiability.toLocaleString()})
                            </div>
                          )}
                        </td>
                      )}

                      {/* Meter Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          r.hasMeterUpdated
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {r.hasMeterUpdated ? 'บันทึกแล้ว' : 'รอกรอก'}
                        </span>
                      </td>

                      {/* Payment Status Toggle (Owner Only) */}
                      {!isCaretaker && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onTogglePaymentStatus(r.key)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer shadow-2xs ${
                              r.isPaid
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                            }`}
                            title={r.isPaid ? 'คลิกเพื่อเปลี่ยนเป็นยังไม่ชำระ (จะยกยอดไปเดือนถัดไป)' : 'คลิกเพื่อยืนยันการชำระเงินแล้ว'}
                          >
                            {r.isPaid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>จ่ายแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-red-600" />
                                <span>ยังไม่จ่าย</span>
                              </>
                            )}
                          </button>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenMeterModal(r.building, r.roomNo)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition cursor-pointer text-xs flex items-center gap-1"
                            title="บันทึกมิเตอร์ห้องนี้"
                          >
                            <PencilLine className="w-3 h-3" />
                            <span>จดมิเตอร์</span>
                          </button>
                          {!isCaretaker && (
                            <button
                              onClick={() => onOpenInvoiceModal(r)}
                              className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition cursor-pointer text-xs"
                              title="ดู/ออกใบแจ้งหนี้ PDF"
                            >
                              Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unpaid Summary Modal */}
      {showUnpaidModal && !isCaretaker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-linear-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <UserX className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">สรุปผู้เช่าที่ยังไม่ชำระเงิน (งวดประจำเดือน {activeMonth})</h3>
                  <p className="text-xs text-red-100">ระบบจะยกยอดหนี้ค้างทั้งหมดไปเป็น "ช่องค้างจ่าย" ในเดือนถัดไปให้อัตโนมัติ</p>
                </div>
              </div>
              <button
                onClick={() => setShowUnpaidModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
              {unpaidRooms.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-700 text-sm">ยอดเยี่ยม! ทุกห้องชำระเงินครบถ้วนแล้ว</p>
                  <p className="text-xs text-slate-400 mt-1">ไม่มีผู้เช่าค้างชำระในงวดเดือนนี้</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-red-50 p-3.5 rounded-xl border border-red-200 text-xs">
                    <div className="text-red-900 font-medium">
                      รวมทั้งสิ้น <strong className="font-bold text-red-700 text-sm">{unpaidRooms.length}</strong> ห้อง
                    </div>
                    <div className="text-right">
                      <span className="text-red-600 font-bold text-base">฿{totalUnpaidAmount.toLocaleString()}</span>
                      <div className="text-[10px] text-red-500 font-medium">ยอดหนี้ที่จะถูกส่งต่อไปงวดถัดไป</div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">ห้อง / อาคาร</th>
                          <th className="py-2.5 px-3 font-semibold">ผู้เช่า / โทร</th>
                          <th className="py-2.5 px-3 font-semibold text-right">ยอดคงค้างงวดนี้</th>
                          <th className="py-2.5 px-3 font-semibold text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {unpaidRooms.map(r => {
                          const total = getRoomEffectiveTotal(r);
                          return (
                            <tr key={r.key} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900">{r.roomNo}</span>
                                <div className="text-[10px] text-slate-400">{r.building}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-medium text-slate-800">{r.tenantName || 'ไม่ระบุชื่อ'}</span>
                                {r.phone && <div className="text-[10px] text-slate-400">{r.phone}</div>}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-red-600">
                                ฿{total.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => onTogglePaymentStatus(r.key)}
                                  className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition cursor-pointer"
                                >
                                  กดจ่ายแล้ว
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                💡 เมื่อสลับเดือน ยอดคงค้างทั้งหมดจะไปปรากฏในช่อง <strong>"ยอดยกมา / ค้างชำระ"</strong> ของเดือนถัดไปอัตโนมัติ
              </span>
              <button
                onClick={() => setShowUnpaidModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard PDF Export Modal */}
      <DashboardPdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        rooms={rooms}
        activeMonth={activeMonth}
        buildings={buildings}
        config={config}
        expenses={expenses}
        currentUser={currentUser}
      />
    </div>
  );
};
