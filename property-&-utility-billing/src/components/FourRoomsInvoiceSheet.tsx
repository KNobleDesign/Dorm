import React from 'react';
import { Edit3 } from 'lucide-react';
import { RoomRecord, LandlordConfig } from '../types';

export interface FourRoomsInvoiceSheetProps {
  chunk: RoomRecord[]; // Up to 4 rooms
  config: LandlordConfig;
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
  const latePolicyText = config.latePolicyNotice || `กำหนดชำระเงินทุกวันที่ ${config.paymentDueDay || 5} ของเดือน หากชำระล่าช้าคิดค่าปรับวันละ ${config.lateFeePerDayDefault || 100} บาท`;

  return (
    <div
      className={`a4-print-sheet pdf-a4-page bg-white p-2.5 mx-auto text-slate-800 font-thai relative select-none ${className}`}
      style={{
        width: '794px',
        minHeight: '1123px',
        height: '1123px',
        maxHeight: '1123px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...customStyle,
      }}
    >
      {/* 2x2 Grid with Scissor Cutting Guidelines */}
      <div className="grid grid-cols-2 grid-rows-2 gap-2.5 h-full relative" style={{ height: '100%' }}>
        {/* Horizontal Cut Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-b border-dashed border-slate-300 pointer-events-none z-10" />

        {/* Vertical Cut Line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r border-dashed border-slate-300 pointer-events-none z-10" />

        {/* 4 Quadrant Slips */}
        {[0, 1, 2, 3].map((slotIdx) => {
          const room = chunk[slotIdx];

          // Empty Slot Placeholder
          if (!room) {
            return (
              <div
                key={`empty-slot-${slotIdx}`}
                className="p-4 bg-slate-50/40 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 text-xs italic space-y-1"
                style={{ height: '100%', boxSizing: 'border-box' }}
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
          const perPersonRate = room.waterPerPersonRate || config.waterPerPersonRateDefault || 100;

          // Clean bank details (strip any text in parentheses like (KBANK) or (บัญชีออมทรัพย์...))
          const displayBankName = (config.bankName || 'ธนาคาร').replace(/\s*\([^)]*\)/g, '').trim();
          const displayBankAccount = (config.bankAccount || '-').replace(/\s*\([^)]*\)/g, '').trim();

          return (
            <div
              key={room.key}
              className={`p-3.5 bg-white rounded-xl border flex flex-col justify-between text-xs relative overflow-hidden ${
                isHighlighted ? 'border-blue-500 ring-2 ring-blue-400/30' : 'border-slate-300'
              }`}
              style={{
                height: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
              }}
            >
              {/* Slip Upper Content */}
              <div>
                {/* Header: Property Name & Room Badge */}
                <div className="flex justify-between items-start border-b-2 border-slate-200 pb-2 mb-2">
                  <div className="max-w-[215px]">
                    <div className="font-extrabold text-slate-950 text-[15px] tracking-tight leading-snug truncate">
                      {config.propertyName || 'หอพัก P&J อพาร์ทเม้นท์'}
                    </div>
                    <div className="text-[11.5px] text-slate-600 leading-normal mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>โทร: <strong className="font-bold text-slate-800">{config.phone || '-'}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>งวด: <strong className="text-blue-900 font-extrabold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">{activeMonth}</strong></span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 text-white font-black text-[13px] tracking-wide shadow-2xs whitespace-nowrap">
                      ห้อง {room.roomNo}
                    </div>
                    <div className="text-[11.5px] text-slate-600 font-semibold mt-0.5 whitespace-nowrap">
                      {room.building}
                    </div>
                  </div>
                </div>

                {/* Tenant & Status Bar (2 structured lines so full tenant name is visible) */}
                <div className="bg-slate-50/90 px-2.5 py-1.5 rounded-lg border border-slate-200/90 text-xs mb-2 space-y-1">
                  {/* Line 1: Tenant Full Name & Status/Occupants */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      {room.occupancyStatus === 'vacant' ? (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap">
                          ⚪ ห้องว่าง (Vacant)
                        </span>
                      ) : room.occupancyStatus === 'under_renovation' ? (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-purple-100 text-purple-900 border border-purple-300 whitespace-nowrap">
                          🟡 ปิดปรับปรุง ({room.renovationReason || 'ซ่อมแซม'})
                        </span>
                      ) : (
                        <>
                          <span className="text-slate-500 font-semibold text-[11px] whitespace-nowrap">ผู้เช่า:</span>
                          <strong className="text-slate-950 font-extrabold text-[12.5px] leading-tight">
                            {room.tenantName || 'ผู้เช่า'}
                          </strong>
                          <span className="text-slate-600 font-medium text-[11px] whitespace-nowrap">
                            ({room.occupants || 1} คน)
                          </span>
                        </>
                      )}
                    </div>

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
                  </div>

                  {/* Line 2: Phone number & Payment Due Date */}
                  <div className="flex justify-between items-center text-[11.5px] text-slate-600 border-t border-slate-200/70 pt-1">
                    <div className="flex items-center gap-1 min-w-0">
                      {room.occupancyStatus === 'vacant' ? (
                        <span className="text-[10.5px] text-slate-400 italic">พร้อมเปิดให้เช่า</span>
                      ) : room.occupancyStatus === 'under_renovation' ? (
                        <span className="text-[10.5px] text-purple-700 font-medium italic">งดคิดค่าเช่าในงวดนี้</span>
                      ) : room.phone ? (
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400 text-[10.5px]">เบอร์โทร:</span>
                          <strong className="text-slate-800 font-mono font-bold text-[11.5px]">{room.phone}</strong>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10.5px]">-</span>
                      )}
                    </div>

                    <div className="text-[11.5px] text-slate-600 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                      <span className="text-slate-500 font-medium text-[10.5px]">ครบกำหนด:</span>
                      <strong className="text-rose-600 font-black text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {dueDate}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Liability Notice (if arrears or late fees exist) */}
                {liabilityTotal > 0 && (
                  <div className="mb-2 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-950 font-bold flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <span>⚠️ ค้างชำระ/ค่าปรับ:</span>
                      <strong className="text-rose-700 font-black">+฿{liabilityTotal.toLocaleString()}</strong>
                    </span>
                    <span className="text-[10.5px] text-amber-900 font-medium truncate text-right">
                      {previousBalance > 0 && `(ค้าง ฿${previousBalance.toLocaleString()})`}
                      {lateDays > 0 && ` [เกิน ${lateDays} วัน ฿${lateFeeTotal.toLocaleString()}]`}
                    </span>
                  </div>
                )}

                {/* Itemized Calculation Table with fixed layout to avoid overlap */}
                <table className="w-full text-left border border-slate-300 rounded-lg overflow-hidden border-collapse mb-2 text-xs table-fixed">
                  <colgroup>
                    <col style={{ width: '35%' }} />
                    <col style={{ width: '23%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '26%' }} />
                  </colgroup>
                  <thead className="bg-[#0f172a] text-white font-bold text-[11.5px]">
                    <tr>
                      <th className="py-1.5 px-2.5">รายการ</th>
                      <th className="py-1.5 px-1 text-center whitespace-nowrap">เลขมิเตอร์</th>
                      <th className="py-1.5 px-1 text-right whitespace-nowrap">หน่วย</th>
                      <th className="py-1.5 pr-3 pl-1 text-right whitespace-nowrap">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-1 px-2.5 font-bold text-slate-950 text-xs">ค่าเช่าห้อง</td>
                      <td className="py-1 px-1 text-center text-slate-400 font-mono text-[11px]">-</td>
                      <td className="py-1 px-1 text-right text-slate-600 font-medium text-xs whitespace-nowrap">1 ห้อง</td>
                      <td className="py-1 pr-3 pl-1 text-right font-bold text-slate-950 text-xs font-mono whitespace-nowrap">{room.rent.toLocaleString()}</td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="py-1 px-2.5 text-xs">
                        <span className="font-bold text-blue-950">
                          {isPerPerson ? `ค่าน้ำ (เหมา ${room.occupants || 1} คน)` : 'ค่าน้ำประปา'}
                        </span>
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {isPerPerson ? <span className="text-slate-400">เหมาจ่าย</span> : `${room.waterPrev} → ${room.waterCurr}`}
                      </td>
                      <td className="py-1 px-1 text-right font-bold text-blue-800 text-xs whitespace-nowrap">
                        {isPerPerson ? `${room.occupants || 1} คน` : `${room.waterUnits} หน่วย`}
                      </td>
                      <td className="py-1 pr-3 pl-1 text-right font-bold text-blue-950 text-xs font-mono whitespace-nowrap">{room.waterCost.toLocaleString()}</td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="py-1 px-2.5 text-xs">
                        <span className="font-bold text-amber-950">ค่าไฟฟ้า</span>
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {room.elecPrev} → {room.elecCurr}
                      </td>
                      <td className="py-1 px-1 text-right font-bold text-amber-900 text-xs whitespace-nowrap">
                        {room.elecUnits} หน่วย
                      </td>
                      <td className="py-1 pr-3 pl-1 text-right font-bold text-amber-950 text-xs font-mono whitespace-nowrap">{room.elecCost.toLocaleString()}</td>
                    </tr>

                    {room.otherFees > 0 && (
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-1 px-2.5 text-slate-800 font-semibold text-xs">ค่าส่วนกลาง / อื่นๆ</td>
                        <td className="py-1 px-1 text-center text-slate-400 font-mono text-[11px]">-</td>
                        <td className="py-1 px-1 text-right text-slate-600 font-medium text-xs whitespace-nowrap">1</td>
                        <td className="py-1 pr-3 pl-1 text-right font-bold text-slate-950 text-xs font-mono whitespace-nowrap">{room.otherFees.toLocaleString()}</td>
                      </tr>
                    )}

                    {previousBalance > 0 && (
                      <tr className="bg-amber-50/80 text-amber-950">
                        <td className="py-1 px-2.5 font-extrabold text-xs text-amber-950">ยอดค้างชำระเดิมยกมา</td>
                        <td className="py-1 px-1 text-center text-slate-400 font-mono text-[11px]">-</td>
                        <td className="py-1 px-1 text-right text-amber-900 font-bold text-xs whitespace-nowrap">1 งวด</td>
                        <td className="py-1 pr-3 pl-1 text-right font-black text-amber-950 text-xs font-mono whitespace-nowrap">{previousBalance.toLocaleString()}</td>
                      </tr>
                    )}

                    {lateFeeTotal > 0 && (
                      <tr className="bg-rose-50/80 text-rose-950">
                        <td className="py-1 px-2.5 font-extrabold text-xs text-rose-950">ค่าปรับล่าช้า ({lateDays} วัน)</td>
                        <td className="py-1 px-1 text-center font-mono text-[10px] text-rose-800 whitespace-nowrap">@{lateFeePerDay}บ./วัน</td>
                        <td className="py-1 px-1 text-right font-bold text-rose-900 text-xs whitespace-nowrap">{lateDays} วัน</td>
                        <td className="py-1 pr-3 pl-1 text-right font-black text-rose-950 text-xs font-mono whitespace-nowrap">{lateFeeTotal.toLocaleString()}</td>
                      </tr>
                    )}

                    {/* Total Row */}
                    <tr className="bg-blue-50/90 font-bold text-slate-900 border-t-2 border-slate-900">
                      <td colSpan={3} className="py-2 px-2.5 text-right text-xs font-black text-slate-950 whitespace-nowrap">
                        รวมยอดสุทธิที่ต้องชำระ:
                      </td>
                      <td className="py-2 pr-3 pl-1 text-right text-[15px] font-black text-blue-700 font-mono whitespace-nowrap">
                        ฿{effectiveGrandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Late Notice Text */}
                <div className="text-[10.5px] text-amber-950 bg-amber-50/90 px-2 py-1 rounded-md border border-amber-200/90 font-medium mb-2 leading-relaxed">
                  ⚠️ {latePolicyText}
                </div>
              </div>

              {/* Slip Bottom: Payment Details & Signature Stub */}
              <div className="border-t border-slate-200 pt-1.5 space-y-1.5">
                {/* Bank & PromptPay Card (Bank account moved down with account name to avoid truncation) */}
                <div className="bg-slate-100/90 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-1">
                  {/* Line 1: PromptPay */}
                  <div className="flex justify-between items-center">
                    <div className="whitespace-nowrap flex items-center gap-1.5">
                      <span className="text-slate-600 font-semibold text-[11px]">พร้อมเพย์:</span>
                      <strong className="font-mono text-slate-950 font-extrabold text-[12.5px] tracking-wider">
                        {config.promptPayId || '-'}
                      </strong>
                    </div>
                    <span className="text-[10.5px] text-slate-500 font-medium">โอนชำระเงิน</span>
                  </div>

                  {/* Line 2: Bank Name & Account Number with Account Name */}
                  <div className="flex justify-between items-center gap-1.5 pt-1 border-t border-slate-200/80 text-[11.5px] flex-wrap">
                    <div className="whitespace-nowrap flex items-center gap-1">
                      <span className="text-slate-600 font-medium">{displayBankName}:</span>
                      <strong className="font-mono text-slate-950 font-extrabold text-xs tracking-wider">
                        {displayBankAccount}
                      </strong>
                    </div>
                    <div className="whitespace-nowrap text-right flex items-center gap-1">
                      <span className="text-slate-500 font-medium">ชื่อบัญชี:</span>
                      <strong className="text-slate-900 font-bold">
                        {config.landlordName || '-'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Signature & Status Stub */}
                <div className="flex justify-between items-center pt-0.5 text-xs text-slate-600">
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
                      className={`px-2 py-0.5 rounded font-bold border text-[11px] whitespace-nowrap ${
                        room.isPaid
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                      }`}
                    >
                      {room.isPaid ? '✓ ชำระเงินแล้ว' : '○ รอชำระเงิน'}
                    </span>
                  )}

                  <span className="text-[10.5px] text-slate-500 whitespace-nowrap">
                    ออกบิล: {issueDate}
                  </span>

                  <span className="text-xs text-slate-700 font-medium whitespace-nowrap">
                    ผู้รับเงิน: .................................
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
