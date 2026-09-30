import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DoorClosed, 
  UserCheck, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Droplet, 
  Zap, 
  Check, 
  X, 
  Search, 
  Filter, 
  Sparkles,
  Phone,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Calculator,
  RotateCcw,
  Wrench,
  ChevronDown,
  Layers,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react';
import { RoomRecord, LandlordConfig, WaterCalcType, BuildingProfile, OccupancyStatus } from '../types';

interface RoomBuildingManagerViewProps {
  rooms: RoomRecord[];
  activeMonth: string;
  buildings: BuildingProfile[];
  config: LandlordConfig;
  initialBuildingFilter?: string;
  onAddRoom: (newRoom: RoomRecord, applyToAllMonths: boolean) => void;
  onUpdateRoom: (updatedRoom: RoomRecord, applyToAllMonths: boolean) => void;
  onDeleteRoom: (roomKey: string, applyToAllMonths: boolean) => void;
  onNavigateToMeter: () => void;
  onNavigateToBuildings: () => void;
  onOpenClearDataModal?: () => void;
  onRestoreDemoData?: () => void;
}

export const RoomBuildingManagerView: React.FC<RoomBuildingManagerViewProps> = ({
  rooms,
  activeMonth,
  buildings,
  config,
  initialBuildingFilter,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onNavigateToMeter,
  onNavigateToBuildings,
  onOpenClearDataModal,
  onRestoreDemoData,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>(initialBuildingFilter || 'ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedWaterCalcFilter, setSelectedWaterCalcFilter] = useState<string>('ALL');

  // Synchronize with initialBuildingFilter when navigated from building view
  useEffect(() => {
    if (initialBuildingFilter) {
      setSelectedBuildingFilter(initialBuildingFilter);
    }
  }, [initialBuildingFilter]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<RoomRecord | null>(null);
  const [applyToAllMonths, setApplyToAllMonths] = useState<boolean>(true);

  // Form states for Add / Edit
  const [formData, setFormData] = useState<{
    buildingId: string;
    building: string;
    roomNo: string;
    floor: number;
    tenantName: string;
    phone: string;
    occupants: number;
    occupancyStatus: OccupancyStatus;
    renovationReason: string;
    rent: number;
    waterCalcType: WaterCalcType;
    waterPerPersonRate: number;
    waterRate: number;
    waterPrev: number;
    waterCurr: number;
    elecRate: number;
    elecPrev: number;
    elecCurr: number;
    otherFees: number;
    previousBalance: number;
    notes: string;
  }>({
    buildingId: buildings[0]?.id || 'BLD-DM01',
    building: buildings[0]?.name || 'อาคารดอนเมือง',
    roomNo: '',
    floor: 1,
    tenantName: '',
    phone: '',
    occupants: 1,
    occupancyStatus: 'occupied',
    renovationReason: '',
    rent: 3800,
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    waterRate: config.waterRateDefault || 18,
    waterPrev: 1000,
    waterCurr: 0,
    elecRate: config.elecRateDefault || 8,
    elecPrev: 2000,
    elecCurr: 0,
    otherFees: config.commonFeeDefault || 0,
    previousBalance: 0,
    notes: '',
  });

  const [formValidationErrors, setFormValidationErrors] = useState<Record<string, string>>({});

  // Open Add Modal
  const handleOpenAddModal = (defaultBuildingName?: string) => {
    const targetBld = buildings.find(b => b.name === defaultBuildingName) || buildings[0];
    setFormData({
      buildingId: targetBld?.id || 'BLD-DM01',
      building: targetBld?.name || 'อาคารดอนเมือง',
      roomNo: '',
      floor: 1,
      tenantName: '',
      phone: '',
      occupants: 1,
      occupancyStatus: 'occupied',
      renovationReason: '',
      rent: 3800,
      waterCalcType: 'meter',
      waterPerPersonRate: config.waterPerPersonRateDefault || 100,
      waterRate: targetBld?.defaultWaterRate || config.waterRateDefault || 18,
      waterPrev: 1000,
      waterCurr: 0,
      elecRate: targetBld?.defaultElecRate || config.elecRateDefault || 8,
      elecPrev: 2000,
      elecCurr: 0,
      otherFees: config.commonFeeDefault || 0,
      previousBalance: 0,
      notes: '',
    });
    setFormValidationErrors({});
    setApplyToAllMonths(true);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (room: RoomRecord) => {
    setEditingRoom(room);
    const targetBld = buildings.find(b => b.name === room.building || b.id === room.buildingId) || buildings[0];
    setFormData({
      buildingId: room.buildingId || targetBld?.id || '',
      building: room.building,
      roomNo: room.roomNo,
      floor: room.floor || 1,
      tenantName: room.tenantName || '',
      phone: room.phone || '',
      occupants: room.occupants || 1,
      occupancyStatus: room.occupancyStatus || (room.isOccupied ? 'occupied' : 'vacant'),
      renovationReason: room.renovationReason || '',
      rent: room.rent,
      waterCalcType: room.waterCalcType || 'meter',
      waterPerPersonRate: room.waterPerPersonRate || config.waterPerPersonRateDefault || 100,
      waterRate: room.waterRate || targetBld?.defaultWaterRate || config.waterRateDefault || 18,
      waterPrev: room.waterPrev,
      waterCurr: room.waterCurr,
      elecRate: room.elecRate || targetBld?.defaultElecRate || config.elecRateDefault || 8,
      elecPrev: room.elecPrev,
      elecCurr: room.elecCurr,
      otherFees: room.otherFees,
      previousBalance: room.previousBalance || 0,
      notes: room.notes || '',
    });
    setFormValidationErrors({});
    setApplyToAllMonths(true);
  };

  // Quick Inline Occupancy Status Switcher
  const handleQuickStatusChange = (room: RoomRecord, newStatus: OccupancyStatus) => {
    const isOccupied = newStatus === 'occupied';
    const occupants = isOccupied ? (room.occupants > 0 ? room.occupants : 1) : 0;
    
    // Recalculate billing
    let waterCost = 0;
    if (isOccupied) {
      if (room.waterCalcType === 'per_person') {
        waterCost = occupants * (room.waterPerPersonRate || 100);
      } else {
        waterCost = room.waterUnits * room.waterRate;
      }
    }
    const elecCost = isOccupied ? room.elecUnits * room.elecRate : 0;
    const rent = isOccupied ? room.rent : 0;
    const otherFees = isOccupied ? room.otherFees : 0;
    const total = rent + waterCost + elecCost + otherFees;

    const updated: RoomRecord = {
      ...room,
      occupancyStatus: newStatus,
      isOccupied,
      occupants,
      waterCost,
      elecCost,
      total,
      notes: newStatus === 'occupied' ? (room.notes || 'มีผู้เช่า') : newStatus === 'vacant' ? 'ห้องว่าง' : 'ปิดปรับปรุง',
    };

    onUpdateRoom(updated, false);
  };

  // Submit Add or Edit Room
  const handleSubmitRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // 1. DATA VALIDATION: Building Existence Check (Foreign Key Integrity)
    const matchedBuilding = buildings.find(
      b => b.id === formData.buildingId || b.name === formData.building
    );

    if (!matchedBuilding) {
      errors.building = 'อาคารที่เลือกไม่มีอยู่ในระบบ กรุณาเลือกอาคารที่มีอยู่จริงหรือสร้างโปรไฟล์อาคารก่อน';
    }

    // 2. Room number validation
    if (!formData.roomNo.trim()) {
      errors.roomNo = 'กรุณาระบุเลขห้อง';
    } else {
      // Check duplicate room in same building
      const isDuplicate = rooms.some(
        r => r.building === (matchedBuilding?.name || formData.building) && 
             r.roomNo.toLowerCase() === formData.roomNo.trim().toLowerCase() &&
             (!editingRoom || r.key !== editingRoom.key)
      );
      if (isDuplicate) {
        errors.roomNo = `เลขห้อง ${formData.roomNo} มีอยู่ในอาคารนี้แล้ว`;
      }
    }

    // 3. Occupancy specific validation
    if (formData.occupancyStatus === 'occupied') {
      if (!formData.tenantName.trim()) {
        errors.tenantName = 'สถานะมีผู้เช่า กรุณาระบุชื่อ-นามสกุลผู้เช่า';
      }
      if (formData.occupants < 1) {
        errors.occupants = 'จำนวนผู้อยู่อาศัยต้องมีอย่างน้อย 1 คน';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormValidationErrors(errors);
      return;
    }

    const effectiveBuildingName = matchedBuilding ? matchedBuilding.name : formData.building;
    const effectiveBuildingId = matchedBuilding ? matchedBuilding.id : formData.buildingId;
    const isOccupied = formData.occupancyStatus === 'occupied';

    // Calculate Costs
    let waterUnits = 0;
    let waterCost = 0;
    if (isOccupied) {
      if (formData.waterCalcType === 'per_person') {
        waterUnits = 0;
        waterCost = formData.occupants * formData.waterPerPersonRate;
      } else {
        waterUnits = formData.waterCurr >= formData.waterPrev && formData.waterCurr > 0 ? formData.waterCurr - formData.waterPrev : 0;
        waterCost = waterUnits * formData.waterRate;
      }
    }

    const elecUnits = isOccupied && formData.elecCurr >= formData.elecPrev && formData.elecCurr > 0 ? formData.elecCurr - formData.elecPrev : 0;
    const elecCost = isOccupied ? elecUnits * formData.elecRate : 0;
    const monthlyTotal = (isOccupied ? formData.rent : 0) + waterCost + elecCost + (isOccupied ? formData.otherFees : 0);
    const prevBalance = Number(formData.previousBalance) || 0;
    const lateFeeTotal = editingRoom ? (editingRoom.lateFeeTotal || 0) : 0;
    const liabilityTotal = prevBalance + lateFeeTotal;
    const grandTotal = monthlyTotal + liabilityTotal;

    if (editingRoom) {
      const updated: RoomRecord = {
        ...editingRoom,
        buildingId: effectiveBuildingId,
        building: effectiveBuildingName,
        roomNo: formData.roomNo.trim(),
        floor: Number(formData.floor) || 1,
        tenantName: isOccupied ? formData.tenantName.trim() : '',
        phone: isOccupied ? formData.phone.trim() : '',
        occupants: isOccupied ? formData.occupants : 0,
        occupancyStatus: formData.occupancyStatus,
        isOccupied,
        renovationReason: formData.occupancyStatus === 'under_renovation' ? formData.renovationReason.trim() : undefined,
        rent: Number(formData.rent) || 0,
        waterCalcType: formData.waterCalcType,
        waterPerPersonRate: Number(formData.waterPerPersonRate) || 100,
        waterRate: Number(formData.waterRate) || 18,
        waterPrev: Number(formData.waterPrev) || 0,
        waterCurr: Number(formData.waterCurr) || 0,
        waterUnits,
        waterCost,
        elecRate: Number(formData.elecRate) || 8,
        elecPrev: Number(formData.elecPrev) || 0,
        elecCurr: Number(formData.elecCurr) || 0,
        elecUnits,
        elecCost,
        otherFees: Number(formData.otherFees) || 0,
        previousBalance: prevBalance,
        liabilityTotal,
        grandTotal,
        total: monthlyTotal,
        notes: formData.notes.trim(),
      };
      onUpdateRoom(updated, applyToAllMonths);
      setEditingRoom(null);
    } else {
      // Generate clean key: BLDCODE-ROOM
      const prefix = effectiveBuildingId.replace('BLD-', '') || 'ROOM';
      const newKey = `${prefix}-${formData.roomNo.trim()}`;

      const newRecord: RoomRecord = {
        key: newKey,
        buildingId: effectiveBuildingId,
        building: effectiveBuildingName,
        roomNo: formData.roomNo.trim(),
        floor: Number(formData.floor) || 1,
        tenantName: isOccupied ? formData.tenantName.trim() : '',
        phone: isOccupied ? formData.phone.trim() : '',
        occupants: isOccupied ? formData.occupants : 0,
        occupancyStatus: formData.occupancyStatus,
        isOccupied,
        renovationReason: formData.occupancyStatus === 'under_renovation' ? formData.renovationReason.trim() : undefined,
        rent: Number(formData.rent) || 0,
        waterCalcType: formData.waterCalcType,
        waterPerPersonRate: Number(formData.waterPerPersonRate) || 100,
        waterRate: Number(formData.waterRate) || 18,
        waterPrev: Number(formData.waterPrev) || 0,
        waterCurr: Number(formData.waterCurr) || 0,
        waterUnits,
        waterCost,
        elecRate: Number(formData.elecRate) || 8,
        elecPrev: Number(formData.elecPrev) || 0,
        elecCurr: Number(formData.elecCurr) || 0,
        elecUnits,
        elecCost,
        otherFees: Number(formData.otherFees) || 0,
        previousBalance: prevBalance,
        liabilityTotal: prevBalance,
        grandTotal: monthlyTotal + prevBalance,
        total: monthlyTotal,
        isPaid: false,
        hasMeterUpdated: false,
        notes: formData.notes.trim() || (isOccupied ? 'สร้างห้องใหม่' : 'ห้องว่าง'),
      };
      onAddRoom(newRecord, applyToAllMonths);
      setIsAddModalOpen(false);
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter(r => {
    if (selectedBuildingFilter !== 'ALL' && r.building !== selectedBuildingFilter) return false;
    
    // Status Filter
    if (selectedStatusFilter === 'occupied' && r.occupancyStatus !== 'occupied' && !r.isOccupied) return false;
    if (selectedStatusFilter === 'vacant' && r.occupancyStatus !== 'vacant') return false;
    if (selectedStatusFilter === 'under_renovation' && r.occupancyStatus !== 'under_renovation') return false;

    // Water mode filter
    if (selectedWaterCalcFilter !== 'ALL' && r.waterCalcType !== selectedWaterCalcFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoom = r.roomNo.toLowerCase().includes(q);
      const matchTenant = r.tenantName.toLowerCase().includes(q);
      const matchBuilding = r.building.toLowerCase().includes(q);
      const matchPhone = (r.phone || '').includes(q);
      return matchRoom || matchTenant || matchBuilding || matchPhone;
    }
    return true;
  });

  // Calculate overall metrics
  const totalOccupied = rooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
  const totalVacant = rooms.filter(r => r.occupancyStatus === 'vacant').length;
  const totalReno = rooms.filter(r => r.occupancyStatus === 'under_renovation').length;
  const totalCapacity = buildings.reduce((sum, b) => sum + b.totalUnits, 0);
  const overallOccupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Dynamic Occupancy Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">งวดประจำเดือน {activeMonth}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight flex items-center gap-2">
            <DoorClosed className="w-7 h-7 text-emerald-600" />
            จัดการห้องพัก & สถานะการเข้าพัก (Rooms & Occupancy)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            สลับสถานะห้องพักแบบเรียลไทม์ (มีผู้เช่า / ว่าง / ปิดปรับปรุง) อัปเดตรายชื่อผู้เช่า และคำนวณค่าน้ำเหมาจ่ายรายคน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenClearDataModal && (
            <button
              onClick={onOpenClearDataModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer"
              title="ล้างข้อมูลและเริ่มต้นสร้างตึก/ห้องใหม่"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>ล้างข้อมูล / เริ่มใหม่ (Reset)</span>
            </button>
          )}

          <button
            onClick={onNavigateToBuildings}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition border border-slate-300 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>จัดการโปรไฟล์อาคาร ({buildings.length})</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มห้องพักใหม่ (Add Room)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Dynamic Occupancy Rate & Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Occupancy Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              อัตราการเข้าพักรวม (Occupancy Rate)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{overallOccupancyRate}%</div>
            <div className="text-xs text-slate-500 mt-1">
              เข้าพัก {totalOccupied} จากความจุ {totalCapacity} ยูนิต
            </div>
          </div>
        </div>

        {/* Occupied Units */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              มีผู้เช่า (Occupied)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-700">{totalOccupied} ห้อง</div>
            <div className="text-xs text-slate-500 mt-1">
              ผู้พักอาศัยรวม {rooms.reduce((sum, r) => sum + (r.isOccupied ? r.occupants : 0), 0)} คน
            </div>
          </div>
        </div>

        {/* Vacant Units */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              ห้องว่าง (Vacant)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <DoorClosed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-700">{totalVacant} ห้อง</div>
            <div className="text-xs text-slate-500 mt-1">
              พร้อมเปิดให้เช่าทันที
            </div>
          </div>
        </div>

        {/* Under Renovation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
              ปิดปรับปรุง (Under Renovation)
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-orange-700">{totalReno} ห้อง</div>
            <div className="text-xs text-slate-500 mt-1">
              ทาสี / ซ่อมแซมระบบ
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขห้อง, ชื่อผู้เช่า, อาคาร, เบอร์โทร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Building Filter */}
          <select
            value={selectedBuildingFilter}
            onChange={(e) => setSelectedBuildingFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">🏢 ทุกอาคาร ({rooms.length})</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name} ({b.id})
              </option>
            ))}
          </select>

          {/* Occupancy Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">🏷️ ทุกสถานะการเช่า</option>
            <option value="occupied">🟢 มีผู้เช่า (Occupied)</option>
            <option value="vacant">🟡 ห้องว่าง (Vacant)</option>
            <option value="under_renovation">🟠 ปิดปรับปรุง (Under Renovation)</option>
          </select>

          {/* Water Calculation Mode */}
          <select
            value={selectedWaterCalcFilter}
            onChange={(e) => setSelectedWaterCalcFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">💧 ทุกวิธีคิดค่าน้ำ</option>
            <option value="meter">ตามมิเตอร์ (18 บ./หน่วย)</option>
            <option value="per_person">เหมาจ่ายรายคน (100 บ./คน)</option>
          </select>

          {(selectedBuildingFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || selectedWaterCalcFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedBuildingFilter('ALL');
                setSelectedStatusFilter('ALL');
                setSelectedWaterCalcFilter('ALL');
                setSearchQuery('');
              }}
              className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">อาคาร & เลขห้อง</th>
                <th className="py-3 px-4">สถานะการเข้าพัก (Occupancy)</th>
                <th className="py-3 px-4">ผู้เช่า / จำนวนคน</th>
                <th className="py-3 px-4">ค่าเช่าพื้นฐาน</th>
                <th className="py-3 px-4">วิธีคิดค่าน้ำ</th>
                <th className="py-3 px-4">มิเตอร์ล่าสุด (น้ำ/ไฟ)</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
                        <DoorClosed className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-700 text-sm">
                        {rooms.length === 0 ? 'ยังไม่มีข้อมูลห้องพักในระบบ' : 'ไม่พบข้อมูลห้องพักที่ตรงกับเงื่อนไขการค้นหา'}
                      </div>
                      <p className="text-xs text-slate-500">
                        {rooms.length === 0
                          ? 'คุณสามารถใช้ Wizard ล้างและสร้างห้องพักชุดใหม่ หรือกดเพิ่มห้องด้วยตนเอง'
                          : 'ลองปรับตัวกรองอาคารหรือคำค้นหาเพื่อแสดงรายการห้อง'}
                      </p>
                      {rooms.length === 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          {onOpenClearDataModal && (
                            <button
                              onClick={onOpenClearDataModal}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>สร้างห้องใหม่อัตโนมัติ (Wizard)</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenAddModal()}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>เพิ่มห้องใหม่ (Manual)</span>
                          </button>
                          {onRestoreDemoData && (
                            <button
                              onClick={onRestoreDemoData}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                              <span>คืนค่า Demo</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const isOccupied = room.occupancyStatus === 'occupied' || (room.occupancyStatus === undefined && room.isOccupied);
                  const isVacant = room.occupancyStatus === 'vacant';
                  const isReno = room.occupancyStatus === 'under_renovation';

                  return (
                    <tr key={room.key} className="hover:bg-slate-50/70 transition">
                      {/* Building & Room No */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {room.roomNo}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{room.roomNo}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <span>{room.building}</span>
                              {room.floor && <span className="text-[10px] text-slate-400">· ชั้น {room.floor}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Dynamic Occupancy Status Toggle */}
                      <td className="py-3 px-4">
                        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                          <button
                            onClick={() => handleQuickStatusChange(room, 'occupied')}
                            className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                              isOccupied 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="มีผู้เช่าอยู่"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>มีผู้เช่า</span>
                          </button>

                          <button
                            onClick={() => handleQuickStatusChange(room, 'vacant')}
                            className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                              isVacant 
                                ? 'bg-amber-500 text-white shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="ห้องว่างพร้อมให้เช่า"
                          >
                            <DoorClosed className="w-3 h-3" />
                            <span>ว่าง</span>
                          </button>

                          <button
                            onClick={() => handleQuickStatusChange(room, 'under_renovation')}
                            className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                              isReno 
                                ? 'bg-orange-500 text-white shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="ปิดปรับปรุง / ซ่อมแซม"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>ปรับปรุง</span>
                          </button>
                        </div>

                        {isReno && room.renovationReason && (
                          <div className="text-[10px] text-orange-700 mt-1 line-clamp-1 italic">
                            🛠️ {room.renovationReason}
                          </div>
                        )}
                      </td>

                      {/* Tenant & Occupants */}
                      <td className="py-3 px-4">
                        {isOccupied ? (
                          <div>
                            <div className="font-semibold text-slate-900">{room.tenantName || 'ไม่ระบุชื่อ'}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {room.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3 text-slate-400" /> {room.phone}</span>}
                              <span className="flex items-center gap-0.5 font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <Users className="w-3 h-3" /> {room.occupants} คน
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            {isVacant ? 'ห้องว่าง (ยังไม่มีผู้เช่า)' : 'ปิดปรับปรุง'}
                          </span>
                        )}
                      </td>

                      {/* Base Rent */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div>฿{room.rent.toLocaleString()}</div>
                        {Boolean(room.previousBalance && room.previousBalance > 0) && (
                          <div className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 inline-block">
                            ค้างเก่า +฿{room.previousBalance?.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Water Calc Type */}
                      <td className="py-3 px-4">
                        {room.waterCalcType === 'per_person' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <Users className="w-3 h-3 text-purple-600" />
                            เหมา {room.waterPerPersonRate || 100} บ./คน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Droplet className="w-3 h-3 text-blue-600" />
                            มิเตอร์ {room.waterRate || 18} บ./หน่วย
                          </span>
                        )}
                      </td>

                      {/* Latest Meter Readings */}
                      <td className="py-3 px-4 text-[11px] font-mono">
                        <div>น้ำ: <strong className="text-blue-700">{room.waterPrev}</strong> &rarr; {room.waterCurr > 0 ? room.waterCurr : '-'}</div>
                        <div>ไฟ: <strong className="text-amber-700">{room.elecPrev}</strong> &rarr; {room.elecCurr > 0 ? room.elecCurr : '-'}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(room)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                            title="แก้ไขข้อมูลห้อง & การเข้าพัก"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingRoom(room)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="ลบห้อง"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ADD / EDIT ROOM MODAL */}
      {(isAddModalOpen || editingRoom) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full my-auto overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <DoorClosed className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {editingRoom ? `แก้ไขข้อมูลห้อง ${editingRoom.roomNo} (${editingRoom.building})` : 'เพิ่มห้องพักใหม่ (New Room)'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingRoom(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitRoom} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Building & Room No */}
              <div className="grid grid-cols-2 gap-4">
                {/* Building Selector (Foreign Key) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อาคารที่สังกัด (Building) *
                  </label>
                  <select
                    value={formData.buildingId}
                    onChange={(e) => {
                      const selectedBld = buildings.find(b => b.id === e.target.value);
                      if (selectedBld) {
                        setFormData(prev => ({
                          ...prev,
                          buildingId: selectedBld.id,
                          building: selectedBld.name,
                          waterRate: selectedBld.defaultWaterRate,
                          elecRate: selectedBld.defaultElecRate,
                        }));
                      }
                    }}
                    className={`w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium ${
                      formValidationErrors.building ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.id}) - ความจุ {b.totalUnits} ห้อง
                      </option>
                    ))}
                  </select>
                  {formValidationErrors.building && (
                    <p className="text-[11px] text-red-600 mt-0.5">{formValidationErrors.building}</p>
                  )}
                </div>

                {/* Room Number & Floor */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เลขห้อง *
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 101, 202"
                      value={formData.roomNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, roomNo: e.target.value }))}
                      className={`w-full text-xs font-mono p-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formValidationErrors.roomNo ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {formValidationErrors.roomNo && (
                      <p className="text-[11px] text-red-600 mt-0.5">{formValidationErrors.roomNo}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชั้นที่
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.floor}
                      onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) || 1 }))}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Occupancy Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  สถานะการเข้าพัก (Occupancy Status) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, occupancyStatus: 'occupied' }))}
                    className={`p-2.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                      formData.occupancyStatus === 'occupied'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>มีผู้เช่า (Occupied)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, occupancyStatus: 'vacant' }))}
                    className={`p-2.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                      formData.occupancyStatus === 'vacant'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <DoorClosed className="w-4 h-4 text-amber-600" />
                    <span>ห้องว่าง (Vacant)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, occupancyStatus: 'under_renovation' }))}
                    className={`p-2.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                      formData.occupancyStatus === 'under_renovation'
                        ? 'bg-orange-50 border-orange-500 text-orange-800 ring-2 ring-orange-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-orange-600" />
                    <span>ปรับปรุง (Reno)</span>
                  </button>
                </div>
              </div>

              {/* Occupied Fields */}
              {formData.occupancyStatus === 'occupied' && (
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    ข้อมูลผู้เช่าและผู้อยู่อาศัย (Tenant Profile)
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ชื่อ-นามสกุลผู้เช่า *
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น นายสมชาย มั่งมีทรัพย์"
                        value={formData.tenantName}
                        onChange={(e) => setFormData(prev => ({ ...prev, tenantName: e.target.value }))}
                        className={`w-full text-xs p-2.5 bg-white border rounded-lg ${
                          formValidationErrors.tenantName ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {formValidationErrors.tenantName && (
                        <p className="text-[11px] text-red-600 mt-0.5">{formValidationErrors.tenantName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        เบอร์โทรศัพท์ติดต่อ
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น 089-112-3344"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Occupants Count */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      จำนวนผู้พักอาศัยจริง (Occupants) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.occupants}
                      onChange={(e) => setFormData(prev => ({ ...prev, occupants: parseInt(e.target.value) || 1 }))}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      ใช้ในการคำนวณค่าน้ำกรณีเลือกวิธีคิดแบบ "เหมาจ่ายรายคน"
                    </p>
                  </div>
                </div>
              )}

              {/* Under Renovation Reason */}
              {formData.occupancyStatus === 'under_renovation' && (
                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-200 space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-orange-950">
                    รายละเอียดการปรับปรุง / ซ่อมแซม (Renovation Details)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ทาสีผนังใหม่ และเปลี่ยนสุขภัณฑ์ห้องน้ำ"
                    value={formData.renovationReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, renovationReason: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-orange-300 rounded-lg"
                  />
                </div>
              )}

              {/* Rent, Other Fees & Previous Balance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ค่าเช่าห้องรายเดือน (บาท) *
                  </label>
                  <input
                    type="number"
                    value={formData.rent}
                    onChange={(e) => setFormData(prev => ({ ...prev, rent: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ค่าบริการอื่นๆ (บาท) <span className="text-[10px] text-emerald-600 font-normal">(ไม่เก็บค่าส่วนกลาง)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.otherFees}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherFees: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    ยอดคงค้างเดือนก่อน (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.previousBalance === 0 ? '' : formData.previousBalance}
                    onChange={(e) => setFormData(prev => ({ ...prev, previousBalance: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs font-mono font-bold p-2.5 bg-amber-50/50 border border-amber-300 rounded-lg text-amber-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Water Calculation Mode */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-blue-600" />
                  วิธีคิดค่าน้ำประปาสำหรับห้องนี้
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, waterCalcType: 'meter' }))}
                    className={`p-2.5 text-xs font-bold rounded-lg border text-left flex items-center gap-2 ${
                      formData.waterCalcType === 'meter'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Droplet className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>ตามมิเตอร์จริง</div>
                      <div className="text-[10px] font-normal text-slate-500">฿{formData.waterRate}/หน่วย</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, waterCalcType: 'per_person' }))}
                    className={`p-2.5 text-xs font-bold rounded-lg border text-left flex items-center gap-2 ${
                      formData.waterCalcType === 'per_person'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-400'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Users className="w-4 h-4 text-purple-600" />
                    <div>
                      <div>เหมาจ่ายรายคน</div>
                      <div className="text-[10px] font-normal text-slate-500">฿{formData.waterPerPersonRate}/คน</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Baseline meter readings */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    เลขมิเตอร์น้ำเริ่มต้น (waterPrev)
                  </label>
                  <input
                    type="number"
                    value={formData.waterPrev}
                    onChange={(e) => setFormData(prev => ({ ...prev, waterPrev: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs font-mono p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    เลขมิเตอร์ไฟเริ่มต้น (elecPrev)
                  </label>
                  <input
                    type="number"
                    value={formData.elecPrev}
                    onChange={(e) => setFormData(prev => ({ ...prev, elecPrev: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs font-mono p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Apply to all 12 months checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="applyAll"
                  checked={applyToAllMonths}
                  onChange={(e) => setApplyToAllMonths(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="applyAll" className="text-xs font-medium text-slate-700 cursor-pointer">
                  บันทึกการเปลี่ยนแปลงนี้ไปยังทุกงวดเดือน (ทั้ง 12 เดือน)
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingRoom(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm"
                >
                  {editingRoom ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มห้องพัก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {deletingRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full my-auto p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบห้องพัก</h3>
                <p className="text-xs text-slate-500 font-mono">ห้อง {deletingRoom.roomNo} ({deletingRoom.building})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              คุณแน่ใจหรือไม่ว่าต้องการลบห้อง {deletingRoom.roomNo} ออกจากระบบ? การลบนี้จะลบข้อมูลประวัติมิเตอร์ของห้องนี้ด้วย
            </p>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="delAll"
                checked={applyToAllMonths}
                onChange={(e) => setApplyToAllMonths(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-slate-300"
              />
              <label htmlFor="delAll" className="text-xs text-slate-700">
                ลบออกจากทุกงวดเดือนในระบบ
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingRoom(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteRoom(deletingRoom.key, applyToAllMonths);
                  setDeletingRoom(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
