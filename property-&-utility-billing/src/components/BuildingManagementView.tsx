import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  DoorClosed, 
  Users, 
  Zap, 
  Droplet, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Wrench, 
  Home, 
  Check, 
  X, 
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Info,
  RotateCcw
} from 'lucide-react';
import { BuildingProfile, RoomRecord, OccupancyStatus } from '../types';

interface BuildingManagementViewProps {
  buildings: BuildingProfile[];
  rooms: RoomRecord[];
  activeMonth: string;
  onAddBuilding: (newBuilding: BuildingProfile) => boolean;
  onUpdateBuilding: (updatedBuilding: BuildingProfile) => boolean;
  onDeleteBuilding: (buildingId: string) => { success: boolean; message: string };
  onBatchUpdateBuildingOccupancy: (buildingName: string, newStatus: OccupancyStatus, reason?: string) => void;
  onNavigateToRooms: (filterBuilding?: string) => void;
  onOpenClearDataModal?: () => void;
  onRestoreDemoData?: () => void;
}

export const BuildingManagementView: React.FC<BuildingManagementViewProps> = ({
  buildings,
  rooms,
  activeMonth,
  onAddBuilding,
  onUpdateBuilding,
  onDeleteBuilding,
  onBatchUpdateBuildingOccupancy,
  onNavigateToRooms,
  onOpenClearDataModal,
  onRestoreDemoData,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingProfile | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<BuildingProfile | null>(null);
  const [batchModalBuilding, setBatchModalBuilding] = useState<BuildingProfile | null>(null);
  const [batchStatus, setBatchStatus] = useState<OccupancyStatus>('vacant');
  const [batchReason, setBatchReason] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    totalUnits: number;
    location: string;
    floors: number;
    defaultWaterRate: number;
    defaultElecRate: number;
    description: string;
  }>({
    id: '',
    name: '',
    totalUnits: 8,
    location: '',
    floors: 3,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4500);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const nextNum = buildings.length + 1;
    setFormData({
      id: `BLD-0${nextNum}`,
      name: `อาคารใหม่ ${nextNum}`,
      totalUnits: 10,
      location: 'ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กทม.',
      floors: 3,
      defaultWaterRate: 18,
      defaultElecRate: 8,
      description: 'อาคารพักอาศัยพร้อมสิ่งอำนวยความสะดวกครบครัน',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (bld: BuildingProfile) => {
    setEditingBuilding(bld);
    setFormData({
      id: bld.id,
      name: bld.name,
      totalUnits: bld.totalUnits,
      location: bld.location,
      floors: bld.floors,
      defaultWaterRate: bld.defaultWaterRate,
      defaultElecRate: bld.defaultElecRate,
      description: bld.description || '',
    });
    setFormErrors({});
  };

  // Validate and submit Add / Edit
  const handleSubmitBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.id.trim()) {
      errors.id = 'กรุณาระบุรหัสอาคาร (Building ID)';
    } else if (!editingBuilding && buildings.some(b => b.id.toLowerCase() === formData.id.trim().toLowerCase())) {
      errors.id = 'รหัสอาคารนี้มีอยู่ในระบบแล้ว';
    }

    if (!formData.name.trim()) {
      errors.name = 'กรุณาระบุชื่ออาคาร';
    } else if (
      buildings.some(
        b => b.name.toLowerCase() === formData.name.trim().toLowerCase() && 
        (!editingBuilding || b.id !== editingBuilding.id)
      )
    ) {
      errors.name = 'ชื่ออาคารนี้มีอยู่ในระบบแล้ว';
    }

    if (!formData.location.trim()) {
      errors.location = 'กรุณาระบุที่ตั้ง / ที่อยู่อาคาร';
    }

    if (formData.totalUnits < 1) {
      errors.totalUnits = 'จำนวนยูนิตต้องมีอย่างน้อย 1 ยูนิต';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingBuilding) {
      const updated: BuildingProfile = {
        ...editingBuilding,
        name: formData.name.trim(),
        totalUnits: Number(formData.totalUnits),
        location: formData.location.trim(),
        floors: Number(formData.floors) || 1,
        defaultWaterRate: Number(formData.defaultWaterRate) || 18,
        defaultElecRate: Number(formData.defaultElecRate) || 8,
        description: formData.description.trim(),
      };
      const ok = onUpdateBuilding(updated);
      if (ok) {
        showMessage(`อัปเดตข้อมูลอาคาร "${updated.name}" เรียบร้อยแล้ว!`, 'success');
        setEditingBuilding(null);
      }
    } else {
      const newBld: BuildingProfile = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        totalUnits: Number(formData.totalUnits),
        location: formData.location.trim(),
        floors: Number(formData.floors) || 1,
        defaultWaterRate: Number(formData.defaultWaterRate) || 18,
        defaultElecRate: Number(formData.defaultElecRate) || 8,
        description: formData.description.trim(),
        createdAt: new Date().toISOString().substring(0, 10),
      };
      const ok = onAddBuilding(newBld);
      if (ok) {
        showMessage(`เพิ่มโปรไฟล์อาคาร "${newBld.name}" (${newBld.id}) เรียบร้อยแล้ว!`, 'success');
        setIsAddModalOpen(false);
      }
    }
  };

  // Confirm delete building
  const handleConfirmDelete = () => {
    if (!deletingBuilding) return;
    const res = onDeleteBuilding(deletingBuilding.id);
    if (res.success) {
      showMessage(res.message, 'success');
      setDeletingBuilding(null);
    } else {
      showMessage(res.message, 'error');
    }
  };

  // Submit Batch Occupancy Update
  const handleApplyBatchOccupancy = () => {
    if (!batchModalBuilding) return;
    onBatchUpdateBuildingOccupancy(batchModalBuilding.name, batchStatus, batchReason);
    showMessage(`อัปเดตสถานะห้องทุกห้องใน "${batchModalBuilding.name}" เป็น "${batchStatus === 'occupied' ? 'มีผู้เช่า' : batchStatus === 'vacant' ? 'ห้องว่าง' : 'ปิดปรับปรุง'}" เรียบร้อยแล้ว!`, 'success');
    setBatchModalBuilding(null);
    setBatchReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Building Profiles & Capacity
            </span>
            <span className="text-xs text-slate-500 font-medium">งวดประจำเดือน {activeMonth}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            จัดการโปรไฟล์อาคาร (Manage Buildings)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            เพิ่ม แก้ไข และติดตามความจุของอาคาร (Building ID, Name, Total Units, Location) พร้อมระบบควบคุมความสัมพันธ์ของข้อมูล
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
              <span>ล้างข้อมูล / เริ่มต้นใหม่ (Reset Data)</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มโปรไฟล์อาคารใหม่ (Add Building)</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm animate-in fade-in ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Buildings Cards Grid / Empty State */}
      {buildings.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              ยังไม่มีข้อมูลอาคารในระบบ (Empty Slate)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ระบบของคุณพร้อมสำหรับการเริ่มต้นสร้างอาคารและห้องพักใหม่ คุณสามารถใช้ Wizard สร้างอัตโนมัติ หรือเพิ่มทีละอาคารได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onOpenClearDataModal && (
              <button
                onClick={onOpenClearDataModal}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>สร้างหอพักและห้องพักใหม่อัตโนมัติ (Start Fresh Wizard)</span>
              </button>
            )}

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>เพิ่มอาคารด้วยตนเอง (Manual Add)</span>
            </button>

            {onRestoreDemoData && (
              <button
                onClick={onRestoreDemoData}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>คืนค่าชุดข้อมูลตัวอย่าง (Restore Demo)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {buildings.map((bld) => {
          const bldRooms = rooms.filter(r => r.building === bld.name || (r.buildingId && r.buildingId === bld.id));
          const totalRegisteredRooms = bldRooms.length;
          const occupiedCount = bldRooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
          const vacantCount = bldRooms.filter(r => r.occupancyStatus === 'vacant').length;
          const renovationCount = bldRooms.filter(r => r.occupancyStatus === 'under_renovation').length;
          
          // Occupancy rate calculation based on Total Capacity
          const occupancyRate = bld.totalUnits > 0 ? Math.round((occupiedCount / bld.totalUnits) * 100) : 0;
          const isOverCapacity = totalRegisteredRooms > bld.totalUnits;

          return (
            <div
              key={bld.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        {bld.id}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {bld.floors} ชั้น
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {bld.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(bld)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                      title="แก้ไขโปรไฟล์อาคาร"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingBuilding(bld)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                      title="ลบอาคาร"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-2.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{bld.location}</span>
                </div>
              </div>

              {/* Card Body Stats */}
              <div className="p-5 space-y-4">
                {/* Capacity & Occupancy Progress */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                    <span className="text-slate-700">อัตราการเข้าพัก (Occupancy Rate)</span>
                    <span className="text-blue-700 font-bold">{occupancyRate}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (occupiedCount / bld.totalUnits) * 100)}%` }}
                      title={`มีผู้เช่า: ${occupiedCount} ห้อง`}
                    />
                    <div 
                      className="bg-amber-400 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (vacantCount / bld.totalUnits) * 100)}%` }}
                      title={`ห้องว่าง: ${vacantCount} ห้อง`}
                    />
                    <div 
                      className="bg-orange-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (renovationCount / bld.totalUnits) * 100)}%` }}
                      title={`ปรับปรุง: ${renovationCount} ห้อง`}
                    />
                  </div>
                </div>

                {/* 3 Status Pills Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                    <div className="text-[10px] text-emerald-700 font-semibold">มีผู้เช่า (Occupied)</div>
                    <div className="text-lg font-bold text-emerald-800 mt-0.5">{occupiedCount}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                    <div className="text-[10px] text-amber-700 font-semibold">ห้องว่าง (Vacant)</div>
                    <div className="text-lg font-bold text-amber-800 mt-0.5">{vacantCount}</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                    <div className="text-[10px] text-orange-700 font-semibold">ปรับปรุง (Reno)</div>
                    <div className="text-lg font-bold text-orange-800 mt-0.5">{renovationCount}</div>
                  </div>
                </div>

                {/* Capacity Summary & Rates */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>ความจุทั้งหมด (Total Units):</span>
                    <strong className="text-slate-900 font-mono">{bld.totalUnits} ยูนิต</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ห้องที่สร้างในระบบ (Configured):</span>
                    <span className={`font-bold font-mono ${isOverCapacity ? 'text-red-600' : 'text-slate-800'}`}>
                      {totalRegisteredRooms} / {bld.totalUnits} ห้อง
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-500" /> ค่าน้ำ: ฿{bld.defaultWaterRate}/หน่วย</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> ค่าไฟ: ฿{bld.defaultElecRate}/หน่วย</span>
                  </div>
                </div>

                {isOverCapacity && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>คำเตือน: จำนวนห้อง ({totalRegisteredRooms}) เกินความจุอาคารที่กำหนดไว้ ({bld.totalUnits})</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={() => setBatchModalBuilding(bld)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5 text-slate-500" />
                  <span>ปรับสถานะทั้งตึก</span>
                </button>

                <button
                  onClick={() => onNavigateToRooms(bld.name)}
                  className="px-3 py-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1 transition cursor-pointer"
                >
                  <span>ดูห้องทั้งหมด</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add / Edit Building Modal */}
      {(isAddModalOpen || editingBuilding) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  {editingBuilding ? `แก้ไขโปรไฟล์อาคาร: ${editingBuilding.name}` : 'เพิ่มโปรไฟล์อาคารใหม่ (New Building Profile)'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingBuilding(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitBuilding} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Building ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสอาคาร (Building ID) *
                  </label>
                  <input
                    type="text"
                    disabled={!!editingBuilding}
                    placeholder="เช่น BLD-DM01, BLD-FAC01"
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    className={`w-full text-xs font-mono p-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.id ? 'border-red-500' : 'border-slate-300'
                    } disabled:bg-slate-100 disabled:text-slate-500`}
                  />
                  {formErrors.id && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.id}</p>}
                </div>

                {/* Building Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่ออาคาร (Building Name) *
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น อาคารดอนเมือง, อาคารโรงงาน"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.name ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.name && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Total Units (Capacity) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จำนวนยูนิตทั้งหมด (Total Units) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.totalUnits}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalUnits: parseInt(e.target.value) || 0 }))}
                    className={`w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.totalUnits ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.totalUnits && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.totalUnits}</p>}
                </div>

                {/* Floors */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จำนวนชั้น (Floors)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.floors}
                    onChange={(e) => setFormData(prev => ({ ...prev, floors: parseInt(e.target.value) || 1 }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ที่ตั้ง / ที่อยู่อาคาร (Location) *
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุเลขที่ ซอย ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className={`w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.location ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {formErrors.location && <p className="text-[11px] text-red-600 mt-0.5">{formErrors.location}</p>}
              </div>

              {/* Default Utility Rates */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Droplet className="w-3 h-3 text-blue-600" /> ค่าน้ำเริ่มต้น (บาท/หน่วย)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.defaultWaterRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultWaterRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600" /> ค่าไฟเริ่มต้น (บาท/หน่วย)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.defaultElecRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultElecRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำอธิบายเพิ่มเติม / สิ่งอำนวยความสะดวก
                </label>
                <input
                  type="text"
                  placeholder="เช่น หอพัก 3 ชั้น ใกล้สนามบินดอนเมือง ห้องแอร์พร้อมเฟอร์นิเจอร์"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingBuilding(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
                >
                  {editingBuilding ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มอาคาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBuilding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-full">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบโปรไฟล์อาคาร</h3>
                <p className="text-xs text-slate-500 font-mono">{deletingBuilding.id} - {deletingBuilding.name}</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="font-bold">ระบบตรวจสอบความปลอดภัย (Integrity Check):</div>
              <p>
                ระบบจะป้องกันการลบอาคารหากยังมีห้องพักที่ผูกกับอาคารนี้อยู่ เพื่อป้องกันข้อมูลสูญหาย (Orphaned Units Violation)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingBuilding(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Occupancy Modal */}
      {batchModalBuilding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  ปรับปรุงสถานะทั้งอาคาร: {batchModalBuilding.name}
                </h3>
              </div>
              <button onClick={() => setBatchModalBuilding(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เลือกสถานะที่ต้องการปรับใช้กับห้องทุกห้องในอาคารนี้:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchStatus('occupied')}
                    className={`p-2.5 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 ${
                      batchStatus === 'occupied' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>มีผู้เช่า</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchStatus('vacant')}
                    className={`p-2.5 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 ${
                      batchStatus === 'vacant' 
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <DoorClosed className="w-4 h-4 text-amber-600" />
                    <span>ห้องว่าง</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchStatus('under_renovation')}
                    className={`p-2.5 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 ${
                      batchStatus === 'under_renovation' 
                        ? 'bg-orange-50 border-orange-500 text-orange-800 ring-2 ring-orange-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-orange-600" />
                    <span>ปิดปรับปรุง</span>
                  </button>
                </div>
              </div>

              {batchStatus === 'under_renovation' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เหตุผล / รายละเอียดการปรับปรุงทั้งอาคาร
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ปิดซ่อมบำรุงระบบประปาและทาสีใหม่ทั้งตึก"
                    value={batchReason}
                    onChange={(e) => setBatchReason(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-950">
                การดำเนินการนี้จะอัปเดตสถานะห้องทุกห้องในอาคารนี้ และบันทึกลงในฐานข้อมูลระบบโดยอัตโนมัติ
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setBatchModalBuilding(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleApplyBatchOccupancy}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
                >
                  บันทึกสถานะทั้งอาคาร
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
