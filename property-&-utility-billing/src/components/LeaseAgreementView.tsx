import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Shield,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  Languages,
  Copy,
  Check,
  Info
} from 'lucide-react';
import {
  RoomRecord,
  BuildingProfile,
  LandlordConfig,
  AppUser,
  LeaseAgreementData,
  LeaseInventoryItem
} from '../types';
import { exportElementsToMultiPageA4Pdf } from '../utils/pdfExport';
import { exportLeaseAgreementToExcel } from '../utils/leaseExcelExport';

interface LeaseAgreementViewProps {
  rooms: RoomRecord[];
  buildings: BuildingProfile[];
  config: LandlordConfig;
  currentUser: AppUser;
  onBackToOverview?: () => void;
  onUpdateRoomRecord?: (updated: RoomRecord) => void;
}

// Default Bilingual Clauses (ข้อ 9 - 12 และข้อความรับรองท้ายสัญญา)
export const DEFAULT_CLAUSES_BILINGUAL = {
  clause9_1Th: 'ผู้เช่าต้องรักษาความสะอาด ไม่ให้ห้องเช่ามีสิ่งสกปรก กลิ่นเหม็น หรือกระทำการเสียงดังรบกวนผู้อื่น หรือกระทำสิ่งใดๆ อันเป็นที่น่าหวาดเสียว หรือเป็นอันตรายต่อผู้พักอาศัยใกล้เคียง',
  clause9_1En: 'The Lessee shall maintain cleanliness and good hygiene within the leased premises, preventing any dirt, foul odors, or disturbing noises, and shall refrain from engaging in any acts that are alarming, hazardous, or cause disturbance or danger to neighboring residents.',

  clause9_2Th: 'ทรัพย์สิน ยานพาหนะ (รถยนต์/รถจักรยานยนต์) ของผู้เช่าหรือบริวาร หากเกิดความเสียหาย สูญหาย หรือบุบสลาย ผู้เช่าจะเป็นผู้รับผิดชอบเองทั้งสิ้น',
  clause9_2En: 'The Lessee shall bear sole and exclusive responsibility for any loss, theft, damage, or destruction to personal property and vehicles (cars/motorcycles) belonging to the Lessee, occupants, or their visitors.',

  clause9_3Th: 'หากมีสิ่งผิดกฎหมาย หรือการกระทำผิดกฎหมายเกิดขึ้นในบริเวณห้องเช่า ผู้เช่าต้องรับผิดชอบทุกประการ',
  clause9_3En: 'The Lessee shall be held strictly and entirely liable for any illegal substances, unlawful items, or illegal acts occurring within the leased premises.',

  clause10_1Th: 'ผู้เช่าได้ตรวจตราห้องเช่าและอุปกรณ์ครบถ้วนแล้ว หากอุปกรณ์เกิดความเสียหายหรือชำรุดในระหว่างการเช่า ผู้เช่าต้องเป็นผู้ออกค่าใช้จ่ายในการซ่อมแซมเอง',
  clause10_1En: 'The Lessee has thoroughly inspected and accepted the premises and all equipment in good condition. Should any equipment or fixture suffer damage or deterioration during the lease term, the Lessee shall bear all repair costs at their own expense.',

  clause10_2Th: 'กรณีเกิดอัคคีภัยขึ้น สัญญานี้เป็นอันสิ้นสุดลงทันที โดยผู้เช่าไม่มีสิทธิ์เรียกร้องค่าเสียหายจากผู้ให้เช่า',
  clause10_2En: 'In the event of a fire incident, this Agreement shall terminate immediately, and the Lessee shall have no right to claim any compensation or damages from the Lessor.',

  clause11_1Th: 'เงินประกันจะคืนให้เมื่อเช่าครบกำหนดสัญญา ย้ายออกโดยไม่ผิดสัญญา ไม่มีหนี้สินค้างชำระ และไม่มีทรัพย์สินชำรุดเสียหาย หากเงินประกันไม่พอชำระค่าเสียหาย ผู้เช่าต้องชำระส่วนที่ขาดให้ครบถ้วน หากไม่มีเงินสดชำระ ยินยอมให้ยึดถือทรัพย์สินไว้จนกว่าจะชำระครบ',
  clause11_1En: 'The security deposit shall be refunded upon expiration of the agreed lease term, provided that the Lessee vacates without breach of contract, without outstanding debt, and with no property damage. If the deposit is insufficient to cover all damages and debts, the Lessee shall settle the remaining balance in full; failing which, the Lessee agrees that the Lessor may retain personal belongings as security until full settlement is made.',

  clause11_2Th: 'หากย้ายออกก่อนครบกำหนดสัญญา ผู้ให้เช่าจะไม่คืนเงินประกัน และผู้เช่าต้องชำระค่าเช่าตามระยะเวลาที่ได้พักอาศัยจริง',
  clause11_2En: 'If the Lessee vacates the premises prior to the expiration of the lease contract, the Lessor reserves the right to forfeit the entire security deposit, and the Lessee remains obligated to pay rent for the actual period of occupancy.',

  clause11_3Th: 'เมื่อย้ายออกจากห้องพัก ผู้เช่าต้องทำความสะอาดห้องพักให้เรียบร้อย หากไม่ทำความสะอาด จะต้องชำระค่าทำความสะอาดเป็นเงิน 300 บาท',
  clause11_3En: 'Upon moving out, the Lessee must clean the room and restore it to a neat and tidy condition. If the Lessee fails to do so, a cleaning fee of THB 300 shall be charged or deducted.',

  clause12Th: 'ผู้เช่าสัญญาว่าจะปฏิบัติตามข้อตกลงในสัญญานี้ และปฏิบัติตามระเบียบข้อบังคับที่ผู้ให้เช่าประกาศกำหนดไว้ในบริเวณอาคารอย่างเคร่งครัด หากประพฤติผิดสัญญาข้อหนึ่งข้อใด ให้ถือว่าสัญญาเป็นอันระงับทันที และยินยอมขนย้ายสิ่งของออกจากที่ผู้ให้เช่ากำหนด',
  clause12En: 'The Lessee covenants and agrees to strictly comply with all provisions set forth in this Agreement, as well as all building rules and regulations announced by the Lessor within the premises. Any breach or violation of any clause shall result in the immediate termination of this Agreement, and the Lessee consents to promptly remove all belongings from the designated premises.',

  executionStatementTh: 'สัญญานี้ทำขึ้นเป็นสองฉบับ มีข้อความตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยละเอียดแล้ว จึงได้ลงลายมือชื่อไว้เป็นหลักฐาน',
  executionStatementEn: 'This Agreement is executed in duplicate with identical wording. Both parties have thoroughly read, understood, and agreed to all provisions herein, and have affixed their signatures below as evidence thereof.',
};

// 6 standard inventory items matching the exact document
const DEFAULT_INVENTORY_ITEMS: LeaseInventoryItem[] = [
  { no: 1, itemDescription: 'กุญแจและคีย์การ์ด', itemDescriptionEn: 'Keys & Keycards', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'เรียบร้อย', conditionEn: 'Intact', remark: '' },
  { no: 2, itemDescription: 'เครื่องปรับอากาศ + รีโมท', itemDescriptionEn: 'Air Conditioner & Remote', qty: '1', unitTh: 'เครื่อง', unitEn: 'Units', condition: 'ใช้งานได้ปกติ', conditionEn: 'Working', remark: '' },
  { no: 3, itemDescription: 'เตียงนอน / ที่นอน', itemDescriptionEn: 'Bed & Mattress', qty: '1', unitTh: 'หลัง', unitEn: 'Sets', condition: 'เรียบร้อย', conditionEn: 'Intact', remark: '' },
  { no: 4, itemDescription: 'ตู้เสื้อผ้า', itemDescriptionEn: 'Wardrobe', qty: '1', unitTh: 'หลัง', unitEn: 'Units', condition: 'เรียบร้อย', conditionEn: 'Intact', remark: '' },
  { no: 5, itemDescription: 'โต๊ะ / เก้าอี้', itemDescriptionEn: 'Table & Chairs', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'เรียบร้อย', conditionEn: 'Intact', remark: '' },
  { no: 6, itemDescription: 'เครื่องทำน้ำอุ่น / ฝักบัว', itemDescriptionEn: 'Water Heater & Shower', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'ใช้งานได้ปกติ', conditionEn: 'Working', remark: '' },
];

// 11 standard damage compensation rates matching Page 4 of the user's document
export const DAMAGE_REPLACEMENT_CHARGES = [
  { itemTh: 'สายชำระ (ชุดละ)', itemEn: 'Bidet spray (per set)', price: '150' },
  { itemTh: 'ฝักบัว (อันละ)', itemEn: 'shower head (per piece)', price: '150' },
  { itemTh: 'ที่แขวนฝักบัว', itemEn: 'Shower holder (per piece)', price: '50' },
  { itemTh: 'ก๊อกน้ำอ่างล้างหน้า', itemEn: 'Washbasin faucet', price: '450' },
  { itemTh: 'อ่างล้างหน้า', itemEn: 'Washbasin', price: '850' },
  { itemTh: 'ชักโครก', itemEn: 'Toilet', price: '2,500' },
  { itemTh: 'ลูกบิดประตู', itemEn: 'Door knob', price: '500' },
  { itemTh: 'เตียงนอน', itemEn: 'Bed', price: '3,500' },
  { itemTh: 'บานประตูห้องน้ำ', itemEn: 'Bathroom door', price: '2,000' },
  { itemTh: 'ค่าทาสีห้องใหม่', itemEn: 'Repainting fee', price: '2,500' },
  { itemTh: 'บานประตูหน้าห้อง', itemEn: 'Front entrance door', price: '3,000' },
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

  // UI Tabs / Mode: 'preview' | 'editor'
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'editor'>('preview');
  const [editorSection, setEditorSection] = useState<'parties' | 'property_terms' | 'deposit_rules' | 'inventory' | 'clauses_bilingual'>('parties');
  const [hasCopiedEnglish, setHasCopiedEnglish] = useState(false);

  // Preview Scale
  const [previewScale, setPreviewScale] = useState<'fit' | '100%' | '80%' | '60%'>('fit');
  const [containerWidth, setContainerWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fitScale = useMemo(() => {
    const available = Math.max(300, containerWidth - (containerWidth < 640 ? 32 : 80));
    return Math.min(1, Math.max(0.35, Number((available / 820).toFixed(2))));
  }, [containerWidth]);

  const activeZoomNumber = useMemo(() => {
    if (previewScale === 'fit') return fitScale;
    if (previewScale === '100%') return 1;
    if (previewScale === '80%') return 0.8;
    return 0.6;
  }, [previewScale, fitScale]);

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
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split('T')[0];

  // Helper factory for lease agreement data
  const getDefaultLeaseData = (room?: RoomRecord): LeaseAgreementData => {
    const targetRoom = room || rooms[0];
    const bld = buildings.find(b => b.name === targetRoom?.building || b.id === targetRoom?.buildingId);
    const landlordName = config.landlordName || 'คุณพลอย (ผู้ให้เช่า)';
    const landlordAddr = config.address || 'เพชรบุรี ซอย 6 กทม';
    const landlordPhone = config.phone || '084-041-1115';
    const landlordTax = config.taxId || '3-1006-00000-00-0';
    const bankName = config.bankName || 'ธนาคารกสิกรไทย';
    const bankAccount = config.bankAccount || '743-2-89012-3';

    return {
      madeAt: 'เพชรบุรี ซอย 6 กทม',
      agreementDate: todayStr,
      lessorName: landlordName,
      lessorAddress: landlordAddr,
      lessorPhone: landlordPhone,
      lessorIdCard: landlordTax,

      lesseeName: targetRoom?.tenantName && targetRoom.tenantName !== 'ห้องว่าง' ? targetRoom.tenantName : '',
      lesseeIdCard: '',
      lesseeIdCardIssueDate: '',
      lesseeIdCardExpiryDate: '',
      lesseeAddress: '',
      lesseePhone: targetRoom?.phone || '',
      emergencyContact: '',

      roomNo: targetRoom?.roomNo || '101',
      buildingName: targetRoom?.building || 'หอพักสุขสบาย',
      propertyAddressNo: '88/19',
      alley: 'เพชรบุรี ซอย 6',
      road: 'เพชรบุรี',
      subdistrict: 'ทุ่งพญาไท',
      district: 'ราชเทวี',
      province: 'กรุงเทพมหานคร',

      leaseStartDate: todayStr,
      leaseEndDate: nextYearStr,
      minimumYear: 1,

      monthlyRent: targetRoom?.rent || 3500,
      paymentDueDay: config.paymentDueDay || 5,
      bankName: bankName,
      bankAccountNo: bankAccount,
      bankAccountName: landlordName,
      latePenaltyPerDay: config.lateFeePerDayDefault || 100,

      securityDeposit: targetRoom?.rent || 3500,
      advanceRent: targetRoom?.rent || 3500,
      refundDaysAfterExit: 7, // 7 business days as specified in contract

      waterRatePerUnit: 28, // 28 THB per unit as specified in contract
      electricityRatePerUnit: 8, // 8 THB per unit as specified in contract

      terminationArrearsDays: 15,
      vacateGraceDays: 7,

      lessorSignName: landlordName,
      lesseeSignName: targetRoom?.tenantName && targetRoom.tenantName !== 'ห้องว่าง' ? targetRoom.tenantName : '',
      witness1Name: '',
      witness2Name: '',

      contractTemplate: 'bilingual',
      additionalRules: '',
      additionalRulesEn: '',
      damageFinePolicyTh: 'อัตราค่าปรับวัสดุอุปกรณ์ชำรุดเสียหายตามรายการแนบท้ายสัญญา หน้า 4',
      damageFinePolicyEn: 'Equipment and material replacement/repair charges in case of damage as listed in Annex Page 4',

      // Clauses 9-12 Bilingual Defaults
      ...DEFAULT_CLAUSES_BILINGUAL,

      inventory: DEFAULT_INVENTORY_ITEMS,
    };
  };

  // Primary Lease State
  const [leaseData, setLeaseData] = useState<LeaseAgreementData>(() => getDefaultLeaseData(rooms[0]));

  // Auto-fill upon selecting room
  const handleSelectRoom = (roomKey: string) => {
    setSelectedRoomKey(roomKey);
    const room = rooms.find(r => r.key === roomKey);
    if (!room) return;

    setLeaseData(prev => ({
      ...prev,
      roomNo: room.roomNo,
      buildingName: room.building,
      lesseeName: room.tenantName && room.tenantName !== 'ห้องว่าง' ? room.tenantName : prev.lesseeName,
      lesseePhone: room.phone || prev.lesseePhone,
      monthlyRent: room.rent || prev.monthlyRent,
      securityDeposit: room.rent || prev.securityDeposit,
      advanceRent: room.rent || prev.advanceRent,
      lesseeSignName: room.tenantName && room.tenantName !== 'ห้องว่าง' ? room.tenantName : prev.lesseeSignName,
    }));
  };

  // Reset to default
  const handleResetToStandard = () => {
    const currentRoom = rooms.find(r => r.key === selectedRoomKey);
    setLeaseData(getDefaultLeaseData(currentRoom));
    setExportSuccessMsg('รีเซ็ตสัญญาเช่าตามแบบมาตรฐานฉบับนี้เรียบร้อยแล้ว');
    setTimeout(() => setExportSuccessMsg(null), 4000);
  };

  // Inventory handlers
  const handleAddInventoryItem = () => {
    const nextNo = (leaseData.inventory?.length || 0) + 1;
    const newItem: LeaseInventoryItem = {
      no: nextNo,
      itemDescription: 'รายการอุปกรณ์เพิ่มเติม',
      itemDescriptionEn: 'Additional Equipment',
      qty: '1',
      unitTh: 'ชุด',
      unitEn: 'Sets',
      condition: 'เรียบร้อย',
      conditionEn: 'Intact',
      remark: '',
    };
    setLeaseData(prev => ({
      ...prev,
      inventory: [...(prev.inventory || []), newItem],
    }));
  };

  const handleRemoveInventoryItem = (index: number) => {
    setLeaseData(prev => {
      const filtered = prev.inventory.filter((_, idx) => idx !== index);
      const reindexed = filtered.map((it, i) => ({ ...it, no: i + 1 }));
      return { ...prev, inventory: reindexed };
    });
  };

  const handleUpdateInventoryItem = (index: number, field: keyof LeaseInventoryItem, val: string) => {
    setLeaseData(prev => {
      const updated = [...prev.inventory];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, inventory: updated };
    });
  };

  // Date Parsing Helpers
  const parseDateParts = (dateStr: string) => {
    if (!dateStr) return { day: '..........', monthTh: '.....................', monthEn: '', yearTh: '..............', yearEn: '' };
    try {
      const monthsTh = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const monthsEn = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 0 && m < 12) {
          return {
            day: String(d),
            monthTh: monthsTh[m],
            monthEn: monthsEn[m],
            yearTh: String(y + 543),
            yearEn: String(y),
          };
        }
      }
    } catch {
      // fallback
    }
    return { day: '..........', monthTh: '.....................', monthEn: '', yearTh: '..............', yearEn: '' };
  };

  const formatThaiDate = (dateStr: string) => {
    const parts = parseDateParts(dateStr);
    if (parts.day === '..........') return '..................................';
    return `${parts.day} ${parts.monthTh} พ.ศ. ${parts.yearTh}`;
  };

  const formatEnDate = (dateStr: string) => {
    const parts = parseDateParts(dateStr);
    if (!parts.monthEn) return '..................................';
    return `${parts.monthEn} ${parts.day}, ${parts.yearEn}`;
  };

  const formatMoney = (num: number) => {
    return (num || 0).toLocaleString('th-TH');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export PDF Handler
  const handleExportPdf = async () => {
    if (activeSubTab !== 'preview') {
      setActiveSubTab('preview');
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const pages = [page1Ref.current, page2Ref.current, page3Ref.current, page4Ref.current].filter(
      Boolean
    ) as HTMLElement[];

    if (pages.length === 0) {
      alert('ไม่พบองค์ประกอบหน้าสัญญา กรุณาสลับมาที่หน้าตัวอย่าง (Preview) แล้วลองใหม่อีกครั้ง');
      return;
    }

    try {
      setIsExportingPdf(true);
      const fileName = `สัญญาเช่าห้องพัก_ห้อง${leaseData.roomNo}_${leaseData.lesseeName || 'ผู้เช่า'}.pdf`;
      await exportElementsToMultiPageA4Pdf(pages, fileName, undefined, 'portrait', { scale: 2 });
      setExportSuccessMsg(`ดาวน์โหลดไฟล์สัญญา PDF 4 หน้า (A4) เรียบร้อยแล้ว: ${fileName}`);
      setTimeout(() => setExportSuccessMsg(null), 6000);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Excel Handler
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const fileName = `สัญญาเช่าห้องพัก_ห้อง${leaseData.roomNo}_${leaseData.lesseeName || 'ผู้เช่า'}.xlsx`;
      exportLeaseAgreementToExcel(leaseData, fileName);
      setExportSuccessMsg(`ดาวน์โหลดไฟล์สัญญา Excel เรียบร้อยแล้ว: ${fileName}`);
      setTimeout(() => setExportSuccessMsg(null), 5000);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const agreementDateParsed = parseDateParts(leaseData.agreementDate);
  const totalPaid = (leaseData.securityDeposit || 0) + (leaseData.advanceRent || 0);

  // Helper component for underlined fill values:
  // If string exists, display with dotted underline and offset so it never touches vowels
  // If empty, display clean dotted line
  const FillText: React.FC<{ value?: string | number; placeholderLength?: number; className?: string }> = ({
    value,
    placeholderLength = 24,
    className = ''
  }) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return (
        <span className={`font-semibold underline decoration-dotted decoration-slate-400 underline-offset-4 px-0.5 text-slate-900 ${className}`}>
          {value}
        </span>
      );
    }
    return (
      <span className={`text-slate-400 font-mono tracking-widest ${className}`}>
        {'.'.repeat(placeholderLength)}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* 1. Header & Navigation Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToOverview && (
              <button
                type="button"
                onClick={onBackToOverview}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition cursor-pointer"
                title="กลับหน้าจัดการห้องพัก"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white tracking-wide">
                  สัญญาเช่าห้องพักเพื่อการอยู่อาศัย (Residential Lease Agreement)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600/30 text-blue-300 border border-blue-500/30">
                  มาตรฐาน 4 หน้า (A4)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Languages className="w-3 h-3 text-emerald-400" />
                  แปลอังกฤษข้อ 9-12 ในเว็บแล้ว
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                สัญญาเช่า 2 ภาษา (ไทย-English) พร้อมตารางตรวจรับห้องพัก และตารางอัตราค่าปรับกรณีทำของเสียหายครบถ้วน (ตัวอักษรไม่ซ้อนกัน 100%)
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            {/* Quick jump to clauses 9-12 translations */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('editor');
                setEditorSection('clauses_bilingual');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition cursor-pointer"
              title="ดูและปรับแต่งคำแปลภาษาอังกฤษข้อ 9 - 12"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <span>แปลอังกฤษข้อ 9-12</span>
            </button>

            {/* View / Edit Mode Switch */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveSubTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSubTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>ดูตัวอย่าง A4 (4 หน้า)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSubTab === 'editor'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>แก้ไขข้อมูลสัญญา</span>
              </button>
            </div>

            {/* Reset to standard */}
            <button
              type="button"
              onClick={handleResetToStandard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-semibold transition cursor-pointer"
              title="รีเซ็ตข้อความกลับเป็นสัญญาฉบับมาตรฐาน"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีเซ็ตตามแบบ</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>พิมพ์</span>
            </button>

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExportingExcel ? 'กำลังสร้าง...' : 'Excel'}</span>
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition cursor-pointer shadow-lg shadow-red-900/30 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'บันทึก PDF (4 หน้า)'}</span>
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
            <span>เลือกห้องพักเพื่อโหลดข้อมูล:</span>
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
          <span className="text-xs text-slate-400">
            * สัญญาฉบับนี้กำหนดระยะเวลา 1 ปี, คืนเงินประกันใน 7 วันทำการ, ค่าน้ำ 28 บ./หน่วย, ค่าไฟ 8 บ./หน่วย, ค่าปรับล่าช้า 100 บ./วัน, ค่าทำความสะอาด 300 บ., และตารางค่าชดใช้วัสดุอุปกรณ์ชำรุดเสียหาย หน้า 4
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
              <span>1. ข้อมูลผู้ให้เช่า & ผู้เช่า</span>
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
              <span>2. ทรัพย์สิน & ระยะเวลาเช่า</span>
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
              <span>4. รายการตรวจรับห้องพัก & ค่าปรับของเสียหาย (หน้า 4)</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorSection('clauses_bilingual')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                editorSection === 'clauses_bilingual'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Languages className="w-4 h-4 text-indigo-600" />
              <span>5. ข้อสัญญา 9-12 & คำแปลภาษาอังกฤษ</span>
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
                      สัญญาทำขึ้น ณ (This Agreement is made at)
                    </label>
                    <input
                      type="text"
                      value={leaseData.madeAt}
                      onChange={(e) => setLeaseData({ ...leaseData, madeAt: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="เช่น เพชรบุรี ซอย 6 กทม"
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อผู้ให้เช่า (Lessor Name)</label>
                    <input
                      type="text"
                      value={leaseData.lessorName}
                      onChange={(e) => setLeaseData({ ...leaseData, lessorName: e.target.value, lessorSignName: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ (Phone)</label>
                    <input
                      type="text"
                      value={leaseData.lessorPhone}
                      onChange={(e) => setLeaseData({ ...leaseData, lessorPhone: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ที่อยู่ (Address)</label>
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
                    <span>ฝ่ายผู้เช่า (Lessee)</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อผู้เช่า (Lessee Name)</label>
                    <input
                      type="text"
                      value={leaseData.lesseeName}
                      onChange={(e) => setLeaseData({ ...leaseData, lesseeName: e.target.value, lesseeSignName: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">เลขประจำตัวประชาชน / Passport No.</label>
                    <input
                      type="text"
                      value={leaseData.lesseeIdCard}
                      onChange={(e) => setLeaseData({ ...leaseData, lesseeIdCard: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      placeholder="เช่น 1-1002-00000-00-0"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">วันออกบัตร (Issue Date)</label>
                      <input
                        type="text"
                        value={leaseData.lesseeIdCardIssueDate || ''}
                        onChange={(e) => setLeaseData({ ...leaseData, lesseeIdCardIssueDate: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="เช่น 15 ม.ค. 2566"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">วันหมดอายุ (Expiry Date)</label>
                      <input
                        type="text"
                        value={leaseData.lesseeIdCardExpiryDate || ''}
                        onChange={(e) => setLeaseData({ ...leaseData, lesseeIdCardExpiryDate: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="เช่น 14 ม.ค. 2575"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ผู้เช่า (Phone)</label>
                    <input
                      type="text"
                      value={leaseData.lesseePhone}
                      onChange={(e) => setLeaseData({ ...leaseData, lesseePhone: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ที่อยู่ตามบัตร (Address)</label>
                    <textarea
                      rows={2}
                      value={leaseData.lesseeAddress}
                      onChange={(e) => setLeaseData({ ...leaseData, lesseeAddress: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">บุคคลให้ติดต่อกรณีฉุกเฉิน (Emergency Contact)</label>
                    <input
                      type="text"
                      value={leaseData.emergencyContact || ''}
                      onChange={(e) => setLeaseData({ ...leaseData, emergencyContact: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      placeholder="เช่น คุณแม่ 089-xxx-xxxx"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Property & Terms */}
          {editorSection === 'property_terms' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>ข้อ 1 & 2. ข้อมูลห้องพัก & ระยะเวลาสัญญาเช่า</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ห้องพักเลขที่ (Room No.)</label>
                    <input
                      type="text"
                      value={leaseData.roomNo}
                      onChange={(e) => setLeaseData({ ...leaseData, roomNo: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อหอพัก/อาคาร (Building/Dormitory)</label>
                    <input
                      type="text"
                      value={leaseData.buildingName}
                      onChange={(e) => setLeaseData({ ...leaseData, buildingName: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ตั้งอยู่เลขที่ (Address No.)</label>
                    <input
                      type="text"
                      value={leaseData.propertyAddressNo}
                      onChange={(e) => setLeaseData({ ...leaseData, propertyAddressNo: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ซอย (Soi)</label>
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">ตำบล/แขวง (Subdistrict)</label>
                    <input
                      type="text"
                      value={leaseData.subdistrict}
                      onChange={(e) => setLeaseData({ ...leaseData, subdistrict: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">อำเภอ/เขต (District)</label>
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
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ระยะเวลาเช่าขั้นต่ำ (ปี / Year)</label>
                    <input
                      type="number"
                      value={leaseData.minimumYear}
                      onChange={(e) => setLeaseData({ ...leaseData, minimumYear: Number(e.target.value) || 1 })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">วันที่เริ่มต้นสัญญา (Start Date)</label>
                    <input
                      type="date"
                      value={leaseData.leaseStartDate}
                      onChange={(e) => setLeaseData({ ...leaseData, leaseStartDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">วันที่สิ้นสุดสัญญา (End Date)</label>
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

          {/* Section 3: Deposit & Financials */}
          {editorSection === 'deposit_rules' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span>ข้อ 3. ค่าเช่าและการชำระเงิน</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">ค่าเช่าห้องพักต่อเดือน (บาท)</label>
                      <input
                        type="number"
                        value={leaseData.monthlyRent}
                        onChange={(e) => setLeaseData({ ...leaseData, monthlyRent: Number(e.target.value) || 0 })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
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
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">ธนาคาร</label>
                        <input
                          type="text"
                          value={leaseData.bankName}
                          onChange={(e) => setLeaseData({ ...leaseData, bankName: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">เลขที่บัญชี</label>
                        <input
                          type="text"
                          value={leaseData.bankAccountNo}
                          onChange={(e) => setLeaseData({ ...leaseData, bankAccountNo: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อบัญชี</label>
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
                        onChange={(e) => setLeaseData({ ...leaseData, latePenaltyPerDay: Number(e.target.value) || 100 })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-red-600 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>ข้อ 4 & 5. เงินประกัน & ค่าน้ำไฟ</span>
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
                        <label className="block text-xs font-medium text-slate-700 mb-1">ค่าเช่าล่วงหน้า (บาท)</label>
                        <input
                          type="number"
                          value={leaseData.advanceRent}
                          onChange={(e) => setLeaseData({ ...leaseData, advanceRent: Number(e.target.value) || 0 })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-100/60 border border-emerald-200 text-emerald-900 text-xs font-bold flex justify-between">
                      <span>รวมยอดเงินที่ชำระ ณ วันทำสัญญา:</span>
                      <span>{formatMoney(totalPaid)} บาท</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">ค่าน้ำประปา (บาท/หน่วย)</label>
                        <input
                          type="number"
                          value={leaseData.waterRatePerUnit}
                          onChange={(e) => setLeaseData({ ...leaseData, waterRatePerUnit: Number(e.target.value) || 28 })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">ค่าไฟฟ้า (บาท/หน่วย)</label>
                        <input
                          type="number"
                          value={leaseData.electricityRatePerUnit}
                          onChange={(e) => setLeaseData({ ...leaseData, electricityRatePerUnit: Number(e.target.value) || 8 })}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Inventory & Damage Rates */}
          {editorSection === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    รายการตรวจรับทรัพย์สินห้องพัก (Furniture & Equipment Checklist - หน้า 4)
                  </h3>
                  <p className="text-xs text-slate-500">
                    รายการตรวจรับ 6 รายการมาตรฐานพร้อมสามารถเพิ่ม/แก้ไขได้
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

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-12 text-center">ลำดับ</th>
                      <th className="p-2.5">รายการ (ไทย)</th>
                      <th className="p-2.5">รายการ (English)</th>
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
                            className="w-full text-xs px-2 py-1 border border-slate-300 rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.itemDescriptionEn}
                            onChange={(e) => handleUpdateInventoryItem(idx, 'itemDescriptionEn', e.target.value)}
                            className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={item.qty}
                              onChange={(e) => handleUpdateInventoryItem(idx, 'qty', e.target.value)}
                              className="w-10 text-xs px-1 py-1 border border-slate-300 rounded text-center"
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
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveInventoryItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Damage penalty rates preview */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>อัตราค่าปรับ/ค่าชดใช้วัสดุอุปกรณ์ห้องพัก กรณีได้รับความเสียหาย (แสดงท้ายหน้า 4)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-700 pt-1">
                  {DAMAGE_REPLACEMENT_CHARGES.map((d, i) => (
                    <div key={i} className="bg-white p-2 rounded border border-amber-100 flex justify-between items-center">
                      <span>{d.itemTh}</span>
                      <span className="font-bold text-red-600">{d.price} บ.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Clauses 9-12 Bilingual Editor */}
          {editorSection === 'clauses_bilingual' && (
            <div className="space-y-6">
              {/* Info Header & Quick Actions */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg mt-0.5">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                      <span>ข้อสัญญาข้อ 9 - 12 พร้อมคำแปลภาษาอังกฤษระดับมาตรฐาน (Legal Bilingual Terms)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        พร้อมใช้งานบนเว็บ & PDF / Excel
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-800/80 mt-0.5">
                      ข้อความและคำแปลภาษาอังกฤษด้านล่างนี้จะแสดงผลในหน้า 3 ของสัญญา และถูกรวมในไฟล์พิมพ์, PDF และ Excel A4 โดยอัตโนมัติ สามารถปรับแต่งหรือรีเซ็ตกลับเป็นค่ามาตรฐานได้
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy = `Clause 9: Orderliness and Safety\n9.1 ${leaseData.clause9_1En || DEFAULT_CLAUSES_BILINGUAL.clause9_1En}\n9.2 ${leaseData.clause9_2En || DEFAULT_CLAUSES_BILINGUAL.clause9_2En}\n9.3 ${leaseData.clause9_3En || DEFAULT_CLAUSES_BILINGUAL.clause9_3En}\n\nClause 10: Damage and Repairs\n10.1 ${leaseData.clause10_1En || DEFAULT_CLAUSES_BILINGUAL.clause10_1En}\n10.2 ${leaseData.clause10_2En || DEFAULT_CLAUSES_BILINGUAL.clause10_2En}\n\nClause 11: Security Deposit & Vacating Conditions\n11.1 ${leaseData.clause11_1En || DEFAULT_CLAUSES_BILINGUAL.clause11_1En}\n11.2 ${leaseData.clause11_2En || DEFAULT_CLAUSES_BILINGUAL.clause11_2En}\n11.3 ${leaseData.clause11_3En || DEFAULT_CLAUSES_BILINGUAL.clause11_3En}\n\nClause 12: Compliance with Regulations\n${leaseData.clause12En || DEFAULT_CLAUSES_BILINGUAL.clause12En}\n\nExecution Statement:\n${DEFAULT_CLAUSES_BILINGUAL.executionStatementEn}`;
                      navigator.clipboard.writeText(textToCopy);
                      setHasCopiedEnglish(true);
                      setTimeout(() => setHasCopiedEnglish(false), 3000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
                    title="คัดลอกคำแปลภาษาอังกฤษทั้งหมดลงคลิปบอร์ด"
                  >
                    {hasCopiedEnglish ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">คัดลอกเรียบร้อย!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกคำแปลภาษาอังกฤษ</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLeaseData(prev => ({
                        ...prev,
                        ...DEFAULT_CLAUSES_BILINGUAL,
                      }));
                      setExportSuccessMsg('รีเซ็ตคำแปลข้อ 9 - 12 กลับเป็นแบบมาตรฐานเรียบร้อยแล้ว');
                      setTimeout(() => setExportSuccessMsg(null), 3500);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>รีเซ็ตตามแบบ</span>
                  </button>
                </div>
              </div>

              {/* Clause 9 Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-mono">ข้อ 9</span>
                    <span>ความเป็นระเบียบเรียบร้อยและความปลอดภัย (Orderliness and Safety)</span>
                  </div>
                </div>

                {/* 9.1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ข้อ 9.1 (ภาษาไทย)
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause9_1Th ?? DEFAULT_CLAUSES_BILINGUAL.clause9_1Th}
                      onChange={(e) => setLeaseData({ ...leaseData, clause9_1Th: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                      <span>ข้อ 9.1 (English Translation)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause9_1En ?? DEFAULT_CLAUSES_BILINGUAL.clause9_1En}
                      onChange={(e) => setLeaseData({ ...leaseData, clause9_1En: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50/30 text-slate-800 italic leading-relaxed"
                    />
                  </div>
                </div>

                {/* 9.2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ข้อ 9.2 (ภาษาไทย)
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause9_2Th ?? DEFAULT_CLAUSES_BILINGUAL.clause9_2Th}
                      onChange={(e) => setLeaseData({ ...leaseData, clause9_2Th: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                      <span>ข้อ 9.2 (English Translation)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause9_2En ?? DEFAULT_CLAUSES_BILINGUAL.clause9_2En}
                      onChange={(e) => setLeaseData({ ...leaseData, clause9_2En: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50/30 text-slate-800 italic leading-relaxed"
                    />
                  </div>
                </div>

                {/* 9.3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ข้อ 9.3 (ภาษาไทย)
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause9_3Th ?? DEFAULT_CLAUSES_BILINGUAL.clause9_3Th}
                      onChange={(e) => setLeaseData({ ...leaseData, clause9_3Th: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                      <span>ข้อ 9.3 (English Translation)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause9_3En ?? DEFAULT_CLAUSES_BILINGUAL.clause9_3En}
                      onChange={(e) => setLeaseData({ ...leaseData, clause9_3En: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50/30 text-slate-800 italic leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Clause 10 Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-mono">ข้อ 10</span>
                    <span>ความเสียหายและการซ่อมแซม (Damage and Repairs)</span>
                  </div>
                </div>

                {/* 10.1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ข้อ 10.1 (ภาษาไทย)
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause10_1Th ?? DEFAULT_CLAUSES_BILINGUAL.clause10_1Th}
                      onChange={(e) => setLeaseData({ ...leaseData, clause10_1Th: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                      <span>ข้อ 10.1 (English Translation)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause10_1En ?? DEFAULT_CLAUSES_BILINGUAL.clause10_1En}
                      onChange={(e) => setLeaseData({ ...leaseData, clause10_1En: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50/30 text-slate-800 italic leading-relaxed"
                    />
                  </div>
                </div>

                {/* 10.2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ข้อ 10.2 (ภาษาไทย)
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause10_2Th ?? DEFAULT_CLAUSES_BILINGUAL.clause10_2Th}
                      onChange={(e) => setLeaseData({ ...leaseData, clause10_2Th: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                      <span>ข้อ 10.2 (English Translation)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause10_2En ?? DEFAULT_CLAUSES_BILINGUAL.clause10_2En}
                      onChange={(e) => setLeaseData({ ...leaseData, clause10_2En: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50/30 text-slate-800 italic leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Clause 11 Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-mono">ข้อ 11</span>
                    <span>เงื่อนไขเงินประกันเพิ่มเติมและการย้ายออก (Security Deposit & Vacating Conditions)</span>
                  </div>
                </div>

                {/* 11.1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ข้อ 11.1 (ภาษาไทย)
                    </label>
                    <textarea
                      rows={3}
                      value={leaseData.clause11_1Th ?? DEFAULT_CLAUSES_BILINGUAL.clause11_1Th}
                      onChange={(e) => setLeaseData({ ...leaseData, clause11_1Th: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                      <span>ข้อ 11.1 (English Translation)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={leaseData.clause11_1En ?? DEFAULT_CLAUSES_BILINGUAL.clause11_1En}
                      onChange={(e) => setLeaseData({ ...leaseData, clause11_1En: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50/30 text-slate-800 italic leading-relaxed"
                    />
                  </div>
                </div>

                {/* 11.2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ข้อ 11.2 (ภาษาไทย)
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause11_2Th ?? DEFAULT_CLAUSES_BILINGUAL.clause11_2Th}
                      onChange={(e) => setLeaseData({ ...leaseData, clause11_2Th: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                      <span>ข้อ 11.2 (English Translation)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause11_2En ?? DEFAULT_CLAUSES_BILINGUAL.clause11_2En}
                      onChange={(e) => setLeaseData({ ...leaseData, clause11_2En: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50/30 text-slate-800 italic leading-relaxed"
                    />
                  </div>
                </div>

                {/* 11.3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ข้อ 11.3 (ภาษาไทย)
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause11_3Th ?? DEFAULT_CLAUSES_BILINGUAL.clause11_3Th}
                      onChange={(e) => setLeaseData({ ...leaseData, clause11_3Th: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                      <span>ข้อ 11.3 (English Translation)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={leaseData.clause11_3En ?? DEFAULT_CLAUSES_BILINGUAL.clause11_3En}
                      onChange={(e) => setLeaseData({ ...leaseData, clause11_3En: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50/30 text-slate-800 italic leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Clause 12 Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-mono">ข้อ 12</span>
                    <span>การปฏิบัติตามระเบียบและบทสรุป (Compliance with Regulations & Execution)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ข้อ 12 (ภาษาไทย)
                    </label>
                    <textarea
                      rows={3}
                      value={leaseData.clause12Th ?? DEFAULT_CLAUSES_BILINGUAL.clause12Th}
                      onChange={(e) => setLeaseData({ ...leaseData, clause12Th: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                      <span>ข้อ 12 (English Translation)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={leaseData.clause12En ?? DEFAULT_CLAUSES_BILINGUAL.clause12En}
                      onChange={(e) => setLeaseData({ ...leaseData, clause12En: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50/30 text-slate-800 italic leading-relaxed"
                    />
                  </div>
                </div>
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
              <span>เสร็จสิ้น ดูตัวอย่างหน้า A4 พร้อมพิมพ์/ส่งออก</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. A4 Multi-Page Layout Container (Always mounted in DOM for robust PDF capture) */}
      <div className={`space-y-8 ${activeSubTab === 'editor' ? 'hidden print:block' : 'block'}`}>
        {/* Zoom Control Bar */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-xl text-white print:hidden flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold">สัญญาเช่าห้องพัก 4 หน้าพอดี (A4 Portrait)</span>
            <span className="text-slate-400 text-[11px]">- ตัวอักษรจัดวางเรียบร้อย สระและวรรณยุกต์ไม่ซ้อนทับกัน</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">ย่อ-ขยายมุมมอง:</span>
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setPreviewScale('fit')}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                  previewScale === 'fit' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300'
                }`}
              >
                พอดีจอ
              </button>
              <button
                type="button"
                onClick={() => setPreviewScale('100%')}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                  previewScale === '100%' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300'
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setPreviewScale('80%')}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                  previewScale === '80%' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300'
                }`}
              >
                80%
              </button>
            </div>
          </div>
        </div>

        {/* Scaled Preview Wrapper */}
        <div className="w-full overflow-x-auto flex justify-center pb-8 print:p-0 print:m-0 print:overflow-visible">
          <div
            className="space-y-8 flex flex-col items-center origin-top transition-transform duration-200 print:space-y-0 print:transform-none"
            style={{
              width: activeZoomNumber < 1 ? `${Math.round(820 * activeZoomNumber)}px` : undefined,
              transform: activeZoomNumber === 1 ? 'none' : `scale(${activeZoomNumber})`,
              transformOrigin: 'top center',
            }}
          >

        {/* -------------------------------------------------------------------- */}
        {/* PAGE 1: Header, Parties, Property, Term, Rent & Deposit Payment      */}
        {/* -------------------------------------------------------------------- */}
        <div
          ref={page1Ref}
          id="lease-page-1"
          className="lease-a4-page mx-auto bg-white text-slate-950 shadow-2xl border border-slate-300 font-sans print:shadow-none print:border-none"
          style={{
            width: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box',
            padding: '12mm 16mm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: "'Sarabun', 'Noto Sans Thai', 'Google Sans', sans-serif",
            lineHeight: 1.6,
          }}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="text-center pt-1 pb-1">
              <h1 className="text-[17px] font-bold tracking-normal uppercase text-slate-950 leading-tight">
                สัญญาเช่าห้องพัก / RESIDENTIAL LEASE AGREEMENT
              </h1>
            </div>

            {/* Place & Date (Right-aligned as in user image) */}
            <div className="text-right text-[11.5px] leading-relaxed text-slate-800">
              <div>
                สัญญาฉบับนี้ทำขึ้น ณ / This Agreement is made at:{' '}
                <FillText value={leaseData.madeAt || 'เพชรบุรี ซอย 6 กทม'} placeholderLength={20} />
              </div>
              <div>
                วันที่ / Date:{' '}
                <FillText value={agreementDateParsed.day} placeholderLength={8} />{' '}
                เดือน / Month:{' '}
                <FillText value={agreementDateParsed.monthTh} placeholderLength={16} />{' '}
                พ.ศ. / Year:{' '}
                <FillText value={agreementDateParsed.yearTh} placeholderLength={10} />
              </div>
            </div>

            {/* Parties Preamble */}
            <div className="text-[12px] leading-[1.7] text-left text-slate-900 space-y-1">
              <p className="font-semibold text-slate-950">
                สัญญาฉบับนี้ทำขึ้นระหว่าง / This Agreement is made by and between:
              </p>

              <div>
                ผู้ให้เช่า(Lessor):{' '}
                <FillText value={leaseData.lessorName} placeholderLength={70} className="font-bold" />
              </div>

              <div>
                ที่อยู่ / Address:{' '}
                <FillText value={leaseData.lessorAddress} placeholderLength={45} />{' '}
                เบอร์โทรศัพท์ / Phone:{' '}
                <FillText value={leaseData.lessorPhone} placeholderLength={22} />
              </div>

              <div className="text-[10.5px] text-slate-700 italic pl-1">
                (ซึ่งต่อไปในสัญญานี้จะเรียกว่า "ผู้ให้เช่า" / hereinafter referred to as the "Lessor") ฝ่ายหนึ่ง กับ / of the one part, and
              </div>

              <div className="pt-1">
                ผู้เช่า(Lessee):{' '}
                <FillText value={leaseData.lesseeName} placeholderLength={70} className="font-bold" />
              </div>

              <div>
                เลขประจำตัวประชาชน / Passport/ID No.:{' '}
                <FillText value={leaseData.lesseeIdCard} placeholderLength={65} />
              </div>

              <div>
                วันออกบัตร / Date of Issue:{' '}
                <FillText value={leaseData.lesseeIdCardIssueDate} placeholderLength={25} />{' '}
                วันหมดอายุ / Expiry Date:{' '}
                <FillText value={leaseData.lesseeIdCardExpiryDate} placeholderLength={30} />
              </div>

              <div>
                ที่อยู่ตามบัตร/Address:{' '}
                <FillText value={leaseData.lesseeAddress} placeholderLength={42} />{' '}
                เบอร์โทรศัพท์ / Phone:{' '}
                <FillText value={leaseData.lesseePhone} placeholderLength={20} />
              </div>

              <div className="text-[10.5px] text-slate-700 italic pl-1">
                (ซึ่งต่อไปในสัญญานี้จะเรียกว่า "ผู้เช่า" / hereinafter referred to as the "Lessee") อีกฝ่ายหนึ่ง / of the other part.
              </div>

              <div className="text-[11.5px] pt-1 leading-snug">
                คู่สัญญาทั้งสองฝ่ายตกลงทำสัญญากันโดยมีข้อความและเงื่อนไขดังต่อไปนี้: Both parties agree to enter into this Agreement under the following terms and conditions:
              </div>
            </div>

            {/* Section 1: Leased Property and Purpose */}
            <div className="text-[12px] leading-[1.65] text-left pt-1">
              <h2 className="font-bold text-slate-950 text-[12.5px] mb-0.5">
                ข้อ 1. ทรัพย์สินที่เช่าและวัตถุประสงค์ / Leased Property and Purpose
              </h2>
              <p className="text-slate-900">
                ผู้ให้เช่าตกลงให้เช่า และผู้เช่าตกลงเช่าห้องพักเลขที่{' '}
                <FillText value={leaseData.roomNo} placeholderLength={12} className="font-bold text-blue-900" />{' '}
                หอพัก{' '}
                <FillText value={leaseData.buildingName} placeholderLength={16} />{' '}
                ตั้งอยู่เลขที่{' '}
                <FillText value={leaseData.propertyAddressNo} placeholderLength={10} />{' '}
                ซอย{' '}
                <FillText value={leaseData.alley} placeholderLength={14} />{' '}
                ถนน{' '}
                <FillText value={leaseData.road} placeholderLength={18} />{' '}
                ตำบล/แขวง{' '}
                <FillText value={leaseData.subdistrict} placeholderLength={18} />{' '}
                อำเภอ/เขต{' '}
                <FillText value={leaseData.district} placeholderLength={18} />{' '}
                จังหวัด{' '}
                <FillText value={leaseData.province} placeholderLength={18} />{' '}
                เพื่อใช้เป็นที่อยู่อาศัยเท่านั้น ห้ามนำไปใช้เพื่อการค้า ธุรกิจ หรือการกระทำอื่นใดที่ผิดกฎหมาย
              </p>
              <p className="text-[10.5px] text-slate-600 italic mt-0.5">
                The Lessor agrees to lease and the Lessee agrees to rent Room No.{' '}
                <span className="font-semibold underline decoration-dotted underline-offset-4">{leaseData.roomNo || '................'}</span>, of{' '}
                <span className="font-semibold underline decoration-dotted underline-offset-4">{leaseData.buildingName || '................................'}</span> Building/Dormitory, located at{' '}
                <span className="underline decoration-dotted underline-offset-4">{leaseData.propertyAddressNo || '........'} {leaseData.alley ? `Soi ${leaseData.alley}` : ''}, {leaseData.road ? `Rd. ${leaseData.road}` : ''}, {leaseData.subdistrict || ''}, {leaseData.district || ''}, {leaseData.province || ''}</span>. The Leased Property shall be used solely for residential purposes, and shall not be used for any commercial, illegal, or unlawful purposes.
              </p>
            </div>

            {/* Section 2: Lease Term */}
            <div className="text-[12px] leading-[1.65] text-left pt-1">
              <h2 className="font-bold text-slate-950 text-[12.5px] mb-0.5">
                ข้อ 2. ระยะเวลาการเช่า / Lease Term
              </h2>
              <p className="text-slate-900">
                สัญญาเช่านี้มีกำหนดระยะเวลาขั้นต่ำ {leaseData.minimumYear || 1} ปี เริ่มตั้งแต่วันที่{' '}
                <FillText value={formatThaiDate(leaseData.leaseStartDate)} placeholderLength={22} />{' '}
                ถึงวันที่{' '}
                <FillText value={formatThaiDate(leaseData.leaseEndDate)} placeholderLength={22} />
              </p>
              <p className="text-[10.5px] text-slate-600 italic mt-0.5">
                The term of this lease shall be for a minimum period of {leaseData.minimumYear || 1} ({leaseData.minimumYear === 1 ? 'one' : leaseData.minimumYear}) year, commencing on{' '}
                <span className="font-semibold underline decoration-dotted underline-offset-4">{formatEnDate(leaseData.leaseStartDate)}</span> and expiring on{' '}
                <span className="font-semibold underline decoration-dotted underline-offset-4">{formatEnDate(leaseData.leaseEndDate)}</span>.
              </p>
            </div>

            {/* Section 3: Rental Fee and Payment Terms */}
            <div className="text-[12px] leading-[1.65] text-left pt-1 space-y-1">
              <h2 className="font-bold text-slate-950 text-[12.5px]">
                ข้อ 3. ค่าเช่าและการชำระเงิน / Rental Fee and Payment Terms
              </h2>
              <div className="pl-3 space-y-1">
                <div>
                  • <span className="font-semibold">3.1</span> ค่าเช่าห้องพักตกลงกันในอัตราเดือนละ{' '}
                  <FillText value={formatMoney(leaseData.monthlyRent)} placeholderLength={16} className="font-bold" /> บาท (The monthly rental fee is agreed at THB{' '}
                  <span className="font-semibold underline decoration-dotted underline-offset-4">{formatMoney(leaseData.monthlyRent)}</span> per month.
                </div>

                <div>
                  • <span className="font-semibold">3.2</span> ผู้เช่าตกลงชำระค่าเช่าล่วงหน้าภายในวันที่ {leaseData.paymentDueDay || 5} ของทุกเดือน โดยโอนเงินเข้า บัญชีธนาคาร{' '}
                  <FillText value={leaseData.bankName} placeholderLength={20} /> บัญชีเลขที่{' '}
                  <FillText value={leaseData.bankAccountNo} placeholderLength={22} className="font-bold" /> ชื่อบัญชี{' '}
                  <FillText value={leaseData.bankAccountName} placeholderLength={24} />
                  <div className="text-[10.5px] text-slate-600 italic mt-0.5 pl-3">
                    The Lessee shall pay the rent in advance by the {leaseData.paymentDueDay || 5}th day of each month by bank transfer to: Bank: {leaseData.bankName || '.....................'}, Account No.: {leaseData.bankAccountNo || '.................................'}, Account Name: {leaseData.bankAccountName || '........................................'}
                  </div>
                </div>

                <div>
                  • <span className="font-semibold">3.3</span> หากชำระล่าช้าเกินกำหนด 1 วัน ผู้เช่ายินยอมเสียค่าปรับวันละ {leaseData.latePenaltyPerDay || 100} บาท จนกว่าจะชำระครบถ้วน
                  <div className="text-[10.5px] text-slate-600 italic mt-0.5 pl-3">
                    If payment is delayed beyond 1 day, the Lessee agrees to pay a late penalty fee of THB {leaseData.latePenaltyPerDay || 100} per day until full settlement.
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Security Deposit and Advance Rent (Beginning on Page 1) */}
            <div className="text-[12px] leading-[1.65] text-left pt-1">
              <h2 className="font-bold text-slate-950 text-[12.5px] mb-0.5">
                ข้อ 4. เงินประกันความเสียหายและค่าเช่าล่วงหน้า / Security Deposit and Advance Rent
              </h2>
              <p className="text-slate-900">
                ในวันทำสัญญานี้ ผู้เช่าได้ชำระเงินให้แก่ผู้ให้เช่าแล้ว ดังนี้: On the date of this Agreement, the Lessee has paid the Lessor as follows:{' '}
                <span className="font-bold">รวมทั้งสิ้น / Total Amount Paid:</span>{' '}
                <FillText value={formatMoney(totalPaid)} placeholderLength={16} className="font-extrabold text-[12.5px]" /> บาท (THB{' '}
                <span className="font-bold underline decoration-dotted underline-offset-4">{formatMoney(totalPaid)}</span>)
              </p>
            </div>
          </div>

          {/* Page 1 Footer */}
          <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[10.5px] text-slate-600 font-sans mt-3">
            <div>สัญญาเช่าห้องพักเลขที่ {leaseData.roomNo} ({leaseData.buildingName})</div>
            <div className="font-semibold text-slate-700">หน้า 1 / 4 (Page 1 of 4)</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span>ลงชื่อย่อผู้ให้เช่า / Lessor:</span>
                <span className="inline-block border-b border-slate-400 w-16"></span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span>ลงชื่อย่อผู้เช่า / Lessee:</span>
                <span className="inline-block border-b border-slate-400 w-16"></span>
              </span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------- */}
        {/* PAGE 2: Deposit Breakdown, Utilities, Maintenance, Restrictions      */}
        {/* -------------------------------------------------------------------- */}
        <div
          ref={page2Ref}
          id="lease-page-2"
          className="lease-a4-page mx-auto bg-white text-slate-950 shadow-2xl border border-slate-300 font-sans print:shadow-none print:border-none"
          style={{
            width: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box',
            padding: '12mm 16mm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: "'Sarabun', 'Noto Sans Thai', 'Google Sans', sans-serif",
            lineHeight: 1.65,
          }}
        >
          <div className="space-y-3.5">
            {/* Continuation of Clause 4 */}
            <div className="text-[12px] leading-[1.65] text-left space-y-1.5">
              <div className="pl-3 space-y-1">
                <div>
                  • <span className="font-semibold">4.1</span> เงินประกันความเสียหาย (1 เดือน) / Security Deposit (1 Month): จำนวน{' '}
                  <FillText value={formatMoney(leaseData.securityDeposit)} placeholderLength={16} className="font-bold" /> บาท (THB{' '}
                  <span className="font-semibold underline decoration-dotted underline-offset-4">{formatMoney(leaseData.securityDeposit)}</span>)
                </div>

                <div>
                  • <span className="font-semibold">4.2</span> ค่าเช่าล่วงหน้า (1 เดือน) / Advance Rent (1 Month): จำนวน{' '}
                  <FillText value={formatMoney(leaseData.advanceRent)} placeholderLength={16} className="font-bold" /> บาท (THB{' '}
                  <span className="font-semibold underline decoration-dotted underline-offset-4">{formatMoney(leaseData.advanceRent)}</span>)
                </div>
              </div>

              <div className="pt-1">
                <div className="font-bold text-slate-950 text-[12px] mb-1">
                  เงื่อนไขเงินประกัน / Deposit Conditions:
                </div>
                <div className="pl-3 space-y-2 text-[11.5px] leading-[1.7]">
                  <div>
                    • <span className="font-medium text-slate-900">เงินประกันจะได้รับคืนหลังจากสัญญาครบกำหนด และผู้เช่าส่งมอบห้องพักคืนในสภาพเรียบร้อย ไม่มีความเสียหาย และชำระหนี้สินทั้งหมดครบถ้วนแล้ว โดยจะคืนให้ภายใน 7 วันทำการ</span>{' '}
                    <span className="text-[10.5px] text-slate-600 italic">
                      The deposit shall be refunded to the Lessee upon the expiration of the lease term, provided that the premises are returned in good condition, without damage, and all outstanding bills are cleared, within 7 business days.
                    </span>
                  </div>

                  <div>
                    • <span className="font-medium text-slate-900">หากผู้เช่าย้ายออกก่อนครบกำหนด 1 ปี หรือผิดสัญญาข้อใดข้อหนึ่งจนเป็นเหตุให้เลิกสัญญา ผู้ให้เช่ามีสิทธิ์ริบเงินประกันความเสียหายเต็มจำนวนทันที และไม่ตัดสิทธิ์เรียกร้องค่าเสียหายเพิ่มเติม</span>{' '}
                    <span className="text-[10.5px] text-slate-600 italic">
                      If the Lessee vacates prior to the 1-year term or breaches any provision resulting in contract termination, the Lessor reserves the right to forfeit the entire security deposit immediately, without prejudice to claims for additional damages.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Utilities */}
            <div className="text-[12px] leading-[1.65] text-left pt-1">
              <h2 className="font-bold text-slate-950 text-[12.5px] mb-0.5">
                ข้อ 5. ค่าสาธารณูปโภค / Utilities
              </h2>
              <p className="text-slate-900">
                ผู้เช่าตกลงชำระค่าน้ำและค่าไฟฟ้าตามหน่วยที่ใช้จริงในแต่ละเดือน:
              </p>
              <p className="text-[10.5px] text-slate-600 italic mb-1">
                The Lessee agrees to pay for actual utility consumption each month:
              </p>
              <div className="pl-3 space-y-1">
                <div>
                  • <span className="font-semibold">5.1</span> ค่าน้ำประปา / Water supply: หน่วยละ {leaseData.waterRatePerUnit || 28} บาท / THB {leaseData.waterRatePerUnit || 28} per unit.
                </div>
                <div>
                  • <span className="font-semibold">5.2</span> ค่าไฟฟ้า / Electricity: หน่วยละ {leaseData.electricityRatePerUnit || 8} บาท / THB {leaseData.electricityRatePerUnit || 8} per unit.
                </div>
              </div>
            </div>

            {/* Section 6: Maintenance and Restrictions */}
            <div className="text-[12px] leading-[1.65] text-left pt-1">
              <h2 className="font-bold text-slate-950 text-[12.5px] mb-1">
                ข้อ 6. การดูแลรักษาและข้อห้าม / Maintenance and Restrictions
              </h2>
              <div className="pl-3 space-y-2">
                <div>
                  • <span className="font-semibold">6.1</span> ผู้เช่าต้องดูแลรักษาห้องพักและเฟอร์นิเจอร์ให้อยู่ในสภาพดี ห้ามเจาะ ดัดแปลง ทาสี หรือต่อเติมห้องพักโดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่า
                  <div className="text-[10.5px] text-slate-600 italic mt-0.5 pl-3">
                    The Lessee shall maintain the room and furnishings in good condition and shall not drill, alter, paint, or modify the premises without prior written consent from the Lessor.
                  </div>
                </div>

                <div>
                  • <span className="font-semibold">6.2</span> ห้ามนำวัตถุไวไฟ สารเคมีอันตราย หรือสิ่งผิดกฎหมายเข้ามาในห้องพัก
                  <div className="text-[10.5px] text-slate-600 italic mt-0.5 pl-3">
                    Flammable materials, dangerous chemicals, or any illegal substances are strictly prohibited.
                  </div>
                </div>

                <div>
                  • <span className="font-semibold">6.3</span> ห้ามเลี้ยงสัตว์ทุกชนิด และห้ามส่งเสียงดังรบกวนผู้อื่น
                  <div className="text-[10.5px] text-slate-600 italic mt-0.5 pl-3">
                    No pets are allowed, and loud noises disturbing neighboring residents are strictly prohibited.
                  </div>
                </div>

                <div>
                  • <span className="font-semibold">6.4</span> ห้ามนำห้องพักไปให้เช่าช่วง หรือโอนสิทธิ์การเช่าให้บุคคลอื่น
                  <div className="text-[10.5px] text-slate-600 italic mt-0.5 pl-3">
                    Subletting or transferring lease rights to third parties is strictly prohibited.
                  </div>
                </div>
              </div>
            </div>

            {/* Section 7: Inspection */}
            <div className="text-[12px] leading-[1.65] text-left pt-1">
              <h2 className="font-bold text-slate-950 text-[12.5px] mb-0.5">
                ข้อ 7. การตรวจสภาพห้องพัก / Inspection
              </h2>
              <p className="text-slate-900">
                ผู้ให้เช่าหรือตัวแทนมีสิทธิ์เข้าตรวจสภาพห้องพักได้ โดยแจ้งล่วงหน้าไม่น้อยกว่า 24 ชั่วโมง เว้นแต่ในกรณีฉุกเฉิน
              </p>
              <p className="text-[10.5px] text-slate-600 italic mt-0.5">
                The Lessor or their representative has the right to inspect the premises by giving at least 24 hours' prior notice, except in emergencies.
              </p>
            </div>

            {/* Section 8: Termination and Vacating (Clause 8.1 on Page 2) */}
            <div className="text-[12px] leading-[1.65] text-left pt-1">
              <h2 className="font-bold text-slate-950 text-[12.5px] mb-0.5">
                ข้อ 8. การบอกเลิกสัญญาและการส่งมอบห้องคืน / Termination and Vacating
              </h2>
              <div className="pl-3">
                • <span className="font-semibold">8.1</span> หากผู้เช่าค้างชำระค่าเช่าหรือค่าสาธารณูปโภคเกินกว่า {leaseData.terminationArrearsDays || 15} วัน หรือทำผิดสัญญาข้อหนึ่งข้อใด ผู้ให้เช่ามีสิทธิ์บอกเลิกสัญญา ตัดระบบน้ำ/ไฟ และเข้าครอบครองห้องพักรวมถึงเปลี่ยนกุญแจได้ทันที
                <div className="text-[10.5px] text-slate-600 italic mt-0.5 pl-3">
                  If the Lessee fails to pay rent or utilities for more than {leaseData.terminationArrearsDays || 15} days, or breaches any clause herein, the Lessor has the right to terminate this Agreement immediately, disconnect water/power supplies, re-enter the premises, and change room locks.
                </div>
              </div>
            </div>
          </div>

          {/* Page 2 Footer */}
          <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[10.5px] text-slate-600 font-sans mt-3">
            <div>สัญญาเช่าห้องพักเลขที่ {leaseData.roomNo} ({leaseData.buildingName})</div>
            <div className="font-semibold text-slate-700">หน้า 2 / 4 (Page 2 of 4)</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span>ลงชื่อย่อผู้ให้เช่า / Lessor:</span>
                <span className="inline-block border-b border-slate-400 w-16"></span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span>ลงชื่อย่อผู้เช่า / Lessee:</span>
                <span className="inline-block border-b border-slate-400 w-16"></span>
              </span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------- */}
        {/* PAGE 3: Vacating, Safety, Damage & Repairs, Conditions, Signatures   */}
        {/* -------------------------------------------------------------------- */}
        <div
          ref={page3Ref}
          id="lease-page-3"
          className="lease-a4-page mx-auto bg-white text-slate-950 shadow-2xl border border-slate-300 font-sans print:shadow-none print:border-none"
          style={{
            width: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box',
            padding: '12mm 16mm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: "'Sarabun', 'Noto Sans Thai', 'Google Sans', sans-serif",
            lineHeight: 1.65,
          }}
        >
          <div className="space-y-3">
            {/* Continuation of Clause 8 (8.2) */}
            <div className="text-[12px] leading-[1.65] text-left">
              <div className="pl-3">
                • <span className="font-semibold">8.2</span> เมื่อสัญญาเลิกกัน ผู้เช่าต้องขนย้ายทรัพย์สินออกจากห้องพักภายใน {leaseData.vacateGraceDays || 7} วัน หากพ้นกำหนด ยินยอมให้ผู้ให้เช่าย้ายทรัพย์สินไปเก็บรักษาไว้ที่อื่น โดยผู้เช่ารับผิดชอบค่าใช้จ่าย และผู้ให้เช่าไม่ต้องรับผิดชอบต่อการสูญหายหรือเสียหายใดๆ
                <div className="text-[10.5px] text-slate-600 italic mt-0.5 pl-3">
                  Upon contract termination, the Lessee must vacate and remove all belongings within {leaseData.vacateGraceDays || 7} days. Otherwise, the Lessor is authorized to remove and store such belongings at the Lessee's expense, without liability for loss or damage.
                </div>
              </div>
            </div>

            {/* Section 9: Orderliness and Safety */}
            <div className="text-[11.5px] leading-[1.6] text-left pt-0.5">
              <h2 className="font-bold text-slate-950 text-[12px] mb-1">
                ข้อ 9. ความเป็นระเบียบเรียบร้อยและความปลอดภัย / Orderliness and Safety
              </h2>
              <div className="pl-3 space-y-1.5">
                <div>
                  • <span className="font-semibold">9.1</span> {leaseData.clause9_1Th || DEFAULT_CLAUSES_BILINGUAL.clause9_1Th}
                  <div className="text-[10px] text-slate-600 italic mt-0.5 pl-3">
                    {leaseData.clause9_1En || DEFAULT_CLAUSES_BILINGUAL.clause9_1En}
                  </div>
                </div>
                <div>
                  • <span className="font-semibold">9.2</span> {leaseData.clause9_2Th || DEFAULT_CLAUSES_BILINGUAL.clause9_2Th}
                  <div className="text-[10px] text-slate-600 italic mt-0.5 pl-3">
                    {leaseData.clause9_2En || DEFAULT_CLAUSES_BILINGUAL.clause9_2En}
                  </div>
                </div>
                <div>
                  • <span className="font-semibold">9.3</span> {leaseData.clause9_3Th || DEFAULT_CLAUSES_BILINGUAL.clause9_3Th}
                  <div className="text-[10px] text-slate-600 italic mt-0.5 pl-3">
                    {leaseData.clause9_3En || DEFAULT_CLAUSES_BILINGUAL.clause9_3En}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 10: Damage and Repairs */}
            <div className="text-[11.5px] leading-[1.6] text-left pt-0.5">
              <h2 className="font-bold text-slate-950 text-[12px] mb-1">
                ข้อ 10. ความเสียหายและการซ่อมแซม / Damage and Repairs
              </h2>
              <div className="pl-3 space-y-1.5">
                <div>
                  • <span className="font-semibold">10.1</span> {leaseData.clause10_1Th || DEFAULT_CLAUSES_BILINGUAL.clause10_1Th}
                  <div className="text-[10px] text-slate-600 italic mt-0.5 pl-3">
                    {leaseData.clause10_1En || DEFAULT_CLAUSES_BILINGUAL.clause10_1En}
                  </div>
                </div>
                <div>
                  • <span className="font-semibold">10.2</span> {leaseData.clause10_2Th || DEFAULT_CLAUSES_BILINGUAL.clause10_2Th}
                  <div className="text-[10px] text-slate-600 italic mt-0.5 pl-3">
                    {leaseData.clause10_2En || DEFAULT_CLAUSES_BILINGUAL.clause10_2En}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 11: Security Deposit & Vacating Conditions */}
            <div className="text-[11.5px] leading-[1.6] text-left pt-0.5">
              <h2 className="font-bold text-slate-950 text-[12px] mb-1">
                ข้อ 11. เงื่อนไขเงินประกันเพิ่มเติมและการย้ายออก / Security Deposit & Vacating Conditions
              </h2>
              <div className="pl-3 space-y-1.5">
                <div>
                  • <span className="font-semibold">11.1</span> {leaseData.clause11_1Th || DEFAULT_CLAUSES_BILINGUAL.clause11_1Th}
                  <div className="text-[10px] text-slate-600 italic mt-0.5 pl-3">
                    {leaseData.clause11_1En || DEFAULT_CLAUSES_BILINGUAL.clause11_1En}
                  </div>
                </div>
                <div>
                  • <span className="font-semibold">11.2</span> {leaseData.clause11_2Th || DEFAULT_CLAUSES_BILINGUAL.clause11_2Th}
                  <div className="text-[10px] text-slate-600 italic mt-0.5 pl-3">
                    {leaseData.clause11_2En || DEFAULT_CLAUSES_BILINGUAL.clause11_2En}
                  </div>
                </div>
                <div>
                  • <span className="font-semibold">11.3</span> {leaseData.clause11_3Th || DEFAULT_CLAUSES_BILINGUAL.clause11_3Th}
                  <div className="text-[10px] text-slate-600 italic mt-0.5 pl-3">
                    {leaseData.clause11_3En || DEFAULT_CLAUSES_BILINGUAL.clause11_3En}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 12: Compliance with Regulations */}
            <div className="text-[11.5px] leading-[1.6] text-left pt-0.5 space-y-1">
              <h2 className="font-bold text-slate-950 text-[12px]">
                ข้อ 12. การปฏิบัติตามระเบียบ / Compliance with Regulations
              </h2>
              <p className="text-slate-900 indent-4">
                {leaseData.clause12Th || DEFAULT_CLAUSES_BILINGUAL.clause12Th}
              </p>
              <p className="text-[10px] text-slate-600 italic indent-4">
                {leaseData.clause12En || DEFAULT_CLAUSES_BILINGUAL.clause12En}
              </p>
              <p className="text-slate-900 indent-4 pt-1 font-medium">
                {DEFAULT_CLAUSES_BILINGUAL.executionStatementTh}
              </p>
              <p className="text-[10px] text-slate-600 italic indent-4">
                {DEFAULT_CLAUSES_BILINGUAL.executionStatementEn}
              </p>
            </div>

            {/* 4-Box Signature Area */}
            <div className="pt-4 border-t border-slate-300">
              <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-center text-xs">
                {/* Lessor */}
                <div className="space-y-1 text-slate-800">
                  <div className="flex items-center justify-center gap-1.5 text-[11.5px]">
                    <span>ลงชื่อ / Signed:</span>
                    <span className="inline-block border-b border-slate-400 w-36"></span>
                    <span className="font-medium whitespace-nowrap">ผู้ให้เช่า / Lessor</span>
                  </div>
                  <div className="font-semibold text-slate-950 text-xs pt-0.5">
                    ( {leaseData.lessorSignName || leaseData.lessorName || '............................................................'} )
                  </div>
                </div>

                {/* Lessee */}
                <div className="space-y-1 text-slate-800">
                  <div className="flex items-center justify-center gap-1.5 text-[11.5px]">
                    <span>ลงชื่อ / Signed:</span>
                    <span className="inline-block border-b border-slate-400 w-36"></span>
                    <span className="font-medium whitespace-nowrap">ผู้เช่า / Lessee</span>
                  </div>
                  <div className="font-semibold text-slate-950 text-xs pt-0.5">
                    ( {leaseData.lesseeSignName || leaseData.lesseeName || '............................................................'} )
                  </div>
                </div>

                {/* Witness 1 */}
                <div className="space-y-1 text-slate-800 pt-1">
                  <div className="flex items-center justify-center gap-1.5 text-[11.5px]">
                    <span>ลงชื่อ / Signed:</span>
                    <span className="inline-block border-b border-slate-400 w-36"></span>
                    <span className="font-medium whitespace-nowrap">พยาน / Witness</span>
                  </div>
                  <div className="font-medium text-slate-700 text-xs pt-0.5">
                    ( {leaseData.witness1Name || '............................................................'} )
                  </div>
                </div>

                {/* Witness 2 */}
                <div className="space-y-1 text-slate-800 pt-1">
                  <div className="flex items-center justify-center gap-1.5 text-[11.5px]">
                    <span>ลงชื่อ / Signed:</span>
                    <span className="inline-block border-b border-slate-400 w-36"></span>
                    <span className="font-medium whitespace-nowrap">พยาน / Witness</span>
                  </div>
                  <div className="font-medium text-slate-700 text-xs pt-0.5">
                    ( {leaseData.witness2Name || '............................................................'} )
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page 3 Footer */}
          <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[10.5px] text-slate-600 font-sans mt-3">
            <div>สัญญาเช่าห้องพักเลขที่ {leaseData.roomNo} ({leaseData.buildingName})</div>
            <div className="font-semibold text-slate-700">หน้า 3 / 4 (Page 3 of 4)</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span>ลงชื่อย่อผู้ให้เช่า / Lessor:</span>
                <span className="inline-block border-b border-slate-400 w-16"></span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span>ลงชื่อย่อผู้เช่า / Lessee:</span>
                <span className="inline-block border-b border-slate-400 w-16"></span>
              </span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------- */}
        {/* PAGE 4: Inventory Checklist & Standard Damage Penalty Price Schedule */}
        {/* -------------------------------------------------------------------- */}
        <div
          ref={page4Ref}
          id="lease-page-4"
          className="lease-a4-page mx-auto bg-white text-slate-950 shadow-2xl border border-slate-300 font-sans print:shadow-none print:border-none"
          style={{
            width: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box',
            padding: '12mm 16mm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: "'Sarabun', 'Noto Sans Thai', 'Google Sans', sans-serif",
            lineHeight: 1.6,
          }}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center pt-1 pb-1">
              <h1 className="text-[15.5px] font-bold tracking-normal uppercase text-slate-950 leading-tight">
                บันทึกรายการทรัพย์สินตรวจรับมอบห้อง / Furniture & Equipment Inventory Checklist
              </h1>
            </div>

            {/* Inventory Table (6 items matching the exact user document) */}
            <div className="border border-slate-400 rounded-sm overflow-hidden">
              <table className="w-full table-fixed text-left border-collapse text-[11.5px] font-sans">
                <thead className="bg-slate-50 text-slate-950 font-bold border-b border-slate-400">
                  <tr>
                    <th className="p-2.5 w-[10%] text-center border-r border-slate-300">ลำดับ /<br/><span className="text-[10px] font-normal text-slate-700">No.</span></th>
                    <th className="p-2.5 w-[38%] border-r border-slate-300">รายการทรัพย์สิน / Item<br/><span className="text-[10px] font-normal text-slate-700">Description</span></th>
                    <th className="p-2.5 w-[16%] text-center border-r border-slate-300">จำนวน / Qty</th>
                    <th className="p-2.5 w-[20%] border-r border-slate-300 text-center">สภาพ ณ วันรับมอบ<br/><span className="text-[10px] font-normal text-slate-700">/ Condition</span></th>
                    <th className="p-2.5 w-[16%] text-center">หมายเหตุ / Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {leaseData.inventory.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="p-2.5 text-center font-semibold text-slate-800 border-r border-slate-300">{item.no}</td>
                      <td className="p-2.5 border-r border-slate-300">
                        <div className="font-semibold text-slate-950 text-[12px]">{item.itemDescription}</div>
                        <div className="text-[10px] text-slate-600 italic">/ {item.itemDescriptionEn}</div>
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-300">
                        <span className="font-bold text-slate-900">{item.qty || '1'}</span> {item.unitTh}{' '}
                        <span className="text-[9.5px] text-slate-600">/{item.unitEn}</span>
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-300 font-medium text-slate-900">
                        <div>{item.condition}</div>
                        <div className="text-[9.5px] text-slate-600 italic">/ {item.conditionEn}</div>
                      </td>
                      <td className="p-2.5 text-center text-slate-600 text-[10.5px]">
                        {item.remark || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures & Emergency Contact */}
            <div className="text-[12px] leading-[1.8] text-slate-900 space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold whitespace-nowrap">ลงชื่อผู้ให้เช่า / Lessor:</span>
                <span className="inline-block border-b border-slate-400 flex-1 min-w-[200px]"></span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold whitespace-nowrap">ลงชื่อผู้เช่า / Lessee:</span>
                <span className="inline-block border-b border-slate-400 flex-1 min-w-[200px]"></span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold whitespace-nowrap">บุคคลให้ติดต่อกรณีฉุกเฉิน / Emergency contract :</span>
                {leaseData.emergencyContact ? (
                  <span className="font-semibold underline decoration-dotted underline-offset-4 flex-1">
                    {leaseData.emergencyContact}
                  </span>
                ) : (
                  <span className="inline-block border-b border-slate-400 flex-1 min-w-[200px]"></span>
                )}
              </div>
            </div>

            {/* Standard Damage Penalty Schedule (Exact match from the user's document) */}
            <div className="pt-3 border-t border-slate-400 space-y-2">
              <div>
                <h2 className="font-bold text-slate-950 text-[12px] leading-tight">
                  หมายเหตุ: ราคาวัสดุอุปกรณ์ห้องพัก กรณีได้รับความเสียหาย
                </h2>
                <p className="text-[10px] text-slate-700 italic">
                  Remarks: Equipment and material replacement/repair charges in case of damage
                </p>
              </div>

              {/* 2-Column Damage Price List matching the user's Page 4 screenshot */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11.5px] leading-snug text-slate-900 font-sans pt-1">
                <div>
                  สายชำระ (ชุดละ) Bidet spray (per set): <span className="font-bold">150</span>
                </div>
                <div>
                  ฝักบัว (อันละ) shower head (per piece): <span className="font-bold">150</span>
                </div>

                <div>
                  ที่แขวนฝักบัว Shower holder (per piece): <span className="font-bold">50</span>
                </div>
                <div>
                  ก๊อกน้ำอ่างล้างหน้า Washbasin faucet: <span className="font-bold">450</span>
                </div>

                <div>
                  อ่างล้างหน้า Washbasin: <span className="font-bold">850</span>
                </div>
                <div>
                  ชักโครก Toilet: <span className="font-bold">2,500</span>
                </div>

                <div>
                  ลูกบิดประตู Door knob: <span className="font-bold">500</span>
                </div>
                <div>
                  เตียงนอน Bed: <span className="font-bold">3,500</span>
                </div>

                <div>
                  บานประตูห้องน้ำ Bathroom door: <span className="font-bold">2,000</span>
                </div>
                <div>
                  ค่าทาสีห้องใหม่ Repainting fee: <span className="font-bold">2,500</span>
                </div>

                <div>
                  บานประตูหน้าห้อง Front entrance door: <span className="font-bold">3,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Page 4 Footer */}
          <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[10.5px] text-slate-600 font-sans mt-3">
            <div>เอกสารแนบท้ายห้องพักเลขที่ {leaseData.roomNo} ({leaseData.buildingName})</div>
            <div className="font-semibold text-slate-700">หน้า 4 / 4 (Page 4 of 4)</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span>ลงชื่อย่อผู้ให้เช่า / Lessor:</span>
                <span className="inline-block border-b border-slate-400 w-16"></span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span>ลงชื่อย่อผู้เช่า / Lessee:</span>
                <span className="inline-block border-b border-slate-400 w-16"></span>
              </span>
            </div>
          </div>
        </div>

          </div>
        </div>
      </div>
    </div>
  );
};
