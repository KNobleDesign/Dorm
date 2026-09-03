import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Building2, 
  Calendar, 
  DollarSign, 
  Droplet, 
  Zap, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck,
  Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { RoomRecord, LandlordConfig, ExpenseRecord, AppUser } from '../types';

interface DashboardPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomRecord[];
  activeMonth: string;
  buildings: string[];
  config: LandlordConfig;
  expenses: ExpenseRecord[];
  currentUser?: AppUser;
}

export const DashboardPdfExportModal: React.FC<DashboardPdfExportModalProps> = ({
  isOpen,
  onClose,
  rooms,
  activeMonth,
  buildings,
  config,
  expenses,
  currentUser,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Effective room total calculation with liabilities
  const getRoomEffectiveTotal = (r: RoomRecord) => {
    if (r.grandTotal !== undefined && r.grandTotal !== null) return r.grandTotal;
    const liability = (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || config.lateFeePerDayDefault || 100)));
    return (r.total || 0) + liability;
  };

  // KPI Calculations
  const totalRevenue = rooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const collectedRevenue = rooms.filter(r => r.isPaid).reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const pendingRevenue = totalRevenue - collectedRevenue;
  const totalLiability = rooms.reduce((sum, r) => sum + (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || config.lateFeePerDayDefault || 100))), 0);
  
  const totalRent = rooms.reduce((sum, r) => sum + (r.rent || 0), 0);
  const totalWaterUnits = rooms.reduce((sum, r) => sum + (r.waterUnits || 0), 0);
  const totalWaterCost = rooms.reduce((sum, r) => sum + (r.waterCost || 0), 0);
  const totalElecUnits = rooms.reduce((sum, r) => sum + (r.elecUnits || 0), 0);
  const totalElecCost = rooms.reduce((sum, r) => sum + (r.elecCost || 0), 0);

  const occupiedRooms = rooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
  const vacantRooms = rooms.filter(r => r.occupancyStatus === 'vacant').length;
  const renoRooms = rooms.filter(r => r.occupancyStatus === 'under_renovation').length;
  const totalOccupants = rooms.reduce((sum, r) => sum + (r.occupants || 0), 0);
  const occupancyPercent = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

  const currentMonthExpenses = expenses.filter(e => e.month === activeMonth || !e.month);
  const totalExpenseAmount = currentMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netOperatingIncome = totalRevenue - totalExpenseAmount;

  const unpaidRooms = rooms.filter(r => !r.isPaid && (r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)));

  // Building Summary Breakdown
  const buildingSummaries = buildings.map((bName) => {
    const bRooms = rooms.filter(r => r.building === bName);
    const bOccupied = bRooms.filter(r => r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied)).length;
    const bVacant = bRooms.filter(r => r.occupancyStatus === 'vacant').length;
    const bRent = bRooms.reduce((sum, r) => sum + (r.rent || 0), 0);
    const bWater = bRooms.reduce((sum, r) => sum + (r.waterCost || 0), 0);
    const bElec = bRooms.reduce((sum, r) => sum + (r.elecCost || 0), 0);
    const bTotal = bRooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
    const bCollected = bRooms.filter(r => r.isPaid).reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
    return {
      name: bName,
      totalRooms: bRooms.length,
      occupied: bOccupied,
      vacant: bVacant,
      rent: bRent,
      water: bWater,
      elec: bElec,
      total: bTotal,
      collected: bCollected,
      pending: bTotal - bCollected,
    };
  });

  // Handle Generate & Download PDF
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    setDownloadSuccess(null);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(printRef.current, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1000,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
      
      const fileName = `รายงานสรุปผลประกอบการ_${config.propertyName.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}_งวด_${activeMonth}.pdf`;
      pdf.save(fileName);
      setDownloadSuccess(`ดาวน์โหลดรายงาน PDF งวด ${activeMonth} สำเร็จแล้ว!`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-google-sans">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-fade-in">
        
        {/* Modal Top Control Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>ส่งออกรายงานสรุปประจำเดือน (Export PDF Report)</span>
              </h2>
              <p className="text-xs text-slate-300">
                งวดบัญชี: <strong className="text-amber-400 font-bold">{activeMonth} 2569</strong> • พิมพ์แบบฟอร์มเอกสารสรุปผลประกอบการมาตรฐาน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDirectPrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">สั่งพิมพ์ (Print)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (A4)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
            <button onClick={() => setDownloadSuccess(null)} className="text-emerald-700 font-bold">✕</button>
          </div>
        )}

        {/* Scrollable Printable Container (Standard A4 preview) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/80">
          <div 
            ref={printRef}
            className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-md border border-slate-300 max-w-[800px] mx-auto space-y-6 text-xs font-sans print:shadow-none print:border-none print:p-0 print:m-0"
            style={{ minHeight: '1050px' }}
          >
            
            {/* 1. Executive Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                    P
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                      {config.propertyName}
                    </h1>
                    <p className="text-[11px] text-slate-600">
                      {config.address} • โทร: {config.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="inline-block px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded">
                  รายงานสรุปผลประกอบการ
                </div>
                <div className="text-xs font-bold text-slate-900 pt-1">
                  ประจำงวด: <span className="text-indigo-700 font-bold">{activeMonth} 2569</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  วันที่พิมพ์เอกสาร: {todayStr}
                </div>
              </div>
            </div>

            {/* 2. Key Executive Financial Metrics Grid */}
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. สรุปรายได้และสถานะทางการเงิน (Executive Financial Summary)</span>
              </h2>

              <div className="grid grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-semibold">รายรับรวมตามบิล (Total Invoiced)</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">฿{totalRevenue.toLocaleString()}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{rooms.length} ห้องทั้งหมด</div>
                </div>

                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                  <div className="text-[10px] text-emerald-700 font-semibold">เก็บเงินแล้ว (Collected)</div>
                  <div className="text-sm font-bold text-emerald-800 mt-0.5">฿{collectedRevenue.toLocaleString()}</div>
                  <div className="text-[9px] text-emerald-600 mt-0.5">
                    {totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : 0}% ของยอดรวม
                  </div>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                  <div className="text-[10px] text-amber-800 font-semibold">ค้างชำระ/หนี้สิน (Outstanding)</div>
                  <div className="text-sm font-bold text-amber-900 mt-0.5">฿{pendingRevenue.toLocaleString()}</div>
                  <div className="text-[9px] text-amber-700 mt-0.5">{unpaidRooms.length} ห้องค้างชำระ</div>
                </div>

                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl">
                  <div className="text-[10px] text-indigo-700 font-semibold">กำไรสุทธิหลังหักรายจ่าย (Net Profit)</div>
                  <div className="text-sm font-bold text-indigo-950 mt-0.5">฿{netOperatingIncome.toLocaleString()}</div>
                  <div className="text-[9px] text-indigo-600 mt-0.5">หักค่าใช้จ่าย ฿{totalExpenseAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* 3. Building-by-Building Breakdown Table */}
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. สรุปแยกรายอาคาร (Building-by-Building Breakdown)</span>
              </h2>

              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                    <th className="p-2 border-r border-slate-200">ชื่ออาคาร</th>
                    <th className="p-2 border-r border-slate-200 text-center">ห้องทั้งหมด</th>
                    <th className="p-2 border-r border-slate-200 text-center">มีผู้เช่า</th>
                    <th className="p-2 border-r border-slate-200 text-center">ห้องว่าง</th>
                    <th className="p-2 border-r border-slate-200 text-right">ค่าเช่า (บาท)</th>
                    <th className="p-2 border-r border-slate-200 text-right">ค่าน้ำ (บาท)</th>
                    <th className="p-2 border-r border-slate-200 text-right">ค่าไฟ (บาท)</th>
                    <th className="p-2 border-r border-slate-200 text-right">ยอดรวม (บาท)</th>
                    <th className="p-2 text-right">เก็บแล้ว (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {buildingSummaries.map((b) => (
                    <tr key={b.name} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{b.name}</td>
                      <td className="p-2 border-r border-slate-200 text-center">{b.totalRooms}</td>
                      <td className="p-2 border-r border-slate-200 text-center text-emerald-700 font-semibold">{b.occupied}</td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-500">{b.vacant}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">฿{b.rent.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">฿{b.water.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">฿{b.elec.toLocaleString()}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold font-mono text-slate-900">฿{b.total.toLocaleString()}</td>
                      <td className="p-2 text-right font-bold font-mono text-emerald-700">฿{b.collected.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="p-2 border-r border-slate-200">รวมทั้งหมด</td>
                    <td className="p-2 border-r border-slate-200 text-center">{rooms.length}</td>
                    <td className="p-2 border-r border-slate-200 text-center text-emerald-800">{occupiedRooms}</td>
                    <td className="p-2 border-r border-slate-200 text-center">{vacantRooms}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">฿{totalRent.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">฿{totalWaterCost.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">฿{totalElecCost.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono text-indigo-900">฿{totalRevenue.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-emerald-800">฿{collectedRevenue.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Occupancy and Utilities Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>สถิติการอยู่อาศัย (Occupancy Statistics)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">อัตราการเข้าพัก</span>
                    <strong className="text-xs text-indigo-600 font-bold">{occupancyPercent}%</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">ผู้พักอาศัยรวม</span>
                    <strong className="text-xs text-slate-800 font-bold">{totalOccupants} คน</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">ปิดปรับปรุง</span>
                    <strong className="text-xs text-amber-600 font-bold">{renoRooms} ห้อง</strong>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>การใช้น้ำ-ไฟฟ้ารวม (Utilities Consumption)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">💧 น้ำประปารวม</span>
                    <strong className="text-xs text-blue-700 font-bold">{totalWaterUnits.toLocaleString()} หน่วย (฿{totalWaterCost.toLocaleString()})</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">⚡ ไฟฟ้ารวม</span>
                    <strong className="text-xs text-amber-700 font-bold">{totalElecUnits.toLocaleString()} หน่วย (฿{totalElecCost.toLocaleString()})</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Unpaid / Outstanding Rooms Table */}
            {unpaidRooms.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>3. รายการห้องที่ยังค้างชำระ (Pending / Outstanding Rooms - {unpaidRooms.length} ห้อง)</span>
                </h2>

                <table className="w-full text-left border-collapse border border-slate-200 text-[10px]">
                  <thead>
                    <tr className="bg-amber-50 border-b border-amber-200 text-amber-900 font-bold">
                      <th className="p-1.5 border-r border-slate-200">อาคาร</th>
                      <th className="p-1.5 border-r border-slate-200">เลขห้อง</th>
                      <th className="p-1.5 border-r border-slate-200">ชื่อผู้เช่า</th>
                      <th className="p-1.5 border-r border-slate-200">เบอร์โทร</th>
                      <th className="p-1.5 border-r border-slate-200 text-right">บิลเดือนนี้</th>
                      <th className="p-1.5 border-r border-slate-200 text-right">ยอดค้างเดิม/ค่าปรับ</th>
                      <th className="p-1.5 text-right font-bold">ยอดสุทธิที่ต้องชำระ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unpaidRooms.slice(0, 10).map((r) => {
                      const liab = (r.previousBalance || 0) + (r.lateFeeTotal || 0);
                      const grand = getRoomEffectiveTotal(r);
                      return (
                        <tr key={r.key} className="hover:bg-amber-50/40">
                          <td className="p-1.5 border-r border-slate-200 text-slate-700">{r.building}</td>
                          <td className="p-1.5 border-r border-slate-200 font-bold text-slate-900">{r.roomNo}</td>
                          <td className="p-1.5 border-r border-slate-200">{r.tenantName}</td>
                          <td className="p-1.5 border-r border-slate-200 font-mono text-slate-600">{r.phone || '-'}</td>
                          <td className="p-1.5 border-r border-slate-200 text-right font-mono">฿{(r.total || 0).toLocaleString()}</td>
                          <td className="p-1.5 border-r border-slate-200 text-right font-mono text-amber-700">฿{liab.toLocaleString()}</td>
                          <td className="p-1.5 text-right font-bold font-mono text-red-600">฿{grand.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {unpaidRooms.length > 10 && (
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    * แสดง 10 ห้องแรก จากทั้งหมด {unpaidRooms.length} ห้องที่ค้างชำระ
                  </p>
                )}
              </div>
            )}

            {/* 6. Signatures & Verification */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[11px]">
              <div className="space-y-10">
                <p className="text-slate-600">ลงชื่อ .............................................................. ผู้จัดทำรายงาน</p>
                <p className="text-slate-800 font-semibold">( {currentUser?.name || 'เจ้าหน้าที่ดูแลหอพัก'} )</p>
              </div>
              <div className="space-y-10">
                <p className="text-slate-600">ลงชื่อ .............................................................. ผู้ตรวจสอบ / เจ้าของหอ</p>
                <p className="text-slate-800 font-semibold">( {config.landlordName} )</p>
              </div>
            </div>

            {/* Document Footer */}
            <div className="text-[9px] text-slate-400 text-center pt-3 border-t border-slate-200">
              PropManage GAS • ระบบบริหารจัดการหอพักและสาธารณูปโภค • เอกสารนี้ออกโดยระบบอัตโนมัติเมื่อ {todayStr}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
