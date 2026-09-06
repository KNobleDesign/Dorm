import React from 'react';
import { Edit3, Scissors } from 'lucide-react';
import { RoomRecord, LandlordConfig, BuildingProfile } from '../types';
import { getPaymentAccountForRoom } from '../utils/paymentAccount';

export interface FourRoomsInvoiceSheetProps {
  chunk: RoomRecord[]; // Up to 4 rooms
  config: LandlordConfig;
  buildings?: BuildingProfile[];
  activeMonth: string;
  dueDate: string;
  issueDate: string;
  isForExport?: boolean; // When true, rendered cleanly without action buttons for PDF/print
  highlightedRoomKey?: string;
  onOpenEditModal?: (room: RoomRecord) => void;
  onTogglePaymentStatus?: (key: string) => void;
  customStyle?: React.CSSProperties;
  className?: string;
}

export const FourRoomsInvoiceSheet: React.FC<FourRoomsInvoiceSheetProps> = ({
  chunk,
  config,
  buildings,
  activeMonth,
  dueDate,
  issueDate,
  isForExport = false,
  highlightedRoomKey,
  onOpenEditModal,
  onTogglePaymentStatus,
  customStyle,
  className = '',
}) => {
  const latePolicyText =
    config.latePolicyNotice ||
    `กำหนดชำระเงินทุกวันที่ ${config.paymentDueDay || 5} ของเดือน หากชำระล่าช้าคิดค่าปรับวันละ ${config.lateFeePerDayDefault || 100} บาท (Payment Due: ${config.paymentDueDay || 5}th of month. Late fee: ${config.lateFeePerDayDefault || 100} THB/day)`;

  const fontStack = "'Google Sans', 'Sarabun', 'Noto Sans Thai', 'Prompt', system-ui, -apple-system, sans-serif";

  const renderSlip = (slotIdx: number) => {
    const room = chunk[slotIdx];

    // Empty Slot Placeholder
    if (!room) {
      return (
        <div
          key={`empty-slot-${slotIdx}`}
          className="rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-300 text-xs italic space-y-1"
          style={{
            flex: 1,
            width: 'calc(50% - 7px)',
            height: '100%',
            boxSizing: 'border-box',
            backgroundColor: '#f8fafc',
            fontFamily: fontStack,
          }}
        >
          <span>(พื้นที่ว่าง)</span>
        </div>
      );
    }

    const isHighlighted = highlightedRoomKey === room.key;
    const isPerPerson = room.waterCalcType === 'per_person';
    const previousBalance = room.previousBalance || 0;
    const lateDays = room.lateDays || 0;
    const lateFeePerDay = room.lateFeePerDay ?? config.lateFeePerDayDefault ?? 100;
    const lateFeeTotal = room.lateFeeTotal ?? (lateDays * lateFeePerDay);
    const liabilityTotal = room.liabilityTotal ?? (previousBalance + lateFeeTotal);
    const effectiveGrandTotal = room.grandTotal ?? (room.total + liabilityTotal);

    // Rate calculation
    const isFactory = room.building.includes('โรงงาน');
    const waterRate = isFactory ? 20 : (room.waterRate || config.waterRateDefault || 18);
    const elecRate = isFactory ? 8.5 : (room.elecRate || config.elecRateDefault || 8);

    // Payment account resolution per room/building configuration
    const paymentAccount = getPaymentAccountForRoom(room, config, buildings);
    const displayBankName = (paymentAccount.bankName || 'ธนาคาร').replace(/\s*\([^)]*\)/g, '').trim();
    const displayBankAccount = (paymentAccount.bankAccount || '-').replace(/\s*\([^)]*\)/g, '').trim();

    return (
      <div
        key={room.key}
        className={`rounded-xl border relative overflow-hidden ${
          isHighlighted ? 'border-blue-500 ring-2 ring-blue-400/30' : 'border-slate-300'
        }`}
        style={{
          flex: 1,
          width: 'calc(50% - 7px)',
          height: '100%',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '12px 14px',
          fontFamily: fontStack,
          color: '#1e293b',
          lineHeight: 1.4,
          border: isHighlighted ? '2px solid #2563eb' : '1px solid #cbd5e1',
        }}
      >
        {/* Slip Upper Content */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* HEADER ROW 1: Property Name (Left) + Room & Building Badges (Right) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              marginBottom: '3px',
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: '#020617',
                fontSize: '15.5px',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '220px',
              }}
              title={config.propertyName || 'หอพัก P&J อพาร์ทเม้นท์'}
            >
              {config.propertyName || 'หอพัก P&J อพาร์ทเม้นท์'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 9px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '12.5px',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                ห้อง {room.roomNo}
              </span>
              {room.building && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '11px',
                    border: '1px solid #cbd5e1',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {room.building}
                </span>
              )}
            </div>
          </div>

          {/* HEADER ROW 2: Phone Number (Left) + Period Month (Right) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              borderBottom: '2px solid #e2e8f0',
              paddingBottom: '5px',
              marginBottom: '6px',
              fontSize: '11px',
              color: '#475569',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#64748b' }}>โทร:</span>
              <strong
                style={{
                  fontWeight: 700,
                  color: '#0f172a',
                  fontFamily: 'monospace',
                  fontSize: '11.5px',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                {config.phone || '-'}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#64748b' }}>งวด:</span>
              <strong
                style={{
                  color: '#1e40af',
                  fontWeight: 800,
                  backgroundColor: '#eff6ff',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid #bfdbfe',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeMonth}
              </strong>
            </div>
          </div>

          {/* Tenant & Status Box (Clean layout, non-overlapping, large legible text within boundaries) */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              padding: '6px 9px',
              borderRadius: '7px',
              border: '1.5px solid #e2e8f0',
              marginBottom: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {/* Top Row: Tenant Name + Due Date Badge & Edit button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
                {room.occupancyStatus === 'vacant' ? (
                  <span
                    style={{
                      padding: '2px 8px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      borderRadius: '4px',
                      backgroundColor: '#fef3c7',
                      color: '#78350f',
                      border: '1px solid #fde68a',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ⚪ ห้องว่าง (Vacant)
                  </span>
                ) : room.occupancyStatus === 'under_renovation' ? (
                  <span
                    style={{
                      padding: '2px 8px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      borderRadius: '4px',
                      backgroundColor: '#f3e8ff',
                      color: '#581c87',
                      border: '1px solid #e9d5ff',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🟡 ปิดปรับปรุง ({room.renovationReason || 'ซ่อมแซม'})
                  </span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', minWidth: 0 }}>
                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '11px', flexShrink: 0 }}>ผู้เช่า:</span>
                    <strong
                      style={{
                        color: '#020617',
                        fontWeight: 900,
                        fontSize: '13px',
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'inline-block',
                      }}
                      title={room.tenantName}
                    >
                      {room.tenantName || 'ผู้เช่า'}
                    </strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                {!isForExport && onOpenEditModal && (
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(room)}
                    className="px-2 py-0.5 text-[10.5px] font-semibold text-blue-700 hover:text-blue-900 bg-white rounded border border-blue-200 flex items-center gap-1 transition cursor-pointer print:hidden shadow-2xs flex-shrink-0"
                    title="แก้ไขสถานะผู้เช่า/มิเตอร์"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>แก้ไข</span>
                  </button>
                )}

                <div style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500, fontSize: '10px' }}>ครบกำหนด:</span>
                  <strong
                    style={{
                      color: '#e11d48',
                      fontWeight: 900,
                      fontSize: '11px',
                      backgroundColor: '#fff1f2',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      border: '1px solid #fecdd3',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dueDate}
                  </strong>
                </div>
              </div>
            </div>

            {/* Bottom Sub-Row: Occupants & Phone number (Clean and separated, prevents overlap) */}
            {room.occupancyStatus === 'occupied' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '10.5px',
                  color: '#475569',
                  borderTop: '1px dashed #e2e8f0',
                  paddingTop: '3px',
                  marginTop: '1px',
                }}
              >
                <span
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '0 5px',
                    borderRadius: '3px',
                    fontWeight: 700,
                    fontSize: '10px',
                    color: '#334155',
                  }}
                >
                  👥 {room.occupants || 1} คน
                </span>
                {room.phone && (
                  <span style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    📞 {room.phone}
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#94a3b8' }}>
                  งวด {activeMonth}
                </span>
              </div>
            )}
          </div>

          {/* Liability Notice (if arrears or late fees exist) */}
          {liabilityTotal > 0 && (
            <div
              style={{
                marginBottom: '6px',
                padding: '4px 8px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fcd34d',
                borderRadius: '6px',
                fontSize: '10.5px',
                color: '#78350f',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <span>⚠️ ค้างชำระ/ค่าปรับ:</span>
                <strong style={{ color: '#be123c', fontWeight: 900 }}>+฿{liabilityTotal.toLocaleString()}</strong>
              </span>
              <span style={{ fontSize: '10px', color: '#78350f', fontWeight: 500, textAlign: 'right' }}>
                {previousBalance > 0 && `(ค้าง ฿${previousBalance.toLocaleString()})`}
                {lateDays > 0 && ` [เกิน ${lateDays} วัน ฿${lateFeeTotal.toLocaleString()}]`}
              </span>
            </div>
          )}

          {/* Itemized Calculation Table with fixed column widths */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '6px',
              fontSize: '11px',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: '36%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '24%' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 700, fontSize: '11px' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>รายการ</th>
                <th style={{ padding: '6px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>เลขมิเตอร์</th>
                <th style={{ padding: '6px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>หน่วย</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '5px 8px', fontWeight: 700, color: '#020617', fontSize: '11px' }}>ค่าเช่าห้อง</td>
                <td style={{ padding: '5px 4px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace', fontSize: '10.5px' }}>-</td>
                <td style={{ padding: '5px 4px', textAlign: 'right', color: '#475569', fontWeight: 500, fontSize: '11px', whiteSpace: 'nowrap' }}>1 ห้อง</td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#020617', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {room.rent.toLocaleString()}
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '5px 8px', fontSize: '11px' }}>
                  <span style={{ fontWeight: 700, color: '#172554' }}>
                    {isPerPerson ? `ค่าน้ำ (เหมา ${room.occupants || 1} คน)` : 'ค่าน้ำประปา'}
                  </span>
                </td>
                <td style={{ padding: '5px 4px', textAlign: 'center', fontFamily: 'monospace', fontSize: '10.5px', color: '#334155', whiteSpace: 'nowrap' }}>
                  {isPerPerson ? <span style={{ color: '#94a3b8' }}>เหมาจ่าย</span> : `${room.waterPrev} → ${room.waterCurr}`}
                </td>
                <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700, color: '#1e40af', fontSize: '11px', whiteSpace: 'nowrap' }}>
                  {isPerPerson ? `${room.occupants || 1} คน` : `${room.waterUnits} หน่วย`}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#172554', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {room.waterCost.toLocaleString()}
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '5px 8px', fontSize: '11px' }}>
                  <span style={{ fontWeight: 700, color: '#78350f' }}>ค่าไฟฟ้า</span>
                </td>
                <td style={{ padding: '5px 4px', textAlign: 'center', fontFamily: 'monospace', fontSize: '10.5px', color: '#334155', whiteSpace: 'nowrap' }}>
                  {room.elecPrev} → {room.elecCurr}
                </td>
                <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700, color: '#92400e', fontSize: '11px', whiteSpace: 'nowrap' }}>
                  {room.elecUnits} หน่วย
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#78350f', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {room.elecCost.toLocaleString()}
                </td>
              </tr>

              {room.otherFees > 0 && (
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', color: '#1e293b', fontWeight: 600, fontSize: '11px' }}>ค่าส่วนกลาง / อื่นๆ</td>
                  <td style={{ padding: '5px 4px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace', fontSize: '10.5px' }}>-</td>
                  <td style={{ padding: '5px 4px', textAlign: 'right', color: '#475569', fontWeight: 500, fontSize: '11px', whiteSpace: 'nowrap' }}>1</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#020617', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {room.otherFees.toLocaleString()}
                  </td>
                </tr>
              )}

              {previousBalance > 0 && (
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fffbeb', color: '#78350f' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 800, fontSize: '11px', color: '#78350f' }}>ยอดค้างชำระเดิมยกมา</td>
                  <td style={{ padding: '5px 4px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace', fontSize: '10.5px' }}>-</td>
                  <td style={{ padding: '5px 4px', textAlign: 'right', color: '#92400e', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>1 งวด</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 900, color: '#78350f', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {previousBalance.toLocaleString()}
                  </td>
                </tr>
              )}

              {lateFeeTotal > 0 && (
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff1f2', color: '#881337' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 800, fontSize: '11px', color: '#881337' }}>ค่าปรับล่าช้า ({lateDays} วัน)</td>
                  <td style={{ padding: '5px 4px', textAlign: 'center', fontFamily: 'monospace', fontSize: '9.5px', color: '#9f1239', whiteSpace: 'nowrap' }}>@{lateFeePerDay}บ./วัน</td>
                  <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700, color: '#9f1239', fontSize: '11px', whiteSpace: 'nowrap' }}>{lateDays} วัน</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 900, color: '#881337', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {lateFeeTotal.toLocaleString()}
                  </td>
                </tr>
              )}

              {/* Total Row */}
              <tr style={{ backgroundColor: '#eff6ff', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #0f172a' }}>
                <td colSpan={3} style={{ padding: '7px 8px', textAlign: 'right', fontSize: '12.5px', fontWeight: 900, color: '#020617', whiteSpace: 'nowrap' }}>
                  รวมยอดสุทธิที่ต้องชำระ:
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: '14.5px', fontWeight: 900, color: '#1d4ed8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  ฿{effectiveGrandTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Late Notice Text */}
          <div
            style={{
              fontSize: '10px',
              color: '#78350f',
              backgroundColor: '#fffbeb',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #fde68a',
              fontWeight: 500,
              marginBottom: '6px',
              lineHeight: 1.35,
            }}
          >
            ⚠️ {latePolicyText}
          </div>
        </div>

        {/* Slip Bottom: Payment Details & Signature Stub */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Bank & PromptPay Card (Customized per room / building account) */}
          <div
            style={{
              padding: '6px 9px',
              borderRadius: '6px',
              border: paymentAccount.isHouseAccount ? '1px solid #e9d5ff' : '1px solid #e2e8f0',
              backgroundColor: paymentAccount.isHouseAccount ? '#faf5ff' : '#f8fafc',
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            {/* Line 1: PromptPay & Account Label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#475569', fontWeight: 600, fontSize: '10.5px' }}>พร้อมเพย์:</span>
                <strong style={{ fontFamily: 'monospace', color: '#020617', fontWeight: 800, fontSize: '12px', letterSpacing: '0.04em' }}>
                  {paymentAccount.promptPayId || '-'}
                </strong>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                }}
              >
                {paymentAccount.accountLabel}
              </span>
            </div>

            {/* Line 2: Bank Name & Account Number with Account Name */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '4px',
                paddingTop: '3px',
                borderTop: '1px solid #f1f5f9',
                fontSize: '11px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>{displayBankName}:</span>
                <strong style={{ fontFamily: 'monospace', color: '#020617', fontWeight: 800, fontSize: '11.5px', letterSpacing: '0.03em' }}>
                  {displayBankAccount}
                </strong>
              </div>
              <div style={{ whiteSpace: 'nowrap', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#64748b', fontWeight: 500, fontSize: '10.5px' }}>ชื่อบัญชี:</span>
                <strong style={{ color: '#0f172a', fontWeight: 700, fontSize: '11px' }}>
                  {paymentAccount.accountName || '-'}
                </strong>
              </div>
            </div>
          </div>

          {/* Signature & Status Stub */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px', fontSize: '11px', color: '#475569' }}>
            {!isForExport && onTogglePaymentStatus ? (
              <button
                type="button"
                onClick={() => onTogglePaymentStatus(room.key)}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer print:border print:border-slate-300 shadow-2xs text-[11px] whitespace-nowrap ${
                  room.isPaid
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                }`}
                title="คลิกเพื่อสลับสถานะชำระเงิน"
              >
                {room.isPaid ? '✓ ชำระแล้ว' : '○ รอชำระเงิน'}
              </button>
            ) : (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  border: room.isPaid ? '1px solid #86efac' : '1px solid #fde68a',
                  fontSize: '10.5px',
                  whiteSpace: 'nowrap',
                  backgroundColor: room.isPaid ? '#f0fdf4' : '#fffbeb',
                  color: room.isPaid ? '#166534' : '#78350f',
                }}
              >
                {room.isPaid ? '✓ ชำระแล้ว' : '○ รอชำระเงิน'}
              </span>
            )}

            <span style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap' }}>
              ออกบิล: {issueDate}
            </span>

            <span style={{ fontSize: '11px', color: '#334155', fontWeight: 500, whiteSpace: 'nowrap' }}>
              ผู้รับเงิน: .................................
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`a4-print-sheet pdf-a4-page bg-white p-2.5 mx-auto text-slate-800 relative select-none ${className}`}
      style={{
        width: '794px',
        minHeight: '1123px',
        height: '1123px',
        maxHeight: '1123px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        fontFamily: fontStack,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '10px',
        position: 'relative',
        ...customStyle,
      }}
    >
      {/* Horizontal Scissor Cutting Guideline (Subtle dashed line, scissor at left/right edges only - no overlapping text) */}
      <div
        style={{
          position: 'absolute',
          left: '0px',
          right: '0px',
          top: '50%',
          transform: 'translateY(-50%)',
          borderBottom: '1px dashed #cbd5e1',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
      {/* Left Edge Scissor */}
      <div
        style={{
          position: 'absolute',
          left: '1px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          zIndex: 6,
          backgroundColor: '#ffffff',
          padding: '0 2px',
        }}
      >
        <Scissors className="w-3.5 h-3.5 text-slate-400" />
      </div>
      {/* Right Edge Scissor */}
      <div
        style={{
          position: 'absolute',
          right: '1px',
          top: '50%',
          transform: 'translateY(-50%) rotate(180deg)',
          pointerEvents: 'none',
          zIndex: 6,
          backgroundColor: '#ffffff',
          padding: '0 2px',
        }}
      >
        <Scissors className="w-3.5 h-3.5 text-slate-400" />
      </div>

      {/* Vertical Scissor Cutting Guideline (Subtle dashed line, scissor at top/bottom edges only - no overlapping text) */}
      <div
        style={{
          position: 'absolute',
          top: '0px',
          bottom: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderRight: '1px dashed #cbd5e1',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
      {/* Top Edge Scissor */}
      <div
        style={{
          position: 'absolute',
          top: '1px',
          left: '50%',
          transform: 'translateX(-50%) rotate(90deg)',
          pointerEvents: 'none',
          zIndex: 6,
          backgroundColor: '#ffffff',
          padding: '2px 0',
        }}
      >
        <Scissors className="w-3.5 h-3.5 text-slate-400" />
      </div>
      {/* Bottom Edge Scissor */}
      <div
        style={{
          position: 'absolute',
          bottom: '1px',
          left: '50%',
          transform: 'translateX(-50%) rotate(-90deg)',
          pointerEvents: 'none',
          zIndex: 6,
          backgroundColor: '#ffffff',
          padding: '2px 0',
        }}
      >
        <Scissors className="w-3.5 h-3.5 text-slate-400" />
      </div>

      {/* Row 1: Quadrants 0 and 1 */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          height: 'calc(50% - 5px)',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {renderSlip(0)}
        {renderSlip(1)}
      </div>

      {/* Row 2: Quadrants 2 and 3 */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          height: 'calc(50% - 5px)',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {renderSlip(2)}
        {renderSlip(3)}
      </div>
    </div>
  );
};
