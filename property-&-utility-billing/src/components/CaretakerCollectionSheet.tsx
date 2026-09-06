import React, { useRef, useState, useMemo } from 'react';
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
  Columns,
  List,
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
  buildingProfiles = [],
  onBackToOverview,
  onTogglePaymentStatus,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  // 'split' = 2 columns side-by-side (fits all 79 rooms on 1 A4), 'single' = 1 full-width column
  const [layoutMode, setLayoutMode] = useState<'split' | 'single'>('split');
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

  // Extract unique building list from rooms and buildingProfiles
  const buildingList = useMemo(() => {
    const names = new Set<string>();
    rooms.forEach(r => {
      if (r.building) names.add(r.building);
    });
    buildings.forEach(b => names.add(b));
    buildingProfiles.forEach(bp => names.add(bp.name));
    return Array.from(names);
  }, [rooms, buildings, buildingProfiles]);

  // Filter rooms by building
  const displayRooms = useMemo(() => {
    if (selectedBuilding === 'ALL') return rooms;
    return rooms.filter((r) => r.building === selectedBuilding);
  }, [rooms, selectedBuilding]);

  // Calculate totals
  const totalRooms = displayRooms.length;
  const occupiedRooms = displayRooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
  const vacantRooms = displayRooms.filter(r => r.occupancyStatus === 'vacant').length;
  const totalDueAmount = displayRooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const paidRooms = displayRooms.filter(r => r.isPaid);
  const paidAmount = paidRooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const unpaidRooms = displayRooms.filter(r => !r.isPaid);
  const unpaidAmount = totalDueAmount - paidAmount;

  // Split rooms into 2 columns for side-by-side view
  const midPoint = Math.ceil(displayRooms.length / 2);
  const leftColumnRooms = displayRooms.slice(0, midPoint);
  const rightColumnRooms = displayRooms.slice(midPoint);

  // Dynamic row padding and fonts for 1-page A4 fitting
  const isSplit = layoutMode === 'split';
  const rowCount = isSplit ? midPoint : totalRooms;
  const isUltraDense = rowCount > 35;
  const isDense = rowCount > 20;
  const cellPy = isUltraDense ? '1.5px' : isDense ? '2.5px' : '4px';
  const cellFontSize = isUltraDense ? '8.5px' : isDense ? '9.5px' : '10.5px';
  const priceFontSize = isUltraDense ? '9px' : isDense ? '10px' : '11px';

  // Format Dates
  const todayThai = new Date().toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const dueDayFormatted = (config.paymentDueDay || 5).toString().padStart(2, '0');
  const dueDate = `${dueDayFormatted}/09/2569`;

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

  // Helper to render an individual sub-table (for left or right column)
  const renderSubTable = (subRooms: RoomRecord[], startIndex: number, showFooter: boolean = false) => {
    return (
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1.5px solid #0f172a',
          fontSize: cellFontSize,
          lineHeight: 1.25,
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead>
          <tr
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: cellFontSize,
            }}
          >
            <th style={{ padding: '4px 2px', textAlign: 'center', borderRight: '1px solid #334155' }}>ลำดับ</th>
            <th style={{ padding: '4px 4px', textAlign: 'left', borderRight: '1px solid #334155' }}>ชื่อตึก</th>
            <th style={{ padding: '4px 2px', textAlign: 'center', borderRight: '1px solid #334155' }}>ห้อง</th>
            <th style={{ padding: '4px 4px', textAlign: 'left', borderRight: '1px solid #334155' }}>คนเช่า</th>
            <th style={{ padding: '4px 4px', textAlign: 'right', borderRight: '1px solid #334155' }}>ยอดชำระ</th>
            <th style={{ padding: '4px 2px', textAlign: 'center' }}>จ่ายแล้ว</th>
          </tr>
        </thead>
        <tbody>
          {subRooms.map((room, idx) => {
            const globalIdx = startIndex + idx;
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
                    padding: `${cellPy} 2px`,
                    textAlign: 'center',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: cellFontSize,
                    borderRight: '1px solid #e2e8f0',
                  }}
                >
                  {globalIdx + 1}
                </td>

                {/* 2. ชื่อตึก */}
                <td
                  style={{
                    padding: `${cellPy} 4px`,
                    fontWeight: 700,
                    color: '#0f172a',
                    fontSize: cellFontSize,
                    borderRight: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {room.building?.replace('อาคาร', '').trim() || '-'}
                </td>

                {/* 3. ห้อง */}
                <td
                  style={{
                    padding: `${cellPy} 2px`,
                    textAlign: 'center',
                    fontWeight: 900,
                    color: '#0f172a',
                    borderRight: '1px solid #e2e8f0',
                    backgroundColor: '#f1f5f9',
                    fontFamily: 'monospace',
                    fontSize: cellFontSize,
                  }}
                >
                  {room.roomNo}
                </td>

                {/* 4. คนเช่า */}
                <td
                  style={{
                    padding: `${cellPy} 4px`,
                    borderRight: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isVacant ? (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 600, fontSize: cellFontSize }}>
                      (ห้องว่าง)
                    </span>
                  ) : isReno ? (
                    <span style={{ color: '#d97706', fontWeight: 600, fontSize: cellFontSize }}>
                      (ปรับปรุง)
                    </span>
                  ) : (
                    <strong style={{ color: '#0f172a', fontWeight: 800, fontSize: cellFontSize }}>
                      {room.tenantName || 'ผู้เช่า'}
                    </strong>
                  )}
                </td>

                {/* 5. ยอดชำระ */}
                <td
                  style={{
                    padding: `${cellPy} 4px`,
                    textAlign: 'right',
                    fontWeight: 900,
                    borderRight: '1px solid #e2e8f0',
                    fontFamily: 'monospace',
                    fontSize: priceFontSize,
                    color: roomTotal > 0 ? '#1d4ed8' : '#94a3b8',
                  }}
                >
                  {roomTotal > 0 ? `฿${roomTotal.toLocaleString()}` : '-'}
                </td>

                {/* 6. ช่องจ่ายแล้ว */}
                <td
                  style={{
                    padding: `${cellPy} 2px`,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        border: isMarkedPaid ? '1.5px solid #16a34a' : '1.5px solid #475569',
                        borderRadius: '2px',
                        backgroundColor: isMarkedPaid ? '#dcfce7' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#15803d',
                        fontWeight: 900,
                        fontSize: '9px',
                        flexShrink: 0,
                      }}
                    >
                      {isMarkedPaid ? '✓' : ''}
                    </div>
                    <span
                      style={{
                        fontSize: '8px',
                        color: isMarkedPaid ? '#15803d' : '#94a3b8',
                        fontWeight: isMarkedPaid ? 700 : 400,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isMarkedPaid ? 'จ่าย' : '______'}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6 font-google-sans">
      {/* Top Controls & Navigation Toolbar (Hidden during browser print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex-shrink-0"
              title="กลับหน้าภาพรวม Dashboard"
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
                งวดประจำเดือน {activeMonth} (กันยายน 2569)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              ใบสรุปยอดเก็บเงินค่าเช่าและค่าน้ำ-ค่าไฟ (สำหรับผู้ดูแลหอพัก)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              สรุปทุกห้องทุกตึก ครบทั้ง 6 ตึก 79 ห้อง แบ่งคอลัมน์ซ้าย-ขวา พิมพ์ลงกระดาษ A4 หน้าเดียวพอดี
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Mode Switcher: Split 2 Columns vs 1 Column */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setLayoutMode('split')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                layoutMode === 'split'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แบ่งกระดาษเป็น 2 คอลัมน์ (ซ้าย-ขวา) เหมาะสำหรับรวมทุกตึก 79 ห้องใน 1 หน้า A4"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>แบ่ง 2 คอลัมน์ (ซ้าย-ขวา)</span>
            </button>
            <button
              onClick={() => setLayoutMode('single')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                layoutMode === 'single'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="ตาราง 1 คอลัมน์เต็มหน้า"
            >
              <List className="w-3.5 h-3.5" />
              <span>1 คอลัมน์เต็ม</span>
            </button>
          </div>

          {/* Building Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">🏢 รวมทุกตึก ({rooms.length} ห้อง)</option>
              {buildingList.map((b) => {
                const count = rooms.filter(r => r.building === b).length;
                return (
                  <option key={b} value={b}>
                    {b} ({count} ห้อง)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Print Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setPrintMode('current')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                printMode === 'current'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ตามระบบจริง
            </button>
            <button
              onClick={() => setPrintMode('blank')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                printMode === 'blank'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ฟอร์มเปล่าติ๊กมือ
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            title="สั่งพิมพ์ออกเครื่องพิมพ์กระดาษ A4"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ A4</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            title="ดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูงขนาด A4"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}</span>
          </button>
        </div>
      </div>

      {/* PDF Success Toast */}
      {pdfSuccessToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{pdfSuccessToast}</span>
        </div>
      )}

      {/* A4 Sheet Container Preview (Screen & Print Wrapper) */}
      <div className="flex justify-center bg-slate-100/80 p-2 sm:p-6 rounded-2xl border border-slate-200 overflow-x-auto">
        <div
          ref={sheetRef}
          id="caretaker-collection-sheet-a4"
          style={{
            width: '794px',
            minHeight: '1123px',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            padding: '16px 20px',
            boxSizing: 'border-box',
            fontFamily: fontStack,
            color: '#0f172a',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
                paddingBottom: '8px',
                marginBottom: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em' }}>
                  {config.propertyName || 'หอพัก P&J อพาร์ตเมนต์'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e40af', marginTop: '1px' }}>
                  📋 ใบสรุปยอดเก็บเงินค่าเช่าและค่าน้ำ-ค่าไฟ (สำหรับผู้ดูแลหอพัก)
                </div>
                <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px' }}>
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
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  งวดประจำเดือน: {activeMonth} (กันยายน 2569)
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  ครบกำหนดชำระ: <strong style={{ color: '#be123c', fontWeight: 800 }}>{dueDate}</strong>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
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
                borderRadius: '6px',
                padding: '5px 10px',
                marginBottom: '8px',
                fontSize: '10.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>
                  🏢 สรุป: <strong>{selectedBuilding === 'ALL' ? 'ทุกอาคาร (6 อาคาร)' : selectedBuilding}</strong>
                </span>
                <span>
                  ห้องทั้งหมด: <strong>{totalRooms} ห้อง</strong> (มีคนเช่า {occupiedRooms} / ว่าง {vacantRooms})
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

            {/* MAIN CONTENT AREA: Split 2-Columns vs Single Full Table */}
            {isSplit ? (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  width: '100%',
                  alignItems: 'flex-start',
                }}
              >
                {/* Left Column Table (Rooms 1 .. Mid) */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#475569', marginBottom: '2px', textAlign: 'center' }}>
                    คอลัมน์ที่ 1 (ลำดับ 1 - {midPoint})
                  </div>
                  {renderSubTable(leftColumnRooms, 0)}
                </div>

                {/* Right Column Table (Rooms Mid+1 .. End) */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#475569', marginBottom: '2px', textAlign: 'center' }}>
                    คอลัมน์ที่ 2 (ลำดับ {midPoint + 1} - {displayRooms.length})
                  </div>
                  {renderSubTable(rightColumnRooms, midPoint)}
                </div>
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                {renderSubTable(displayRooms, 0)}
              </div>
            )}

            {/* Combined Grand Total Bar */}
            <div
              style={{
                marginTop: '6px',
                backgroundColor: '#f1f5f9',
                border: '1.5px solid #0f172a',
                borderRadius: '5px',
                padding: '5px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              <div>
                รวมยอดเรียกเก็บทุกห้อง ({totalRooms} ห้อง): <strong style={{ color: '#1d4ed8', fontSize: '12.5px', fontFamily: 'monospace' }}>฿{totalDueAmount.toLocaleString()} บาท</strong>
              </div>
              <div style={{ display: 'flex', gap: '14px' }}>
                <span style={{ color: '#15803d' }}>
                  ชำระแล้ว: ฿{paidAmount.toLocaleString()} ({paidRooms.length} ห้อง)
                </span>
                <span style={{ color: '#be123c' }}>
                  คงค้าง: ฿{unpaidAmount.toLocaleString()} ({unpaidRooms.length} ห้อง)
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: Instructions & Signatures */}
          <div style={{ marginTop: '8px', borderTop: '1.5px solid #cbd5e1', paddingTop: '8px' }}>
            {/* Notice / Caretaker Instructions */}
            <div
              style={{
                fontSize: '9.5px',
                color: '#475569',
                backgroundColor: '#f8fafc',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>
                📌 <strong>คำแนะนำผู้ดูแลหอ:</strong> ใช้ติ๊กตรวจรับเงินสดหรือสลิปโอนเงิน เมื่อรับเงินแล้วให้ลงวันที่และเซ็นกำกับ พร้อมส่งมอบเงินและใบสรุปนี้ให้ฝ่ายบัญชี/เจ้าของ
              </span>
              <span>
                กำหนดชำระไม่เกินวันที่ 5 ของเดือน
              </span>
            </div>

            {/* 2 Signature Blocks & Stamp Box */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                padding: '0 16px',
                marginTop: '6px',
              }}
            >
              {/* Left: Caretaker Signature */}
              <div style={{ textAlign: 'center', width: '220px' }}>
                <div style={{ borderBottom: '1px solid #0f172a', height: '20px', marginBottom: '3px' }}></div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#0f172a' }}>
                  ( .............................................................. )
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px' }}>
                  ผู้ดูแลหอพัก (ผู้จัดเก็บเงิน)
                </div>
                <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '1px' }}>
                  วันที่: ......... / ......... / .................
                </div>
              </div>

              {/* Center: Total Collected Stamp Box */}
              <div
                style={{
                  border: '1.5px dashed #94a3b8',
                  borderRadius: '5px',
                  padding: '4px 12px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ fontSize: '9.5px', color: '#64748b' }}>ยอดเงินสดที่ส่งมอบจริง</div>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                  ..................................... บาท
                </div>
              </div>

              {/* Right: Owner / Accounting Signature */}
              <div style={{ textAlign: 'center', width: '220px' }}>
                <div style={{ borderBottom: '1px solid #0f172a', height: '20px', marginBottom: '3px' }}></div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#0f172a' }}>
                  ( {config.landlordName || '..............................................................'} )
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px' }}>
                  เจ้าของหอพัก / ผู้ตรวจรับเงิน
                </div>
                <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '1px' }}>
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
