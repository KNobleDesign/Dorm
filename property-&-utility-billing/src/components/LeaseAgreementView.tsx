import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  Edit3,
  Eye,
  CheckCircle2,
  RefreshCw,
  Building2,
  User,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Info,
  Shield,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import {
  RoomRecord,
  BuildingProfile,
  LandlordConfig,
  AppUser,
  LeaseAgreementData,
  LeaseInventoryItem
} from '../types';
import { exportElementToA4Pdf, exportElementsToMultiPageA4Pdf } from '../utils/pdfExport';
import { exportLeaseAgreementToExcel } from '../utils/leaseExcelExport';

interface LeaseAgreementViewProps {
  rooms: RoomRecord[];
  buildings: BuildingProfile[];
  config: LandlordConfig;
  currentUser: AppUser;
  onBackToOverview?: () => void;
  onUpdateRoomRecord?: (updated: RoomRecord) => void;
}

const DEFAULT_INVENTORY: LeaseInventoryItem[] = [
  { no: 1, itemDescription: 'ลูกกุญแจห้องพักและคีย์การ์ดประตูทางเข้า', itemDescriptionEn: 'Room Keys & Access Cards', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'เรียบร้อยดี', conditionEn: 'Good / Intact', remark: '' },
  { no: 2, itemDescription: 'เครื่องปรับอากาศ (แอร์) พร้อมรีโมทคอนโทรล', itemDescriptionEn: 'Air Conditioner & Remote Control', qty: '1', unitTh: 'เครื่อง', unitEn: 'Units', condition: 'ใช้งานได้ตามปกติ เย็นดี', conditionEn: 'Normal / Working', remark: '' },
  { no: 3, itemDescription: 'เตียงนอนพร้อมที่นอน (ขนาดมาตรฐาน)', itemDescriptionEn: 'Bed Frame & Mattress', qty: '1', unitTh: 'หลัง', unitEn: 'Sets', condition: 'สะอาด ไม่มีรอยชำรุด', conditionEn: 'Good Condition', remark: '' },
  { no: 4, itemDescription: 'ตู้เสื้อผ้าไม้ / ตู้เก็บของบานเปิดพร้อมกระจกเงา', itemDescriptionEn: 'Wardrobe Cabinet with Mirror', qty: '1', unitTh: 'หลัง', unitEn: 'Units', condition: 'เรียบร้อย บานพับปิดสนิท', conditionEn: 'Good / Intact', remark: '' },
  { no: 5, itemDescription: 'โต๊ะทำงาน / โต๊ะเครื่องแป้ง และเก้าอี้', itemDescriptionEn: 'Working / Vanity Desk & Chair', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'แข็งแรง ไม่โยกคลอน', conditionEn: 'Sturdy / Intact', remark: '' },
  { no: 6, itemDescription: 'สุขภัณฑ์ห้องน้ำ / เครื่องทำน้ำอุ่น / ฝักบัว', itemDescriptionEn: 'Bathroom Sanitaryware & Water Heater', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'น้ำไหลปกติ เครื่องทำงานดี', conditionEn: 'Normal / Working', remark: '' },
  { no: 7, itemDescription: 'ผ้าม่านบังแดดและมุ้งลวดหน้าต่าง', itemDescriptionEn: 'Curtains & Window Screens', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'สะอาด ไม่ฉีกขาด', conditionEn: 'Clean / Intact', remark: '' },
  { no: 8, itemDescription: 'หลอดไฟส่องสว่างและเต้ารับไฟฟ้าทุกจุด', itemDescriptionEn: 'Lighting Fixtures & Electrical Outlets', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'ติดครบทุกจุด ปลอดภัย', conditionEn: 'Complete & Working', remark: '' },
  { no: 9, itemDescription: 'มิเตอร์ไฟฟ้าและมิเตอร์น้ำประปาประจำห้อง', itemDescriptionEn: 'Dedicated Electricity & Water Meters', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'หน้าปัดหมุนปกติ ไม่มีชำรุด', conditionEn: 'Accurate / Normal', remark: '' },
  { no: 10, itemDescription: 'ประตู หน้าต่าง และกลอนล็อคความปลอดภัย', itemDescriptionEn: 'Doors, Windows & Safety Latches', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'ล็อคแน่นหนา ปลอดภัย', conditionEn: 'Secure / Intact', remark: '' },
];

export const LeaseAgreementView: React.FC<LeaseAgreementViewProps> = ({
  rooms,
  buildings,
  config,
  currentUser,
  onBackToOverview,
  onUpdateRoomRecord,
}) => {
  // Selected Room for auto-fill
  const [selectedRoomKey, setSelectedRoomKey] = useState<string>(rooms.length > 0 ? rooms[0].key : '');
  
  // UI Tabs / Mode: 'editor' | 'preview'
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'preview'>('editor');
  const [editorSection, setEditorSection] = useState<'parties' | 'property_terms' | 'deposit_rules' | 'inventory'>('parties');
  
  // A4 Layout & Font Scaling States
  const [fontSizeScale, setFontSizeScale] = useState<'standard' | 'large' | 'compact'>('standard');
  const [spacingScale, setSpacingScale] = useState<'standard' | 'spacious' | 'compact'>('standard');

  // Export Loading States
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // References for printable A4 pages (Pages 1, 2, 3, 4)
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);
  const page4Ref = useRef<HTMLDivElement>(null);

  // Today string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split('T')[0];

  // Primary Lease State
  const [leaseData, setLeaseData] = useState<LeaseAgreementData>(() => {
    const firstRoom = rooms[0];
    const bld = buildings.find(b => b.name === firstRoom?.building || b.id === firstRoom?.buildingId);

    return {
      madeAt: config.propertyName || 'หอพัก พีแอนด์เจ',
      agreementDate: todayStr,
      lessorName: config.landlordName || 'คุณพลอย (ผู้ให้เช่า)',
      lessorAddress: config.address || 'แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร',
      lessorPhone: config.phone || '084-041-1115',
      lessorIdCard: config.taxId || '3-1006-00000-00-0',
      
      lesseeName: firstRoom?.tenantName || 'นายสมชาย รักสงบ',
      lesseeIdCard: '1-1002-00000-00-0',
      lesseeAddress: 'เลขที่ 99/9 หมู่ 2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี',
      lesseePhone: firstRoom?.phone || '081-234-5678',

      roomNo: firstRoom?.roomNo || '101',
      buildingName: firstRoom?.building || 'อาคารดอนเมือง',
      propertyAddressNo: '48/12',
      alley: 'สรงประภา 12',
      road: 'สรงประภา',
      subdistrict: 'สีกัน',
      district: 'ดอนเมือง',
      province: 'กรุงเทพมหานคร',

      leaseStartDate: todayStr,
      leaseEndDate: nextYearStr,
      minimumYear: 1,

      monthlyRent: firstRoom?.rent || 3500,
      paymentDueDay: config.paymentDueDay || 5,
      bankName: config.bankName || 'ธนาคารกสิกรไทย',
      bankAccountNo: config.bankAccount || '041-1-12345-6',
      bankAccountName: config.landlordName || 'น.ส. พลอยไพลิน',
      latePenaltyPerDay: config.lateFeePerDayDefault || 100,

      securityDeposit: firstRoom?.rent ? firstRoom.rent : 3500,
      advanceRent: firstRoom?.rent ? firstRoom.rent : 3500,
      refundDaysAfterExit: 15,

      waterRatePerUnit: config.waterRateDefault || 28,
      electricityRatePerUnit: config.elecRateDefault || 8,

      terminationArrearsDays: 15,
      vacateGraceDays: 7,

      lessorSignName: config.landlordName || 'คุณพลอย',
      lesseeSignName: firstRoom?.tenantName || 'นายสมชาย รักสงบ',
      witness1Name: 'ผู้จัดการอาคาร',
      witness2Name: 'ผู้ดูแลหอพัก',

      inventory: DEFAULT_INVENTORY,
    };
  });

  // Handle Room Selection change - Auto fill
  const handleSelectRoom = (roomKey: string) => {
    setSelectedRoomKey(roomKey);
    const room = rooms.find(r => r.key === roomKey);
    if (!room) return;

    const bld = buildings.find(b => b.name === room.building || b.id === room.buildingId);

    setLeaseData(prev => ({
      ...prev,
      roomNo: room.roomNo,
      buildingName: room.building,
      lesseeName: room.tenantName && room.tenantName !== 'ห้องว่าง' ? room.tenantName : prev.lesseeName,
      lesseePhone: room.phone || prev.lesseePhone,
      monthlyRent: room.rent || prev.monthlyRent,
      securityDeposit: room.rent || prev.securityDeposit,
      advanceRent: room.rent || prev.advanceRent,
      lessorSignName: prev.lessorName,
      lesseeSignName: room.tenantName && room.tenantName !== 'ห้องว่าง' ? room.tenantName : prev.lesseeSignName,
      waterRatePerUnit: bld?.defaultWaterRate || config.waterRateDefault || prev.waterRatePerUnit,
      electricityRatePerUnit: bld?.defaultElecRate || config.elecRateDefault || prev.electricityRatePerUnit,
    }));
  };

  // Add custom inventory row
  const handleAddInventoryItem = () => {
    const nextNo = (leaseData.inventory?.length || 0) + 1;
    const newItem: LeaseInventoryItem = {
      no: nextNo,
      itemDescription: 'รายการอุปกรณ์เพิ่มเติม',
      itemDescriptionEn: 'Additional Equipment',
      qty: '1',
      unitTh: 'ชิ้น',
      unitEn: 'Item',
      condition: 'ปกติ / สมบูรณ์',
      conditionEn: 'Good',
      remark: '',
    };
    setLeaseData(prev => ({
      ...prev,
      inventory: [...(prev.inventory || []), newItem],
    }));
  };

  // Remove inventory item
  const handleRemoveInventoryItem = (index: number) => {
    setLeaseData(prev => {
      const filtered = prev.inventory.filter((_, idx) => idx !== index);
      const reindexed = filtered.map((it, i) => ({ ...it, no: i + 1 }));
      return { ...prev, inventory: reindexed };
    });
  };

  // Update inventory item
  const handleUpdateInventoryItem = (index: number, field: keyof LeaseInventoryItem, val: string) => {
    setLeaseData(prev => {
      const updated = [...prev.inventory];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, inventory: updated };
    });
  };

  // Helper date format Thai
  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return '..............................';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      return `${day} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
    } catch {
      return dateStr;
    }
  };

  // Helper date format English
  const formatEnDate = (dateStr: string) => {
    if (!dateStr) return '..............................';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Helper English ordinal (1st, 2nd, 3rd, 4th, 5th, etc.)
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Helper Thai Baht text format
  const formatMoney = (num: number) => {
    return (num || 0).toLocaleString('th-TH');
  };

  // Dynamic Typography & Spacing Classes for A4 fit
  const thaiTextClass = fontSizeScale === 'large'
    ? 'text-[13.5px] leading-[1.65] text-slate-900'
    : fontSizeScale === 'compact'
    ? 'text-[11.5px] leading-[1.5] text-slate-900'
    : 'text-[12.5px] leading-[1.6] text-slate-900';

  const enTextClass = fontSizeScale === 'large'
    ? 'text-[11.5px] leading-[1.5] text-slate-700 italic font-serif'
    : fontSizeScale === 'compact'
    ? 'text-[10px] leading-[1.4] text-slate-700 italic font-serif'
    : 'text-[11px] leading-[1.45] text-slate-700 italic font-serif';

  const sectionHeadingClass = fontSizeScale === 'large'
    ? 'text-[14.5px] font-bold text-slate-950 tracking-tight'
    : fontSizeScale === 'compact'
    ? 'text-[12.5px] font-bold text-slate-950 tracking-tight'
    : 'text-[13.5px] font-bold text-slate-950 tracking-tight';

  const clauseGapClass = spacingScale === 'spacious'
    ? 'space-y-3.5'
    : spacingScale === 'compact'
    ? 'space-y-1.5'
    : 'space-y-2.5';

  // Export to Multi-Page PDF
  const handleExportPdf = async () => {
    const pages = [page1Ref.current, page2Ref.current, page3Ref.current, page4Ref.current].filter(
      Boolean
    ) as HTMLElement[];

    if (pages.length === 0) {
      alert('ไม่พบองค์ประกอบหน้าสัญญา กรุณาสลับมาที่หน้าตัวอย่าง (Preview) แล้วลองใหม่อีกครั้ง');
      return;
    }

    try {
      setIsExportingPdf(true);
      const fileName = `สัญญาเช่าห้องพัก_${leaseData.roomNo}_${leaseData.lesseeName || 'ผู้เช่า'}.pdf`;
      await exportElementsToMultiPageA4Pdf(pages, fileName, undefined, 'portrait', { scale: 2 });
      setExportSuccessMsg(`ดาวน์โหลดไฟล์สัญญา PDF 4 หน้า (A4) เรียบร้อยแล้ว: ${fileName}`);
      setTimeout(() => setExportSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const fileName = `สัญญาเช่าห้องพัก_${leaseData.roomNo}_${leaseData.lesseeName || 'ผู้เช่า'}.xlsx`;
      exportLeaseAgreementToExcel(leaseData, fileName);
      setExportSuccessMsg(`ดาวน์โหลดไฟล์ Excel สัญญาเช่า 2 แผ่นงาน (จัดหน้า A4 แล้ว) เรียบร้อยแล้ว: ${fileName}`);
      setTimeout(() => setExportSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการส่งออก Excel: ' + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Native Print
  const handlePrint = () => {
    setActiveSubTab('preview');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 print:m-0 print:p-0 print:max-w-none">
      {/* 1. Header Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToOverview && (
              <button
                type="button"
                onClick={onBackToOverview}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="ย้อนกลับไปหน้าภาพรวม"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  ระบบทำสัญญาเช่าห้องพัก (Lease Agreement Generator)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  4 หน้า A4 มาตรฐาน
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ไทย-อังกฤษ (Bilingual)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ผู้เช่าและผู้ให้เช่าสามารถกรอกและปรับแต่งข้อมูลได้โดยตรง ส่งออกเป็น PDF หรือ Excel ที่จัดหน้ากระดาษ A4 สวยงาม ไม่ซ้อน ไม่ล้น
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Editor / Preview */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveSubTab('editor')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSubTab === 'editor'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>กรอกข้อมูลสัญญา (Form)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('preview')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSubTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>ดูตัวอย่างหน้าพิมพ์ (A4 Preview)</span>
              </button>
            </div>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>พิมพ์ (Print)</span>
            </button>

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExportingExcel ? 'กำลังสร้าง Excel...' : 'ส่งออก Excel (.xlsx)'}</span>
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-red-900/30 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'กำลังสร้าง PDF 4 หน้า...' : 'บันทึก PDF (4 หน้า A4)'}</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {exportSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Quick Room Selector */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>ดึงข้อมูลจากห้องพักในระบบ:</span>
          </span>
          <select
            value={selectedRoomKey}
            onChange={(e) => handleSelectRoom(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
          >
            {rooms.map(r => (
              <option key={r.key} value={r.key}>
                {r.building} - ห้อง {r.roomNo} ({r.tenantName || 'ห้องว่าง'}) - ค่าเช่า {formatMoney(r.rent)} บ.
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-500">
            * การเลือกลำดับห้องพักจะโหลดชื่อผู้เช่า, เบอร์โทร, ค่าเช่า และค่าน้ำไฟมาให้อัตโนมัติ โดยคุณสามารถแก้ไขเพิ่มเติมได้ทันที
          </span>
        </div>
      </div>

      {/* 2. Form Editor Mode */}
      {activeSubTab === 'editor' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 print:hidden">
          {/* Section Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setEditorSection('parties')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                editorSection === 'parties'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>1. ข้อมูลคู่สัญญา (ผู้เช่า & ผู้ให้เช่า)</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorSection('property_terms')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                editorSection === 'property_terms'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>2. ทรัพย์สินที่เช่า & ระยะเวลา</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorSection('deposit_rules')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                editorSection === 'deposit_rules'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>3. ค่าเช่า เงินประกัน & ค่าน้ำไฟ</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorSection('inventory')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                editorSection === 'inventory'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>4. ตรวจรับเฟอร์นิเจอร์ & อุปกรณ์ (หน้า 4)</span>
            </button>
          </div>

          {/* Section 1: Parties */}
          {editorSection === 'parties' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Contract Info */}
                <div className="col-span-full bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      สัญญาทำขึ้น ณ (Place Made)
                    </label>
                    <input
                      type="text"
                      value={leaseData.madeAt}
                      onChange={(e) => setLeaseData({ ...leaseData, madeAt: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="เช่น หอพัก พีแอนด์เจ อพาร์ตเมนต์"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      วันที่ทำสัญญา (Agreement Date)
                    </label>
                    <input
                      type="date"
                      value={leaseData.agreementDate}
                      onChange={(e) => setLeaseData({ ...leaseData, agreementDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                {/* Lessor Card */}
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>ฝ่ายผู้ให้เช่า (Lessor)</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อ-นามสกุล / นิติบุคคล ผู้ให้เช่า</label>
                    <input
                      type="text"
                      value={leaseData.lessorName}
                      onChange={(e) => setLeaseData({ ...leaseData, lessorName: e.target.value, lessorSignName: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">เลขประจำตัวประชาชน / ทะเบียนภาษี</label>
                    <input
                      type="text"
                      value={leaseData.lessorIdCard || ''}
                      onChange={(e) => setLeaseData({ ...leaseData, lessorIdCard: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      placeholder="เช่น 3-1006-00000-00-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                    <input
                      type="text"
                      value={leaseData.lessorPhone}
                      onChange={(e) => setLeaseData({ ...leaseData, lessorPhone: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ที่อยู่ติดต่อของผู้ให้เช่า</label>
                    <textarea
                      rows={2}
                      value={leaseData.lessorAddress}
                      onChange={(e) => setLeaseData({ ...leaseData, lessorAddress: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                {/* Lessee Card */}
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>ฝ่ายผู้เช่า (Lessee) - ผู้เช่ากรอกเองได้</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อ-นามสกุล ผู้เช่า</label>
                    <input
                      type="text"
                      value={leaseData.lesseeName}
                      onChange={(e) => setLeaseData({ ...leaseData, lesseeName: e.target.value, lesseeSignName: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">เลขประจำตัวประชาชน / Passport</label>
                    <input
                      type="text"
                      value={leaseData.lesseeIdCard}
                      onChange={(e) => setLeaseData({ ...leaseData, lesseeIdCard: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      placeholder="13 หลัก เช่น 1-1002-00000-00-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อของผู้เช่า</label>
                    <input
                      type="text"
                      value={leaseData.lesseePhone}
                      onChange={(e) => setLeaseData({ ...leaseData, lesseePhone: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ที่อยู่ตามทะเบียนบ้าน/ที่อยู่เดิมของผู้เช่า</label>
                    <textarea
                      rows={2}
                      value={leaseData.lesseeAddress}
                      onChange={(e) => setLeaseData({ ...leaseData, lesseeAddress: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Witnesses & Signatories */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="text-xs font-bold text-slate-700">พยานและผู้ลงลายมือชื่อ (Signatories & Witnesses)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">ชื่อผู้ลงนาม (ผู้ให้เช่า)</label>
                    <input
                      type="text"
                      value={leaseData.lessorSignName}
                      onChange={(e) => setLeaseData({ ...leaseData, lessorSignName: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">ชื่อผู้ลงนาม (ผู้เช่า)</label>
                    <input
                      type="text"
                      value={leaseData.lesseeSignName}
                      onChange={(e) => setLeaseData({ ...leaseData, lesseeSignName: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">พยานคนที่ 1 (Witness 1)</label>
                    <input
                      type="text"
                      value={leaseData.witness1Name}
                      onChange={(e) => setLeaseData({ ...leaseData, witness1Name: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">พยานคนที่ 2 (Witness 2)</label>
                    <input
                      type="text"
                      value={leaseData.witness2Name}
                      onChange={(e) => setLeaseData({ ...leaseData, witness2Name: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Property & Lease Term */}
          {editorSection === 'property_terms' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>ข้อ 1. รายละเอียดทรัพย์สินที่เช่า (Leased Property)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ห้องพักเลขที่ (Room No.)</label>
                    <input
                      type="text"
                      value={leaseData.roomNo}
                      onChange={(e) => setLeaseData({ ...leaseData, roomNo: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ชื่ออาคาร / หอพัก</label>
                    <input
                      type="text"
                      value={leaseData.buildingName}
                      onChange={(e) => setLeaseData({ ...leaseData, buildingName: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">เลขที่ตั้งอาคาร</label>
                    <input
                      type="text"
                      value={leaseData.propertyAddressNo}
                      onChange={(e) => setLeaseData({ ...leaseData, propertyAddressNo: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ซอย (Soi/Alley)</label>
                    <input
                      type="text"
                      value={leaseData.alley}
                      onChange={(e) => setLeaseData({ ...leaseData, alley: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ถนน (Road)</label>
                    <input
                      type="text"
                      value={leaseData.road}
                      onChange={(e) => setLeaseData({ ...leaseData, road: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ตำบล / แขวง (Subdistrict)</label>
                    <input
                      type="text"
                      value={leaseData.subdistrict}
                      onChange={(e) => setLeaseData({ ...leaseData, subdistrict: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">อำเภอ / เขต (District)</label>
                    <input
                      type="text"
                      value={leaseData.district}
                      onChange={(e) => setLeaseData({ ...leaseData, district: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">จังหวัด (Province)</label>
                    <input
                      type="text"
                      value={leaseData.province}
                      onChange={(e) => setLeaseData({ ...leaseData, province: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Lease Term */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>ข้อ 2. ระยะเวลาการเช่า (Term of Lease)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ระยะเวลาขั้นต่ำ (ปี)</label>
                    <input
                      type="number"
                      min={1}
                      value={leaseData.minimumYear}
                      onChange={(e) => setLeaseData({ ...leaseData, minimumYear: Number(e.target.value) || 1 })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">วันเริ่มต้นสัญญา (Start Date)</label>
                    <input
                      type="date"
                      value={leaseData.leaseStartDate}
                      onChange={(e) => setLeaseData({ ...leaseData, leaseStartDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">วันสิ้นสุดสัญญา (End Date)</label>
                    <input
                      type="date"
                      value={leaseData.leaseEndDate}
                      onChange={(e) => setLeaseData({ ...leaseData, leaseEndDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Fees, Security Deposit, Utilities */}
          {editorSection === 'deposit_rules' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rent & Payment Terms */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span>ข้อ 3. ค่าเช่าและการชำระเงิน (Rental Fee & Bank)</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">ค่าเช่ารายเดือน (บาท/เดือน)</label>
                      <input
                        type="number"
                        value={leaseData.monthlyRent}
                        onChange={(e) => setLeaseData({ ...leaseData, monthlyRent: Number(e.target.value) || 0 })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">กำหนดชำระภายในวันที่</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={leaseData.paymentDueDay}
                        onChange={(e) => setLeaseData({ ...leaseData, paymentDueDay: Number(e.target.value) || 5 })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="เช่น 5 ของทุกเดือน"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">ธนาคาร</label>
                        <input
                          type="text"
                          value={leaseData.bankName}
                          onChange={(e) => setLeaseData({ ...leaseData, bankName: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">เลขบัญชีรับเงิน</label>
                        <input
                          type="text"
                          value={leaseData.bankAccountNo}
                          onChange={(e) => setLeaseData({ ...leaseData, bankAccountNo: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อบัญชีรับเงิน</label>
                      <input
                        type="text"
                        value={leaseData.bankAccountName}
                        onChange={(e) => setLeaseData({ ...leaseData, bankAccountName: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">ค่าปรับชำระล่าช้า (บาท/วัน)</label>
                      <input
                        type="number"
                        value={leaseData.latePenaltyPerDay}
                        onChange={(e) => setLeaseData({ ...leaseData, latePenaltyPerDay: Number(e.target.value) || 0 })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-red-600 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Deposit & Advance & Utilities */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>ข้อ 4-5. เงินประกัน & ค่าน้ำไฟ (Deposit & Utilities)</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">เงินประกันความเสียหาย (บาท)</label>
                        <input
                          type="number"
                          value={leaseData.securityDeposit}
                          onChange={(e) => setLeaseData({ ...leaseData, securityDeposit: Number(e.target.value) || 0 })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">ค่าเช่าล่วงหน้า 1 เดือน (บาท)</label>
                        <input
                          type="number"
                          value={leaseData.advanceRent}
                          onChange={(e) => setLeaseData({ ...leaseData, advanceRent: Number(e.target.value) || 0 })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-100/50 border border-blue-200 text-blue-900 text-xs font-semibold flex justify-between">
                      <span>รวมยอดชำระวันทำสัญญา (ประกัน + ล่วงหน้า):</span>
                      <span>{formatMoney((leaseData.securityDeposit || 0) + (leaseData.advanceRent || 0))} บาท</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">ค่าน้ำประปา (บาท/หน่วย)</label>
                        <input
                          type="number"
                          value={leaseData.waterRatePerUnit}
                          onChange={(e) => setLeaseData({ ...leaseData, waterRatePerUnit: Number(e.target.value) || 0 })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">ค่าไฟฟ้า (บาท/หน่วย)</label>
                        <input
                          type="number"
                          value={leaseData.electricityRatePerUnit}
                          onChange={(e) => setLeaseData({ ...leaseData, electricityRatePerUnit: Number(e.target.value) || 0 })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">คืนเงินประกันภายใน (วันทำการ)</label>
                        <input
                          type="number"
                          value={leaseData.refundDaysAfterExit}
                          onChange={(e) => setLeaseData({ ...leaseData, refundDaysAfterExit: Number(e.target.value) || 15 })}
                          className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">ค้างเกินกี่วันบอกเลิกสัญญา</label>
                        <input
                          type="number"
                          value={leaseData.terminationArrearsDays}
                          onChange={(e) => setLeaseData({ ...leaseData, terminationArrearsDays: Number(e.target.value) || 15 })}
                          className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Inventory Checklist */}
          {editorSection === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    รายการตรวจรับทรัพย์สินและอุปกรณ์ (Furniture & Equipment Inventory)
                  </h3>
                  <p className="text-xs text-slate-500">
                    แสดงในหน้า 4 ของสัญญาเช่า ให้ผู้เช่าและผู้ให้เช่าตรวจสอบสภาพร่วมกันก่อนส่งมอบกุญแจ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddInventoryItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายการ</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-12 text-center">ลำดับ</th>
                      <th className="p-2.5">รายการทรัพย์สิน (ไทย)</th>
                      <th className="p-2.5">รายการภาษาอังกฤษ (En)</th>
                      <th className="p-2.5 w-24">จำนวน</th>
                      <th className="p-2.5 w-32">สภาพ ณ วันรับมอบ</th>
                      <th className="p-2.5">หมายเหตุ</th>
                      <th className="p-2.5 w-12 text-center">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {leaseData.inventory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-semibold text-slate-500">{item.no}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.itemDescription}
                            onChange={(e) => handleUpdateInventoryItem(idx, 'itemDescription', e.target.value)}
                            className="w-full text-xs px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.itemDescriptionEn}
                            onChange={(e) => handleUpdateInventoryItem(idx, 'itemDescriptionEn', e.target.value)}
                            className="w-full text-xs px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={item.qty}
                              onChange={(e) => handleUpdateInventoryItem(idx, 'qty', e.target.value)}
                              className="w-10 text-xs px-1.5 py-1 border border-slate-300 rounded text-center"
                            />
                            <input
                              type="text"
                              value={item.unitTh}
                              onChange={(e) => handleUpdateInventoryItem(idx, 'unitTh', e.target.value)}
                              className="w-12 text-xs px-1 py-1 border border-slate-300 rounded text-center"
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.condition}
                            onChange={(e) => handleUpdateInventoryItem(idx, 'condition', e.target.value)}
                            className="w-full text-xs px-2 py-1 border border-slate-300 rounded text-emerald-700 font-medium"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.remark || ''}
                            onChange={(e) => handleUpdateInventoryItem(idx, 'remark', e.target.value)}
                            className="w-full text-xs px-2 py-1 border border-slate-300 rounded"
                            placeholder="เช่น ยี่ห้อ Daikin"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveInventoryItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1 transition cursor-pointer"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Preview Switch Button */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveSubTab('preview')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              <span>เสร็จสิ้น ดูตัวอย่างหน้า A4 พร้อมส่งออก</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. A4 Multi-Page Layout Container (Always mounted in DOM for robust PDF capture) */}
      <div className={`space-y-8 ${activeSubTab === 'editor' ? 'hidden print:block' : 'block'}`}>
        {/* Interactive Layout & Typography Control Bar (Preview Mode) */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-xl text-white print:hidden space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>จัดหน้าสัญญาเช่า 2 ภาษา (ไทย-English) บนกระดาษ A4</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-600 text-blue-100 font-medium">4 หน้าพอดี</span>
                </h4>
                <p className="text-xs text-slate-400">
                  ปรับขนาดตัวอักษรและระยะบรรทัดให้พอดีหน้ากระดาษ A4 ไม่เหลือพื้นที่ว่าง และคงข้อความ 2 ภาษาครบถ้วนทุกข้อ
                </p>
              </div>
            </div>

            {/* Quick Page Jump Navigation */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1 text-[11px]">เลื่อนไปหน้า:</span>
              {[1, 2, 3, 4].map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`lease-page-${pageNum}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition"
                >
                  หน้า {pageNum}
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Font Size & Line Spacing */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Font Size Scaling */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-medium text-[11px]">ขนาดตัวอักษร A4:</span>
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setFontSizeScale('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    fontSizeScale === 'standard'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>มาตรฐานเต็มหน้า (12.5px)</span>
                  <span className="text-[10px] opacity-75">★ แนะนำ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeScale('large')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    fontSizeScale === 'large'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  ตัวใหญ่พิเศษ (13.5px)
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeScale('compact')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    fontSizeScale === 'compact'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  กะทัดรัด (11.5px)
                </button>
              </div>
            </div>

            {/* Paragraph Spacing Scaling */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-medium text-[11px]">ระยะห่างข้อสัญญา:</span>
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setSpacingScale('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    spacingScale === 'standard'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  สมดุลพอดีหน้า (Balanced)
                </button>
                <button
                  type="button"
                  onClick={() => setSpacingScale('spacious')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    spacingScale === 'spacious'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  เว้นโปร่งสบาย (Relaxed)
                </button>
                <button
                  type="button"
                  onClick={() => setSpacingScale('compact')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    spacingScale === 'compact'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  กระชับ (Tight)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------- */}
        {/* PAGE 1: Parties, Property & Rental Terms (ข้อ 1 - 3.2)               */}
        {/* -------------------------------------------------------------------- */}
        <div
          ref={page1Ref}
          id="lease-page-1"
          className="lease-a4-page mx-auto bg-white text-slate-950 shadow-2xl border border-slate-300 font-serif"
          style={{
            width: '210mm',
            minHeight: '297mm',
            height: '297mm',
            maxHeight: '297mm',
            padding: '12mm 15mm',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          <div>
            {/* Header */}
            <div className="text-center border-b-2 border-slate-950 pb-2 mb-3">
              <h2 className="text-lg font-bold tracking-wide uppercase text-slate-950">
                สัญญาเช่าห้องพักเพื่อการอยู่อาศัย
              </h2>
              <p className="text-xs font-bold text-slate-800 tracking-wider">
                RESIDENTIAL LEASE AGREEMENT
              </p>
            </div>

            {/* Place & Date (Bilingual) */}
            <div className="text-right text-[11.5px] leading-snug mb-3 space-y-0.5 font-sans">
              <div>
                <span className="text-slate-600">สัญญาฉบับนี้ทำขึ้น ณ / This Agreement is made at:</span>{' '}
                <span className="font-bold underline decoration-dotted decoration-slate-400">
                  {leaseData.madeAt || 'หอพัก พีแอนด์เจ'}
                </span>
              </div>
              <div>
                <span className="text-slate-600">วันที่ / Date:</span>{' '}
                <span className="font-bold underline decoration-dotted decoration-slate-400">
                  {formatThaiDate(leaseData.agreementDate)}
                </span>{' '}
                <span className="text-slate-500 italic">({formatEnDate(leaseData.agreementDate)})</span>
              </div>
            </div>

            {/* Parties Preamble (Bilingual) */}
            <div className={`${clauseGapClass} mb-3`}>
              <p className={`${thaiTextClass} text-justify indent-6`}>
                สัญญาฉบับนี้ทำขึ้นระหว่าง <span className="font-bold underline decoration-dotted decoration-slate-500">{leaseData.lessorName}</span> 
                {leaseData.lessorIdCard && <span> เลขประจำตัว {leaseData.lessorIdCard}</span>} อยู่เลขที่ <span className="underline decoration-dotted decoration-slate-500">{leaseData.lessorAddress}</span> โทรศัพท์ <span className="underline decoration-dotted decoration-slate-500">{leaseData.lessorPhone}</span> 
                {' '}ซึ่งต่อไปในสัญญานี้จะเรียกว่า <span className="font-bold">"ผู้ให้เช่า"</span> ฝ่ายหนึ่ง กับ
              </p>
              <p className={`${enTextClass} text-justify indent-6 -mt-1.5`}>
                (This Agreement is made by and between <span className="font-semibold">{leaseData.lessorName}</span>, residing at {leaseData.lessorAddress}, Phone: {leaseData.lessorPhone}, hereinafter referred to as the <span className="font-semibold">"Lessor"</span> of the one part, and)
              </p>

              <p className={`${thaiTextClass} text-justify indent-6`}>
                <span className="font-bold underline decoration-dotted decoration-slate-500">{leaseData.lesseeName}</span> 
                <span> เลขประจำตัวประชาชน/หนังสือเดินทาง <span className="font-semibold underline decoration-dotted decoration-slate-500">{leaseData.lesseeIdCard}</span></span> อยู่เลขที่ <span className="underline decoration-dotted decoration-slate-500">{leaseData.lesseeAddress}</span> โทรศัพท์ <span className="underline decoration-dotted decoration-slate-500">{leaseData.lesseePhone}</span> 
                {' '}ซึ่งต่อไปในสัญญานี้จะเรียกว่า <span className="font-bold">"ผู้เช่า"</span> อีกฝ่ายหนึ่ง
              </p>
              <p className={`${enTextClass} text-justify indent-6 -mt-1.5`}>
                (<span className="font-semibold">{leaseData.lesseeName}</span>, Passport/ID No. {leaseData.lesseeIdCard}, residing at {leaseData.lesseeAddress}, Phone: {leaseData.lesseePhone}, hereinafter referred to as the <span className="font-semibold">"Lessee"</span> of the other part.)
              </p>

              <p className={`${thaiTextClass} text-justify indent-6 font-medium`}>
                คู่สัญญาทั้งสองฝ่ายได้ตกลงทำสัญญากันโดยมีข้อความและเงื่อนไขดังต่อไปนี้:
              </p>
              <p className={`${enTextClass} text-justify indent-6 -mt-1.5`}>
                (Both parties agree to enter into this Agreement under the following terms and conditions:)
              </p>
            </div>

            {/* Section 1: Property */}
            <div className={clauseGapClass}>
              <div>
                <div className={sectionHeadingClass}>
                  ข้อ 1. ทรัพย์สินที่เช่าและวัตถุประสงค์ / Leased Property and Purpose
                </div>
                <p className={`${thaiTextClass} text-justify indent-4 mt-0.5`}>
                  ผู้ให้เช่าตกลงให้เช่า และผู้เช่าตกลงเช่าห้องพักเลขที่ <span className="font-bold underline decoration-dotted decoration-slate-600 px-1">{leaseData.roomNo}</span> อาคาร/หอพัก <span className="font-semibold underline decoration-dotted decoration-slate-600">{leaseData.buildingName}</span> 
                  {' '}ตั้งอยู่เลขที่ <span className="underline decoration-dotted decoration-slate-400">{leaseData.propertyAddressNo}</span> ซอย <span className="underline decoration-dotted decoration-slate-400">{leaseData.alley}</span> ถนน <span className="underline decoration-dotted decoration-slate-400">{leaseData.road}</span> ตำบล/แขวง <span className="underline decoration-dotted decoration-slate-400">{leaseData.subdistrict}</span> อำเภอ/เขต <span className="underline decoration-dotted decoration-slate-400">{leaseData.district}</span> จังหวัด <span className="underline decoration-dotted decoration-slate-400">{leaseData.province}</span>
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  The Lessor agrees to lease and the Lessee agrees to rent Room No. {leaseData.roomNo}, Building {leaseData.buildingName}, located at {leaseData.propertyAddressNo}, Soi {leaseData.alley}, Road {leaseData.road}, Sub-district {leaseData.subdistrict}, District {leaseData.district}, Province {leaseData.province}.
                </p>

                <p className={`${thaiTextClass} text-justify indent-4 mt-1`}>
                  1.1 ผู้เช่าตกลงว่าจะใช้สถานที่เช่านี้เพื่อการอยู่อาศัยของตนเท่านั้น ห้ามนำไปใช้ประกอบการค้า ธุรกิจ หรือดำเนินกิจกรรมใดๆ ที่ขัดต่อกฎหมาย ความสงบเรียบร้อย หรือศีลธรรมอันดีงามของประชาชน
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  1.1 The Lessee agrees to use the leased premises exclusively for residential purposes, and shall not use the property for commercial trade, business, or any unlawful, immoral, or disruptive activities.
                </p>
              </div>

              {/* Section 2: Term */}
              <div>
                <div className={sectionHeadingClass}>
                  ข้อ 2. ระยะเวลาการเช่า / Lease Term
                </div>
                <p className={`${thaiTextClass} text-justify indent-4 mt-0.5`}>
                  คู่สัญญาตกลงกำหนดระยะเวลาการเช่าขั้นต่ำ <span className="font-bold underline decoration-dotted decoration-slate-600">{leaseData.minimumYear} ปี</span> เริ่มต้นตั้งแต่วันที่ <span className="font-semibold underline decoration-dotted decoration-slate-600">{formatThaiDate(leaseData.leaseStartDate)}</span> ถึงวันที่ <span className="font-semibold underline decoration-dotted decoration-slate-600">{formatThaiDate(leaseData.leaseEndDate)}</span>
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  The parties agree to a minimum lease term of {leaseData.minimumYear} year(s), starting from {formatEnDate(leaseData.leaseStartDate)} to {formatEnDate(leaseData.leaseEndDate)}.
                </p>

                <p className={`${thaiTextClass} text-justify indent-4 mt-1`}>
                  2.1 หากครบกำหนดระยะเวลาดังกล่าวและประสงค์จะต่อสัญญาเช่า ผู้เช่าต้องแจ้งความประสงค์เป็นลายลักษณ์อักษรแก่ผู้ให้เช่าล่วงหน้าไม่น้อยกว่า 30 วัน ก่อนสิ้นสุดสัญญา โดยเงื่อนไขค่าเช่าให้เป็นไปตามข้อตกลงใหม่
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  2.1 Upon expiration of the lease term, if the Lessee wishes to renew the contract, the Lessee must notify the Lessor in writing at least 30 days prior to the expiration date, subject to revised mutual terms.
                </p>
              </div>

              {/* Section 3: Rent */}
              <div>
                <div className={sectionHeadingClass}>
                  ข้อ 3. ค่าเช่าและการชำระเงิน / Rental Fee and Payment Terms
                </div>
                <p className={`${thaiTextClass} text-justify indent-4 mt-0.5`}>
                  3.1 ผู้เช่าตกลงชำระค่าเช่าให้แก่ผู้ให้เช่าเป็นรายเดือน ในอัตราเดือนละ <span className="font-bold underline decoration-dotted decoration-slate-600 px-1">{formatMoney(leaseData.monthlyRent)} บาท (THB)</span>
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  3.1 The Lessee agrees to pay the Lessor rent at the rate of THB {formatMoney(leaseData.monthlyRent)} per month.
                </p>

                <p className={`${thaiTextClass} text-justify indent-4 mt-1`}>
                  3.2 ผู้เช่าตกลงชำระค่าเช่าล่วงหน้าภายใน <span className="font-bold underline decoration-dotted decoration-slate-600">วันที่ {leaseData.paymentDueDay} ของทุกเดือน</span> โดยการโอนเงินเข้าบัญชีเงินฝากธนาคาร <span className="font-semibold underline decoration-dotted decoration-slate-600">{leaseData.bankName}</span> เลขที่บัญชี <span className="font-bold underline decoration-dotted decoration-slate-600">{leaseData.bankAccountNo}</span> ชื่อบัญชี <span className="font-semibold underline decoration-dotted decoration-slate-600">{leaseData.bankAccountName}</span> และส่งหลักฐานการโอน (สลิป) ให้แก่ผู้ให้เช่าหรือผู้ดูแลหอพักทราบทันที
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  3.2 The Lessee agrees to pay rent in advance within the {getOrdinal(leaseData.paymentDueDay || 5)} day of each month by transferring to Bank: {leaseData.bankName}, Account No: {leaseData.bankAccountNo}, Account Name: {leaseData.bankAccountName}, and promptly provide payment receipt evidence.
                </p>
              </div>
            </div>
          </div>

          {/* Page 1 Footer */}
          <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[10.5px] text-slate-600 font-sans mt-2">
            <div>สัญญาเช่าห้องพักเลขที่ {leaseData.roomNo} ({leaseData.buildingName})</div>
            <div className="font-semibold">หน้า 1 / 4 (Page 1 of 4)</div>
            <div className="flex gap-4">
              <span>ลงชื่อย่อผู้ให้เช่า / Lessor: ...............</span>
              <span>ลงชื่อย่อผู้เช่า / Lessee: ...............</span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------- */}
        {/* PAGE 2: Security Deposit, Utilities & Rules (ข้อ 3.3 - 6.3)           */}
        {/* -------------------------------------------------------------------- */}
        <div
          ref={page2Ref}
          id="lease-page-2"
          className="lease-a4-page mx-auto bg-white text-slate-950 shadow-2xl border border-slate-300 font-serif"
          style={{
            width: '210mm',
            minHeight: '297mm',
            height: '297mm',
            maxHeight: '297mm',
            padding: '12mm 15mm',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          <div>
            {/* Header */}
            <div className="text-center border-b border-slate-300 pb-1.5 mb-3">
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-900">
                สัญญาเช่าห้องพักเพื่อการอยู่อาศัย (หน้า 2/4)
              </h3>
              <p className="text-[10px] font-semibold text-slate-600 tracking-wider">
                RESIDENTIAL LEASE AGREEMENT — TERMS & CONDITIONS (CONTINUED)
              </p>
            </div>

            <div className={clauseGapClass}>
              {/* Clause 3.3 */}
              <div>
                <p className={`${thaiTextClass} text-justify indent-4`}>
                  3.3 หากผู้เช่าชำระค่าเช่าล่าช้าเกินกำหนดวันที่ 1 ของวันครบกำหนดชำระ ผู้เช่ายินยอมเสียค่าปรับให้แก่ผู้ให้เช่าในอัตรา <span className="font-bold underline decoration-dotted decoration-slate-600">วันละ {leaseData.latePenaltyPerDay} บาท</span> นับแต่วันที่ผิดนัดจนกว่าจะชำระเสร็จสิ้น
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  3.3 If the rent payment is overdue by more than 1 day from the due date, the Lessee agrees to pay a late fine of THB {leaseData.latePenaltyPerDay} per day until the full amount is settled.
                </p>
              </div>

              {/* Section 4: Security Deposit */}
              <div>
                <div className={sectionHeadingClass}>
                  ข้อ 4. เงินประกันความเสียหายและค่าเช่าล่วงหน้า / Security Deposit and Advance Rent
                </div>
                <p className={`${thaiTextClass} text-justify indent-4 mt-0.5`}>
                  ในวันทำสัญญานี้ ผู้เช่าได้วางเงินให้แก่ผู้ให้เช่าครบถ้วนแล้ว ดังนี้:
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  Upon signing this Agreement, the Lessee has paid the Lessor in full as follows:
                </p>

                <div className="pl-5 space-y-1.5 my-2 border-l-2 border-slate-400 bg-slate-50/50 p-2 rounded-r-lg">
                  <div>
                    <span className={`${thaiTextClass} font-semibold`}>
                      4.1 เงินประกันความเสียหายห้องพักและทรัพย์สิน (1 เดือน):{' '}
                      <span className="underline decoration-dotted decoration-slate-600 font-bold">{formatMoney(leaseData.securityDeposit)} บาท</span>
                    </span>
                    <div className={`${enTextClass}`}>
                      Security deposit for property and damage (1 month): THB {formatMoney(leaseData.securityDeposit)}
                    </div>
                  </div>
                  <div>
                    <span className={`${thaiTextClass} font-semibold`}>
                      4.2 ค่าเช่าห้องพักล่วงหน้า (1 เดือน):{' '}
                      <span className="underline decoration-dotted decoration-slate-600 font-bold">{formatMoney(leaseData.advanceRent)} บาท</span>
                    </span>
                    <div className={`${enTextClass}`}>
                      Advance room rental fee (1 month): THB {formatMoney(leaseData.advanceRent)}
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200">
                    <span className={`${thaiTextClass} font-bold text-slate-950`}>
                      รวมยอดเงินที่ชำระทั้งสิ้น ณ วันทำสัญญา:{' '}
                      <span className="underline decoration-double decoration-slate-900 text-sm font-extrabold">
                        {formatMoney((leaseData.securityDeposit || 0) + (leaseData.advanceRent || 0))} บาท (THB)
                      </span>
                    </span>
                    <div className={`${enTextClass} font-medium`}>
                      Total Amount Paid on Signing Date: THB {formatMoney((leaseData.securityDeposit || 0) + (leaseData.advanceRent || 0))}
                    </div>
                  </div>
                </div>

                <p className={`${thaiTextClass} text-justify indent-4 mt-1.5`}>
                  <span className="font-semibold">เงื่อนไขการคืนเงินประกัน:</span> เงินประกันความเสียหายตามข้อ 4.1 ผู้ให้เช่าจะคืนให้แก่ผู้เช่าภายใน <span className="font-semibold underline decoration-dotted decoration-slate-600">{leaseData.refundDaysAfterExit} วันทำการ</span> หลังจากผู้เช่าส่งมอบห้องพักคืนในสภาพเรียบร้อย สะอาด ไม่มีสิ่งของชำรุดเสียหาย และได้ชำระค่าเช่า ค่าน้ำ ค่าไฟ ตลอดจนหนี้สินอื่นใดครบถ้วนแล้ว
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  Deposit Refund Conditions: The security deposit shall be refunded to the Lessee within {leaseData.refundDaysAfterExit} business days after vacating and returning the room in clean, undamaged condition, and after all rent, utilities, and liabilities are settled in full.
                </p>

                <p className={`${thaiTextClass} text-justify indent-4 mt-1 text-red-800 font-medium`}>
                  <span className="font-bold">ข้อกำหนดการริบเงินประกัน:</span> หากผู้เช่าบอกเลิกสัญญาก่อนครบกำหนด {leaseData.minimumYear} ปี หรือกระทำผิดสัญญาข้อใดข้อหนึ่งจนเป็นเหตุให้ผู้ให้เช่าบอกเลิกสัญญา ผู้เช่ายินยอมให้ผู้ให้เช่าริบเงินประกันความเสียหายทั้งหมดทันทีโดยไม่มีข้อโต้แย้งใดๆ ทั้งสิ้น
                </p>
                <p className={`${enTextClass} text-justify indent-4 text-red-700`}>
                  Forfeiture of Deposit: If the Lessee vacates prior to the completion of the {leaseData.minimumYear}-year term or breaches any terms of this Agreement causing termination, the Lessor reserves the right to forfeit the entire security deposit immediately.
                </p>
              </div>

              {/* Section 5: Utilities */}
              <div>
                <div className={sectionHeadingClass}>
                  ข้อ 5. ค่าสาธารณูปโภคและค่าบริการ / Utilities & Service Fees
                </div>
                <p className={`${thaiTextClass} text-justify indent-4 mt-0.5`}>
                  ผู้เช่าตกลงเป็นผู้รับผิดชอบค่าใช้จ่ายเกี่ยวกับสาธารณูปโภคที่ใช้ไปในห้องพักตามที่ปรากฏในมาตรวัด ดังนี้:
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  The Lessee agrees to be responsible for utility expenses consumed in the room based on meter readings as follows:
                </p>

                <div className="pl-5 space-y-1 my-1.5 border-l-2 border-slate-400 bg-slate-50/50 p-2 rounded-r-lg">
                  <p className={`${thaiTextClass}`}>
                    5.1 ค่าน้ำประปา คิดตามอัตราหน่วยละ <span className="font-bold underline decoration-dotted decoration-slate-600">{leaseData.waterRatePerUnit} บาท/หน่วย</span>
                  </p>
                  <p className={`${enTextClass} -mt-1`}>
                    Water supply charge: THB {leaseData.waterRatePerUnit} per unit.
                  </p>
                  <p className={`${thaiTextClass}`}>
                    5.2 ค่าไฟฟ้า คิดตามอัตราหน่วยละ <span className="font-bold underline decoration-dotted decoration-slate-600">{leaseData.electricityRatePerUnit} บาท/หน่วย</span>
                  </p>
                  <p className={`${enTextClass} -mt-1`}>
                    Electricity supply charge: THB {leaseData.electricityRatePerUnit} per unit.
                  </p>
                </div>

                <p className={`${thaiTextClass} text-justify indent-4 mt-1`}>
                  5.3 ผู้เช่าตกลงชำระค่าน้ำ ค่าไฟ พร้อมกับค่าเช่าประจำเดือนภายในกำหนดตามที่ได้รับใบแจ้งหนี้จากผู้ให้เช่า
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  5.3 The Lessee agrees to pay utility charges together with the monthly rent as specified in the invoice issued by the Lessor.
                </p>
              </div>

              {/* Section 6: Maintenance & Prohibitions (Part 1) */}
              <div>
                <div className={sectionHeadingClass}>
                  ข้อ 6. การดูแลรักษาและข้อห้ามในการพักอาศัย / Maintenance and Restrictions
                </div>
                <p className={`${thaiTextClass} text-justify indent-4 mt-0.5`}>
                  6.1 ผู้เช่าต้องดูแลรักษาห้องพัก เฟอร์นิเจอร์ และอุปกรณ์ให้อยู่ในสภาพดี ห้ามตอกตะปู เจาะผนัง ติดตั้งอุปกรณ์ ดัดแปลง ทาสี หรือต่อเติมส่วนใดๆ ของห้องพักโดยมิได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่า
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  6.1 The Lessee must maintain the room, furniture, and equipment in good condition. Hammering nails, drilling walls, repainting, modifying, or altering any part of the premises without prior written consent is strictly prohibited.
                </p>

                <p className={`${thaiTextClass} text-justify indent-4 mt-1`}>
                  6.2 <span className="font-semibold">ห้ามนำวัตถุไวไฟ</span> สารเคมีอันตราย แก๊สหุงต้ม หรือสิ่งผิดกฎหมาย ยาเสพติด หรืออาวุธร้ายแรงเข้ามาในห้องพักหรือบริเวณอาคารโดยเด็ดขาด
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  6.2 Flammable substances, hazardous chemicals, cooking gas cylinders, illegal drugs, or dangerous weapons are strictly prohibited on the premises.
                </p>

                <p className={`${thaiTextClass} text-justify indent-4 mt-1`}>
                  6.3 <span className="font-semibold">ห้ามเลี้ยงสัตว์ทุกชนิด</span> (เช่น สุนัข แมว นก) และห้ามส่งเสียงดังรบกวนความสงบสุขของผู้เช่าห้องอื่นในอาคาร
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  6.3 Pets of any kind (e.g., dogs, cats, birds) are strictly prohibited, and causing loud noise or disturbance to other residents is forbidden.
                </p>
              </div>
            </div>
          </div>

          {/* Page 2 Footer */}
          <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[10.5px] text-slate-600 font-sans mt-2">
            <div>สัญญาเช่าห้องพักเลขที่ {leaseData.roomNo} ({leaseData.buildingName})</div>
            <div className="font-semibold">หน้า 2 / 4 (Page 2 of 4)</div>
            <div className="flex gap-4">
              <span>ลงชื่อย่อผู้ให้เช่า / Lessor: ...............</span>
              <span>ลงชื่อย่อผู้เช่า / Lessee: ...............</span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------- */}
        {/* PAGE 3: Termination, Vacating & Signatures (ข้อ 6.4 - 10)            */}
        {/* -------------------------------------------------------------------- */}
        <div
          ref={page3Ref}
          id="lease-page-3"
          className="lease-a4-page mx-auto bg-white text-slate-950 shadow-2xl border border-slate-300 font-serif"
          style={{
            width: '210mm',
            minHeight: '297mm',
            height: '297mm',
            maxHeight: '297mm',
            padding: '12mm 15mm',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          <div>
            {/* Header */}
            <div className="text-center border-b border-slate-300 pb-1.5 mb-3">
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-900">
                สัญญาเช่าห้องพักเพื่อการอยู่อาศัย (หน้า 3/4)
              </h3>
              <p className="text-[10px] font-semibold text-slate-600 tracking-wider">
                TERMINATION, DISPUTE RESOLUTION & EXECUTION SIGNATURES
              </p>
            </div>

            <div className={clauseGapClass}>
              {/* 6.4 Subletting */}
              <div>
                <p className={`${thaiTextClass} text-justify indent-4`}>
                  6.4 <span className="font-semibold">ห้ามนำห้องพักไปให้เช่าช่วง (No Subletting)</span> หรือโอนสิทธิ์การเช่าให้แก่ผู้อื่นโดยมิได้รับความยินยอมจากผู้ให้เช่าเป็นลายลักษณ์อักษร
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  6.4 Subletting or transferring the lease rights to any third party without prior written consent from the Lessor is strictly prohibited.
                </p>
              </div>

              {/* Section 7: Inspection */}
              <div>
                <div className={sectionHeadingClass}>
                  ข้อ 7. การตรวจสภาพห้องพัก / Right of Inspection
                </div>
                <p className={`${thaiTextClass} text-justify indent-4 mt-0.5`}>
                  ผู้ให้เช่าหรือตัวแทนมีสิทธิ์เข้าตรวจสภาพห้องพักได้ตามสมควรในเวลาอันควร โดยแจ้งให้ผู้เช่าทราบล่วงหน้าไม่น้อยกว่า 24 ชั่วโมง เว้นแต่กรณีเกิดเหตุฉุกเฉินหรือมีเหตุอันควรสงสัยว่าอาจเกิดความเสียหายร้ายแรงต่ออาคาร ผู้ให้เช่ามีสิทธิ์เข้าห้องพักได้ทันที
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  The Lessor or designated representative has the right to inspect the leased premises upon giving at least 24 hours prior notice, except in case of emergency or reasonable suspicion of imminent hazard where immediate entry is permitted.
                </p>
              </div>

              {/* Section 8: Termination */}
              <div>
                <div className={sectionHeadingClass}>
                  ข้อ 8. การบอกเลิกสัญญาและการย้ายออก / Termination and Vacating
                </div>
                <p className={`${thaiTextClass} text-justify indent-4 mt-0.5`}>
                  8.1 หากผู้เช่าค้างชำระค่าเช่าหรือค่าสาธารณูปโภคเกินกว่า <span className="font-bold underline decoration-dotted decoration-slate-600">{leaseData.terminationArrearsDays} วัน</span> หรือผิดสัญญาข้อใดข้อหนึ่ง ผู้ให้เช่ามีสิทธิ์บอกเลิกสัญญา ระงับการจ่ายกระแสไฟฟ้าและน้ำประปา และเข้าครอบครองห้องพักได้ทันที
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  8.1 If the Lessee is in default of rent or utility payments for more than {leaseData.terminationArrearsDays} days or breaches any clause of this Agreement, the Lessor has the right to terminate the contract immediately, disconnect utilities, and repossess the room.
                </p>

                <p className={`${thaiTextClass} text-justify indent-4 mt-1`}>
                  8.2 เมื่อสัญญาเลิกกันไม่ว่าด้วยเหตุใด ผู้เช่าจะต้องขนย้ายทรัพย์สินและบริวารออกจากห้องพักภายใน <span className="font-bold underline decoration-dotted decoration-slate-600">{leaseData.vacateGraceDays} วัน</span> หากพ้นกำหนด ผู้เช่ายินยอมให้ผู้ให้เช่าขนย้ายทรัพย์สินของผู้เช่าไปเก็บไว้ที่อื่น โดยผู้เช่าเป็นผู้รับผิดชอบค่าใช้จ่ายทั้งหมด
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  8.2 Upon termination for any reason, the Lessee must vacate and remove all belongings within {leaseData.vacateGraceDays} days. Failing which, the Lessee agrees that the Lessor may remove and store the items elsewhere at the Lessee's sole expense.
                </p>
              </div>

              {/* Section 9: Return */}
              <div>
                <div className={sectionHeadingClass}>
                  ข้อ 9. การส่งมอบห้องพักคืน / Return of Property
                </div>
                <p className={`${thaiTextClass} text-justify indent-4 mt-0.5`}>
                  ในวันส่งมอบห้องพักคืน ผู้เช่าต้องส่งมอบกุญแจและคีย์การ์ดครบถ้วน พร้อมทำความสะอาดห้องพักให้อยู่ในสภาพเดียวกับวันเริ่มเช่า หากมีความเสียหายหรือสูญหายเกิดขึ้นแก่ทรัพย์สินของผู้ให้เช่า ผู้เช่ายินยอมให้หักค่าซ่อมแซมหรือค่าเสียหายจากเงินประกันความเสียหาย หากเงินประกันไม่พอ ผู้เช่าตกลงชดใช้ส่วนที่เหลือจนครบถ้วน
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  Upon handover, the Lessee must return all keys and keycards, and leave the premises in a clean and well-maintained condition. In case of damage or loss, repair costs shall be deducted from the security deposit; any deficit shall be compensated in full by the Lessee.
                </p>
              </div>

              {/* Section 10: Governing Law */}
              <div>
                <div className={sectionHeadingClass}>
                  ข้อ 10. กฎหมายที่ใช้บังคับและการระงับข้อพิพาท / Governing Law
                </div>
                <p className={`${thaiTextClass} text-justify indent-4 mt-0.5`}>
                  สัญญานี้ให้อยู่ภายใต้บังคับและการตีความตามกฎหมายแห่งราชอาณาจักรไทย ข้อพิพาทใดๆ ที่เกิดขึ้นให้อยู่ในเขตอำนาจของศาลยุติธรรมไทย
                </p>
                <p className={`${enTextClass} text-justify indent-4`}>
                  This Agreement shall be governed by and construed in accordance with the laws of the Kingdom of Thailand, under the exclusive jurisdiction of the Thai courts.
                </p>
              </div>

              {/* Closing Statement */}
              <div className="pt-1">
                <p className={`${thaiTextClass} text-justify indent-6 font-medium italic text-slate-900`}>
                  สัญญานี้ทำขึ้นเป็นสองฉบับ มีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยละเอียดตลอดแล้ว เห็นว่าถูกต้องตรงตามเจตนา จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน และต่างยึดถือไว้ฝ่ายละหนึ่งฉบับ
                </p>
                <p className={`${enTextClass} text-justify indent-6`}>
                  This Agreement is executed in duplicate with identical terms. Both parties have read and understood its contents thoroughly, find them fully agreeable, and have signed below as evidence in the presence of witnesses, each party retaining one original copy.
                </p>
              </div>
            </div>

            {/* Signatures 4-Box Grid */}
            <div className="pt-3 mt-2 border-t border-slate-300">
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-center text-xs">
                {/* Lessor */}
                <div className="space-y-1">
                  <div className="text-[11.5px] text-slate-700 font-sans">
                    ลงชื่อ / Signed: ............................................................ ผู้ให้เช่า
                  </div>
                  <div className="font-bold text-slate-950 text-sm">
                    ({leaseData.lessorSignName || leaseData.lessorName})
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans">Lessor Signature</div>
                </div>

                {/* Lessee */}
                <div className="space-y-1">
                  <div className="text-[11.5px] text-slate-700 font-sans">
                    ลงชื่อ / Signed: ............................................................ ผู้เช่า
                  </div>
                  <div className="font-bold text-slate-950 text-sm">
                    ({leaseData.lesseeSignName || leaseData.lesseeName})
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans">Lessee Signature</div>
                </div>

                {/* Witness 1 */}
                <div className="space-y-1 pt-1">
                  <div className="text-[11.5px] text-slate-700 font-sans">
                    ลงชื่อ / Signed: ............................................................ พยาน
                  </div>
                  <div className="font-semibold text-slate-800">
                    ({leaseData.witness1Name || '............................................................'})
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans">Witness 1</div>
                </div>

                {/* Witness 2 */}
                <div className="space-y-1 pt-1">
                  <div className="text-[11.5px] text-slate-700 font-sans">
                    ลงชื่อ / Signed: ............................................................ พยาน
                  </div>
                  <div className="font-semibold text-slate-800">
                    ({leaseData.witness2Name || '............................................................'})
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans">Witness 2</div>
                </div>
              </div>
            </div>
          </div>

          {/* Page 3 Footer */}
          <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[10.5px] text-slate-600 font-sans mt-2">
            <div>สัญญาเช่าห้องพักเลขที่ {leaseData.roomNo} ({leaseData.buildingName})</div>
            <div className="font-semibold">หน้า 3 / 4 (Page 3 of 4)</div>
            <div className="flex gap-4">
              <span>ลงชื่อย่อผู้ให้เช่า / Lessor: ...............</span>
              <span>ลงชื่อย่อผู้เช่า / Lessee: ...............</span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------- */}
        {/* PAGE 4: Furniture & Equipment Inventory Checklist                    */}
        {/* -------------------------------------------------------------------- */}
        <div
          ref={page4Ref}
          id="lease-page-4"
          className="lease-a4-page mx-auto bg-white text-slate-950 shadow-2xl border border-slate-300 font-serif"
          style={{
            width: '210mm',
            minHeight: '297mm',
            height: '297mm',
            maxHeight: '297mm',
            padding: '12mm 15mm',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          <div>
            {/* Header */}
            <div className="text-center border-b-2 border-slate-950 pb-2 mb-3">
              <h2 className="text-base font-bold tracking-wide uppercase text-slate-950">
                เอกสารแนบท้ายสัญญา: บันทึกการตรวจรับมอบห้องพักและทรัพย์สิน
              </h2>
              <p className="text-xs font-bold text-slate-700 tracking-wider">
                ANNEX: FURNITURE, APPLIANCES & ROOM INVENTORY CHECKLIST
              </p>
            </div>

            {/* Room Details Banner (Bilingual) */}
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs grid grid-cols-3 gap-2.5 mb-3 font-sans">
              <div>
                <span className="text-slate-500">ห้องพักเลขที่ / Room No.:</span>{' '}
                <span className="font-bold text-slate-950 text-sm">{leaseData.roomNo}</span>
              </div>
              <div>
                <span className="text-slate-500">อาคาร/หอพัก / Building:</span>{' '}
                <span className="font-semibold text-slate-950">{leaseData.buildingName}</span>
              </div>
              <div>
                <span className="text-slate-500">ชื่อผู้เช่า / Lessee Name:</span>{' '}
                <span className="font-semibold text-slate-950">{leaseData.lesseeName}</span>
              </div>
              <div>
                <span className="text-slate-500">วันที่ส่งมอบ / Inspection Date:</span>{' '}
                <span className="font-semibold text-slate-900">{formatThaiDate(leaseData.agreementDate)}</span>
              </div>
              <div>
                <span className="text-slate-500">เบอร์โทรศัพท์ / Phone:</span>{' '}
                <span className="font-semibold text-slate-900">{leaseData.lesseePhone}</span>
              </div>
              <div>
                <span className="text-slate-500">สถานะการส่งมอบ / Status:</span>{' '}
                <span className="font-bold text-emerald-700">ส่งมอบเรียบร้อย (Handed Over)</span>
              </div>
            </div>

            {/* Inventory Table (Bilingual) */}
            <div className="border border-slate-700 rounded overflow-hidden mb-3">
              <table className="w-full text-left border-collapse text-[11.5px] font-sans">
                <thead className="bg-slate-100 text-slate-950 font-bold border-b border-slate-400">
                  <tr>
                    <th className="p-2 w-10 text-center border-r border-slate-300">ลำดับ<br/><span className="text-[10px] font-normal text-slate-600">No.</span></th>
                    <th className="p-2 border-r border-slate-300">รายการทรัพย์สินและอุปกรณ์<br/><span className="text-[10px] font-normal text-slate-600">Description of Furniture & Appliances</span></th>
                    <th className="p-2 w-28 text-center border-r border-slate-300">จำนวน<br/><span className="text-[10px] font-normal text-slate-600">Qty / Unit</span></th>
                    <th className="p-2 w-36 border-r border-slate-300">สภาพ ณ วันรับมอบ<br/><span className="text-[10px] font-normal text-slate-600">Condition at Handover</span></th>
                    <th className="p-2 w-28 text-center">หมายเหตุ<br/><span className="text-[10px] font-normal text-slate-600">Remark</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {leaseData.inventory.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="p-2 text-center font-semibold text-slate-800 border-r border-slate-200">{item.no}</td>
                      <td className="p-2 border-r border-slate-200">
                        <div className="font-semibold text-slate-950 text-[12px]">{item.itemDescription}</div>
                        <div className="text-[10px] text-slate-600 font-serif italic">{item.itemDescriptionEn}</div>
                      </td>
                      <td className="p-2 text-center font-medium border-r border-slate-200">
                        <span className="font-bold text-slate-900">{item.qty}</span> {item.unitTh}{' '}
                        <span className="text-[9.5px] text-slate-500">({item.unitEn})</span>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium text-emerald-800">
                        <div className="text-[11.5px]">{item.condition}</div>
                        <div className="text-[9.5px] text-slate-500 italic">{item.conditionEn || 'Good / Normal'}</div>
                      </td>
                      <td className="p-2 text-center text-slate-600 text-[10.5px]">
                        {item.remark || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Joint Inspection Acknowledgement Statement (Bilingual) */}
            <div className="text-[11px] text-slate-800 leading-relaxed text-justify mb-4 space-y-1">
              <p className="indent-4 font-medium">
                ผู้เช่าและผู้ให้เช่าได้ร่วมกันตรวจสอบสภาพห้องพัก อุปกรณ์ เฟอร์นิเจอร์ และระบบสาธารณูปโภคต่างๆ ตามรายการข้างต้นเรียบร้อยแล้ว ถูกต้องครบถ้วนและอยู่ในสภาพใช้งานได้ตามปกติ จึงได้ลงลายมือชื่อรับมอบไว้เป็นหลักฐาน
              </p>
              <p className="indent-4 italic text-slate-600 text-[10.5px]">
                Both parties have jointly inspected the premises, furniture, appliances, and all utilities listed above, confirming they are complete, intact, and in good operating condition upon key handover, and have signed below as evidence.
              </p>
            </div>

            {/* Handover Signatures */}
            <div className="border-t border-slate-300 pt-3">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-1.5">
                  <div className="text-[11.5px] text-slate-700 font-sans">
                    ลงชื่อ / Signed: ............................................................ ผู้ให้เช่า/ผู้ส่งมอบ
                  </div>
                  <div className="font-bold text-slate-950 text-sm">
                    ({leaseData.lessorSignName || leaseData.lessorName})
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans">Lessor / Handover Signature</div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    วันที่ / Date: ............................................................
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11.5px] text-slate-700 font-sans">
                    ลงชื่อ / Signed: ............................................................ ผู้เช่า/ผู้รับมอบ
                  </div>
                  <div className="font-bold text-slate-950 text-sm">
                    ({leaseData.lesseeSignName || leaseData.lesseeName})
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans">Lessee / Receiver Signature</div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    วันที่ / Date: ............................................................
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page 4 Footer */}
          <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[10.5px] text-slate-600 font-sans mt-2">
            <div>เอกสารแนบท้ายห้องพักเลขที่ {leaseData.roomNo} ({leaseData.buildingName})</div>
            <div className="font-semibold">หน้า 4 / 4 (Page 4 of 4)</div>
            <div className="flex gap-4">
              <span>ลงชื่อย่อผู้ให้เช่า / Lessor: ...............</span>
              <span>ลงชื่อย่อผู้เช่า / Lessee: ...............</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
