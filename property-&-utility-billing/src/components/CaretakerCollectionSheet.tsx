import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Building2, 
  CheckCircle2, 
  Clock, 
  CheckSquare, 
  Square, 
  Filter, 
  AlertCircle,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { RoomRecord, LandlordConfig, BuildingProfile } from '../types';
import { exportElementToA4Pdf } from '../utils/pdfExport';

export interface CaretakerCollectionSheetProps {
  rooms: RoomRecord[];
  activeMonth: string;
  config: LandlordConfig;
  buildings?: string[];
  buildingProfiles?: BuildingProfile[];
  onBackToOverview?: () => void;
  onTogglePaymentStatus?: (roomKey: string) => void;
}

export const CaretakerCollectionSheet: React.FC<CaretakerCollectionSheetProps> = ({
  rooms,
  activeMonth,
  config,
  buildings = [],
  onBackToOverview,
  onTogglePaymentStatus,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  // 'current' = shows checkmark if isPaid in system, 'blank' = always empty checkboxes for hand-filling
  const [printMode, setPrintMode] = useState<'current' | 'blank'>('current');

  // Calculate effective room total (Rent + Water + Elec + Other + Arrears)
  const getRoomEffectiveTotal = (r: RoomRecord): number => {
    if (r.grandTotal !== undefined && r.grandTotal !== null && r.grandTotal > 0) {
      return r.grandTotal;
    }
    const rent = r.isOccupied ? (r.rent || 0) : 0;
    const waterCost = r.isOccupied ? (r.waterCost || 0) : 0;
    const elecCost = r.isOccupied ? (r.elecCost || 0) : 0;
    const otherFees = r.isOccupied ? (r.otherFees || 0) : 0;
    const subtotal = rent + waterCost + elecCost + otherFees;
    const prevBalance = r.previousBalance || 0;
    const lateFeeTotal = r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || config.lateFeePerDayDefault || 100));
    return subtotal + prevBalance + lateFeeTotal;
  };

  // Filter rooms by building
  const displayRooms = rooms.filter((r) => {
    if (selectedBuilding !== 'ALL' && r.building !== selectedBuilding) return false;
    return true;
  });

  // Calculate totals
  const totalRooms = displayRooms.length;
  const occupiedRooms = displayRooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
  const vacantRooms = displayRooms.filter(r => r.occupancyStatus === 'vacant').length;
  const totalDueAmount = displayRooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const paidRooms = displayRooms.filter(r => r.isPaid);
  const paidAmount = paidRooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const unpaidRooms = displayRooms.filter(r => !r.isPaid);
  const unpaidAmount = totalDueAmount - paidAmount;

  // Format Dates
  const todayThai = new Date().toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const dueDayFormatted = (config.paymentDueDay || 5).toString().padStart(2, '0');
  const dueDate = `${dueDayFormatted}/` + (new Date().getMonth() + 1).toString().padStart(2, '0') + '/' + (new Date().getFullYear() + 543);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Export Handler
  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    setIsGeneratingPdf(true);
    setPdfSuccessToast(null);

    try {
      const fileName = `ใบสรุปเก็บเงินผู้ดูแลหอ_ทุกห้องทุกตึก_งวด_${activeMonth}.pdf`;
      await exportElementToA4Pdf(sheetRef.current, fileName, 'portrait', {
        width: 794,
        height: 1123,
        scale: 2,
      });
      setPdfSuccessToast('ดาวน์โหลด PDF สรุปเก็บเงิน 1 แผ่น A4 สำเร็จเรียบร้อย!');
      setTimeout(() => setPdfSuccessToast(null), 4000);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const fontStack = "'Google Sans', 'Sarabun', 'Noto Sans Thai', 'Prompt', system-ui, -apple-system, sans-serif";

  return (
    <div className="space-y-6 font-google-sans">
      {/* Top Controls & Navigation Toolbar (Hidden during browser print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex-shrink-0"
              title="กลับหน้าภาพรวมสถิติ Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                1 แผ่นกระดาษ A4
              </span>
              <span className="text-xs font-bold text-slate-500">
                งวด {activeMonth}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              📋 ใบสรุปเก็บเงินผู้ดูแลหอ (ทุกห้องทุกตึก)
            </h2>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Building Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">🏢 สรุปทุกตึกรวมกัน ({rooms.length} ห้อง)</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Print Mode Selector */}
          <div className="inline-flex rounded-xl border border-slate-300 p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setPrintMode('current')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                printMode === 'current'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงเครื่องหมายตามสถานะชำระจริงในระบบ"
            >
              ตามสถานะในระบบ
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('blank')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                printMode === 'blank'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="ปริ้นท์ช่องว่างเปล่า ให้ผู้ดูแลหอเดินติ๊กด้วยปากกา"
            >
              ช่องว่างเดินตรวจ
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shadow-sm"
            title="สั่งพิมพ์ออกเครื่องพิมพ์โดยตรง ขนาดพอดี 1 กระดาษ A4"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ A4</span>
          </button>

          {/* PDF Download Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            title="ดาวน์โหลดเป็นไฟล์ PDF ขนาด A4 คุณภาพสูง"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (A4)'}</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {pdfSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-sm animate-in slide-in-from-top-2 duration-200 print:hidden">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{pdfSuccessToast}</span>
          </div>
        </div>
      )}

      {/* Responsive Preview Scroll Wrapper */}
      <div className="overflow-x-auto pb-6 print:overflow-visible print:pb-0 flex justify-center">
        {/* PHYSICAL 1 A4 SHEET CONTAINER (794px x 1123px) */}
        <div
          ref={sheetRef}
          id="caretaker-collection-sheet-a4"
          className="bg-white text-slate-900 shadow-xl border border-slate-300 rounded-none print:shadow-none print:border-none print:m-0"
          style={{
            width: '794px',
            minHeight: '1123px',
            height: '1123px',
            maxHeight: '1123px',
            boxSizing: 'border-box',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: fontStack,
            backgroundColor: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* TOP SECTION: Header & Summary Badges */}
          <div>
            {/* Main Title Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2.5px solid #0f172a',
                paddingBottom: '10px',
                marginBottom: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em' }}>
                  {config.propertyName || 'หอพัก P&J อพาร์ตเมนต์'}
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#1e40af', marginTop: '1px' }}>
                  📋 ใบสรุปยอดเก็บเงินค่าเช่าและค่าน้ำ-ค่าไฟ (สำหรับผู้ดูแลหอพัก)
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                  ที่อยู่/ติดต่อ: {config.address || 'หอพัก'} • โทร: <strong>{config.phone || '-'}</strong>
                </div>
              </div>

              {/* Right side info box */}
              <div
                style={{
                  textAlign: 'right',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '2px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1.5px solid #bfdbfe',
                    color: '#1e3a8a',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                  }}
                >
                  งวดประจำเดือน: {activeMonth}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  ครบกำหนดชำระ: <strong style={{ color: '#be123c', fontWeight: 800 }}>{dueDate}</strong>
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  พิมพ์เมื่อ: {todayThai}
                </div>
              </div>
            </div>

            {/* Quick KPI Bar (Occupancy & Collection Progress) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 12px',
                marginBottom: '10px',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span>
                  🏢 สรุป: <strong>{selectedBuilding === 'ALL' ? 'ทุกอาคาร' : selectedBuilding}</strong>
                </span>
                <span>
                  ห้องทั้งหมด: <strong>{totalRooms} ห้อง</strong> (มีคนเช่า {occupiedRooms} / ว่าง {vacantRooms})
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span>
                  ยอดที่ต้องเก็บรวม: <strong style={{ color: '#0f172a', fontWeight: 800 }}>฿{totalDueAmount.toLocaleString()}</strong>
                </span>
                <span style={{ color: '#15803d', fontWeight: 700 }}>
                  ชำระแล้ว: ฿{paidAmount.toLocaleString()} ({paidRooms.length})
                </span>
                <span style={{ color: '#b91c1c', fontWeight: 800 }}>
                  ค้างเก็บ: ฿{unpaidAmount.toLocaleString()} ({unpaidRooms.length})
                </span>
              </div>
            </div>

            {/* MAIN TABLE: Showing ONLY [ชื่อตึก, ห้อง, คนเช่า, ราคาที่ต้องชำระ, และช่องสำหรับกรอกว่าจ่ายหรือยัง] */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.5px solid #0f172a',
                fontSize: '11px',
                lineHeight: 1.35,
                tableLayout: 'fixed',
              }}
            >
              <colgroup>
                <col style={{ width: '6%' }} />  {/* ลำดับ */}
                <col style={{ width: '21%' }} /> {/* ชื่อตึก */}
                <col style={{ width: '11%' }} /> {/* ห้อง */}
                <col style={{ width: '26%' }} /> {/* คนเช่า */}
                <col style={{ width: '18%' }} /> {/* ราคาที่ต้องชำระ */}
                <col style={{ width: '18%' }} /> {/* ช่องสำหรับกรอกว่าจ่ายหรือยัง */}
              </colgroup>
              <thead>
                <tr
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '11px',
                  }}
                >
                  <th style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #334155' }}>ลำดับ</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #334155' }}>ชื่อตึก</th>
                  <th style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #334155' }}>ห้อง</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #334155' }}>คนเช่า</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #334155' }}>ราคาที่ต้องชำระ</th>
                  <th style={{ padding: '6px 6px', textAlign: 'center' }}>ช่องสำหรับกรอกว่าจ่ายหรือยัง</th>
                </tr>
              </thead>
              <tbody>
                {displayRooms.map((room, idx) => {
                  const roomTotal = getRoomEffectiveTotal(room);
                  const isVacant = room.occupancyStatus === 'vacant';
                  const isReno = room.occupancyStatus === 'under_renovation';
                  const isPaid = room.isPaid;
                  const isMarkedPaid = printMode === 'current' ? isPaid : false;

                  return (
                    <tr
                      key={room.key}
                      onClick={() => onTogglePaymentStatus && onTogglePaymentStatus(room.key)}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #cbd5e1',
                        cursor: onTogglePaymentStatus ? 'pointer' : 'default',
                      }}
                      title="คลิกที่แถวเพื่อสลับสถานะ ชำระแล้ว / รอชำระ"
                    >
                      {/* 1. ลำดับ */}
                      <td
                        style={{
                          padding: '5px 4px',
                          textAlign: 'center',
                          color: '#64748b',
                          fontWeight: 600,
                          fontSize: '10.5px',
                          borderRight: '1px solid #e2e8f0',
                        }}
                      >
                        {idx + 1}
                      </td>

                      {/* 2. ชื่อตึก */}
                      <td
                        style={{
                          padding: '5px 8px',
                          fontWeight: 700,
                          color: '#0f172a',
                          borderRight: '1px solid #e2e8f0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {room.building || '-'}
                      </td>

                      {/* 3. ห้อง */}
                      <td
                        style={{
                          padding: '5px 6px',
                          textAlign: 'center',
                          fontWeight: 900,
                          color: '#0f172a',
                          borderRight: '1px solid #e2e8f0',
                          backgroundColor: '#f1f5f9',
                          fontFamily: 'monospace',
                          fontSize: '11.5px',
                        }}
                      >
                        {room.roomNo}
                      </td>

                      {/* 4. คนเช่า */}
                      <td
                        style={{
                          padding: '5px 8px',
                          borderRight: '1px solid #e2e8f0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {isVacant ? (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>⚪ ห้องว่าง</span>
                        ) : isReno ? (
                          <span style={{ color: '#7c3aed', fontWeight: 600 }}>🟡 ปิดปรับปรุง</span>
                        ) : (
                          <span style={{ fontWeight: 600, color: '#020617' }}>
                            {room.tenantName || 'ผู้เช่า'}
                            {room.phone ? (
                              <span style={{ color: '#64748b', fontSize: '10px', marginLeft: '4px' }}>
                                ({room.phone})
                              </span>
                            ) : null}
                          </span>
                        )}
                      </td>

                      {/* 5. ราคาที่ต้องชำระ */}
                      <td
                        style={{
                          padding: '5px 8px',
                          textAlign: 'right',
                          fontWeight: 900,
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          color: isVacant || isReno || roomTotal === 0 ? '#64748b' : '#1e3a8a',
                          borderRight: '1px solid #e2e8f0',
                        }}
                      >
                        ฿{roomTotal.toLocaleString()}
                      </td>

                      {/* 6. ช่องสำหรับกรอกว่าจ่ายหรือยัง เพื่อปริ้นให้ผู้ดูแลหอ */}
                      <td
                        style={{
                          padding: '4px 6px',
                          textAlign: 'left',
                          verticalAlign: 'middle',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                          }}
                        >
                          {/* Checkbox Box (Hand fillable or pre-checked) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                border: isMarkedPaid ? '2px solid #16a34a' : '1.5px solid #475569',
                                borderRadius: '3px',
                                backgroundColor: isMarkedPaid ? '#dcfce7' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#15803d',
                                fontWeight: 900,
                                fontSize: '12px',
                                flexShrink: 0,
                              }}
                            >
                              {isMarkedPaid ? '✓' : ''}
                            </div>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: isMarkedPaid ? 700 : 500,
                                color: isMarkedPaid ? '#15803d' : '#334155',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isMarkedPaid ? 'จ่ายแล้ว' : 'จ่ายแล้ว'}
                            </span>
                          </div>

                          {/* Date / Sign writing guideline line for caretaker */}
                          <div
                            style={{
                              fontSize: '9.5px',
                              color: '#64748b',
                              whiteSpace: 'nowrap',
                              borderBottom: '1px dotted #94a3b8',
                              paddingBottom: '1px',
                              minWidth: '55px',
                              textAlign: 'right',
                            }}
                          >
                            {isMarkedPaid && room.paymentDate ? (
                              <span style={{ color: '#15803d', fontWeight: 600 }}>{room.paymentDate}</span>
                            ) : (
                              'ว/ด/ป: ......'
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Total Row */}
              <tfoot>
                <tr
                  style={{
                    backgroundColor: '#f1f5f9',
                    borderTop: '2px solid #0f172a',
                    fontWeight: 900,
                  }}
                >
                  <td colSpan={4} style={{ padding: '7px 8px', textAlign: 'right', fontSize: '12px', color: '#020617' }}>
                    รวมราคาที่ต้องชำระทั้งหมด ({totalRooms} ห้อง):
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: '13.5px', color: '#1d4ed8', fontFamily: 'monospace' }}>
                    ฿{totalDueAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'center', fontSize: '11px', color: '#15803d' }}>
                    ชำระแล้ว: {paidRooms.length} / ค้าง: {unpaidRooms.length}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* BOTTOM SECTION: Instructions, Signatures & Footer Summary */}
          <div style={{ marginTop: '12px', borderTop: '1.5px solid #cbd5e1', paddingTop: '10px' }}>
            {/* Notice / Caretaker Instructions */}
            <div
              style={{
                fontSize: '10px',
                color: '#475569',
                backgroundColor: '#f8fafc',
                padding: '4px 8px',
                borderRadius: '5px',
                border: '1px solid #e2e8f0',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>
                📌 <strong>คำแนะนำผู้ดูแลหอ:</strong> ใช้ติ๊กตรวจรับเงินสดหรือสลิปโอนเงิน เมื่อรับเงินแล้วให้ลงวันที่และเซ็นกำกับ พร้อมส่งมอบเงินและใบสรุปนี้ให้ฝ่ายบัญชี/เจ้าของ
              </span>
              <span>
                กำหนดชำระไม่เกินวันที่ {config.paymentDueDay || 5} ของเดือน
              </span>
            </div>

            {/* 2 Signature Blocks */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                padding: '0 20px',
                marginTop: '12px',
              }}
            >
              {/* Left: Caretaker Signature */}
              <div style={{ textAlign: 'center', width: '240px' }}>
                <div style={{ borderBottom: '1px solid #0f172a', height: '24px', marginBottom: '4px' }}></div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                  ( .............................................................. )
                </div>
                <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '1px' }}>
                  ผู้ดูแลหอพัก (ผู้จัดเก็บเงิน)
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  วันที่: ......... / ......... / .................
                </div>
              </div>

              {/* Center: Total Collected Stamp Box */}
              <div
                style={{
                  border: '1.5px dashed #94a3b8',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ fontSize: '10px', color: '#64748b' }}>ยอดเงินสดที่ส่งมอบจริง</div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                  ..................................... บาท
                </div>
              </div>

              {/* Right: Owner / Accounting Signature */}
              <div style={{ textAlign: 'center', width: '240px' }}>
                <div style={{ borderBottom: '1px solid #0f172a', height: '24px', marginBottom: '4px' }}></div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                  ( {config.landlordName || '..............................................................'} )
                </div>
                <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '1px' }}>
                  เจ้าของหอพัก / ผู้ตรวจรับเงิน
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  วันที่: ......... / ......... / .................
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
