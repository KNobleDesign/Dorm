import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  X, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  CreditCard, 
  MapPin, 
  Phone, 
  DollarSign, 
  Droplet, 
  Zap, 
  Users, 
  Download, 
  Upload, 
  RotateCcw,
  ShieldCheck,
  Building,
  Home
} from 'lucide-react';
import { LandlordConfig, BuildingProfile, RoomRecord } from '../types';
import { POPULAR_THAI_BANKS } from '../utils/paymentAccount';

interface ApartmentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LandlordConfig;
  onSaveConfig: (updatedConfig: LandlordConfig) => void;
  buildings: BuildingProfile[];
  rooms: RoomRecord[];
  activeMonth: string;
  onResetAllData?: () => void;
  onOpenClearDataModal?: () => void;
}

export const ApartmentSettingsModal: React.FC<ApartmentSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  buildings,
  rooms,
  activeMonth,
  onResetAllData,
  onOpenClearDataModal,
}) => {
  const [formData, setFormData] = useState<LandlordConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'rates' | 'backup'>('general');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const totalOccupied = rooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
  const totalCapacity = buildings.reduce((sum, b) => sum + b.totalUnits, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.propertyName.trim()) {
      newErrors.propertyName = 'กรุณาระบุชื่ออพาร์ตเมนต์ / หอพัก';
    }
    if (!formData.landlordName.trim()) {
      newErrors.landlordName = 'กรุณาระบุชื่อผู้จัดการหรือผู้ให้เช่า';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSaveConfig(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const handleExportData = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      apartmentName: formData.propertyName,
      config: formData,
      buildings,
      rooms,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PropManage_${formData.propertyName.replace(/\s+/g, '_')}_Backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-google-sans overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Building className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                แก้ไขข้อมูลอพาร์ตเมนต์ & การตั้งค่า (Apartment & Settings)
              </h3>
              <p className="text-xs text-slate-400">
                ปรับแต่งชื่ออพาร์ตเมนต์ ข้อมูลผู้ให้เช่า อัตราค่าน้ำ-ไฟ และการบันทึกข้อมูล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>ชื่อ & ข้อมูลอพาร์ตเมนต์</span>
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payment'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>การชำระเงิน & พร้อมเพย์</span>
          </button>

          <button
            onClick={() => setActiveTab('rates')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rates'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>อัตราค่าน้ำ & ค่าไฟ</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>สำรองข้อมูล (Backup)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Quick Occupancy & Status Indicator */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                🏢
              </div>
              <div>
                <div className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                  สถานะการเข้าพักปัจจุบัน (Occupancy Summary)
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {totalOccupied} / {totalCapacity} ห้องเข้าพัก ({occupancyRate}% Occupancy)
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                งวด {activeMonth}
              </span>
            </div>
          </div>

          {/* TAB 1: General Info */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่ออพาร์ตเมนต์ / หอพัก / โครงการ (Apartment Name) *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น พีแอนด์เจ อพาร์ตเมนต์, เจริญสุข แมนชั่น, สุขุมวิท เรสซิเดนซ์"
                    value={formData.propertyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, propertyName: e.target.value }))}
                    className={`w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 ${
                      errors.propertyName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.propertyName && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.propertyName}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  ชื่อนี้จะแสดงบนแถบหัวข้อระบบ, หน้า Dashboard, และพิมพ์บนหัวกระดาษใบแจ้งหนี้ทุกใบ
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อผู้ให้เช่า / ผู้จัดการ (Landlord / Manager Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณประดิษฐ์ เจริญสุขสิริ"
                    value={formData.landlordName}
                    onChange={(e) => setFormData(prev => ({ ...prev, landlordName: e.target.value }))}
                    className={`w-full p-2.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.landlordName ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ (Phone Number)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="เช่น 081-987-6543, 02-566-7890"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ที่อยู่อพาร์ตเมนต์ / สถานที่ตั้ง (Address)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    placeholder="เลขที่, ซอย, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลขประจำตัวผู้เสียภาษี (Tax ID)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 0-1055-64019-88-2"
                  value={formData.taxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Payment info */}
          {activeTab === 'payment' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 mb-1">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>ระบบจัดการบัญชีรับเงินโอนค่าเช่า & QR Code พร้อมเพย์ (2 บัญชี)</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  ระบบรองรับการแยกบัญชีรับเงินได้สูงสุด 2 บัญชี (เช่น บัญชีหลักหอพัก และ บัญชีบ้านเช่าของคุณพลอย) 
                  โดยสามารถเลือกในหน้า <strong>"จัดการอาคาร"</strong> ได้ว่าอาคารใดจะรับเงินเข้าบัญชีไหน และระบบจะสร้าง QR Code พร้อมเพย์พร้อมพิมพ์ใบแจ้งหนี้ตรงบัญชีอัตโนมัติ
                </p>
              </div>

              {/* SECTION 1: MAIN ACCOUNT (บัญชีที่ 1: บัญชีหลักหอพัก) */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-300 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        👑 บัญชีรับเงินหลักหอพัก (Main Account)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        บัญชีมาตรฐานสำหรับอาคารทั่วไป (เช่น อาคารดอนเมือง, อาคารโรงงาน)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    บัญชีหลัก
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์พร้อมเพย์ หรือ เลขประจำตัวผู้เสียภาษี (PromptPay ID)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 0819876543 หรือ 0105564019882"
                    value={formData.promptPayId}
                    onChange={(e) => setFormData(prev => ({ ...prev, promptPayId: e.target.value }))}
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อธนาคาร (Bank Name)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ธนาคารกสิกรไทย"
                      value={formData.bankName}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* Quick Bank Select Pills */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {POPULAR_THAI_BANKS.slice(0, 5).map((b) => (
                        <button
                          type="button"
                          key={`main-bank-${b.code}`}
                          onClick={() => setFormData(prev => ({ ...prev, bankName: b.name }))}
                          className="px-1.5 py-0.5 text-[10px] bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition"
                        >
                          {b.shortName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เลขที่บัญชีธนาคาร (Bank Account)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 743-2-89012-3"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                      className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      ชื่อบัญชี: {formData.landlordName || 'ชื่อผู้ให้เช่า'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: HOUSE RENTAL ACCOUNT (บัญชีที่ 2: บัญชีบ้านเช่า) */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-300 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <div>
                      <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        🏠 บัญชีรับเงินของบ้านเช่า (House Rental Payment Account Option)
                      </span>
                      <p className="text-[11px] text-purple-700">
                        บัญชีที่ 2 สำหรับให้ผู้เช่าบ้านเดี่ยว/ทาวน์โฮม/อาคารที่กำหนดโอนตรง
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.houseAccountEnabled !== false}
                      onChange={(e) => setFormData(prev => ({ ...prev, houseAccountEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    <span className="ml-2 text-xs font-bold text-purple-900">
                      {formData.houseAccountEnabled !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </label>
                </div>

                {formData.houseAccountEnabled !== false ? (
                  <div className="space-y-3 pt-1 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-purple-950 mb-1">
                          ป้ายกำกับบัญชี (Account Label)
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น บัญชีบ้านเช่า"
                          value={formData.houseAccountLabel || 'บัญชีบ้านเช่า'}
                          onChange={(e) => setFormData(prev => ({ ...prev, houseAccountLabel: e.target.value }))}
                          className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-purple-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-950 mb-1">
                          เบอร์พร้อมเพย์บ้านเช่า (House PromptPay ID)
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น 0840411115"
                          value={formData.housePromptPayId || '0840411115'}
                          onChange={(e) => setFormData(prev => ({ ...prev, housePromptPayId: e.target.value }))}
                          className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-purple-950"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-purple-950 mb-1">
                          ชื่อธนาคารบ้านเช่า (House Bank Name)
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น ธนาคารไทยพาณิชย์ (SCB)"
                          value={formData.houseBankName || 'ธนาคารไทยพาณิชย์ (SCB)'}
                          onChange={(e) => setFormData(prev => ({ ...prev, houseBankName: e.target.value }))}
                          className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        {/* Quick Bank Select Pills for House */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {POPULAR_THAI_BANKS.slice(0, 5).map((b) => (
                            <button
                              type="button"
                              key={`house-bank-${b.code}`}
                              onClick={() => setFormData(prev => ({ ...prev, houseBankName: b.name }))}
                              className="px-1.5 py-0.5 text-[10px] bg-white hover:bg-purple-100 border border-purple-200 rounded text-purple-800 transition"
                            >
                              {b.shortName}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-950 mb-1">
                          เลขที่บัญชีบ้านเช่า (House Bank Account)
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น 408-2-88910-1"
                          value={formData.houseBankAccount || '408-2-88910-1'}
                          onChange={(e) => setFormData(prev => ({ ...prev, houseBankAccount: e.target.value }))}
                          className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-purple-950 mb-1">
                          ชื่อเจ้าของบัญชีบ้านเช่า (Account Name / Owner)
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น คุณพลอย (Ploy)"
                          value={formData.houseAccountName || 'คุณพลอย (Ploy)'}
                          onChange={(e) => setFormData(prev => ({ ...prev, houseAccountName: e.target.value }))}
                          className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-950 mb-1">
                          คำอธิบาย / หมายเหตุในใบแจ้งหนี้
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น บัญชีรับเงินเฉพาะสำหรับบ้านเช่า & ที่พักส่วนตัว"
                          value={formData.houseAccountNotes || 'บัญชีรับเงินเฉพาะสำหรับบ้านเช่า & ที่พักส่วนตัว'}
                          onChange={(e) => setFormData(prev => ({ ...prev, houseAccountNotes: e.target.value }))}
                          className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-purple-100/70 rounded-lg text-[11px] text-purple-900 flex items-center gap-2">
                      <span className="text-base">💡</span>
                      <span>
                        <strong>วิธีเลือกใช้อาคาร:</strong> เข้าเมนู <strong>"จัดการอาคาร"</strong> แล้วกดแก้ไขอาคารที่ต้องการ (เช่น อาคารที่เป็นบ้านเช่า) แล้วเลือกตัวเลือก <strong>"🏠 บัญชีบ้านเช่า"</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-500 italic">
                    ปิดใช้งานบัญชีที่สอง (ทุกอาคารจะใช้บัญชีหลักบัญชีเดียว)
                  </div>
                )}
              </div>

              {/* PREVIEW CARDS (SIDE BY SIDE) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold text-blue-900">
                    <span>👑 บัญชีหลักหอพัก</span>
                    <span className="text-[10px] font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">
                      {formData.promptPayId || '-'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <div>{formData.bankName || 'ธนาคาร'}</div>
                    <div className="font-mono font-bold text-slate-900">{formData.bankAccount || '-'}</div>
                    <div className="text-slate-500">ชื่อ: {formData.landlordName || '-'}</div>
                  </div>
                </div>

                {formData.houseAccountEnabled !== false && (
                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-purple-900">
                      <span>🏠 {formData.houseAccountLabel || 'บัญชีบ้านเช่า'}</span>
                      <span className="text-[10px] font-mono bg-purple-100 px-1.5 py-0.5 rounded text-purple-800">
                        {formData.housePromptPayId || '-'}
                      </span>
                    </div>
                    <div className="text-[11px] text-purple-950">
                      <div>{formData.houseBankName || 'ธนาคารไทยพาณิชย์'}</div>
                      <div className="font-mono font-bold text-purple-900">{formData.houseBankAccount || '-'}</div>
                      <div className="text-purple-700">ชื่อ: {formData.houseAccountName || '-'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Liability & Late Payment Policy Config */}
              <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-300 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <span className="text-sm">⚠️</span>
                  <span>เงื่อนไขกำหนดชำระ & ค่าปรับชำระล่าช้า (Liability & Late Payment Policy)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      กำหนดชำระทุกวันที่ (Due Day of Month)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={formData.paymentDueDay || 5}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentDueDay: parseInt(e.target.value, 10) || 5 }))}
                        className="w-full p-2 text-xs bg-white border border-amber-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-xs text-amber-900 font-medium whitespace-nowrap">ของทุกเดือน</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      ค่าปรับชำระล่าช้าต่อวัน (Late Fee / Day)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={formData.lateFeePerDayDefault ?? 100}
                        onChange={(e) => setFormData(prev => ({ ...prev, lateFeePerDayDefault: parseFloat(e.target.value) || 0 }))}
                        className="w-full p-2 text-xs bg-white border border-amber-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                      <span className="text-xs text-amber-900 font-medium whitespace-nowrap">บาท/วัน</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    ข้อความนโยบายค่าปรับพิมพ์บนใบแจ้งหนี้ (Notice on Invoices)
                  </label>
                  <input
                    type="text"
                    value={formData.latePolicyNotice || `กำหนดชำระเงินทุกวันที่ ${formData.paymentDueDay || 5} ของเดือน หากชำระล่าช้าคิดค่าปรับวันละ ${formData.lateFeePerDayDefault ?? 100} บาท`}
                    onChange={(e) => setFormData(prev => ({ ...prev, latePolicyNotice: e.target.value }))}
                    className="w-full p-2 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    placeholder="เช่น กำหนดชำระเงินทุกวันที่ 5 ของเดือน หากชำระล่าช้าคิดค่าปรับวันละ 100 บาท"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Rates & Utilities */}
          {activeTab === 'rates' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-2">
                    <Droplet className="w-4 h-4 text-blue-600" />
                    ค่าน้ำประปา (ตามมิเตอร์จริง)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      value={formData.waterRateDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, waterRateDefault: parseFloat(e.target.value) || 18 }))}
                      className="w-full p-2 text-sm bg-white border border-blue-300 rounded-lg font-mono font-bold text-blue-900"
                    />
                    <span className="text-xs text-slate-600 font-medium whitespace-nowrap">บาท/หน่วย</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    คำนวณตามหน่วยใช้งานจริง (เลขใหม่ - เลขเก่า)
                  </p>
                </div>

                <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    ค่าน้ำประปา (เหมาจ่ายรายคน)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.waterPerPersonRateDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, waterPerPersonRateDefault: parseFloat(e.target.value) || 100 }))}
                      className="w-full p-2 text-sm bg-white border border-purple-300 rounded-lg font-mono font-bold text-purple-900"
                    />
                    <span className="text-xs text-slate-600 font-medium whitespace-nowrap">บาท/คน/เดือน</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    คำนวณจาก (จำนวนผู้เช่าในห้อง × อัตราต่อคน)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    ค่าไฟฟ้า (เริ่มต้น)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      value={formData.elecRateDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, elecRateDefault: parseFloat(e.target.value) || 8 }))}
                      className="w-full p-2 text-sm bg-white border border-amber-300 rounded-lg font-mono font-bold text-amber-900"
                    />
                    <span className="text-xs text-slate-600 font-medium whitespace-nowrap">บาท/หน่วย</span>
                  </div>
                </div>

                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Building2 className="w-4 h-4 text-slate-600" />
                      ค่าส่วนกลาง / ขยะ (เริ่มต้น)
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      {formData.commonFeeDefault === 0 ? 'ฟรี / ไม่เก็บค่าส่วนกลาง' : `${formData.commonFeeDefault} ฿/ห้อง`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={formData.commonFeeDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, commonFeeDefault: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                    />
                    <span className="text-xs text-slate-600 font-medium whitespace-nowrap">บาท/ห้อง</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    ทุกอาคารไม่เก็บค่าส่วนกลาง (0 บาท) สามารถกำหนดค่าบริการเฉพาะห้องได้ตามต้องการ
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Backup & Reset */}
          {activeTab === 'backup' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Clear Data & Start Fresh Setup Option */}
              <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-3">
                <div className="font-bold text-xs text-indigo-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>ล้างข้อมูลตัวอย่าง & เริ่มต้นใช้งานจริง (Clear & Start Fresh Wizard)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800 font-bold">
                    แนะนำ
                  </span>
                </div>
                <p className="text-xs text-indigo-800">
                  ล้างข้อมูลตัวอย่างทั้งหมด เพื่อเริ่มกรอกชื่อหอพัก อาคาร ห้องพัก และบันทึกมิเตอร์น้ำไฟจริงของคุณเอง
                </p>
                {onOpenClearDataModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenClearDataModal();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>เปิดเครื่องมือช่วยตั้งค่าและล้างข้อมูล (Open Setup Wizard)</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  ส่งออกข้อมูลสำรอง (Export JSON Backup)
                </div>
                <p className="text-xs text-slate-500">
                  บันทึกข้อมูลอพาร์ตเมนต์ อาคารทั้งหมด รายชื่อห้อง ข้อมูลผู้เช่า และมิเตอร์ 12 เดือน เก็บไว้เป็นไฟล์ JSON
                </p>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลดไฟล์สำรองข้อมูล (Download Backup)
                </button>
              </div>

              {onResetAllData && (
                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-3">
                  <div className="font-bold text-xs text-red-900 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-red-600" />
                    คืนค่าชุดข้อมูลตัวอย่างเริ่มต้น (Restore Demo Data)
                  </div>
                  <p className="text-xs text-red-700">
                    หากต้องการทดสอบระบบด้วยชุดข้อมูลตัวอย่าง 3 อาคาร 26 ห้อง สามารถกดรีเซ็ตได้
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('คุณต้องการคืนค่าข้อมูลตัวอย่างเริ่มต้นใช่หรือไม่? ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลตัวอย่าง')) {
                        onResetAllData();
                        onClose();
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    คืนค่าข้อมูลตัวอย่าง (Restore Demo)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ข้อมูลจะถูกบันทึกอัตโนมัติลงในระบบ LocalStorage</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                ยกเลิก (Cancel)
              </button>

              <button
                type="submit"
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึกสำเร็จแล้ว! (Saved)</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึกข้อมูล (Save Changes)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
