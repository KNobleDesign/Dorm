import React, { useState } from 'react';
import { 
  TableProperties, 
  Layers, 
  Code, 
  HelpCircle, 
  CheckCircle, 
  Sparkles, 
  FileSpreadsheet,
  Download,
  Info,
  Edit3,
  Check,
  X,
  RotateCcw,
  Save,
  AlertCircle,
  Calculator,
  Clock
} from 'lucide-react';
import { RoomRecord, LandlordConfig } from '../types';

interface SheetVisualizerViewProps {
  rooms: RoomRecord[];
  activeMonth: string;
  config: LandlordConfig;
  onUpdateRoomRecord?: (updatedRoom: RoomRecord) => void;
  onBatchUpdateRooms?: (updatedRooms: RoomRecord[]) => void;
}

export const SheetVisualizerView: React.FC<SheetVisualizerViewProps> = ({
  rooms,
  activeMonth,
  config,
  onUpdateRoomRecord,
  onBatchUpdateRooms,
}) => {
  const [activeSheetTab, setActiveSheetTab] = useState<'monthly' | 'rooms' | 'schema-doc'>('monthly');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  // Local edit states for inline or modal editing
  const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<RoomRecord>>({});
  
  // Quick batch editing state for the table
  const [tableEdits, setTableEdits] = useState<Record<string, { waterPrev: number; elecPrev: number; rent: number; otherFees: number; waterCurr: number; elecCurr: number; tenantName: string }>>({});

  // Initialize edit modal for a specific room
  const handleStartEdit = (room: RoomRecord) => {
    setEditingRoom(room);
    setEditFormData({
      waterPrev: room.waterPrev,
      waterCurr: room.waterCurr,
      elecPrev: room.elecPrev,
      elecCurr: room.elecCurr,
      rent: room.rent,
      otherFees: room.otherFees,
      previousBalance: room.previousBalance || 0,
      tenantName: room.tenantName,
      isPaid: room.isPaid,
      notes: room.notes || '',
    });
  };

  // Save changes from modal
  const handleSaveModalEdit = () => {
    if (!editingRoom || !onUpdateRoomRecord) return;

    const isFactory = editingRoom.building.includes('โรงงาน');
    const waterRate = isFactory ? 20 : config.waterRateDefault;
    const elecRate = isFactory ? 8.5 : config.elecRateDefault;

    const waterPrev = Number(editFormData.waterPrev ?? editingRoom.waterPrev);
    const waterCurr = Number(editFormData.waterCurr ?? editingRoom.waterCurr);
    const elecPrev = Number(editFormData.elecPrev ?? editingRoom.elecPrev);
    const elecCurr = Number(editFormData.elecCurr ?? editingRoom.elecCurr);
    const rent = Number(editFormData.rent ?? editingRoom.rent);
    const otherFees = Number(editFormData.otherFees ?? editingRoom.otherFees);
    const previousBalance = Number(editFormData.previousBalance ?? (editingRoom.previousBalance || 0));
    const tenantName = (editFormData.tenantName ?? editingRoom.tenantName).trim();
    const isPaid = Boolean(editFormData.isPaid ?? editingRoom.isPaid);

    let waterCost = 0;
    let waterUnits = 0;
    if (editingRoom.waterCalcType === 'per_person') {
      waterUnits = 0;
      waterCost = (editingRoom.occupants || 1) * (editingRoom.waterPerPersonRate || config.waterPerPersonRateDefault || 100);
    } else {
      waterUnits = waterCurr > 0 ? Math.max(0, waterCurr - waterPrev) : 0;
      waterCost = waterUnits * waterRate;
    }

    const elecUnits = elecCurr > 0 ? Math.max(0, elecCurr - elecPrev) : 0;
    const elecCost = elecUnits * elecRate;

    const monthlyTotal = rent + waterCost + elecCost + otherFees;
    const lateFeeTotal = editingRoom.lateFeeTotal || 0;
    const liabilityTotal = previousBalance + lateFeeTotal;
    const grandTotal = monthlyTotal + liabilityTotal;

    const updated: RoomRecord = {
      ...editingRoom,
      tenantName,
      rent,
      waterPrev,
      waterCurr,
      waterUnits,
      waterRate,
      waterCost,
      elecPrev,
      elecCurr,
      elecUnits,
      elecRate,
      elecCost,
      otherFees,
      previousBalance,
      liabilityTotal,
      grandTotal,
      total: monthlyTotal,
      isPaid,
      hasMeterUpdated: waterCurr > 0 || elecCurr > 0,
      notes: editFormData.notes,
    };

    onUpdateRoomRecord(updated);
    setEditingRoom(null);
  };

  // Toggle inline edit mode
  const handleToggleEditMode = () => {
    if (!isEditMode) {
      // populate table edits
      const initial: Record<string, any> = {};
      rooms.forEach(r => {
        initial[r.key] = {
          waterPrev: r.waterPrev,
          elecPrev: r.elecPrev,
          waterCurr: r.waterCurr,
          elecCurr: r.elecCurr,
          rent: r.rent,
          otherFees: r.otherFees,
          tenantName: r.tenantName,
        };
      });
      setTableEdits(initial);
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  };

  // Save all inline edits
  const handleSaveAllInlineEdits = () => {
    if (!onBatchUpdateRooms) return;

    const updatedRooms = rooms.map(r => {
      const edit = tableEdits[r.key];
      if (!edit) return r;

      const isFactory = r.building.includes('โรงงาน');
      const waterRate = isFactory ? 20 : config.waterRateDefault;
      const elecRate = isFactory ? 8.5 : config.elecRateDefault;

      const waterPrev = Number(edit.waterPrev);
      const waterCurr = Number(edit.waterCurr);
      const elecPrev = Number(edit.elecPrev);
      const elecCurr = Number(edit.elecCurr);
      const rent = Number(edit.rent);
      const otherFees = Number(edit.otherFees);
      const tenantName = edit.tenantName.trim();

      const waterUnits = waterCurr > 0 ? Math.max(0, waterCurr - waterPrev) : 0;
      const waterCost = waterUnits * waterRate;

      const elecUnits = elecCurr > 0 ? Math.max(0, elecCurr - elecPrev) : 0;
      const elecCost = elecUnits * elecRate;

      const total = rent + waterCost + elecCost + otherFees;

      return {
        ...r,
        tenantName,
        rent,
        waterPrev,
        waterCurr,
        waterUnits,
        waterRate,
        waterCost,
        elecPrev,
        elecCurr,
        elecUnits,
        elecRate,
        elecCost,
        otherFees,
        total,
        hasMeterUpdated: waterCurr > 0 || elecCurr > 0,
      };
    });

    onBatchUpdateRooms(updatedRooms);
    setIsEditMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Google Spreadsheet Schema Visualizer & Sync
            </span>
            <span className="text-xs text-slate-500 font-medium">งวดประจำเดือน {activeMonth}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
            โครงสร้างตารางและแก้ไขเลขมิเตอร์เดือนก่อน (Google Sheets)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            ตรวจสอบและแก้ไขเลขน้ำ-ไฟเดือนก่อน (Last Month Baseline), ค่าเช่า และค่าบริการต่างๆ ได้โดยตรง
          </p>
        </div>

        {/* Action Controls & Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {activeSheetTab === 'monthly' && (
            <button
              onClick={isEditMode ? handleSaveAllInlineEdits : handleToggleEditMode}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer shadow-sm ${
                isEditMode
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isEditMode ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกข้อมูลลงชีต (Save All)</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>แก้ไขเลขเดือนก่อนในตาราง (Quick Edit Mode)</span>
                </>
              )}
            </button>
          )}

          {/* Sheet Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveSheetTab('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeSheetTab === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              แผ่นงานรายเดือน ({activeMonth})
            </button>
            <button
              onClick={() => setActiveSheetTab('rooms')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeSheetTab === 'rooms'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              แผ่นงาน Rooms (มาสเตอร์)
            </button>
            <button
              onClick={() => setActiveSheetTab('schema-doc')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeSheetTab === 'schema-doc'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              คำอธิบาย Schema & สูตร
            </button>
          </div>
        </div>
      </div>

      {/* Edit Mode Notice Banner */}
      {isEditMode && activeSheetTab === 'monthly' && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between gap-3 text-blue-900 text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              <strong>โหมดแก้ไขตารางเปิดอยู่:</strong> คุณสามารถแก้ไข <strong>เลขน้ำเดือนก่อน (Col E)</strong>, <strong>เลขไฟเดือนก่อน (Col H)</strong>, ค่าเช่า และค่าบริการต่างๆ ได้ในช่องตารางด้านล่าง เมื่อเสร็จสิ้นให้กดปุ่ม <strong>"บันทึกข้อมูลลงชีต"</strong>
            </span>
          </div>
          <button
            onClick={() => setIsEditMode(false)}
            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded border border-slate-300 text-xs flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
            ยกเลิก
          </button>
        </div>
      )}

      {activeSheetTab === 'monthly' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Sheet Header Simulation */}
          <div className="bg-slate-100 p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800">แผ่นงาน: <code>{activeMonth}</code></span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">จำนวนห้อง: {rooms.length} ห้อง ({rooms.length + 1} แถว)</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
              <span className="hidden sm:inline">Col E: เลขน้ำก่อนหน้า</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Col H: เลขไฟก่อนหน้า</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-sans font-bold">
                Auto Re-calculate Units & Costs
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-[#111827] text-slate-200">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-800 w-12 text-center text-slate-400">#</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">A: อาคาร</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">B: ห้อง</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">C: ผู้เช่า</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">D: ค่าเช่า</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 bg-sky-950/80 text-sky-200 text-right font-bold">
                    E: น้ำเดือนก่อน (แก้ไขได้)
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 bg-blue-950/70 text-blue-300 text-right">
                    F: น้ำเดือนนี้ *
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">G: ค่าน้ำ</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 bg-amber-950/80 text-amber-200 text-right font-bold">
                    H: ไฟเดือนก่อน (แก้ไขได้)
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 bg-amber-950/70 text-amber-300 text-right">
                    I: ไฟเดือนนี้ *
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">J: ค่าไฟ</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">K: ค่าอื่นๆ</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 bg-emerald-950/70 text-emerald-300 text-right">
                    L: ยอดรวม
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-center">M: ชำระแล้ว</th>
                  <th className="py-2.5 px-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {rooms.map((r, idx) => {
                  const editData = tableEdits[r.key] || {
                    waterPrev: r.waterPrev,
                    elecPrev: r.elecPrev,
                    waterCurr: r.waterCurr,
                    elecCurr: r.elecCurr,
                    rent: r.rent,
                    otherFees: r.otherFees,
                    tenantName: r.tenantName,
                  };

                  return (
                    <tr key={r.key} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-400 bg-slate-50 border-r border-slate-200 font-sans">
                        {idx + 2}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-sans font-semibold text-slate-900">
                        {r.building}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-blue-600">
                        {r.roomNo}
                      </td>
                      
                      {/* Tenant Name */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-sans">
                        {isEditMode ? (
                          <input
                            type="text"
                            value={editData.tenantName}
                            onChange={(e) => {
                              setTableEdits(prev => ({
                                ...prev,
                                [r.key]: { ...editData, tenantName: e.target.value }
                              }));
                            }}
                            className="w-full px-2 py-1 border border-blue-300 rounded text-xs bg-blue-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        ) : (
                          r.tenantName
                        )}
                      </td>

                      {/* Rent (D) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">
                        {isEditMode ? (
                          <input
                            type="number"
                            value={editData.rent}
                            onChange={(e) => {
                              setTableEdits(prev => ({
                                ...prev,
                                [r.key]: { ...editData, rent: Number(e.target.value) }
                              }));
                            }}
                            className="w-20 px-1.5 py-0.5 border border-blue-300 rounded text-right text-xs bg-blue-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          r.rent.toLocaleString()
                        )}
                      </td>

                      {/* Water Prev (E) - User Requested to Edit */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right bg-sky-50 font-bold text-sky-950">
                        {isEditMode ? (
                          <input
                            type="number"
                            value={editData.waterPrev}
                            onChange={(e) => {
                              setTableEdits(prev => ({
                                ...prev,
                                [r.key]: { ...editData, waterPrev: Number(e.target.value) }
                              }));
                            }}
                            className="w-20 px-1.5 py-0.5 border border-sky-400 rounded text-right text-xs bg-white font-bold text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
                          />
                        ) : (
                          <span className="font-semibold text-sky-800">{r.waterPrev}</span>
                        )}
                      </td>

                      {/* Water Curr (F) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right bg-blue-50/60 text-blue-900 font-bold">
                        {isEditMode ? (
                          <input
                            type="number"
                            value={editData.waterCurr}
                            onChange={(e) => {
                              setTableEdits(prev => ({
                                ...prev,
                                [r.key]: { ...editData, waterCurr: Number(e.target.value) }
                              }));
                            }}
                            className="w-20 px-1.5 py-0.5 border border-blue-300 rounded text-right text-xs bg-white text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          r.waterCurr > 0 ? r.waterCurr : '-'
                        )}
                      </td>

                      {/* Water Cost (G) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right text-blue-700 font-medium">
                        {r.waterCost.toLocaleString()}
                      </td>

                      {/* Elec Prev (H) - User Requested to Edit */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right bg-amber-50 font-bold text-amber-950">
                        {isEditMode ? (
                          <input
                            type="number"
                            value={editData.elecPrev}
                            onChange={(e) => {
                              setTableEdits(prev => ({
                                ...prev,
                                [r.key]: { ...editData, elecPrev: Number(e.target.value) }
                              }));
                            }}
                            className="w-20 px-1.5 py-0.5 border border-amber-400 rounded text-right text-xs bg-white font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                          />
                        ) : (
                          <span className="font-semibold text-amber-800">{r.elecPrev}</span>
                        )}
                      </td>

                      {/* Elec Curr (I) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right bg-amber-50/60 text-amber-900 font-bold">
                        {isEditMode ? (
                          <input
                            type="number"
                            value={editData.elecCurr}
                            onChange={(e) => {
                              setTableEdits(prev => ({
                                ...prev,
                                [r.key]: { ...editData, elecCurr: Number(e.target.value) }
                              }));
                            }}
                            className="w-20 px-1.5 py-0.5 border border-amber-300 rounded text-right text-xs bg-white text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          r.elecCurr > 0 ? r.elecCurr : '-'
                        )}
                      </td>

                      {/* Elec Cost (J) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right text-amber-700 font-medium">
                        {r.elecCost.toLocaleString()}
                      </td>

                      {/* Other Fees (K) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right text-slate-500">
                        {isEditMode ? (
                          <input
                            type="number"
                            value={editData.otherFees}
                            onChange={(e) => {
                              setTableEdits(prev => ({
                                ...prev,
                                [r.key]: { ...editData, otherFees: Number(e.target.value) }
                              }));
                            }}
                            className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          r.otherFees.toLocaleString()
                        )}
                      </td>

                      {/* Total (L) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right bg-green-50 text-green-900 font-bold">
                        {r.total.toLocaleString()}
                      </td>

                      {/* Paid Status (M) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                          r.isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.isPaid ? 'TRUE (ชำระแล้ว)' : 'FALSE (ยังไม่ชำระ)'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleStartEdit(r)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded text-[11px] font-sans font-medium transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                          title="แก้ไขรายละเอียดและเลขมิเตอร์ห้องนี้"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>แก้ไข</span>
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

      {activeSheetTab === 'rooms' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base">แผ่นงาน Master Rooms Sheet</h3>
              <p className="text-xs text-slate-500">
                โครงสร้างหลักสำหรับเก็บฐานข้อมูลห้องพักทั้งหมดและการตั้งค่าราคาเริ่มต้น:
              </p>
            </div>
            <button
              onClick={() => setActiveSheetTab('monthly')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไขข้อมูลเลขเดือนก่อน</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-2.5 border border-slate-200">Key</th>
                  <th className="p-2.5 border border-slate-200">อาคาร</th>
                  <th className="p-2.5 border border-slate-200">เลขห้อง</th>
                  <th className="p-2.5 border border-slate-200">ชื่อผู้เช่า</th>
                  <th className="p-2.5 border border-slate-200 text-right">ค่าเช่า</th>
                  <th className="p-2.5 border border-slate-200 text-right bg-sky-50 text-sky-900 font-bold">เลขน้ำเดือนก่อน</th>
                  <th className="p-2.5 border border-slate-200 text-right">เลขน้ำเดือนนี้</th>
                  <th className="p-2.5 border border-slate-200 text-right">หน่วยน้ำ</th>
                  <th className="p-2.5 border border-slate-200 text-right">ค่าน้ำ</th>
                  <th className="p-2.5 border border-slate-200 text-right bg-amber-50 text-amber-900 font-bold">เลขไฟเดือนก่อน</th>
                  <th className="p-2.5 border border-slate-200 text-right">เลขไฟเดือนนี้</th>
                  <th className="p-2.5 border border-slate-200 text-right">หน่วยไฟ</th>
                  <th className="p-2.5 border border-slate-200 text-right">ค่าไฟ</th>
                  <th className="p-2.5 border border-slate-200 text-right">รวมทั้งสิ้น</th>
                  <th className="p-2.5 border border-slate-200 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.key} className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-200 font-bold text-slate-900">{r.key}</td>
                    <td className="p-2.5 border border-slate-200 font-sans">{r.building}</td>
                    <td className="p-2.5 border border-slate-200 font-bold text-blue-600">{r.roomNo}</td>
                    <td className="p-2.5 border border-slate-200 font-sans">{r.tenantName}</td>
                    <td className="p-2.5 border border-slate-200 text-right">{r.rent.toLocaleString()}</td>
                    <td className="p-2.5 border border-slate-200 text-right bg-sky-50/70 font-bold text-sky-900">{r.waterPrev}</td>
                    <td className="p-2.5 border border-slate-200 text-right">{r.waterCurr}</td>
                    <td className="p-2.5 border border-slate-200 text-right text-blue-600">{r.waterUnits}</td>
                    <td className="p-2.5 border border-slate-200 text-right text-blue-700 font-bold">{r.waterCost.toLocaleString()}</td>
                    <td className="p-2.5 border border-slate-200 text-right bg-amber-50/70 font-bold text-amber-900">{r.elecPrev}</td>
                    <td className="p-2.5 border border-slate-200 text-right">{r.elecCurr}</td>
                    <td className="p-2.5 border border-slate-200 text-right text-amber-600">{r.elecUnits}</td>
                    <td className="p-2.5 border border-slate-200 text-right text-amber-700 font-bold">{r.elecCost.toLocaleString()}</td>
                    <td className="p-2.5 border border-slate-200 text-right text-green-700 font-bold">{r.total.toLocaleString()}</td>
                    <td className="p-2.5 border border-slate-200 text-center">
                      <button
                        onClick={() => handleStartEdit(r)}
                        className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded text-xs font-sans transition cursor-pointer"
                      >
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSheetTab === 'schema-doc' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              การเชื่อมโยงคอลัมน์ใน Google Apps Script
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <li className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong>คอลัมน์ A (1) & B (2):</strong> อาคาร และ เลขห้อง (ใช้ค้นหาแถวเป้าหมายในฟังก์ชัน <code>updateMeterReading</code>)
              </li>
              <li className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-900">
                <strong>คอลัมน์ E (5):</strong> เลขน้ำเดือนก่อน (Previous Water Reading) — ใช้เป็นฐานคำนวณ <code>หน่วยน้ำ = F - E</code>
              </li>
              <li className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                <strong>คอลัมน์ F (6) & G (7):</strong> น้ำเดือนนี้ และ ค่าน้ำ (GAS จะเขียนเลขมิเตอร์ใหม่ลง Col F และคำนวณค่าน้ำลง Col G)
              </li>
              <li className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                <strong>คอลัมน์ H (8):</strong> เลขไฟเดือนก่อน (Previous Elec Reading) — ใช้เป็นฐานคำนวณ <code>หน่วยไฟ = I - H</code>
              </li>
              <li className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-amber-900">
                <strong>คอลัมน์ I (9) & J (10):</strong> ไฟเดือนนี้ และ ค่าไฟ (GAS จะเขียนเลขมิเตอร์ใหม่ลง Col I และคำนวณค่าไฟลง Col J)
              </li>
              <li className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-900">
                <strong>คอลัมน์ L (12) & M (13):</strong> ยอดรวมทั้งสิ้น และ สถานะชำระแล้ว (คำนวณ <code>Rent + Water + Elec + Other</code>)
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600" />
              สูตรคำนวณใน Google Spreadsheet
            </h3>
            <div className="text-xs font-mono space-y-2.5">
              <div className="p-3 bg-[#111827] text-slate-200 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]"># ค่าน้ำ (คอลัมน์ G):</span>
                <code className="text-blue-300">=MAX(0, (F2 - E2)) * 18</code>
              </div>

              <div className="p-3 bg-[#111827] text-slate-200 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]"># ค่าไฟ (คอลัมน์ J):</span>
                <code className="text-amber-300">=MAX(0, (I2 - H2)) * 8</code>
              </div>

              <div className="p-3 bg-[#111827] text-slate-200 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]"># ยอดรวม (คอลัมน์ L):</span>
                <code className="text-emerald-300">=D2 + G2 + J2 + K2</code>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-sans leading-relaxed">
                <strong>💡 เคล็ดลับการทำงาน:</strong> หากท่านต้องการแก้ไขเลขมิเตอร์เดือนก่อน เช่น มิเตอร์ถูกเปลี่ยนใหม่ หรือเลขจดผิดพลาด สามารถแก้ไขคอลัมน์ E และ H ในตารางด้านบนได้ทันที ระบบจะคำนวณยอดค่าน้ำค่าไฟใหม่แบบเรียลไทม์
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row Edit Modal */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                    {editingRoom.building} • ห้อง {editingRoom.roomNo}
                  </span>
                  <span className="text-xs text-slate-400">แก้ไขข้อมูลในชีต</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  แก้ไขเลขมิเตอร์เดือนก่อน & ข้อมูลห้องพัก
                </h3>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Tenant Name */}
              <div className="space-y-1 md:col-span-2">
                <label className="font-semibold text-slate-700">ชื่อผู้เช่า (Col C):</label>
                <input
                  type="text"
                  value={editFormData.tenantName ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, tenantName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                />
              </div>

              {/* Rent */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">ค่าเช่าห้อง (Col D) (บาท):</label>
                <input
                  type="number"
                  value={editFormData.rent ?? 0}
                  onChange={(e) => setEditFormData({ ...editFormData, rent: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Other Fees */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">ค่าส่วนกลาง/อื่นๆ (Col K) (บาท):</label>
                <input
                  type="number"
                  value={editFormData.otherFees ?? 0}
                  onChange={(e) => setEditFormData({ ...editFormData, otherFees: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Previous Balance */}
              <div className="space-y-1 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
                <label className="font-bold text-amber-950 flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>ยอดคงค้างจากเดือนที่แล้ว (บาท):</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.previousBalance ?? 0}
                  onChange={(e) => setEditFormData({ ...editFormData, previousBalance: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-amber-900 bg-white"
                />
              </div>

              {/* Water Prev - Target Highlight */}
              <div className="space-y-1 bg-sky-50/70 p-3 rounded-xl border border-sky-200">
                <label className="font-bold text-sky-950 flex items-center gap-1">
                  <span>เลขน้ำเดือนก่อน (Col E) *</span>
                </label>
                <input
                  type="number"
                  value={editFormData.waterPrev ?? 0}
                  onChange={(e) => setEditFormData({ ...editFormData, waterPrev: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold text-sky-900 bg-white"
                />
                <span className="text-[10px] text-sky-700 block">
                  หน่วยเดิมสำหรับคำนวณค่าน้ำ
                </span>
              </div>

              {/* Water Curr */}
              <div className="space-y-1 bg-sky-50/40 p-3 rounded-xl border border-sky-100">
                <label className="font-semibold text-slate-700">เลขน้ำเดือนนี้ (Col F):</label>
                <input
                  type="number"
                  value={editFormData.waterCurr ?? 0}
                  onChange={(e) => setEditFormData({ ...editFormData, waterCurr: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                />
                <span className="text-[10px] text-slate-500 block">
                  หน่วยที่ใช้: {Math.max(0, Number(editFormData.waterCurr ?? 0) - Number(editFormData.waterPrev ?? 0))} หน่วย
                </span>
              </div>

              {/* Elec Prev - Target Highlight */}
              <div className="space-y-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                <label className="font-bold text-amber-950 flex items-center gap-1">
                  <span>เลขไฟเดือนก่อน (Col H) *</span>
                </label>
                <input
                  type="number"
                  value={editFormData.elecPrev ?? 0}
                  onChange={(e) => setEditFormData({ ...editFormData, elecPrev: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-amber-900 bg-white"
                />
                <span className="text-[10px] text-amber-700 block">
                  หน่วยเดิมสำหรับคำนวณค่าไฟ
                </span>
              </div>

              {/* Elec Curr */}
              <div className="space-y-1 bg-amber-50/40 p-3 rounded-xl border border-amber-100">
                <label className="font-semibold text-slate-700">เลขไฟเดือนนี้ (Col I):</label>
                <input
                  type="number"
                  value={editFormData.elecCurr ?? 0}
                  onChange={(e) => setEditFormData({ ...editFormData, elecCurr: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono bg-white"
                />
                <span className="text-[10px] text-slate-500 block">
                  หน่วยที่ใช้: {Math.max(0, Number(editFormData.elecCurr ?? 0) - Number(editFormData.elecPrev ?? 0))} หน่วย
                </span>
              </div>

              {/* Paid Status Toggle */}
              <div className="md:col-span-2 pt-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">สถานะการชำระเงิน (Col M)</span>
                  <span className="text-[11px] text-slate-500">ติ๊กถูกหากผู้เช่าชำระเงินเรียบร้อยแล้ว</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editFormData.isPaid)}
                    onChange={(e) => setEditFormData({ ...editFormData, isPaid: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingRoom(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveModalEdit}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
