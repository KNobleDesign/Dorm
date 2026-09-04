import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Share2, 
  Sparkles, 
  Receipt, 
  Search, 
  Check, 
  CreditCard, 
  Grid2X2, 
  Scissors, 
  ChevronLeft, 
  ChevronRight, 
  Layers,
  Edit3,
  Users,
  Droplet,
  Droplets,
  X,
  Save,
  Plus,
  Minus,
  AlertTriangle,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { RoomRecord, LandlordConfig, WaterCalcType, OccupancyStatus, AppUser } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface InvoiceViewProps {
  rooms: RoomRecord[];
  activeMonth: string;
  buildings: string[];
  config: LandlordConfig;
  currentUser?: AppUser;
  onNavigateToMeter?: () => void;
  defaultTargetRoom?: RoomRecord | null;
  selectedRoomForModal?: RoomRecord | null;
  onTogglePaymentStatus?: (key: string) => void;
  onUpdateRoom?: (updatedRoom: RoomRecord) => void;
  onUpdateRoomRecord?: (updatedRoom: RoomRecord) => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  rooms,
  activeMonth,
  buildings,
  config,
  currentUser,
  onNavigateToMeter,
  defaultTargetRoom,
  selectedRoomForModal,
  onTogglePaymentStatus = (_key: string) => {},
  onUpdateRoom,
  onUpdateRoomRecord,
}) => {
  const handleUpdate = onUpdateRoom || onUpdateRoomRecord || (() => {});
  const [viewMode, setViewMode] = useState<'four-per-page' | 'single'>('four-per-page');

  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [activePreviewRoom, setActivePreviewRoom] = useState<RoomRecord | null>(
    defaultTargetRoom || selectedRoomForModal || rooms[0] || null
  );

  // Quick edit modal state
  const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null);
  const [editOccupancyStatus, setEditOccupancyStatus] = useState<OccupancyStatus>('occupied');
  const [editTenantName, setEditTenantName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editOccupants, setEditOccupants] = useState<number>(1);
  const [editWaterCalcType, setEditWaterCalcType] = useState<WaterCalcType>('meter');
  const [editWaterCurr, setEditWaterCurr] = useState<number>(0);
  const [editElecCurr, setEditElecCurr] = useState<number>(0);
  const [editRent, setEditRent] = useState<number>(0);
  const [editOtherFees, setEditOtherFees] = useState<number>(0);
  const [editRenovationReason, setEditRenovationReason] = useState<string>('');
  // Liability in quick edit
  const [editPreviousBalance, setEditPreviousBalance] = useState<number>(0);
  const [editLateDays, setEditLateDays] = useState<number>(0);
  const [editLateFeePerDay, setEditLateFeePerDay] = useState<number>(100);

  // Arrears Batch/Quick Manager Modal
  const [isArrearsManagerOpen, setIsArrearsManagerOpen] = useState<boolean>(false);
  const [quickArrearsRoom, setQuickArrearsRoom] = useState<RoomRecord | null>(null);
  const [quickArrearsInput, setQuickArrearsInput] = useState<number>(0);
  const [quickArrearsLateDaysInput, setQuickArrearsLateDaysInput] = useState<number>(0);
  
  // 4-per-page pagination
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const singleInvoiceRef = useRef<HTMLDivElement>(null);
  const fourPerPageRef = useRef<HTMLDivElement>(null);
  const allFourPagesRef = useRef<HTMLDivElement>(null);

  // Financial Stats Calculation across rooms
  const totalRentBilled = rooms.reduce((acc, r) => acc + (r.isOccupied ? (r.rent || 0) : 0), 0);
  const totalWaterBilled = rooms.reduce((acc, r) => acc + (r.isOccupied ? (r.waterCost || 0) : 0), 0);
  const totalElecBilled = rooms.reduce((acc, r) => acc + (r.isOccupied ? (r.elecCost || 0) : 0), 0);
  const totalOtherFeesBilled = rooms.reduce((acc, r) => acc + (r.isOccupied ? (r.otherFees || 0) : 0), 0);
  const totalCurrentMonthBilled = totalRentBilled + totalWaterBilled + totalElecBilled + totalOtherFeesBilled;

  const roomsWithPreviousBalance = rooms.filter(r => r.previousBalance && r.previousBalance > 0);
  const totalPreviousBalance = roomsWithPreviousBalance.reduce((acc, r) => acc + (r.previousBalance || 0), 0);

  const roomsWithLateFees = rooms.filter(r => (r.lateDays && r.lateDays > 0) || (r.lateFeeTotal && r.lateFeeTotal > 0));
  const totalLateFees = roomsWithLateFees.reduce((acc, r) => acc + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || config.lateFeePerDayDefault || 100))), 0);

  const totalLiability = totalPreviousBalance + totalLateFees;
  const totalGrandDue = totalCurrentMonthBilled + totalLiability;

  const totalPaidRooms = rooms.filter(r => r.isPaid).length;
  const totalPaidAmount = rooms.filter(r => r.isPaid).reduce((acc, r) => acc + (r.grandTotal || (r.total + (r.liabilityTotal || 0))), 0);

  // Filter rooms
  const filteredRooms = rooms.filter(r => {
    if (selectedBuildingFilter !== 'ALL' && r.building !== selectedBuildingFilter) return false;
    if (selectedStatusFilter === 'PAID' && !r.isPaid) return false;
    if (selectedStatusFilter === 'UNPAID' && r.isPaid) return false;
    if (selectedStatusFilter === 'LIABILITY' && !((r.liabilityTotal && r.liabilityTotal > 0) || (r.lateDays && r.lateDays > 0) || (r.previousBalance && r.previousBalance > 0))) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.roomNo.toLowerCase().includes(q) || (r.tenantName && r.tenantName.toLowerCase().includes(q));
    }
    return true;
  });

  // Chunk filtered rooms into sets of 4
  const roomChunks: RoomRecord[][] = [];
  for (let i = 0; i < filteredRooms.length; i += 4) {
    roomChunks.push(filteredRooms.slice(i, i + 4));
  }

  const totalPages = Math.max(1, roomChunks.length);
  const currentChunk = roomChunks[currentPage] || roomChunks[0] || [];

  const issueDate = new Date().toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const dueDayFormatted = (config.paymentDueDay || 5).toString().padStart(2, '0');
  const dueDate = `${dueDayFormatted}/` + (new Date().getMonth() + 1).toString().padStart(2, '0') + '/' + (new Date().getFullYear() + 543);
  const latePolicyText = config.latePolicyNotice || `กำหนดชำระเงินทุกวันที่ ${config.paymentDueDay || 5} ของเดือน หากชำระล่าช้าคิดค่าปรับวันละ ${config.lateFeePerDayDefault || 100} บาท`;

  // Quick Arrears Adjustment
  const handleOpenQuickArrearsModal = (room: RoomRecord) => {
    setQuickArrearsRoom(room);
    setQuickArrearsInput(room.previousBalance || 0);
    setQuickArrearsLateDaysInput(room.lateDays || 0);
  };

  const handleSaveQuickArrears = () => {
    if (!quickArrearsRoom) return;
    const prevBal = Math.max(0, Number(quickArrearsInput) || 0);
    const lateD = Math.max(0, Number(quickArrearsLateDaysInput) || 0);
    const ratePerDay = quickArrearsRoom.lateFeePerDay ?? config.lateFeePerDayDefault ?? 100;
    const lateFeeTot = lateD * ratePerDay;
    const liabilityTot = prevBal + lateFeeTot;
    const monthlyTot = quickArrearsRoom.total || (quickArrearsRoom.rent + quickArrearsRoom.waterCost + quickArrearsRoom.elecCost + quickArrearsRoom.otherFees);
    const grandTot = monthlyTot + liabilityTot;

    const updated: RoomRecord = {
      ...quickArrearsRoom,
      previousBalance: prevBal,
      lateDays: lateD,
      lateFeePerDay: ratePerDay,
      lateFeeTotal: lateFeeTot,
      liabilityTotal: liabilityTot,
      grandTotal: grandTot,
      notes: quickArrearsRoom.isOccupied
        ? (lateD > 0 ? `เลยกำหนดชำระ ${lateD} วัน (ค่าปรับ ฿${lateFeeTot})` : (prevBal > 0 ? `มียอดค้างเดิม ฿${prevBal}` : 'มีผู้เช่า'))
        : quickArrearsRoom.notes,
    };

    handleUpdate(updated);
    if (activePreviewRoom?.key === quickArrearsRoom.key) {
      setActivePreviewRoom(updated);
    }
    setQuickArrearsRoom(null);
  };

  // Open Edit Modal for a room
  const handleOpenEditModal = (room: RoomRecord) => {
    setEditingRoom(room);
    const status: OccupancyStatus = room.occupancyStatus || (room.isOccupied ? 'occupied' : 'vacant');
    setEditOccupancyStatus(status);
    setEditTenantName(room.tenantName || '');
    setEditPhone(room.phone || '');
    setEditOccupants(room.occupants || (status === 'occupied' ? 1 : 0));
    setEditWaterCalcType(room.waterCalcType || 'meter');
    setEditWaterCurr(room.waterCurr);
    setEditElecCurr(room.elecCurr);
    setEditRent(room.rent || 0);
    setEditOtherFees(room.otherFees || 0);
    setEditRenovationReason(room.renovationReason || '');
    setEditPreviousBalance(room.previousBalance || 0);
    setEditLateDays(room.lateDays || 0);
    setEditLateFeePerDay(room.lateFeePerDay ?? config.lateFeePerDayDefault ?? 100);
  };

  // Save changes from Edit Modal
  const handleSaveEditRoom = () => {
    if (!editingRoom) return;

    const isFactory = editingRoom.building.includes('โรงงาน');
    const waterRate = isFactory ? 20 : (editingRoom.waterRate || config.waterRateDefault || 18);
    const elecRate = isFactory ? 8.5 : (editingRoom.elecRate || config.elecRateDefault || 8);
    const perPersonRate = editingRoom.waterPerPersonRate || config.waterPerPersonRateDefault || 100;
    
    const isOccupied = editOccupancyStatus === 'occupied';
    const occupants = isOccupied ? Math.max(1, editOccupants) : 0;

    let tenantName = editTenantName.trim();
    if (!tenantName) {
      if (editOccupancyStatus === 'occupied') tenantName = 'ผู้เช่า';
      else if (editOccupancyStatus === 'vacant') tenantName = 'ห้องว่าง';
      else tenantName = 'ปิดปรับปรุง';
    }

    let waterUnits = 0;
    let waterCost = 0;
    let elecUnits = 0;
    let elecCost = 0;
    let rent = editRent >= 0 ? editRent : editingRoom.rent;

    if (isOccupied) {
      if (editWaterCalcType === 'per_person') {
        waterUnits = 0;
        waterCost = occupants * perPersonRate;
      } else {
        waterUnits = editWaterCurr >= editingRoom.waterPrev && editWaterCurr > 0 ? editWaterCurr - editingRoom.waterPrev : 0;
        waterCost = waterUnits * waterRate;
      }

      elecUnits = editElecCurr >= editingRoom.elecPrev && editElecCurr > 0 ? editElecCurr - editingRoom.elecPrev : 0;
      elecCost = elecUnits * elecRate;
    } else {
      // Room is vacant or under renovation
      rent = 0;
      waterUnits = 0;
      waterCost = 0;
      elecUnits = 0;
      elecCost = 0;
    }

    const otherFees = isOccupied ? editOtherFees : 0;
    const total = rent + waterCost + elecCost + otherFees;

    // Liability & Late Fee calculations
    const previousBalance = isOccupied ? Math.max(0, editPreviousBalance) : 0;
    const lateDays = isOccupied ? Math.max(0, editLateDays) : 0;
    const lateFeePerDay = isOccupied ? Math.max(0, editLateFeePerDay) : 0;
    const lateFeeTotal = lateDays * lateFeePerDay;
    const liabilityTotal = previousBalance + lateFeeTotal;
    const grandTotal = total + liabilityTotal;

    const updated: RoomRecord = {
      ...editingRoom,
      occupancyStatus: editOccupancyStatus,
      isOccupied,
      tenantName,
      phone: editPhone.trim() || undefined,
      occupants,
      rent,
      waterCalcType: editWaterCalcType,
      waterCurr: editWaterCurr,
      waterUnits,
      waterCost,
      elecCurr: editElecCurr,
      elecUnits,
      elecCost,
      otherFees,
      total,
      previousBalance,
      lateDays,
      lateFeePerDay,
      lateFeeTotal,
      liabilityTotal,
      grandTotal,
      notes: isOccupied 
        ? (lateDays > 0 ? `เลยกำหนดชำระ ${lateDays} วัน (ค่าปรับ ฿${lateFeeTotal})` : (previousBalance > 0 ? `มียอดค้างเดิม ฿${previousBalance}` : 'มีผู้เช่า'))
        : (editOccupancyStatus === 'vacant' ? 'ห้องว่าง' : (editRenovationReason || 'ปิดปรับปรุง')),
      renovationReason: editOccupancyStatus === 'under_renovation' ? (editRenovationReason || 'ปรับปรุงห้องพัก') : undefined,
    };

    handleUpdate(updated);
    if (activePreviewRoom?.key === editingRoom.key) {
      setActivePreviewRoom(updated);
    }
    setEditingRoom(null);
  };

  // In-browser Single PDF generation with Thai font support
  const handleDownloadSinglePdf = async (room: RoomRecord) => {
    if (!singleInvoiceRef.current) return;
    setIsGeneratingPdf(true);
    setPdfSuccessMessage(null);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const element = singleInvoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`ใบแจ้งหนี้_${room.building}_ห้อง_${room.roomNo}_${activeMonth}.pdf`);
      setPdfSuccessMessage(`ดาวน์โหลดใบแจ้งหนี้ห้อง ${room.roomNo} สำเร็จ!`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 4 Rooms per page PDF generation (Current Page) with Thai font support
  const handleDownloadFourPerPagePdf = async () => {
    if (!fourPerPageRef.current) return;
    setIsGeneratingPdf(true);
    setPdfSuccessMessage(null);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const element = fourPerPageRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
      pdf.save(`ใบแจ้งหนี้_4ห้องต่อแผ่น_หน้า_${currentPage + 1}_งวด_${activeMonth}.pdf`);
      setPdfSuccessMessage(`ดาวน์โหลดไฟล์ PDF หน้าที่ ${currentPage + 1} (4 ห้อง) สำเร็จแล้ว!`);
    } catch (err) {
      console.error('4-per-page PDF generation error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download All 4-Per-Page sheets as multi-page PDF
  const handleDownloadAllPagesPdf = async () => {
    if (!allFourPagesRef.current) return;
    setIsGeneratingPdf(true);
    setPdfSuccessMessage(null);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const pageElements = allFourPagesRef.current.querySelectorAll<HTMLElement>('.a4-print-sheet');
      if (pageElements.length === 0) return;

      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pageElements.length; i++) {
        const el = pageElements[i];
        const canvas = await html2canvas(el, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
      }

      pdf.save(`ใบแจ้งหนี้_4ห้องต่อแผ่น_ครบทุกห้อง_${activeMonth}.pdf`);
      setPdfSuccessMessage(`ดาวน์โหลดใบแจ้งหนี้ครบทุกห้อง (${rooms.length} ห้อง) สำเร็จแล้ว!`);
    } catch (err) {
      console.error('All pages PDF generation error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Export full invoice data to Excel/CSV with Thai UTF-8 BOM
  const handleExportExcel = () => {
    const headers = [
      'อาคาร',
      'เลขห้อง',
      'สถานะการพัก',
      'ชื่อผู้เช่า',
      'เบอร์โทร',
      'จำนวนคน',
      'ค่าเช่าห้อง (บาท)',
      'ประเภทค่าน้ำ',
      'มิเตอร์น้ำก่อน',
      'มิเตอร์น้ำปัจจุบัน',
      'หน่วยน้ำ',
      'ค่าน้ำ (บาท)',
      'มิเตอร์ไฟก่อน',
      'มิเตอร์ไฟปัจจุบัน',
      'หน่วยไฟ',
      'ค่าไฟ (บาท)',
      'ค่าขยะ/ส่วนกลาง (บาท)',
      'ยอดค้างชำระเดิม (บาท)',
      'ค่าปรับล่าช้า (บาท)',
      'ยอดรวมสุทธิ (บาท)',
      'สถานะการชำระ',
    ];

    const rows = rooms.map(r => {
      const isVacant = r.occupancyStatus === 'vacant';
      const isRenov = r.occupancyStatus === 'under_renovation';
      const occupancyLabel = isVacant ? 'ห้องว่าง' : (isRenov ? 'ปิดปรับปรุง' : 'มีผู้เช่า');
      const waterTypeLabel = r.waterCalcType === 'per_person' ? 'เหมาจ่ายรายคน' : 'ตามมิเตอร์';
      const lateTotal = r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || 100));
      const grandTotal = r.grandTotal || (r.total + (r.previousBalance || 0) + lateTotal);

      return [
        `"${r.building}"`,
        `"${r.roomNo}"`,
        `"${occupancyLabel}"`,
        `"${(r.tenantName || '').replace(/"/g, '""')}"`,
        `"${r.phone || ''}"`,
        r.occupants || 0,
        r.rent || 0,
        `"${waterTypeLabel}"`,
        r.waterPrev || 0,
        r.waterCurr || 0,
        r.waterUnits || 0,
        r.waterCost || 0,
        r.elecPrev || 0,
        r.elecCurr || 0,
        r.elecUnits || 0,
        r.elecCost || 0,
        r.otherFees || 0,
        r.previousBalance || 0,
        lateTotal,
        grandTotal,
        `"${r.isPaid ? 'ชำระแล้ว' : 'รอชำระเงิน'}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `สรุปใบแจ้งหนี้_${activeMonth}_(${rooms.length}ห้อง).csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setPdfSuccessMessage(`ส่งออกไฟล์ Excel/CSV สำเร็จแล้ว (${rooms.length} ห้อง)!`);
  };

  // If active user is Caretaker, restrict invoice financial access with friendly guidance
  if (currentUser?.role === 'caretaker') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 font-google-sans my-12 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mx-auto text-3xl shadow-inner">
          🔒
        </div>
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            สิทธิ์: พนักงานดูแลหอพัก (Caretaker)
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            ข้อมูลใบแจ้งหนี้สงวนสิทธิ์เฉพาะเจ้าของหอพัก (คุณแม่ / Owner)
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            หน้าใบแจ้งหนี้มีข้อมูลสรุปรายได้ ค่าเช่า และยอดเงินทั้งหมด เพื่อความปลอดภัยตามสิทธิ์ที่ตั้งไว้ พนักงานดูแลสามารถเข้าใช้งานหน้า <strong>"จดมิเตอร์น้ำ-ไฟ (Meter Entry)"</strong> เพื่อบันทึกเลขมิเตอร์ได้ตามปกติ
          </p>
        </div>

        <div className="pt-2">
          {onNavigateToMeter && (
            <button
              onClick={onNavigateToMeter}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>ไปยังหน้าจดมิเตอร์น้ำ-ไฟ (Meter Entry)</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Invoices & Receipts • 4 Rooms Per Page
            </span>
            <span className="text-xs text-slate-500 font-medium">งวดประจำเดือน {activeMonth}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
            ออกใบแจ้งหนี้ & ใบเสร็จรับเงิน (4 ห้องต่อแผ่น A4)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดหน้าพิมพ์ 4 ห้องต่อ 1 แผ่นกระดาษ A4 พร้อมเส้นประสำหรับตัดแบ่ง รองรับทั้งค่าน้ำตามมิเตอร์และเหมาจ่ายรายคน
          </p>
        </div>

        {/* View Mode Switcher & Global Actions */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none flex-nowrap shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 flex-shrink-0">
            <button
              onClick={() => setViewMode('four-per-page')}
              className={`px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap ${
                viewMode === 'four-per-page'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Grid2X2 className="w-4 h-4 flex-shrink-0" />
              <span>พิมพ์ 4 ห้องต่อแผ่น (4/A4)</span>
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span>ใบเดี่ยวเต็มหน้า (Single A4)</span>
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer flex-shrink-0 whitespace-nowrap"
            title="ส่งออกสรุปข้อมูลใบแจ้งหนี้ทุกห้องเป็นไฟล์ Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
            <span>ส่งออก Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <Printer className="w-4 h-4 flex-shrink-0" />
            <span>พิมพ์ (Print)</span>
          </button>
        </div>
      </div>

      {/* Financial Summary & Arrears Status KPI Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>ยอดเรียกเก็บงวดนี้</span>
            <span className="text-blue-600 font-bold">{rooms.filter(r => r.isOccupied).length} ห้องมีผู้เช่า</span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">
            ฿{totalCurrentMonthBilled.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ค่าเช่า + ค่าน้ำไฟ + ค่าส่วนกลาง
          </div>
        </div>

        <div 
          onClick={() => setIsArrearsManagerOpen(true)}
          className={`p-4 rounded-xl border shadow-xs transition cursor-pointer ${
            totalPreviousBalance > 0 
              ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400 hover:bg-amber-100/60' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          title="คลิกเพื่อจัดการยอดค้างชำระทุกห้อง"
        >
          <div className="text-[11px] font-semibold flex items-center justify-between">
            <span className="text-amber-900 flex items-center gap-1 font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              ยอดค้างชำระยกมา
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-200/90 text-amber-900">
              {roomsWithPreviousBalance.length} ห้อง
            </span>
          </div>
          <div className="text-xl font-black text-amber-900 mt-1">
            ฿{totalPreviousBalance.toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-800 mt-0.5 flex items-center justify-between font-medium">
            <span>ค้างจากเดือนก่อน</span>
            <span className="font-bold underline text-amber-900 flex items-center gap-0.5">
              ⚡ จัดการยอดค้าง
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 text-red-700 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              ค่าปรับชำระล่าช้า
            </span>
            <span className="text-slate-500 font-bold">{roomsWithLateFees.length} ห้อง</span>
          </div>
          <div className="text-xl font-black text-red-600 mt-1">
            ฿{totalLateFees.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            อัตรา @{config.lateFeePerDayDefault || 100} บาท/วัน
          </div>
        </div>

        <div className="bg-blue-900 text-white p-4 rounded-xl shadow-xs border border-blue-950">
          <div className="text-[11px] font-semibold text-blue-200 flex items-center justify-between">
            <span>ยอดรวมสุทธิทั้งสิ้น</span>
            <span className="bg-blue-800 text-blue-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
              ชำระแล้ว {totalPaidRooms}/{rooms.length}
            </span>
          </div>
          <div className="text-xl font-black text-white mt-1">
            ฿{totalGrandDue.toLocaleString()}
          </div>
          <div className="text-[10px] text-blue-300 mt-0.5">
            รับชำระแล้ว: ฿{totalPaidAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {pdfSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between animate-in fade-in print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{pdfSuccessMessage}</span>
          </div>
          <button onClick={() => setPdfSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 ROOMS PER PAGE MODE */}
      {viewMode === 'four-per-page' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedBuildingFilter}
                onChange={(e) => {
                  setSelectedBuildingFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-700 cursor-pointer"
              >
                <option value="ALL">ทุกอาคาร ({rooms.length} ห้อง)</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-700 cursor-pointer"
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value="PAID">เฉพาะที่ชำระแล้ว</option>
                <option value="UNPAID">เฉพาะที่รอชำระ</option>
                <option value="LIABILITY">⚠️ มียอดค้างชำระ / ค่าปรับล่าช้า</option>
              </select>

              <span className="text-xs text-slate-500 font-medium ml-2">
                พบ <strong>{filteredRooms.length}</strong> ห้อง (ทั้งหมด <strong>{totalPages}</strong> แผ่น A4)
              </span>
            </div>

            {/* Pagination & Export Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1 text-xs">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-slate-800">
                  แผ่นที่ {currentPage + 1} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleDownloadFourPerPagePdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลดแผ่นนี้ (PDF)'}</span>
              </button>

              <button
                onClick={handleDownloadAllPagesPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด PDF ทุกหน้า ({totalPages} แผ่น)</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ส่งออก Excel</span>
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900 print:hidden">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>รูปแบบ 4 ห้องต่อหน้า:</strong> กระดาษ A4 แบ่งเป็น 4 ส่วนเท่ากัน (2 แถว × 2 คอลัมน์) สามารถคลิก <strong>"✏️ แก้ไขชื่อ/คน"</strong> บนใบแจ้งหนี้เพื่อปรับปรุงข้อมูลได้ทันที
              </span>
            </div>
            <span className="font-mono text-slate-600 font-semibold">
              ห้องในหน้านี้: {currentChunk.map(r => r.roomNo).join(', ') || 'ไม่มี'}
            </span>
          </div>

          {/* Visible Single Page for Interactive Preview */}
          <div className="overflow-x-auto pb-4">
            <div
              ref={fourPerPageRef}
              className="a4-sheet-container bg-white rounded-xl border border-slate-300 shadow-md p-3 mx-auto text-slate-800 font-thai print:border-none print:shadow-none print:p-0"
              style={{
                width: '100%',
                maxWidth: '210mm',
                minHeight: '297mm',
                boxSizing: 'border-box',
              }}
            >
              {/* 2x2 Grid with Dotted Cut Lines */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full relative" style={{ minHeight: '280mm' }}>
                {/* Horizontal Cut Line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-b border-dashed border-slate-300 pointer-events-none flex justify-center items-center z-10 print:border-slate-400">
                  <span className="bg-white px-2 py-0.5 text-[9px] text-slate-400 flex items-center gap-1 border border-slate-200 rounded-full print:hidden">
                    <Scissors className="w-3 h-3" /> เส้นตัดแบ่งครึ่ง
                  </span>
                </div>

                {/* Vertical Cut Line */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r border-dashed border-slate-300 pointer-events-none flex flex-col justify-center items-center z-10 print:border-slate-400">
                  <span className="bg-white px-1 py-1 text-[9px] text-slate-400 flex flex-col items-center gap-1 border border-slate-200 rounded-full print:hidden">
                    <Scissors className="w-3 h-3" />
                  </span>
                </div>

                {/* 4 Slips */}
                {[0, 1, 2, 3].map((slotIdx) => {
                  const room = currentChunk[slotIdx];
                  if (!room) {
                    return (
                      <div
                        key={`empty-${slotIdx}`}
                        className="p-4 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-xs italic"
                      >
                        (ช่องว่างสำหรับพิมพ์)
                      </div>
                    );
                  }

                  const isPerPerson = room.waterCalcType === 'per_person';
                  const previousBalance = room.previousBalance || 0;
                  const lateDays = room.lateDays || 0;
                  const lateFeePerDay = room.lateFeePerDay ?? config.lateFeePerDayDefault ?? 100;
                  const lateFeeTotal = room.lateFeeTotal ?? (lateDays * lateFeePerDay);
                  const liabilityTotal = room.liabilityTotal ?? (previousBalance + lateFeeTotal);
                  const effectiveGrandTotal = room.grandTotal ?? (room.total + liabilityTotal);

                  return (
                    <div
                      key={room.key}
                      className="p-3.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between text-xs relative hover:border-blue-400 transition"
                      style={{ height: '100%', boxSizing: 'border-box' }}
                    >
                      {/* Slip Header */}
                      <div>
                        <div className="flex justify-between items-start border-b border-slate-200 pb-1.5 mb-2">
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs tracking-tight truncate max-w-[140px]">
                              {config.propertyName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              โทร: {config.phone} • งวด: <strong>{activeMonth}</strong>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-extrabold text-xs border border-blue-200">
                              ห้อง {room.roomNo}
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium">
                              {room.building}
                            </div>
                          </div>
                        </div>

                        {/* Tenant Info & Quick Edit Button */}
                        <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-100 text-[11px] mb-1.5">
                          <div className="truncate max-w-[150px] flex items-center gap-1">
                            {room.occupancyStatus === 'vacant' ? (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">
                                ⚪ ห้องว่าง
                              </span>
                            ) : room.occupancyStatus === 'under_renovation' ? (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-100 text-purple-800 border border-purple-200">
                                🟡 ปิดปรับปรุง
                              </span>
                            ) : (
                              <>
                                <span className="text-slate-400 text-[10px]">ผู้เช่า: </span>
                                <strong className="text-slate-800">{room.tenantName || 'ผู้เช่า'}</strong>
                                <span className="text-[10px] text-slate-500 ml-1">({room.occupants || 1} คน)</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(room)}
                              className="px-1.5 py-0.5 text-[10px] text-blue-700 hover:text-blue-900 bg-white rounded border border-blue-200 flex items-center gap-0.5 print:hidden cursor-pointer"
                              title="แก้ไขสถานะ/ผู้เช่า/มิเตอร์"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>แก้ไข</span>
                            </button>
                            <span className="text-slate-500 text-[10px]">
                              กำหนด: <strong className="text-red-600">{dueDate}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Liability Alert (if late or has arrears) */}
                        {liabilityTotal > 0 && (
                          <div className="mb-1.5 px-1.5 py-0.5 bg-amber-50 border border-amber-300 rounded text-[9px] text-amber-900 font-bold flex items-center justify-between">
                            <span>⚠️ มียอดค้าง/ค่าปรับ: +฿{liabilityTotal.toLocaleString()}</span>
                            {lateDays > 0 && <span className="text-red-700 font-semibold">(เกินกำหนด {lateDays} วัน)</span>}
                          </div>
                        )}

                        {/* Itemized Compact Table */}
                        <table className="w-full text-left text-[11px] border border-slate-200 rounded overflow-hidden border-collapse mb-1.5">
                          <thead className="bg-[#111827] text-white font-semibold text-[10px]">
                            <tr>
                              <th className="py-1 px-1.5">รายการ</th>
                              <th className="py-1 px-1 text-center">จดมิเตอร์</th>
                              <th className="py-1 px-1 text-right">หน่วย</th>
                              <th className="py-1 px-1.5 text-right">บาท</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            <tr>
                              <td className="py-0.5 px-1.5 font-medium text-slate-900">ค่าเช่าห้อง</td>
                              <td className="py-0.5 px-1 text-center text-slate-400">-</td>
                              <td className="py-0.5 px-1 text-right text-slate-500">1</td>
                              <td className="py-0.5 px-1.5 text-right font-semibold">{room.rent.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5 px-1.5">
                                <span className="font-medium text-blue-900">
                                  {isPerPerson ? `ค่าน้ำ (เหมา ${room.occupants || 1}คน)` : 'ค่าน้ำประปา'}
                                </span>
                              </td>
                              <td className="py-0.5 px-1 text-center font-mono text-[10px] text-slate-600">
                                {isPerPerson ? 'เหมาจ่าย' : `${room.waterPrev}→${room.waterCurr}`}
                              </td>
                              <td className="py-0.5 px-1 text-right font-medium text-blue-700">
                                {isPerPerson ? `${room.occupants || 1} คน` : room.waterUnits}
                              </td>
                              <td className="py-0.5 px-1.5 text-right font-semibold text-blue-900">{room.waterCost.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td className="py-0.5 px-1.5">
                                <span className="font-medium text-amber-900">ค่าไฟ</span>
                              </td>
                              <td className="py-0.5 px-1 text-center font-mono text-[10px] text-slate-600">
                                {room.elecPrev}&rarr;{room.elecCurr}
                              </td>
                              <td className="py-0.5 px-1 text-right font-medium text-amber-700">{room.elecUnits}</td>
                              <td className="py-0.5 px-1.5 text-right font-semibold text-amber-900">{room.elecCost.toLocaleString()}</td>
                            </tr>
                            {room.otherFees > 0 && (
                              <tr>
                                <td className="py-0.5 px-1.5 text-slate-600">ค่าส่วนกลาง/อื่นๆ</td>
                                <td className="py-0.5 px-1 text-center text-slate-400">-</td>
                                <td className="py-0.5 px-1 text-right text-slate-500">1</td>
                                <td className="py-0.5 px-1.5 text-right font-semibold">{room.otherFees.toLocaleString()}</td>
                              </tr>
                            )}
                            {previousBalance > 0 && (
                              <tr className="bg-amber-50/70 text-amber-900">
                                <td className="py-0.5 px-1.5 font-bold text-amber-950">ยอดค้างชำระยกมา</td>
                                <td className="py-0.5 px-1 text-center text-slate-400">-</td>
                                <td className="py-0.5 px-1 text-right text-slate-500">1</td>
                                <td className="py-0.5 px-1.5 text-right font-bold text-amber-900">{previousBalance.toLocaleString()}</td>
                              </tr>
                            )}
                            {lateFeeTotal > 0 && (
                              <tr className="bg-amber-50/70 text-amber-900">
                                <td className="py-0.5 px-1.5 font-bold text-amber-950">ค่าปรับล่าช้า ({lateDays} วัน)</td>
                                <td className="py-0.5 px-1 text-center font-mono text-[9px] text-slate-500">@{lateFeePerDay}บ./วัน</td>
                                <td className="py-0.5 px-1 text-right text-slate-500">{lateDays}</td>
                                <td className="py-0.5 px-1.5 text-right font-bold text-amber-900">{lateFeeTotal.toLocaleString()}</td>
                              </tr>
                            )}
                            <tr className="bg-blue-50/80 font-bold text-slate-900 border-t border-slate-300">
                              <td colSpan={3} className="py-1 px-1.5 text-right text-[11px] text-blue-950">
                                รวมยอดสุทธิที่ต้องชำระ:
                              </td>
                              <td className="py-1 px-1.5 text-right text-xs font-black text-blue-700">
                                ฿{effectiveGrandTotal.toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Late Notice Text on Slip */}
                        <div className="text-[8.5px] text-amber-900 bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-200 truncate font-medium mb-1">
                          ⚠️ กำหนดชำระทุกวันที่ {config.paymentDueDay || 5} หากล่าช้าคิดค่าปรับวันละ {config.lateFeePerDayDefault || 100} บาท
                        </div>
                      </div>

                      {/* Slip Bottom Payment */}
                      <div className="border-t border-slate-200 pt-1.5 space-y-1">
                        <div className="text-[9.5px] text-slate-600 space-y-0.5 leading-tight">
                          <div>พร้อมเพย์: <strong className="font-mono text-slate-900">{config.promptPayId}</strong></div>
                          <div>{config.bankName}: <strong className="font-mono text-slate-900">{config.bankAccount}</strong></div>
                          <div className="text-[8.5px] text-slate-400">ชื่อ: {config.landlordName}</div>
                        </div>

                        {/* Status & Signature Footer */}
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[9px] text-slate-400">
                          <button
                            onClick={() => onTogglePaymentStatus(room.key)}
                            className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer print:border print:border-slate-300 ${
                              room.isPaid
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            {room.isPaid ? '✓ ชำระแล้ว' : '○ รอชำระเงิน'}
                          </button>
                          <span>ผู้รับเงิน: ...........................</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hidden Container for Multi-Page Print / All Pages PDF */}
          <div ref={allFourPagesRef} className="hidden print:block">
            {roomChunks.map((chunk, chunkIdx) => (
              <div
                key={`page-${chunkIdx}`}
                className="a4-print-sheet bg-white p-4 mx-auto text-slate-800 font-thai break-after-page"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  pageBreakAfter: 'always',
                  boxSizing: 'border-box',
                }}
              >
                <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full" style={{ minHeight: '280mm' }}>
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const room = chunk[slotIdx];
                    if (!room) return <div key={`empty-${slotIdx}`} className="border border-dashed border-slate-100" />;

                    const isPerPerson = room.waterCalcType === 'per_person';
                    const previousBalance = room.previousBalance || 0;
                    const lateDays = room.lateDays || 0;
                    const lateFeePerDay = room.lateFeePerDay ?? config.lateFeePerDayDefault ?? 100;
                    const lateFeeTotal = room.lateFeeTotal ?? (lateDays * lateFeePerDay);
                    const liabilityTotal = room.liabilityTotal ?? (previousBalance + lateFeeTotal);
                    const effectiveGrandTotal = room.grandTotal ?? (room.total + liabilityTotal);

                    return (
                      <div
                        key={room.key}
                        className="p-3.5 bg-white rounded-lg border border-slate-300 flex flex-col justify-between text-xs relative"
                        style={{ height: '100%', boxSizing: 'border-box' }}
                      >
                        <div>
                          <div className="flex justify-between items-start border-b border-slate-300 pb-1.5 mb-2">
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs">
                                {config.propertyName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                โทร: {config.phone} • งวด: <strong>{activeMonth}</strong>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="px-2 py-0.5 rounded bg-slate-100 text-slate-900 font-extrabold text-xs border border-slate-300">
                                ห้อง {room.roomNo}
                              </div>
                              <div className="text-[9px] text-slate-500">{room.building}</div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-200 text-[11px] mb-1.5">
                            <div>
                              <span className="text-slate-400 text-[10px]">ผู้เช่า: </span>
                              <strong className="text-slate-800">{room.tenantName || 'ห้องว่าง'}</strong>
                              <span className="text-[10px] text-slate-500 ml-1">({room.occupants || 1} คน)</span>
                            </div>
                            <div className="text-slate-500 text-[10px]">
                              ครบกำหนด: <strong className="text-red-600">{dueDate}</strong>
                            </div>
                          </div>

                          {liabilityTotal > 0 && (
                            <div className="mb-1.5 px-1.5 py-0.5 bg-amber-50 border border-amber-300 rounded text-[9px] text-amber-900 font-bold flex items-center justify-between">
                              <span>⚠️ ยอดค้างชำระ / ค่าปรับ: +฿{liabilityTotal.toLocaleString()}</span>
                              {lateDays > 0 && <span className="text-red-700 font-semibold">(เกินกำหนด {lateDays} วัน)</span>}
                            </div>
                          )}

                          <table className="w-full text-left text-[11px] border border-slate-300 rounded border-collapse mb-1.5">
                            <thead className="bg-[#111827] text-white font-semibold text-[10px]">
                              <tr>
                                <th className="py-1 px-1.5">รายการ</th>
                                <th className="py-1 px-1 text-center">จดมิเตอร์</th>
                                <th className="py-1 px-1 text-right">หน่วย</th>
                                <th className="py-1 px-1.5 text-right">บาท</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700">
                              <tr>
                                <td className="py-0.5 px-1.5 font-medium">ค่าเช่าห้อง</td>
                                <td className="py-0.5 px-1 text-center">-</td>
                                <td className="py-0.5 px-1 text-right">1</td>
                                <td className="py-0.5 px-1.5 text-right font-semibold">{room.rent.toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td className="py-0.5 px-1.5">
                                  {isPerPerson ? `ค่าน้ำ (เหมา ${room.occupants || 1}คน)` : 'ค่าน้ำประปา'}
                                </td>
                                <td className="py-0.5 px-1 text-center font-mono text-[10px]">
                                  {isPerPerson ? 'เหมาจ่าย' : `${room.waterPrev}→${room.waterCurr}`}
                                </td>
                                <td className="py-0.5 px-1 text-right">
                                  {isPerPerson ? `${room.occupants || 1} คน` : room.waterUnits}
                                </td>
                                <td className="py-0.5 px-1.5 text-right font-semibold">{room.waterCost.toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td className="py-0.5 px-1.5">ค่าไฟ</td>
                                <td className="py-0.5 px-1 text-center font-mono text-[10px]">{room.elecPrev}&rarr;{room.elecCurr}</td>
                                <td className="py-0.5 px-1 text-right">{room.elecUnits}</td>
                                <td className="py-0.5 px-1.5 text-right font-semibold">{room.elecCost.toLocaleString()}</td>
                              </tr>
                              {room.otherFees > 0 && (
                                <tr>
                                  <td className="py-0.5 px-1.5">ค่าส่วนกลาง/อื่นๆ</td>
                                  <td className="py-0.5 px-1 text-center">-</td>
                                  <td className="py-0.5 px-1 text-right">1</td>
                                  <td className="py-0.5 px-1.5 text-right font-semibold">{room.otherFees.toLocaleString()}</td>
                                </tr>
                              )}
                              {previousBalance > 0 && (
                                <tr className="bg-amber-50/70 text-amber-900">
                                  <td className="py-0.5 px-1.5 font-bold">ยอดค้างชำระยกมา</td>
                                  <td className="py-0.5 px-1 text-center">-</td>
                                  <td className="py-0.5 px-1 text-right">1</td>
                                  <td className="py-0.5 px-1.5 text-right font-bold">{previousBalance.toLocaleString()}</td>
                                </tr>
                              )}
                              {lateFeeTotal > 0 && (
                                <tr className="bg-amber-50/70 text-amber-900">
                                  <td className="py-0.5 px-1.5 font-bold">ค่าปรับล่าช้า ({lateDays} วัน)</td>
                                  <td className="py-0.5 px-1 text-center font-mono text-[9px]">@{lateFeePerDay}บ./วัน</td>
                                  <td className="py-0.5 px-1 text-right">{lateDays}</td>
                                  <td className="py-0.5 px-1.5 text-right font-bold">{lateFeeTotal.toLocaleString()}</td>
                                </tr>
                              )}
                              <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                                <td colSpan={3} className="py-1 px-1.5 text-right text-[11px]">
                                  รวมยอดสุทธิที่ต้องชำระ:
                                </td>
                                <td className="py-1 px-1.5 text-right text-xs font-black text-blue-700">
                                  ฿{effectiveGrandTotal.toLocaleString()}
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          <div className="text-[8.5px] text-amber-900 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200 truncate font-medium mb-1">
                            ⚠️ กำหนดชำระทุกวันที่ {config.paymentDueDay || 5} หากล่าช้าคิดค่าปรับวันละ {config.lateFeePerDayDefault || 100} บาท
                          </div>
                        </div>

                        <div className="border-t border-slate-300 pt-1.5 space-y-1">
                          <div className="text-[9.5px] text-slate-600 space-y-0.5">
                            <div>พร้อมเพย์: <strong className="font-mono">{config.promptPayId}</strong></div>
                            <div>{config.bankName}: <strong className="font-mono">{config.bankAccount}</strong></div>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[9px] text-slate-500">
                            <span>สถานะ: {room.isPaid ? 'ชำระแล้ว' : 'รอชำระเงิน'}</span>
                            <span>ผู้รับเงิน: ...........................</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SINGLE INVOICE MODE */}
      {viewMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Room Invoices Selector Table (5 cols) */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  เลือกห้องที่ต้องการออกบิลเดี่ยว
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {filteredRooms.length} ห้อง
                </span>
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedBuildingFilter}
                  onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-700 cursor-pointer"
                >
                  <option value="ALL">ทุกอาคาร</option>
                  {buildings.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-700 cursor-pointer"
                >
                  <option value="ALL">ทุกสถานะ</option>
                  <option value="PAID">ชำระแล้ว</option>
                  <option value="UNPAID">รอชำระ</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาห้อง หรือ ชื่อผู้เช่า..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Room List Cards */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredRooms.map((r) => {
                  const isActive = activePreviewRoom?.key === r.key;
                  const rLiability = (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || 100)));
                  const rGrandTotal = r.grandTotal || (r.total + rLiability);

                  return (
                    <div
                      key={r.key}
                      onClick={() => setActivePreviewRoom(r)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-md font-bold text-xs flex items-center justify-center ${
                          r.isPaid ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {r.roomNo}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{r.tenantName || 'ห้องว่าง'}</span>
                            {r.occupancyStatus === 'vacant' && (
                              <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-700 font-semibold">ว่าง</span>
                            )}
                            {r.occupancyStatus === 'under_renovation' && (
                              <span className="text-[9px] px-1 rounded bg-purple-100 text-purple-700 font-semibold">ปรับปรุง</span>
                            )}
                            {rLiability > 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                ⚠️ ค้าง/ปรับ +฿{rLiability.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {r.building} • รวมสุทธิ: <strong className="text-slate-800">฿{rGrandTotal.toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          r.isPaid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {r.isPaid ? 'ชำระแล้ว' : 'รอชำระ'}
                        </span>
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Printable Single Invoice Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {activePreviewRoom ? (
              <>
                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      ใบแจ้งหนี้ห้อง {activePreviewRoom.roomNo} ({activePreviewRoom.building})
                    </span>
                    <button
                      onClick={() => handleOpenEditModal(activePreviewRoom)}
                      className="px-2.5 py-1 text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1.5 font-semibold transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไขสถานะเข้าพัก & ผู้เช่า</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTogglePaymentStatus(activePreviewRoom.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        activePreviewRoom.isPaid
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {activePreviewRoom.isPaid ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> ชำระเงินแล้ว
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" /> คลิกเมื่อรับเงินแล้ว
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDownloadSinglePdf(activePreviewRoom)}
                      disabled={isGeneratingPdf}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> 
                      <span>{isGeneratingPdf ? 'กำลังสร้าง...' : 'ดาวน์โหลด PDF'}</span>
                    </button>

                    <button
                      onClick={handleExportExcel}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> 
                      <span>ส่งออก Excel</span>
                    </button>
                  </div>
                </div>

                {/* Printable Invoice Paper Sheet (A4 Proportion) */}
                <div
                  ref={singleInvoiceRef}
                  className="bg-white p-8 rounded-xl border border-slate-300 shadow-sm text-slate-800 space-y-6 font-thai print:p-0 print:border-none print:shadow-none"
                  style={{ minHeight: '680px' }}
                >
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                    <div>
                      <div className="text-lg font-bold text-slate-900 tracking-tight">
                        {config.propertyName}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                        {config.address}<br />
                        เลขประจำตัวผู้เสียภาษี: {config.taxId} | โทร: {config.phone}
                      </div>
                    </div>

                    <div className="text-right">
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        ใบแจ้งหนี้ / ใบเสร็จรับเงิน
                      </h3>
                      <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                        <div>ประจำงวด: <strong className="text-slate-900">{activeMonth}</strong></div>
                        <div>วันที่ออกเอกสาร: {issueDate}</div>
                        <div>กำหนดชำระ: <strong className="text-red-600">{dueDate}</strong></div>
                      </div>
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                        {activePreviewRoom.building}
                      </span>
                    </div>
                  </div>

                  {/* Tenant & Room Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5 text-[11px]">ชื่อผู้เช่า (Tenant Name):</span>
                      <strong className="text-sm font-bold text-slate-900">
                        {activePreviewRoom.tenantName || 'ห้องว่าง'}
                      </strong>
                      <span className="text-slate-500 ml-2">({activePreviewRoom.occupants || 1} คน)</span>
                      {activePreviewRoom.phone && (
                        <span className="text-slate-500 ml-2">({activePreviewRoom.phone})</span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block mb-0.5 text-[11px]">ห้องพักเลขที่ (Room No):</span>
                      <strong className="text-xl font-bold text-slate-900 font-mono">
                        {activePreviewRoom.roomNo}
                      </strong>
                    </div>
                  </div>

                  {/* Payment Terms & Late Policy Notice Banner */}
                  <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-3 flex items-center justify-between text-xs text-amber-950 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <div>
                        <strong>เงื่อนไขการชำระเงิน:</strong> กำหนดชำระทุกวันที่ <strong>{config.paymentDueDay || 5}</strong> ของเดือน หากชำระล่าช้าคิดค่าปรับวันละ <strong>{config.lateFeePerDayDefault || 100}</strong> บาท
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200 shrink-0 ml-2">
                      Late Fee: ฿{config.lateFeePerDayDefault || 100}/วัน
                    </span>
                  </div>

                  {/* Itemized Table */}
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden border-collapse">
                    <thead className="bg-[#111827] text-white font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                        <th className="py-2.5 px-3">รายการ (Description)</th>
                        <th className="py-2.5 px-3 text-center">การอ่านมิเตอร์</th>
                        <th className="py-2.5 px-3 text-right">จำนวนหน่วย</th>
                        <th className="py-2.5 px-3 text-right">จำนวนเงิน (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr>
                        <td className="py-2.5 px-3 text-center text-slate-400">1</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          ค่าเช่าห้องพักประจำเดือน (Monthly Rent)
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400">-</td>
                        <td className="py-2.5 px-3 text-right">1 ห้อง</td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {activePreviewRoom.rent.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 px-3 text-center text-slate-400">2</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900">
                            {activePreviewRoom.waterCalcType === 'per_person'
                              ? `ค่าน้ำประปา (เหมาจ่ายรายคน @ ฿${activePreviewRoom.waterPerPersonRate || 100}/คน)`
                              : 'ค่าน้ำประปา (Water Supply)'}
                          </span>
                          <div className="text-[11px] text-slate-400">
                            {activePreviewRoom.waterCalcType === 'per_person'
                              ? `จำนวนผู้พักอาศัย ${activePreviewRoom.occupants || 1} คน`
                              : `(เลขก่อน: ${activePreviewRoom.waterPrev} | เลขปัจจุบัน: ${activePreviewRoom.waterCurr})`}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {activePreviewRoom.waterCalcType === 'per_person'
                            ? 'เหมาจ่ายรายคน'
                            : `${activePreviewRoom.waterPrev} → ${activePreviewRoom.waterCurr}`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {activePreviewRoom.waterCalcType === 'per_person'
                            ? `${activePreviewRoom.occupants || 1} คน`
                            : `${activePreviewRoom.waterUnits} หน่วย`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {activePreviewRoom.waterCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 px-3 text-center text-slate-400">3</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900">ค่าไฟฟ้า (Electricity)</span>
                          <div className="text-[11px] text-slate-400">
                            (เลขก่อน: {activePreviewRoom.elecPrev} | เลขปัจจุบัน: {activePreviewRoom.elecCurr})
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {activePreviewRoom.elecPrev} &rarr; {activePreviewRoom.elecCurr}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {activePreviewRoom.elecUnits} หน่วย
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {activePreviewRoom.elecCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>

                      {activePreviewRoom.otherFees > 0 && (
                        <tr>
                          <td className="py-2.5 px-3 text-center text-slate-400">4</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            ค่าบริการส่วนกลาง / ค่าขยะ / อื่นๆ
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400">-</td>
                          <td className="py-2.5 px-3 text-right">1 รายการ</td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            {activePreviewRoom.otherFees.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}

                      {(activePreviewRoom.previousBalance || 0) > 0 && (
                        <tr className="bg-amber-50/70 text-amber-950 font-medium">
                          <td className="py-2.5 px-3 text-center text-amber-600 font-bold">⚠️</td>
                          <td className="py-2.5 px-3 font-bold text-amber-900">
                            ยอดค้างชำระยกมาจากงวดก่อน (Previous Balance / Arrears)
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400">-</td>
                          <td className="py-2.5 px-3 text-right">1 งวด</td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-900">
                            {(activePreviewRoom.previousBalance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}

                      {(activePreviewRoom.lateDays || 0) > 0 && (
                        <tr className="bg-amber-50/70 text-amber-950 font-medium">
                          <td className="py-2.5 px-3 text-center text-amber-600 font-bold">⚠️</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-amber-900">
                              ค่าปรับชำระล่าช้า (Late Payment Penalty)
                            </span>
                            <div className="text-[11px] text-amber-700">
                              เกินกำหนด {activePreviewRoom.lateDays} วัน (อัตรา ฿{activePreviewRoom.lateFeePerDay || config.lateFeePerDayDefault || 100}/วัน)
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-xs text-amber-800">
                            {activePreviewRoom.lateDays} วัน
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {activePreviewRoom.lateDays} วัน
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-900">
                            {(activePreviewRoom.lateFeeTotal || (activePreviewRoom.lateDays * (activePreviewRoom.lateFeePerDay || config.lateFeePerDayDefault || 100))).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}

                      {/* Total Row */}
                      {(() => {
                        const prevBal = activePreviewRoom.previousBalance || 0;
                        const lFee = activePreviewRoom.lateFeeTotal || ((activePreviewRoom.lateDays || 0) * (activePreviewRoom.lateFeePerDay || config.lateFeePerDayDefault || 100));
                        const grandTot = activePreviewRoom.grandTotal || (activePreviewRoom.total + prevBal + lFee);

                        return (
                          <tr className="bg-blue-50/90 font-bold text-slate-900 border-t-2 border-slate-900">
                            <td colSpan={4} className="py-3 px-3 text-right text-xs text-slate-900">
                              ยอดรวมสุทธิที่ต้องชำระทั้งสิ้น (Grand Total):
                            </td>
                            <td className="py-3 px-3 text-right text-base font-black text-blue-700">
                              ฿{grandTot.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>

                  {/* Payment Channel & PromptPay QR Code */}
                  {(() => {
                    const prevBal = activePreviewRoom.previousBalance || 0;
                    const lFee = activePreviewRoom.lateFeeTotal || ((activePreviewRoom.lateDays || 0) * (activePreviewRoom.lateFeePerDay || config.lateFeePerDayDefault || 100));
                    const grandTot = activePreviewRoom.grandTotal || (activePreviewRoom.total + prevBal + lFee);

                    return (
                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                        <div className="space-y-1.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            ช่องทางการชำระเงิน (Payment Options):
                          </div>
                          <div className="text-slate-600 space-y-0.5">
                            <div>• ธนาคาร: <strong>{config.bankName}</strong></div>
                            <div>• เลขที่บัญชี: <strong className="font-mono text-slate-900">{config.bankAccount}</strong></div>
                            <div>• บัญชีพร้อมเพย์ (PromptPay): <strong className="font-mono text-slate-900">{config.promptPayId}</strong></div>
                            <div>• ชื่อบัญชี: <strong>{config.landlordName}</strong></div>
                          </div>
                          <p className="text-[11px] text-red-600 font-medium pt-1">
                            * กรุณาส่งสลิปยืนยันการโอนเงินที่ไลน์นิติบุคคลทันทีหลังชำระเงิน
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Footer Stamp */}
                  <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                    ขอบพระคุณที่ไว้วางใจใช้บริการ • เอกสารฉบับนี้สร้างโดยระบบอัตโนมัติ PropManage GAS
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
                กรุณาเลือกห้องพักจากรายการด้านซ้ายเพื่อแสดงใบแจ้งหนี้
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK EDIT MODAL (Occupancy Status, Tenant Name, Occupants, Water Mode, Rent) */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in print:hidden font-google-sans">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  แก้ไขสถานะการเข้าพัก & ใบแจ้งหนี้ (ห้อง {editingRoom.roomNo})
                </h3>
                <span className="text-xs text-slate-500 font-medium">{editingRoom.building}</span>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. OCCUPANCY STATUS SELECTOR */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  สถานะการเข้าพัก (Occupancy Status)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditOccupancyStatus('occupied');
                      if (editOccupants <= 0) setEditOccupants(1);
                      if (!editTenantName || editTenantName === 'ห้องว่าง' || editTenantName === 'ปิดปรับปรุง') {
                        setEditTenantName('');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                      editOccupancyStatus === 'occupied'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>🟢 มีผู้เช่า</span>
                    <span className="text-[10px] font-normal text-slate-500">Occupied</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditOccupancyStatus('vacant');
                      setEditOccupants(0);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                      editOccupancyStatus === 'vacant'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>⚪ ห้องว่าง</span>
                    <span className="text-[10px] font-normal text-slate-500">Vacant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditOccupancyStatus('under_renovation');
                      setEditOccupants(0);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                      editOccupancyStatus === 'under_renovation'
                        ? 'bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>🟡 ปิดปรับปรุง</span>
                    <span className="text-[10px] font-normal text-slate-500">Renovation</span>
                  </button>
                </div>
              </div>

              {/* IF OCCUPIED: SHOW TENANT DETAILS */}
              {editOccupancyStatus === 'occupied' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ชื่อผู้เช่า / ผู้พักอาศัย (Tenant Name)
                      </label>
                      <input
                        type="text"
                        value={editTenantName}
                        onChange={(e) => setEditTenantName(e.target.value)}
                        placeholder="เช่น คุณสมชาย ประเสริฐ"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        เบอร์โทรศัพท์ (Phone)
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="08X-XXX-XXXX"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        จำนวนผู้พักอาศัย (Occupants)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditOccupants(Math.max(1, editOccupants - 1))}
                          className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={editOccupants}
                          onChange={(e) => setEditOccupants(Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 text-center bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold font-mono text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setEditOccupants(editOccupants + 1)}
                          className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-slate-500 font-medium">คน</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ค่าเช่าห้อง (Room Rent)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editRent}
                          onChange={(e) => setEditRent(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold font-mono text-slate-900 pl-6"
                        />
                        <span className="absolute left-2.5 top-2 text-slate-400 font-semibold">฿</span>
                      </div>
                    </div>
                  </div>

                  {/* Water Mode Selection */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      วิธีคิดค่าน้ำประปา
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditWaterCalcType('meter')}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition ${
                          editWaterCalcType === 'meter'
                            ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-blue-600" />
                          <span>ตามมิเตอร์ (18 บ./น.)</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditWaterCalcType('per_person')}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition ${
                          editWaterCalcType === 'per_person'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>เหมาคน (100 บ./คน)</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Water & Electricity Meter Readings */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        เลขมิเตอร์น้ำใหม่ (เดือนนี้)
                      </label>
                      <input
                        type="number"
                        disabled={editWaterCalcType === 'per_person'}
                        value={editWaterCurr}
                        onChange={(e) => setEditWaterCurr(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        เลขมิเตอร์ไฟใหม่ (เดือนนี้)
                      </label>
                      <input
                        type="number"
                        value={editElecCurr}
                        onChange={(e) => setEditElecCurr(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* 3. LIABILITY & LATE PAYMENT SECTION */}
                  <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                        <span>⚠️</span>
                        <span>ยอดค้างชำระ & ค่าปรับชำระล่าช้า (Liability & Late Fee)</span>
                      </div>
                      <span className="text-[10px] text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200 font-bold">
                        กำหนดทุกวันที่ {config.paymentDueDay || 5}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                          ยอดค้างชำระยกมา (บาท)
                        </label>
                        <div className="relative mb-1.5">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={editPreviousBalance}
                            onChange={(e) => setEditPreviousBalance(Math.max(0, Number(e.target.value)))}
                            placeholder="0"
                            className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-bold font-mono text-slate-900 pl-6 focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="absolute left-2.5 top-2 text-amber-600 font-semibold">฿</span>
                        </div>
                        {/* Quick Arrears Presets */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {[0, 500, 1000, 1500, 2000, 3000, 5000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setEditPreviousBalance(preset)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                editPreviousBalance === preset
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {preset === 0 ? '฿0 (ไม่มียอดค้าง)' : `+฿${preset.toLocaleString()}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                          อัตราค่าปรับล่าช้า (บาท/วัน)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={editLateFeePerDay}
                            onChange={(e) => setEditLateFeePerDay(Math.max(0, Number(e.target.value)))}
                            placeholder="100"
                            className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-bold font-mono text-slate-900 pl-6 focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="absolute left-2.5 top-2 text-amber-600 font-semibold">฿</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-amber-900">
                          จำนวนวันที่ชำระล่าช้า (เลยกำหนดชำระ): <strong>{editLateDays} วัน</strong>
                        </label>
                        <span className="text-[10px] text-amber-700 font-bold">
                          คิดค่าปรับ: +฿{(editLateDays * editLateFeePerDay).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[0, 1, 2, 3, 5, 7, 10, 15].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setEditLateDays(days)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                              editLateDays === days
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {days === 0 ? 'ตรงกำหนด (0 วัน)' : `เลย ${days} วัน`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Calculation Breakdown in Modal */}
                    {(() => {
                      const calculatedWater = editWaterCalcType === 'per_person'
                        ? editOccupants * (config.waterPerPersonRate || 100)
                        : Math.max(0, editWaterCurr - editingRoom.waterPrev) * (config.waterRate || 18);
                      const calculatedElec = Math.max(0, editElecCurr - editingRoom.elecPrev) * (config.electricityRate || 8);
                      const currentMonthCharges = editRent + calculatedWater + calculatedElec + (editingRoom.otherFees || 0);
                      const lateFeeVal = editLateDays * editLateFeePerDay;
                      const liabilityVal = editPreviousBalance + lateFeeVal;
                      const calculatedGrandTotal = currentMonthCharges + liabilityVal;

                      return (
                        <div className="pt-2 border-t border-amber-200/80 text-[11px] space-y-1 text-amber-950">
                          <div className="flex justify-between">
                            <span>ค่าเช่า & ค่าน้ำไฟงวดนี้:</span>
                            <span className="font-semibold">฿{currentMonthCharges.toLocaleString()}</span>
                          </div>
                          {editPreviousBalance > 0 && (
                            <div className="flex justify-between text-amber-900">
                              <span>+ ยอดค้างชำระเดิม:</span>
                              <span className="font-semibold">฿{editPreviousBalance.toLocaleString()}</span>
                            </div>
                          )}
                          {lateFeeVal > 0 && (
                            <div className="flex justify-between text-red-700">
                              <span>+ ค่าปรับล่าช้า ({editLateDays} วัน × ฿{editLateFeePerDay}):</span>
                              <span className="font-semibold">+฿{lateFeeVal.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-amber-300 font-bold text-xs text-blue-900">
                            <span>ยอดรวมสุทธิที่ต้องชำระ (Grand Total):</span>
                            <span className="font-black text-sm text-blue-700">฿{calculatedGrandTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : editOccupancyStatus === 'vacant' ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>ตั้งค่าเป็นห้องว่าง (Vacant Room)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    เมื่อเปลี่ยนเป็นห้องว่าง ยอดค่าเช่าและยอดรวมในใบแจ้งหนี้จะถูกปรับเป็น <strong>฿0</strong> อัตโนมัติ และระบบจะอัปเดตสถิติอัตราการเข้าพักบน Dashboard ให้ตรงกันทันที
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3 text-purple-900">
                  <div className="flex items-center gap-2 font-bold text-purple-900">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>ตั้งค่าเป็นปิดปรับปรุง / ซ่อมแซม</span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    ห้องจะอยู่ในสถานะซ่อมแซม ไม่คิดค่าเช่าในงวดนี้ และอัปเดตสถานะห้องปรับปรุงบน Dashboard
                  </p>
                  <div>
                    <label className="block font-semibold text-purple-900 mb-1">
                      รายละเอียดการปรับปรุง (Renovation Note)
                    </label>
                    <input
                      type="text"
                      value={editRenovationReason}
                      onChange={(e) => setEditRenovationReason(e.target.value)}
                      placeholder="เช่น ปรับปรุงทาสี, ซ่อมเครื่องปรับอากาศ, เปลี่ยนสุขภัณฑ์"
                      className="w-full bg-white border border-purple-300 rounded-lg p-2 text-xs font-medium text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEditRoom}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึก & อัปเดตกลับ Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SINGLE-ROOM ARREARS ADJUSTMENT MODAL */}
      {quickArrearsRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-sm border border-amber-300">
                  {quickArrearsRoom.roomNo}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    ปรับยอดค้างชำระ & ค่าปรับ ห้อง {quickArrearsRoom.roomNo}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {quickArrearsRoom.tenantName || 'ผู้เช่า'} • {quickArrearsRoom.building}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickArrearsRoom(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Previous Balance Input */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-amber-950">
                  ยอดค้างชำระยกมาจากเดือนก่อน (บาท)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={quickArrearsInput}
                    onChange={(e) => setQuickArrearsInput(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-full bg-white border border-amber-300 rounded-lg p-2.5 text-sm font-bold font-mono text-slate-900 pl-7 focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute left-2.5 top-2.5 text-amber-600 font-bold">฿</span>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[0, 500, 1000, 1500, 2000, 3000, 5000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setQuickArrearsInput(amount)}
                      className={`px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        quickArrearsInput === amount
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {amount === 0 ? '฿0 (ไม่มียอดค้าง)' : `+฿${amount.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Late Days Input */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-800">
                    จำนวนวันที่ชำระล่าช้า (เลยกำหนด {config.paymentDueDay || 5}):
                  </label>
                  <span className="font-bold text-red-600">
                    +฿{(quickArrearsLateDaysInput * (quickArrearsRoom.lateFeePerDay ?? config.lateFeePerDayDefault ?? 100)).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0, 1, 2, 3, 5, 7, 10, 15].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setQuickArrearsLateDaysInput(days)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        quickArrearsLateDaysInput === days
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {days === 0 ? 'ตรงกำหนด (0 วัน)' : `เลย ${days} วัน`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Impact Preview */}
              {(() => {
                const prev = Math.max(0, Number(quickArrearsInput) || 0);
                const late = Math.max(0, Number(quickArrearsLateDaysInput) || 0);
                const rate = quickArrearsRoom.lateFeePerDay ?? config.lateFeePerDayDefault ?? 100;
                const lateTotal = late * rate;
                const baseMonthly = quickArrearsRoom.total || (quickArrearsRoom.rent + quickArrearsRoom.waterCost + quickArrearsRoom.elecCost + quickArrearsRoom.otherFees);
                const newGrand = baseMonthly + prev + lateTotal;

                return (
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-950">
                    <div className="flex justify-between text-slate-600">
                      <span>ค่าเช่า & ค่าน้ำไฟงวดนี้:</span>
                      <span className="font-semibold">฿{baseMonthly.toLocaleString()}</span>
                    </div>
                    {prev > 0 && (
                      <div className="flex justify-between text-amber-900 font-medium">
                        <span>+ ยอดค้างชำระเดิม:</span>
                        <span>฿{prev.toLocaleString()}</span>
                      </div>
                    )}
                    {lateTotal > 0 && (
                      <div className="flex justify-between text-red-700 font-medium">
                        <span>+ ค่าปรับล่าช้า ({late} วัน):</span>
                        <span>+฿{lateTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-1 border-t border-blue-200 text-sm text-blue-900">
                      <span>ยอดสุทธิในใบแจ้งหนี้ใหม่:</span>
                      <span className="font-black text-blue-700">฿{newGrand.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setQuickArrearsRoom(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveQuickArrears}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกยอดค้าง & ปรับปรุงใบแจ้งหนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL ROOMS ARREARS BATCH MANAGER MODAL */}
      {isArrearsManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-300">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    จัดการยอดค้างชำระยกมาจากเดือนก่อน (Arrears Manager)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตรวจสอบและปรับปรุงยอดคงค้างของทุกห้องในงวดประจำเดือน {activeMonth} (มี {roomsWithPreviousBalance.length} ห้องมียอดค้าง รวม ฿{totalPreviousBalance.toLocaleString()})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsArrearsManagerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Info Banner */}
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-950 flex-shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>หมายเหตุ:</strong> ยอดค้างชำระที่ระบุจะถูกนำไปรวมในใบแจ้งหนี้ (ทั้งแบบ 4 ห้อง/แผ่น และ Single A4) พร้อมคำนวณใน QR Code รับเงินอัตโนมัติ
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedStatusFilter('LIABILITY');
                  setIsArrearsManagerOpen(false);
                }}
                className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded font-bold transition cursor-pointer text-[11px] whitespace-nowrap"
              >
                กรองเฉพาะห้องมียอดค้างในใบแจ้งหนี้
              </button>
            </div>

            {/* Room Arrears Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">ห้อง</th>
                    <th className="py-2.5 px-3">อาคาร</th>
                    <th className="py-2.5 px-3">ผู้เช่า</th>
                    <th className="py-2.5 px-3 text-right">ค่าเช่า+น้ำไฟงวดนี้</th>
                    <th className="py-2.5 px-3 text-center">ยอดค้างชำระยกมา (บาท)</th>
                    <th className="py-2.5 px-3 text-center">เลยกำหนด (วัน)</th>
                    <th className="py-2.5 px-3 text-right">ยอดรวมสุทธิ</th>
                    <th className="py-2.5 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rooms.map((room) => {
                    const prevBal = room.previousBalance || 0;
                    const lateD = room.lateDays || 0;
                    const rate = room.lateFeePerDay ?? config.lateFeePerDayDefault ?? 100;
                    const lateTot = lateD * rate;
                    const liabTot = prevBal + lateTot;
                    const monthlyTot = room.isOccupied ? (room.total || (room.rent + room.waterCost + room.elecCost + room.otherFees)) : 0;
                    const grandTot = monthlyTot + liabTot;

                    return (
                      <tr 
                        key={room.key} 
                        className={`hover:bg-slate-50 transition ${
                          prevBal > 0 ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-extrabold text-slate-900">
                          {room.roomNo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {room.building}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800">
                            {room.tenantName || (room.isOccupied ? 'มีผู้เช่า' : 'ห้องว่าง')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ฿{monthlyTot.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={prevBal}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value) || 0);
                                const newLiab = val + lateTot;
                                const newGrand = monthlyTot + newLiab;
                                const updated: RoomRecord = {
                                  ...room,
                                  previousBalance: val,
                                  liabilityTotal: newLiab,
                                  grandTotal: newGrand,
                                };
                                handleUpdate(updated);
                              }}
                              className={`w-24 text-center p-1 rounded-lg border text-xs font-bold font-mono focus:ring-2 focus:ring-amber-500 ${
                                prevBal > 0 
                                  ? 'border-amber-400 bg-amber-100/60 text-amber-950' 
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            />
                            {prevBal > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newLiab = lateTot;
                                  const newGrand = monthlyTot + newLiab;
                                  const updated: RoomRecord = {
                                    ...room,
                                    previousBalance: 0,
                                    liabilityTotal: newLiab,
                                    grandTotal: newGrand,
                                  };
                                  handleUpdate(updated);
                                }}
                                title="ล้างยอดค้างเป็น 0"
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-200 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {lateD > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                              {lateD} วัน (+฿{lateTot.toLocaleString()})
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-xs font-mono text-blue-900">
                          ฿{grandTot.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenQuickArrearsModal(room);
                            }}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-[11px] font-bold transition cursor-pointer"
                          >
                            ⚡ ปรับด่วน
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-shrink-0">
              <div className="text-xs text-slate-500 font-medium">
                รวมยอดค้างชำระยกมาทั้งหมด: <strong className="text-amber-900 text-sm font-bold">฿{totalPreviousBalance.toLocaleString()}</strong> ({roomsWithPreviousBalance.length} ห้อง)
              </div>
              <button
                type="button"
                onClick={() => setIsArrearsManagerOpen(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>เสร็จสิ้น & ปิดหน้าต่าง</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
