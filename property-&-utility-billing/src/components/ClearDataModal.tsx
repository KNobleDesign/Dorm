import React, { useState } from 'react';
import {
  Sparkles,
  Trash2,
  RotateCcw,
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  Info,
  Check,
  Zap,
  Droplet,
  User,
  Phone,
  CreditCard,
  Layers,
  DoorClosed,
  Plus
} from 'lucide-react';
import { LandlordConfig, BuildingProfile, RoomRecord, WaterCalcType } from '../types';

export interface FreshSetupPayload {
  propertyName: string;
  landlordName: string;
  phone: string;
  promptPayId: string;
  waterRate: number;
  elecRate: number;
  waterCalcType: WaterCalcType;
  waterPerPersonRate: number;
  buildingName: string;
  buildingId?: string;
  roomCount: number;
  startRoomNumber: number;
  defaultRent: number;
  floors?: number;
}

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: LandlordConfig;
  buildings?: BuildingProfile[];
  roomsCount?: number;
  onClearToFreshSetup?: (setup: FreshSetupPayload) => void;
  onFreshSetup?: (setup: FreshSetupPayload) => void;
  onClearToEmptySlate?: (customConfig?: Partial<LandlordConfig>) => void;
  onEmptySlate?: (customConfig?: Partial<LandlordConfig>) => void;
  onClearMetersAndTenantsOnly?: () => void;
  onClearMetersAndTenants?: () => void;
  onRestoreDemoData?: () => void;
  onRestoreDemo?: () => void;
  isSeniorMode?: boolean;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  buildings = [],
  roomsCount = 0,
  onClearToFreshSetup,
  onFreshSetup,
  onClearToEmptySlate,
  onEmptySlate,
  onClearMetersAndTenantsOnly,
  onClearMetersAndTenants,
  onRestoreDemoData,
  onRestoreDemo,
  isSeniorMode = false,
}) => {
  const [selectedMode, setSelectedMode] = useState<'fresh_setup' | 'empty_slate' | 'clear_meters' | 'restore_demo'>('fresh_setup');

  // Setup form states
  const [propertyName, setPropertyName] = useState<string>(
    currentConfig.propertyName.includes('พีแอนด์เจ') || currentConfig.propertyName.includes('เจริญสุข')
      ? 'หอพักของฉัน'
      : currentConfig.propertyName
  );
  const [landlordName, setLandlordName] = useState<string>(
    currentConfig.landlordName.includes('ประดิษฐ์')
      ? 'เจ้าของหอพัก'
      : currentConfig.landlordName
  );
  const [phone, setPhone] = useState<string>(currentConfig.phone.includes('081-987-6543') ? '' : currentConfig.phone);
  const [promptPayId, setPromptPayId] = useState<string>(currentConfig.promptPayId.includes('0819876543') ? '' : currentConfig.promptPayId);
  const [waterRate, setWaterRate] = useState<number>(currentConfig.waterRateDefault || 18);
  const [elecRate, setElecRate] = useState<number>(currentConfig.elecRateDefault || 8);
  const [waterCalcType, setWaterCalcType] = useState<WaterCalcType>('meter');
  const [waterPerPersonRate, setWaterPerPersonRate] = useState<number>(currentConfig.waterPerPersonRateDefault || 100);
  const [buildingName, setBuildingName] = useState<string>('อาคาร 1');
  const [buildingId, setBuildingId] = useState<string>('BLD-01');
  const [roomCount, setRoomCount] = useState<number>(8);
  const [startRoomNumber, setStartRoomNumber] = useState<number>(101);
  const [defaultRent, setDefaultRent] = useState<number>(3500);
  const [floors, setFloors] = useState<number>(3);

  if (!isOpen) return null;

  // Handlers with safe fallbacks
  const executeFreshSetup = onClearToFreshSetup || onFreshSetup;
  const executeEmptySlate = onClearToEmptySlate || onEmptySlate;
  const executeClearMeters = onClearMetersAndTenantsOnly || onClearMetersAndTenants;
  const executeRestoreDemo = onRestoreDemoData || onRestoreDemo;

  // Generate preview of rooms
  const previewRooms = Array.from({ length: Math.min(roomCount, 12) }, (_, i) => startRoomNumber + i);
  const hasMoreRooms = roomCount > 12;

  const handleExecute = () => {
    if (selectedMode === 'fresh_setup') {
      if (executeFreshSetup) {
        executeFreshSetup({
          propertyName: propertyName.trim() || 'หอพักของฉัน',
          landlordName: landlordName.trim() || 'เจ้าของหอพัก',
          phone: phone.trim(),
          promptPayId: promptPayId.trim(),
          waterRate,
          elecRate,
          waterCalcType,
          waterPerPersonRate,
          buildingName: buildingName.trim() || 'อาคาร 1',
          buildingId: buildingId.trim() || 'BLD-01',
          roomCount: Math.max(1, Math.min(roomCount, 100)),
          startRoomNumber,
          defaultRent,
          floors: Math.max(1, floors),
        });
      }
      onClose();
    } else if (selectedMode === 'empty_slate') {
      if (executeEmptySlate) {
        executeEmptySlate({
          propertyName: propertyName.trim() || 'หอพักของฉัน',
          landlordName: landlordName.trim() || 'เจ้าของหอพัก',
          phone: phone.trim(),
          promptPayId: promptPayId.trim(),
        });
      }
      onClose();
    } else if (selectedMode === 'clear_meters') {
      if (executeClearMeters) {
        executeClearMeters();
      }
      onClose();
    } else if (selectedMode === 'restore_demo') {
      if (executeRestoreDemo) {
        executeRestoreDemo();
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-google-sans animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                ล้างข้อมูล & เริ่มต้นตึกและห้องใหม่
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-bold">
                  Start Fresh
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                เลือกล้างข้อมูลตัวอย่างเพื่อเริ่มกรอกชื่อหอพัก อาคาร และเลขมิเตอร์จริงของคุณ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode 1: Fresh Property Setup */}
            <div
              onClick={() => setSelectedMode('fresh_setup')}
              className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between relative ${
                selectedMode === 'fresh_setup'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-400/30'
                  : 'border-slate-200 hover:border-indigo-300 bg-white'
              }`}
            >
              {selectedMode === 'fresh_setup' && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>1. ล้างและสร้างตึก+ห้องใหม่ทันที (แนะนำ)</span>
                </div>
                <p className="text-xs text-slate-600">
                  ล้างข้อมูลตัวอย่างทั้งหมด และสร้างอาคาร/ห้องพักเปล่าพร้อมใช้ตามจำนวนที่คุณกำหนด (เช่น 8-20 ห้อง) พร้อมเริ่มจดมิเตอร์ทันที
                </p>
              </div>
              <span className="mt-3 text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md w-fit">
                ✨ แนะนำสำหรับเริ่มต้นใช้งานจริง
              </span>
            </div>

            {/* Mode 2: 100% Blank Slate */}
            <div
              onClick={() => setSelectedMode('empty_slate')}
              className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between relative ${
                selectedMode === 'empty_slate'
                  ? 'border-red-600 bg-red-50/70 shadow-md ring-2 ring-red-400/30'
                  : 'border-slate-200 hover:border-red-300 bg-white'
              }`}
            >
              {selectedMode === 'empty_slate' && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-red-900 font-black text-sm">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>2. ล้างตึกและห้องเป็น 0 (ว่างเปล่า 100%)</span>
                </div>
                <p className="text-xs text-slate-600">
                  ล้างตึก ห้องพัก ค่าใช้จ่าย และมิเตอร์ทั้งหมดเป็นศูนย์ (0 ห้อง) ให้คุณไปกดเพิ่มตึกและเพิ่มห้องเองทีละห้อง
                </p>
              </div>
              <span className="mt-3 text-[11px] font-bold text-red-700 bg-red-100/70 px-2 py-0.5 rounded-md w-fit">
                เริ่มจากหน้ากระดาษเปล่า
              </span>
            </div>

            {/* Mode 3: Clear only meters & tenants */}
            <div
              onClick={() => setSelectedMode('clear_meters')}
              className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between relative ${
                selectedMode === 'clear_meters'
                  ? 'border-amber-600 bg-amber-50/70 shadow-md ring-2 ring-amber-400/30'
                  : 'border-slate-200 hover:border-amber-300 bg-white'
              }`}
            >
              {selectedMode === 'clear_meters' && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>3. ล้างเฉพาะเลขมิเตอร์ & ผู้เช่า</span>
                </div>
                <p className="text-xs text-slate-600">
                  เก็บโครงสร้างอาคารและห้องพักเดิมไว้ แต่รีเซ็ตเลขมิเตอร์เป็น 0 และล้างชื่อผู้เช่า/ยอดค้างชำระทั้งหมด
                </p>
              </div>
            </div>

            {/* Mode 4: Restore demo */}
            <div
              onClick={() => setSelectedMode('restore_demo')}
              className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between relative ${
                selectedMode === 'restore_demo'
                  ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-400/30'
                  : 'border-slate-200 hover:border-blue-300 bg-white'
              }`}
            >
              {selectedMode === 'restore_demo' && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>4. คืนค่าชุดข้อมูลตัวอย่าง (Demo 3 ตึก)</span>
                </div>
                <p className="text-xs text-slate-600">
                  คืนค่าข้อมูลตัวอย่าง 3 อาคาร (ดอนเมือง, รังสิต, ลาดพร้าว) 26 ห้อง เพื่อทดลองเล่นระบบ
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Form for Mode 1 (Fresh Setup) */}
          {selectedMode === 'fresh_setup' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>กำหนดข้อมูลหอพัก อาคาร และห้องพักเริ่มต้นของคุณ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อหอพัก / อพาร์ตเมนต์
                  </label>
                  <input
                    type="text"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    placeholder="เช่น หอพักสุขใจ, สบายดี เพลส"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อเจ้าของ / ผู้จัดการ
                  </label>
                  <input
                    type="text"
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    placeholder="เช่น คุณสมชาย (เจ้าของหอ)"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หมายเลขพร้อมเพย์รับเงิน (PromptPay)
                  </label>
                  <input
                    type="text"
                    value={promptPayId}
                    onChange={(e) => setPromptPayId(e.target.value)}
                    placeholder="เบอร์มือถือ หรือ เลขบัตร ปชช."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-900"
                  />
                </div>
              </div>

              {/* Building & Room initial generation */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs font-bold text-indigo-950 mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ข้อมูลอาคารและเลขห้องที่จะสร้างอัตโนมัติ</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่ออาคารเริ่มต้น
                    </label>
                    <input
                      type="text"
                      value={buildingName}
                      onChange={(e) => setBuildingName(e.target.value)}
                      placeholder="เช่น อาคาร 1, ตึก A"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      จำนวนชั้น
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={floors}
                      onChange={(e) => setFloors(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      จำนวนห้องที่ต้องการสร้าง
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={roomCount}
                      onChange={(e) => setRoomCount(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เลขห้องเริ่มต้น
                    </label>
                    <input
                      type="number"
                      value={startRoomNumber}
                      onChange={(e) => setStartRoomNumber(parseInt(e.target.value, 10) || 101)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Live Preview Badge */}
                <div className="mt-3 p-2.5 rounded-lg bg-indigo-100/70 border border-indigo-200 text-xs">
                  <div className="font-bold text-indigo-900 flex items-center gap-1 mb-1">
                    <DoorClosed className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ตัวอย่างห้องที่จะถูกสร้าง ({roomCount} ห้อง):</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {previewRooms.map((rNum) => (
                      <span key={rNum} className="px-2 py-0.5 rounded bg-white font-mono font-bold text-indigo-800 border border-indigo-200 text-[11px]">
                        ห้อง {rNum}
                      </span>
                    ))}
                    {hasMoreRooms && (
                      <span className="px-2 py-0.5 text-indigo-600 font-semibold text-[11px] self-center">
                        ... ถึงห้อง {startRoomNumber + roomCount - 1}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Utility Rates */}
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    ค่าไฟ (บาท/หน่วย)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={elecRate}
                    onChange={(e) => setElecRate(parseFloat(e.target.value) || 8)}
                    className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono font-bold text-amber-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 text-blue-600" />
                    ค่าน้ำ (บาท/หน่วย)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={waterRate}
                    onChange={(e) => setWaterRate(parseFloat(e.target.value) || 18)}
                    className="w-full px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1">
                    ค่าเช่าเริ่มต้น (บาท/เดือน)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={defaultRent}
                    onChange={(e) => setDefaultRent(parseFloat(e.target.value) || 3500)}
                    className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Warning Banner */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            selectedMode === 'empty_slate'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              selectedMode === 'empty_slate' ? 'text-red-600' : 'text-amber-600'
            }`} />
            <div className="text-xs space-y-1">
              <p className="font-bold">
                {selectedMode === 'empty_slate'
                  ? 'ล้างข้อมูลเป็น 0 ทั้งหมด (ลบทุกตึกและทุกห้อง)'
                  : 'ยืนยันการล้างข้อมูลและเริ่มต้นใหม่'}
              </p>
              <p className={selectedMode === 'empty_slate' ? 'text-red-800' : 'text-amber-800'}>
                {selectedMode === 'empty_slate'
                  ? 'ระบบจะล้างข้อมูลอาคารและห้องพักทั้งหมดเป็น 0 คุณสามารถไปสร้างอาคารใหม่และเพิ่มห้องพักด้วยตนเองทีละรายการ'
                  : 'ข้อมูลที่ถูกล้างจะถูกแทนที่ด้วยชุดข้อมูลใหม่ใน LocalStorage เพื่อให้คุณกรอกข้อมูลจริงได้ทันที (สามารถกดคืนค่า Demo ได้ทุกเมื่อ)'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            ยกเลิก (Cancel)
          </button>

          <button
            type="button"
            onClick={handleExecute}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer ${
              selectedMode === 'fresh_setup'
                ? 'bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-400/50'
                : selectedMode === 'empty_slate'
                ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-400/50'
                : selectedMode === 'clear_meters'
                ? 'bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-400/50'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {selectedMode === 'fresh_setup' && 'ยืนยันล้างข้อมูล & สร้างตึกและห้องใหม่'}
              {selectedMode === 'empty_slate' && 'ยืนยันล้างตึกและห้องเป็น 0 (100% ว่างเปล่า)'}
              {selectedMode === 'clear_meters' && 'ยืนยันล้างเลขมิเตอร์ & ผู้เช่า'}
              {selectedMode === 'restore_demo' && 'ยืนยันคืนค่าข้อมูลตัวอย่าง'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

