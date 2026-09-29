import React, { useRef, useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Building2, 
  Columns,
  List,
  Check,
  Sparkles
} from 'lucide-react';
import { RoomRecord, LandlordConfig, BuildingProfile } from '../types';
import { exportElementToA4Pdf, exportElementsToMultiPageA4Pdf } from '../utils/pdfExport';

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
  // Refs for single-page and multi-page export
  const sheetRef = useRef<HTMLDivElement>(null);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  // 'split' = 2 columns side-by-side (fits all 78 rooms cleanly on 1 A4 page), 'single' = 1 full-width column (paginates into 2 A4 pages if > 36 rooms)
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

  // Helper to cleanly format building name in the table
  const formatBuildingCleanName = (b?: string): string => {
    if (!b) return '-';
    const cleaned = b.trim();

    if (/399\/38/i.test(cleaned)) return '399/38';
    if (/399\/40/i.test(cleaned)) return '399/40';

    return cleaned
      .replace(/^(บ้านเช่า|อาคาร)\s*/i, '')
      .replace(/^บ้านเช่า/i, '')
      .replace(/^อาคาร/i, '')
      .trim() || b;
  };

  // Extract unique building list
  const buildingList = useMemo(() => {
    const seen = new Map<string, string>();
    buildingProfiles.forEach(bp => {
      const clean = formatBuildingCleanName(bp.name);
      if (!seen.has(clean)) seen.set(clean, bp.name);
    });
    rooms.forEach(r => {
      if (r.building) {
        const clean = formatBuildingCleanName(r.building);
        if (!seen.has(clean)) seen.set(clean, r.building);
      }
    });
    buildings.forEach(b => {
      const clean = formatBuildingCleanName(b);
      if (!seen.has(clean)) seen.set(clean, b);
    });
    return Array.from(seen.values());
  }, [rooms, buildings, buildingProfiles]);

  // Filter rooms by building
  const displayRooms = useMemo(() => {
    if (selectedBuilding === 'ALL') return rooms;
    const targetClean = formatBuildingCleanName(selectedBuilding);
    return rooms.filter((r) => 
      r.building === selectedBuilding ||
      formatBuildingCleanName(r.building) === targetClean ||
      (r.buildingId && buildingProfiles.find(bp => bp.id === r.buildingId && formatBuildingCleanName(bp.name) === targetClean))
    );
  }, [rooms, selectedBuilding, buildingProfiles]);

  // Calculate totals
  const totalRooms = displayRooms.length;
  const occupiedRooms = displayRooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
  const vacantRooms = displayRooms.filter(r => r.occupancyStatus === 'vacant').length;
  const totalDueAmount = displayRooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const paidRooms = displayRooms.filter(r => r.isPaid);
  const paidAmount = paidRooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const unpaidRooms = displayRooms.filter(r => !r.isPaid);
  const unpaidAmount = totalDueAmount - paidAmount;

  // Split rooms into 2 columns for side-by-side view (Split Mode)
  const midPoint = Math.ceil(displayRooms.length / 2);
  const leftColumnRooms = displayRooms.slice(0, midPoint);
  const rightColumnRooms = displayRooms.slice(midPoint);

  // Single Column Pagination (when rooms > 36)
  const isSingleMultiPage = layoutMode === 'single' && displayRooms.length > 36;
  const singlePage1Rooms = useMemo(() => {
    if (!isSingleMultiPage) return displayRooms;
    // Page 1 gets up to 40 rooms
    return displayRooms.slice(0, 40);
  }, [displayRooms, isSingleMultiPage]);

  const singlePage2Rooms = useMemo(() => {
    if (!isSingleMultiPage) return [];
    return displayRooms.slice(40);
  }, [displayRooms, isSingleMultiPage]);

  // Dates formatting
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
    setIsGeneratingPdf(true);
    setPdfSuccessToast(null);

    try {
      const bldgLabel = selectedBuilding === 'ALL' ? 'ทุกตึก_78ห้อง' : formatBuildingCleanName(selectedBuilding);
      const fileName = `ใบสรุปเก็บเงินผู้ดูแลหอ_${bldgLabel}_งวด_${activeMonth}.pdf`;

      if (isSingleMultiPage && page1Ref.current && page2Ref.current) {
        // Multi-page export (2 clean A4 pages)
        await exportElementsToMultiPageA4Pdf(
          [page1Ref.current, page2Ref.current],
          fileName,
          undefined,
          'portrait',
          {
            width: 794,
            height: 1123,
            scale: 2,
          }
        );
        setPdfSuccessToast('ดาวน์โหลด PDF สรุปเก็บเงิน 2 หน้า A4 ครบถ้วน ไม่ซ้อน ไม่ล้นหน้า สำเร็จเรียบร้อย!');
      } else {
        // Single A4 page export
        const targetEl = sheetRef.current || page1Ref.current;
        if (!targetEl) throw new Error('ไม่พบข้อมูลหน้าเอกสาร');

        await exportElementToA4Pdf(targetEl, fileName, 'portrait', {
          width: 794,
          height: 1123,
          scale: 2,
        });
        setPdfSuccessToast('ดาวน์โหลด PDF สรุปเก็บเงิน 1 หน้า A4 ตัวอักษรคมชัด ไม่ซ้อน ไม่ล้นหน้า สำเร็จเรียบร้อย!');
      }
      setTimeout(() => setPdfSuccessToast(null), 4500);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const fontStack = "'Google Sans', 'Sarabun', 'Noto Sans Thai', 'Prompt', system-ui, -apple-system, sans-serif";

  // Render Sub-Table Component
  const renderSubTable = (
    subRooms: RoomRecord[], 
    startIndex: number, 
    isFullWidth: boolean = false
  ) => {
    // Math scaling: large and crystal clear font sizes without overflowing 1123px A4 height
    let cellPy = '2.2px';
    let cellFontSize = '10.5px';
    let roomNoFontSize = '11px';
    let headerFontSize = '10px';
    let priceFontSize = '11px';
    let badgeFontSize = '9px';

    if (isFullWidth) {
      if (subRooms.length <= 25) {
        cellPy = '4.5px';
        cellFontSize = '12px';
        roomNoFontSize = '12.5px';
        headerFontSize = '11.5px';
        priceFontSize = '12.5px';
        badgeFontSize = '10px';
      } else if (subRooms.length <= 42) {
        cellPy = '2.6px';
        cellFontSize = '11px';
        roomNoFontSize = '12px';
        headerFontSize = '10.5px';
        priceFontSize = '11.5px';
        badgeFontSize = '9.5px';
      }
    } else {
      // Split 2-column mode (39 rows)
      cellPy = '2.0px';
      cellFontSize = '10.2px';
      roomNoFontSize = '11px';
      headerFontSize = '9.8px';
      priceFontSize = '10.8px';
      badgeFontSize = '8.8px';
    }

    return (
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1.5px solid #0f172a',
          fontSize: cellFontSize,
          lineHeight: 1.32,
          tableLayout: 'fixed',
          boxSizing: 'border-box',
        }}
      >
        <colgroup>
          {isFullWidth ? (
            <>
              <col style={{ width: '6%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '31%' }} />
              <col style={{ width: '19%' }} />
              <col style={{ width: '15%' }} />
            </>
          ) : (
            <>
              <col style={{ width: '6.5%' }} />
              <col style={{ width: '23%' }} />
              <col style={{ width: '8.5%' }} />
              <col style={{ width: '27%' }} />
              <col style={{ width: '19%' }} />
              <col style={{ width: '16%' }} />
            </>
          )}
        </colgroup>
        <thead>
          <tr
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: headerFontSize,
              lineHeight: 1.3,
            }}
          >
            <th style={{ padding: '3px 1px', textAlign: 'center', borderRight: '1px solid #334155', whiteSpace: 'nowrap' }}>ลำดับ</th>
            <th style={{ padding: '3px 3px', textAlign: 'left', borderRight: '1px solid #334155', whiteSpace: 'nowrap' }}>ชื่อตึก</th>
            <th style={{ padding: '3px 1px', textAlign: 'center', borderRight: '1px solid #334155', whiteSpace: 'nowrap' }}>ห้อง</th>
            <th style={{ padding: '3px 3px', textAlign: 'left', borderRight: '1px solid #334155', whiteSpace: 'nowrap' }}>คนเช่า</th>
            <th style={{ padding: '3px 3px', textAlign: 'right', borderRight: '1px solid #334155', whiteSpace: 'nowrap' }}>ยอดชำระ</th>
            <th style={{ padding: '3px 1px', textAlign: 'center', whiteSpace: 'nowrap' }}>จ่ายแล้ว</th>
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
                  boxSizing: 'border-box',
                }}
                title="คลิกที่แถวเพื่อสลับสถานะ ชำระแล้ว / รอชำระ"
              >
                {/* 1. ลำดับ */}
                <td
                  style={{
                    padding: `${cellPy} 1px`,
                    textAlign: 'center',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: cellFontSize,
                    borderRight: '1px solid #e2e8f0',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {globalIdx + 1}
                </td>

                {/* 2. ชื่อตึก */}
                <td
                  style={{
                    padding: `${cellPy} 3px`,
                    fontWeight: 800,
                    color: '#0f172a',
                    fontSize: cellFontSize,
                    borderRight: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                  }}
                  title={room.building}
                >
                  {formatBuildingCleanName(room.building)}
                </td>

                {/* 3. ห้อง */}
                <td
                  style={{
                    padding: `${cellPy} 1px`,
                    textAlign: 'center',
                    fontWeight: 900,
                    color: '#0f172a',
                    borderRight: '1px solid #e2e8f0',
                    backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#f1f5f9',
                    fontFamily: 'monospace',
                    fontSize: roomNoFontSize,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {room.roomNo}
                </td>

                {/* 4. คนเช่า */}
                <td
                  style={{
                    padding: `${cellPy} 3px`,
                    borderRight: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                  }}
                  title={room.tenantName}
                >
                  {isVacant ? (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 600, fontSize: badgeFontSize }}>
                      (ห้องว่าง)
                    </span>
                  ) : isReno ? (
                    <span style={{ color: '#d97706', fontWeight: 600, fontSize: badgeFontSize }}>
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
                    padding: `${cellPy} 3px`,
                    textAlign: 'right',
                    fontWeight: 900,
                    borderRight: '1px solid #e2e8f0',
                    fontFamily: 'monospace',
                    fontSize: priceFontSize,
                    color: roomTotal > 0 ? '#1d4ed8' : '#94a3b8',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {roomTotal > 0 ? `฿${roomTotal.toLocaleString()}` : '-'}
                </td>

                {/* 6. จ่ายแล้ว */}
                <td
                  style={{
                    padding: `${cellPy} 2px`,
                    textAlign: 'center',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        border: isMarkedPaid ? '1.5px solid #16a34a' : '1.5px solid #64748b',
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
                        fontSize: badgeFontSize,
                        color: isMarkedPaid ? '#15803d' : '#94a3b8',
                        fontWeight: isMarkedPaid ? 700 : 500,
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

  // Render Bottom Instructions and Rock-Solid Signatures Section (No text overlap under any circumstances)
  const renderSignatureSection = () => (
    <div style={{ marginTop: '5px', borderTop: '1.5px solid #cbd5e1', paddingTop: '5px' }}>
      {/* Notice / Caretaker Instructions */}
      <div
        style={{
          fontSize: '9.5px',
          color: '#475569',
          backgroundColor: '#f8fafc',
          padding: '2.5px 8px',
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          marginBottom: '5px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          lineHeight: 1.35,
          whiteSpace: 'nowrap',
        }}
      >
        <span>
          📌 <strong>คำแนะนำผู้ดูแลหอ:</strong> ใช้ติ๊กตรวจรับเงินสดหรือสลิปโอนเงิน เมื่อรับแล้วลงวันที่และเซ็นกำกับ พร้อมส่งมอบให้เจ้าของหอ
        </span>
        <span style={{ color: '#be123c', fontWeight: 700 }}>
          กำหนดชำระไม่เกินวันที่ {dueDayFormatted} ของเดือน
        </span>
      </div>

      {/* 3 Dedicated Signature & Stamp Blocks */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '0 8px',
        }}
      >
        {/* Left: Caretaker Signature Block */}
        <div
          style={{
            width: '215px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Actual signing underline */}
          <div
            style={{
              width: '175px',
              borderBottom: '1.5px solid #1e293b',
              height: '20px',
              marginBottom: '5px',
            }}
          />
          {/* Printed name line using fixed dotted span */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              width: '100%',
              whiteSpace: 'nowrap',
            }}
          >
            <span>(</span>
            <span
              style={{
                borderBottom: '1.5px dotted #64748b',
                width: '155px',
                display: 'inline-block',
                height: '14px',
              }}
            />
            <span>)</span>
          </div>
          {/* Position label */}
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#334155',
              marginTop: '2px',
              lineHeight: 1.35,
              whiteSpace: 'nowrap',
            }}
          >
            ผู้ดูแลหอพัก (ผู้จัดเก็บเงิน)
          </div>
          {/* Date line with fixed day/month/year slots */}
          <div
            style={{
              fontSize: '10px',
              color: '#64748b',
              marginTop: '3px',
              lineHeight: 1.35,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              whiteSpace: 'nowrap',
            }}
          >
            <span>วันที่:</span>
            <span
              style={{
                borderBottom: '1px dotted #94a3b8',
                width: '26px',
                display: 'inline-block',
                height: '12px',
              }}
            />
            <span>/</span>
            <span
              style={{
                borderBottom: '1px dotted #94a3b8',
                width: '26px',
                display: 'inline-block',
                height: '12px',
              }}
            />
            <span>/</span>
            <span
              style={{
                borderBottom: '1px dotted #94a3b8',
                width: '38px',
                display: 'inline-block',
                height: '12px',
                textAlign: 'center',
                fontSize: '9.5px',
                color: '#334155',
                fontWeight: 600,
              }}
            >
              2569
            </span>
          </div>
        </div>

        {/* Center: Handed-over Cash Box */}
        <div
          style={{
            border: '1.5px dashed #475569',
            borderRadius: '6px',
            padding: '4px 12px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            minWidth: '185px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#475569',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
            }}
          >
            ยอดเงินสดที่ส่งมอบจริง
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                borderBottom: '1.5px dotted #0f172a',
                width: '105px',
                display: 'inline-block',
                height: '14px',
              }}
            />
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              บาท
            </span>
          </div>
        </div>

        {/* Right: Owner / Accounting Signature Block */}
        <div
          style={{
            width: '215px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Actual signing underline */}
          <div
            style={{
              width: '175px',
              borderBottom: '1.5px solid #1e293b',
              height: '20px',
              marginBottom: '5px',
            }}
          />
          {/* Printed name line */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              width: '100%',
              whiteSpace: 'nowrap',
            }}
          >
            <span>(</span>
            {config.landlordName ? (
              <span style={{ fontWeight: 800, color: '#0f172a', padding: '0 4px' }}>
                {config.landlordName}
              </span>
            ) : (
              <span
                style={{
                  borderBottom: '1.5px dotted #64748b',
                  width: '155px',
                  display: 'inline-block',
                  height: '14px',
                }}
              />
            )}
            <span>)</span>
          </div>
          {/* Position label */}
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#334155',
              marginTop: '2px',
              lineHeight: 1.35,
              whiteSpace: 'nowrap',
            }}
          >
            เจ้าของหอพัก / ผู้ตรวจรับเงิน
          </div>
          {/* Date line with fixed day/month/year slots */}
          <div
            style={{
              fontSize: '10px',
              color: '#64748b',
              marginTop: '3px',
              lineHeight: 1.35,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              whiteSpace: 'nowrap',
            }}
          >
            <span>วันที่:</span>
            <span
              style={{
                borderBottom: '1px dotted #94a3b8',
                width: '26px',
                display: 'inline-block',
                height: '12px',
              }}
            />
            <span>/</span>
            <span
              style={{
                borderBottom: '1px dotted #94a3b8',
                width: '26px',
                display: 'inline-block',
                height: '12px',
              }}
            />
            <span>/</span>
            <span
              style={{
                borderBottom: '1px dotted #94a3b8',
                width: '38px',
                display: 'inline-block',
                height: '12px',
                textAlign: 'center',
                fontSize: '9.5px',
                color: '#334155',
                fontWeight: 600,
              }}
            >
              2569
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Main Header (Top Info)
  const renderMainHeader = (isCompact: boolean = false, pageLabel?: string) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '2.5px solid #0f172a',
        paddingBottom: isCompact ? '4px' : '6px',
        marginBottom: '6px',
      }}
    >
      <div>
        <div style={{ fontSize: isCompact ? '16px' : '17.5px', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          {config.propertyName || 'หอพัก P&J อพาร์ตเมนต์'}
        </div>
        <div style={{ fontSize: isCompact ? '12.5px' : '13.5px', fontWeight: 800, color: '#1e40af', marginTop: '2px', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
          📋 ใบสรุปยอดเก็บเงินค่าเช่าและค่าน้ำ-ค่าไฟ (สำหรับผู้ดูแลหอพัก) {pageLabel && <span style={{ color: '#047857', fontWeight: 800 }}>({pageLabel})</span>}
        </div>
        {!isCompact && (
          <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
            ที่อยู่/ติดต่อ: {config.address || 'หอพัก'} • โทร: <strong style={{ color: '#0f172a' }}>{config.phone || '-'}</strong>
          </div>
        )}
      </div>

      {/* Right side date box */}
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
            border: '1.5px solid #93c5fd',
            color: '#1e3a8a',
            padding: '2px 8px',
            borderRadius: '5px',
            fontSize: '11px',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}
        >
          งวดประจำเดือน: {activeMonth} (กันยายน 2569)
        </div>
        <div style={{ fontSize: '10.5px', color: '#475569', whiteSpace: 'nowrap', lineHeight: 1.35 }}>
          ครบกำหนดชำระ: <strong style={{ color: '#be123c', fontWeight: 800 }}>{dueDate}</strong>
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', lineHeight: 1.35 }}>
          พิมพ์เมื่อ: {todayThai}
        </div>
      </div>
    </div>
  );

  // Render KPI Summary Bar
  const renderKpiBar = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        border: '1.5px solid #e2e8f0',
        borderRadius: '5px',
        padding: '3px 8px',
        marginBottom: '5px',
        fontSize: '10.5px',
        lineHeight: 1.35,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ whiteSpace: 'nowrap' }}>
          🏢 สรุป: <strong style={{ color: '#0f172a' }}>{selectedBuilding === 'ALL' ? `ทุกอาคาร (${buildingList.length} อาคาร)` : formatBuildingCleanName(selectedBuilding)}</strong>
        </span>
        <span style={{ color: '#cbd5e1' }}>•</span>
        <span style={{ whiteSpace: 'nowrap' }}>
          ห้องทั้งหมด: <strong>{totalRooms} ห้อง</strong> (มีคนเช่า {occupiedRooms} / ว่าง {vacantRooms})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ whiteSpace: 'nowrap' }}>
          ยอดเรียกเก็บรวม: <strong style={{ color: '#0f172a', fontWeight: 900 }}>฿{totalDueAmount.toLocaleString()}</strong>
        </span>
        <span style={{ color: '#cbd5e1' }}>•</span>
        <span style={{ color: '#15803d', fontWeight: 800, whiteSpace: 'nowrap' }}>
          ชำระแล้ว: ฿{paidAmount.toLocaleString()} ({paidRooms.length})
        </span>
        <span style={{ color: '#cbd5e1' }}>•</span>
        <span style={{ color: '#be123c', fontWeight: 900, whiteSpace: 'nowrap' }}>
          ค้างเก็บ: ฿{unpaidAmount.toLocaleString()} ({unpaidRooms.length})
        </span>
      </div>
    </div>
  );

  // Render Grand Total Bar
  const renderGrandTotalBar = () => (
    <div
      style={{
        marginTop: '5px',
        backgroundColor: '#f1f5f9',
        border: '1.5px solid #0f172a',
        borderRadius: '5px',
        padding: '4px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        fontWeight: 800,
        lineHeight: 1.35,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
        <span>รวมยอดเรียกเก็บ ({totalRooms} ห้อง):</span>
        <strong style={{ color: '#1d4ed8', fontSize: '12.5px', fontFamily: 'monospace' }}>
          ฿{totalDueAmount.toLocaleString()}
        </strong>
        <span>บาท</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
        <span style={{ color: '#15803d' }}>
          ชำระแล้ว: ฿{paidAmount.toLocaleString()} ({paidRooms.length} ห้อง)
        </span>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <span style={{ color: '#be123c' }}>
          คงค้าง: ฿{unpaidAmount.toLocaleString()} ({unpaidRooms.length} ห้อง)
        </span>
      </div>
    </div>
  );

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
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {layoutMode === 'split' ? '1 แผ่น A4 (2 คอลัมน์)' : isSingleMultiPage ? '2 หน้า A4 พอดี' : '1 หน้า A4'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                งวดประจำเดือน {activeMonth} (กันยายน 2569)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              ใบสรุปยอดเก็บเงินค่าเช่าและค่าน้ำ-ค่าไฟ (สำหรับผู้ดูแลหอพัก)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดเรียงตัวอักษรใหญ่ชัดเจน ไม่ซ้อนทับ ไม่เลยขอบกระดาษ A4 เวลา Export PDF หรือพิมพ์เอกสาร
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setLayoutMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                layoutMode === 'split'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="รวมครบ 78 ห้องลงใน 1 หน้า A4 ด้วยการแบ่ง 2 คอลัมน์ ซ้าย-ขวา ตัวอักษรคมชัด ไม่ซ้อน ไม่ล้นหน้า"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>1 หน้า A4 (2 คอลัมน์) ⭐ แนะนำ</span>
            </button>
            <button
              onClick={() => setLayoutMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                layoutMode === 'single'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="ตารางเดี่ยวเต็มหน้า แบ่งหน้ากระดาษ A4 อัตโนมัติ ไม่ตกหล่น"
            >
              <List className="w-3.5 h-3.5" />
              <span>ตารางเดี่ยว {isSingleMultiPage ? '(2 หน้า A4)' : '(1 หน้า)'}</span>
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
                const targetClean = formatBuildingCleanName(b);
                const count = rooms.filter(r => 
                  r.building === b || 
                  formatBuildingCleanName(r.building) === targetClean ||
                  (r.buildingId && buildingProfiles.find(bp => bp.id === r.buildingId && formatBuildingCleanName(bp.name) === targetClean))
                ).length;
                return (
                  <option key={b} value={b}>
                    {targetClean} ({count} ห้อง)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Print Mode Switcher (Current Status vs Blank Hand Check) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setPrintMode('current')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                printMode === 'current'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงเครื่องหมายถูกสำหรับห้องที่บันทึกชำระเงินแล้วในระบบ"
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
              title="เว้นช่องสี่เหลี่ยมว่างไว้ให้ผู้ดูแลหอพักถือไปติ๊กด้วยปากกาหน้างาน"
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
            title="ดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูงขนาด A4 พอดี ไม่ล้นหน้า"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}</span>
          </button>
        </div>
      </div>

      {/* PDF Success Toast Notification */}
      {pdfSuccessToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{pdfSuccessToast}</span>
        </div>
      )}

      {/* Document Sheet Display */}
      {layoutMode === 'split' ? (
        /* MODE 1: 1 A4 SHEET (2 Columns Side-by-Side) */
        <div className="flex flex-col items-center bg-slate-100/80 p-2 sm:p-6 rounded-2xl border border-slate-200 overflow-x-auto">
          <div
            ref={sheetRef}
            id="caretaker-collection-sheet-a4"
            className="caretaker-a4-sheet"
            style={{
              width: '794px',
              height: '1123px',
              maxHeight: '1123px',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              padding: '12px 16px',
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
            {/* TOP SECTION: Header & Table */}
            <div>
              {renderMainHeader()}
              {renderKpiBar()}

              {/* 2-Columns Side-by-Side Table Layout */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  width: '100%',
                  alignItems: 'flex-start',
                }}
              >
                {/* Left Column Table */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#334155',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '1.5px 6px',
                      borderRadius: '3px',
                      marginBottom: '2px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.3,
                    }}
                  >
                    คอลัมน์ที่ 1 (ลำดับ 1 - {midPoint})
                  </div>
                  {renderSubTable(leftColumnRooms, 0, false)}
                </div>

                {/* Right Column Table */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#334155',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '1.5px 6px',
                      borderRadius: '3px',
                      marginBottom: '2px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.3,
                    }}
                  >
                    คอลัมน์ที่ 2 (ลำดับ {midPoint + 1} - {displayRooms.length})
                  </div>
                  {renderSubTable(rightColumnRooms, midPoint, false)}
                </div>
              </div>

              {renderGrandTotalBar()}
            </div>

            {/* BOTTOM SECTION: Instructions & Signature Blocks */}
            {renderSignatureSection()}
          </div>
        </div>
      ) : isSingleMultiPage ? (
        /* MODE 2 (Multi-Page): 2 A4 Sheets (Single Wide Table Paginated) */
        <div className="flex flex-col items-center gap-6 bg-slate-100/80 p-2 sm:p-6 rounded-2xl border border-slate-200 overflow-x-auto">
          {/* Page 1 (Rooms 1 - 40) */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-slate-500 mb-2 print:hidden">
              📄 แผ่นที่ 1 (ลำดับที่ 1 ถึง 40 จากทั้งหมด {displayRooms.length} ห้อง)
            </div>
            <div
              ref={page1Ref}
              id="caretaker-collection-sheet-page1"
              className="caretaker-a4-sheet"
              style={{
                width: '794px',
                height: '1123px',
                maxHeight: '1123px',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                padding: '12px 16px',
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
              <div>
                {renderMainHeader(false, 'แผ่นที่ 1/2')}
                {renderKpiBar()}
                {renderSubTable(singlePage1Rooms, 0, true)}
              </div>

              {/* Bottom Next Page Indicator */}
              <div
                style={{
                  borderTop: '1.5px dashed #94a3b8',
                  paddingTop: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#475569',
                }}
              >
                <span>➡️ มีต่อแผ่นที่ 2 (ลำดับที่ 41 ถึง {displayRooms.length} และสรุปยอดส่งมอบเงิน)</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>หน้า 1 / 2</span>
              </div>
            </div>
          </div>

          {/* Page 2 (Rooms 41 - End + Grand Total + Signatures) */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-slate-500 mb-2 print:hidden">
              📄 แผ่นที่ 2 (ลำดับที่ 41 ถึง {displayRooms.length} + สรุปยอดและลายเซ็นส่งมอบเงิน)
            </div>
            <div
              ref={page2Ref}
              id="caretaker-collection-sheet-page2"
              className="caretaker-a4-sheet"
              style={{
                width: '794px',
                height: '1123px',
                maxHeight: '1123px',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                padding: '12px 16px',
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
              <div>
                {renderMainHeader(true, 'แผ่นที่ 2/2')}
                {renderSubTable(singlePage2Rooms, 40, true)}
                {renderGrandTotalBar()}
              </div>

              <div>
                {renderSignatureSection()}
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#64748b',
                    marginTop: '4px',
                  }}
                >
                  หน้า 2 / 2 (จบเอกสาร)
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE 2 (Single-Page): Single Table when filtered <= 36 rooms */
        <div className="flex flex-col items-center bg-slate-100/80 p-2 sm:p-6 rounded-2xl border border-slate-200 overflow-x-auto">
          <div
            ref={sheetRef}
            id="caretaker-collection-sheet-a4"
            className="caretaker-a4-sheet"
            style={{
              width: '794px',
              height: '1123px',
              maxHeight: '1123px',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              padding: '12px 16px',
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
            <div>
              {renderMainHeader()}
              {renderKpiBar()}
              {renderSubTable(displayRooms, 0, true)}
              {renderGrandTotalBar()}
            </div>

            {renderSignatureSection()}
          </div>
        </div>
      )}
    </div>
  );
};
