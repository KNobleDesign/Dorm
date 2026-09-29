import { RoomRecord, LandlordConfig, WaterCalcType, BuildingProfile, OccupancyStatus, AppUser, ExpenseRecord, ExpenseCategory } from '../types';
import { OCTOBER_BUILDINGS, generateAllOctoberRooms } from './octoberRooms';

export const EXPENSE_CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; color: string; bgClass: string; textClass: string; icon: string }> = {
  utility_bills: { label: 'ค่าน้ำ-ไฟหลวง (ต้นทุนหลวง)', color: '#3b82f6', bgClass: 'bg-blue-50 border-blue-200', textClass: 'text-blue-700', icon: 'Zap' },
  maintenance: { label: 'ค่าซ่อมแซม & บำรุงรักษา', color: '#f59e0b', bgClass: 'bg-amber-50 border-amber-200', textClass: 'text-amber-700', icon: 'Wrench' },
  cleaning_waste: { label: 'ค่าแม่บ้าน & ค่าขยะ', color: '#10b981', bgClass: 'bg-emerald-50 border-emerald-200', textClass: 'text-emerald-700', icon: 'Sparkles' },
  security_cctv: { label: 'ค่าระบบความปลอดภัย / CCTV', color: '#8b5cf6', bgClass: 'bg-purple-50 border-purple-200', textClass: 'text-purple-700', icon: 'Shield' },
  internet_network: { label: 'ค่าอินเทอร์เน็ต WiFi', color: '#06b6d4', bgClass: 'bg-cyan-50 border-cyan-200', textClass: 'text-cyan-700', icon: 'Wifi' },
  supplies: { label: 'วัสดุสิ้นเปลือง & น้ำยา', color: '#ec4899', bgClass: 'bg-pink-50 border-pink-200', textClass: 'text-pink-700', icon: 'Package' },
  tax_insurance: { label: 'ภาษี & ประกันภัยอาคาร', color: '#64748b', bgClass: 'bg-slate-100 border-slate-300', textClass: 'text-slate-700', icon: 'FileText' },
  staff_salary: { label: 'เงินเดือนผู้ดูแล/แม่บ้าน', color: '#6366f1', bgClass: 'bg-indigo-50 border-indigo-200', textClass: 'text-indigo-700', icon: 'Users' },
  other: { label: 'ค่าใช้จ่ายอื่นๆ', color: '#94a3b8', bgClass: 'bg-slate-50 border-slate-200', textClass: 'text-slate-600', icon: 'MoreHorizontal' },
};

export const DEFAULT_EXPENSES: ExpenseRecord[] = [
  // 10 ต.ค. (Current Starting Month - ตุลาคม 2026)
  {
    id: 'exp-10-01',
    building: 'อาคาร ดอนเมือง',
    title: 'ค่าไฟฟ้าการไฟฟ้านครหลวง (มิเตอร์ใหญ่ส่วนกลาง)',
    category: 'utility_bills',
    amount: 6850,
    date: '2026-10-02',
    month: '10 ต.ค.',
    notes: 'บิลค่าไฟรอบเดือน ก.ย. ครอบคลุมพื้นที่ส่วนกลางและทางเดิน',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-02 09:30',
  },
  {
    id: 'exp-10-02',
    building: 'อาคาร ดอนเมือง',
    title: 'ค่าน้ำประปานครหลวง (มิเตอร์ประปาหลัก)',
    category: 'utility_bills',
    amount: 1420,
    date: '2026-10-03',
    month: '10 ต.ค.',
    notes: 'ค่าน้ำประปาประจำเดือน',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-03 10:15',
  },
  {
    id: 'exp-10-03',
    building: 'อาคาร ดอนเมือง',
    title: 'ล้างเครื่องปรับอากาศ ห้อง 1, 2 (4 เครื่อง)',
    category: 'maintenance',
    amount: 2000,
    date: '2026-10-06',
    month: '10 ต.ค.',
    notes: 'ช่างแอร์ประจำ เครื่องละ 500 บาท',
    recordedBy: 'พนักงานดูแลหอ',
    createdAt: '2026-10-06 14:00',
  },
  {
    id: 'exp-10-04',
    building: 'อาคาร ดอนเมือง',
    title: 'ค่าแม่บ้านทำความสะอาดบันไดและทางเดินส่วนกลาง',
    category: 'cleaning_waste',
    amount: 3500,
    date: '2026-10-10',
    month: '10 ต.ค.',
    notes: 'กวาดถูทางเดินส่วนกลางสัปดาห์ละ 2 ครั้ง',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-10 11:00',
  },
  {
    id: 'exp-10-05',
    building: 'อาคาร ดอนเมือง',
    title: 'ค่าบริการอินเทอร์เน็ต Fiber WiFi หอพัก',
    category: 'internet_network',
    amount: 850,
    date: '2026-10-15',
    month: '10 ต.ค.',
    notes: '3BB Fiber 500/500 Mbps',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-15 16:30',
  },
  {
    id: 'exp-10-06',
    building: 'อาคารโรงงาน',
    title: 'ค่าไฟฟ้าการไฟฟ้าส่วนภูมิภาค (หม้อแปลง 3 เฟส โรงงาน)',
    category: 'utility_bills',
    amount: 18500,
    date: '2026-10-02',
    month: '10 ต.ค.',
    notes: 'ค่าไฟโรงงานและโกดังเก็บสินค้า',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-02 11:45',
  },
  {
    id: 'exp-10-07',
    building: 'อาคารโรงงาน',
    title: 'ค่าน้ำประปาโรงงานและที่พักช่างประจำ',
    category: 'utility_bills',
    amount: 2400,
    date: '2026-10-04',
    month: '10 ต.ค.',
    notes: 'ค่าน้ำการประปาภูมิภาค',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-04 09:20',
  },
  {
    id: 'exp-10-08',
    building: 'อาคารโรงงาน',
    title: 'ตรวจเช็คระบบตู้ควบคุมไฟและเซอร์กิตเบรกเกอร์',
    category: 'maintenance',
    amount: 2800,
    date: '2026-10-08',
    month: '10 ต.ค.',
    notes: 'ตรวจเช็คประจำปีตามมาตรฐานความปลอดภัยโรงงาน',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-08 15:10',
  },
  {
    id: 'exp-10-09',
    building: 'อาคาร ซอย 8',
    title: 'ค่าไฟฟ้าส่วนกลาง & ปั๊มน้ำแรงดัน',
    category: 'utility_bills',
    amount: 4200,
    date: '2026-10-02',
    month: '10 ต.ค.',
    notes: 'ค่าไฟไฟทางเดินและปั๊มน้ำ',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-02 10:00',
  },
  {
    id: 'exp-10-10',
    building: 'อาคาร ซอย 8',
    title: 'ค่าน้ำประปานครหลวง',
    category: 'utility_bills',
    amount: 1950,
    date: '2026-10-03',
    month: '10 ต.ค.',
    notes: 'มิเตอร์ประปาหลัก ซอย 8',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-03 11:30',
  },
  {
    id: 'exp-10-11',
    building: 'อาคาร ซอย 8',
    title: 'อินเทอร์เน็ต WiFi สำหรับผู้เช่า 15 ห้อง',
    category: 'internet_network',
    amount: 1200,
    date: '2026-10-15',
    month: '10 ต.ค.',
    notes: 'AIS Fibre 1000/500 Mbps',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-15 15:20',
  },
  {
    id: 'exp-10-12',
    building: 'อาคาร 399/40',
    title: 'ค่าไฟฟ้าและไฟทางเดิน',
    category: 'utility_bills',
    amount: 2600,
    date: '2026-10-02',
    month: '10 ต.ค.',
    notes: 'มิเตอร์ส่วนกลาง 399/40',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-02 14:00',
  },
  {
    id: 'exp-10-13',
    building: 'อาคาร 399/38',
    title: 'ค่าไฟฟ้าและการจัดการขยะ',
    category: 'cleaning_waste',
    amount: 2800,
    date: '2026-10-07',
    month: '10 ต.ค.',
    notes: 'ค่าเก็บขยะเทศบาลและไฟทางเดิน 399/38',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-07 09:00',
  },
  {
    id: 'exp-10-14',
    building: 'ส่วนกลาง/สำนักงาน',
    title: 'เงินเดือนพนักงานดูแลหอพักและช่างซ่อมบำรุง',
    category: 'staff_salary',
    amount: 12000,
    date: '2026-10-01',
    month: '10 ต.ค.',
    notes: 'เงินเดือนช่างสมศักดิ์ ดูแลทุกอาคาร',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-01 08:30',
  },
  {
    id: 'exp-10-15',
    building: 'ส่วนกลาง/สำนักงาน',
    title: 'ค่าน้ำยาทำความสะอาด ไม้ถูพื้น และถุงขยะส่วนกลาง',
    category: 'supplies',
    amount: 950,
    date: '2026-10-05',
    month: '10 ต.ค.',
    notes: 'ซื้อจาก Makro สต็อกใช้ประจำเดือน',
    recordedBy: 'พนักงานดูแลหอ',
    createdAt: '2026-10-05 11:15',
  },
  {
    id: 'exp-10-16',
    building: 'ส่วนกลาง/สำนักงาน',
    title: 'ค่าโปรแกรมบัญชีและภาษีป้ายรายปี',
    category: 'tax_insurance',
    amount: 1200,
    date: '2026-10-25',
    month: '10 ต.ค.',
    notes: 'ภาษีป้ายและใบอนุญาตรายปี',
    recordedBy: 'คุณแม่',
    createdAt: '2026-10-25 10:40',
  },

  // เดือนก่อนหน้า (09 ก.ย.) สำหรับ Trend Chart
  {
    id: 'exp-09-01',
    building: 'อาคาร ดอนเมือง',
    title: 'ค่าไฟฟ้าการไฟฟ้านครหลวง',
    category: 'utility_bills',
    amount: 6700,
    date: '2026-09-02',
    month: '09 ก.ย.',
    notes: 'บิลเดือน ส.ค.',
  },
  {
    id: 'exp-09-02',
    building: 'อาคาร ดอนเมือง',
    title: 'ค่าน้ำประปานครหลวง',
    category: 'utility_bills',
    amount: 1380,
    date: '2026-09-03',
    month: '09 ก.ย.',
  },
  {
    id: 'exp-09-03',
    building: 'อาคารโรงงาน',
    title: 'ค่าไฟฟ้าการไฟฟ้าโรงงาน',
    category: 'utility_bills',
    amount: 17900,
    date: '2026-09-02',
    month: '09 ก.ย.',
  },
  {
    id: 'exp-09-04',
    building: 'อาคาร ซอย 8',
    title: 'ค่าไฟฟ้าส่วนกลาง',
    category: 'utility_bills',
    amount: 4100,
    date: '2026-09-02',
    month: '09 ก.ย.',
  },
  {
    id: 'exp-09-05',
    building: 'ส่วนกลาง/สำนักงาน',
    title: 'เงินเดือนพนักงานดูแลหอพัก',
    category: 'staff_salary',
    amount: 12000,
    date: '2026-09-01',
    month: '09 ก.ย.',
  },

  // เดือนก่อนหน้า (08 ส.ค.) สำหรับ Trend Chart
  {
    id: 'exp-08-01',
    building: 'อาคาร ดอนเมือง',
    title: 'ค่าไฟฟ้าการไฟฟ้านครหลวง',
    category: 'utility_bills',
    amount: 6850,
    date: '2026-08-02',
    month: '08 ส.ค.',
  },
  {
    id: 'exp-08-02',
    building: 'อาคารโรงงาน',
    title: 'ค่าไฟฟ้าการไฟฟ้าส่วนภูมิภาค',
    category: 'utility_bills',
    amount: 18500,
    date: '2026-08-02',
    month: '08 ส.ค.',
  },
  {
    id: 'exp-08-03',
    building: 'ส่วนกลาง/สำนักงาน',
    title: 'เงินเดือนพนักงานดูแลหอพัก',
    category: 'staff_salary',
    amount: 12000,
    date: '2026-08-01',
    month: '08 ส.ค.',
  },
];

export const DEFAULT_APP_USERS: AppUser[] = [
  {
    id: 'user-ploy',
    name: 'คุณพลอย (Ploy - Owner & Super Admin)',
    username: 'ploy',
    email: 'ploy@propmanage.com',
    password: '0840411115',
    role: 'ploy',
    isMom: false,
    avatar: '💎',
    phone: '084-041-1115',
    pinCode: '0840411115',
    notes: 'คุณพลอย (Ploy) - เจ้าของหอพักและผู้ดูแลระบบสูงสุด (Owner & Super Admin): สิทธิ์เต็ม ดูและแก้ไขได้ทุกระบบ รวมถึงการเงิน รายรับ รายจ่าย ข้อมูลทุกอย่าง',
    createdAt: '2025-01-01',
  },
  {
    id: 'user-owner',
    name: 'คุณแม่ (เจ้าของหอพัก)',
    username: 'mom',
    email: 'mom@propmanage.com',
    password: '1234',
    role: 'owner',
    isMom: true,
    avatar: '👑',
    phone: '081-987-6543',
    pinCode: '1234',
    notes: 'เจ้าของหอพัก (Owner) - ดูแดชบอร์ด, จดมิเตอร์, ห้องพัก, จัดการอาคาร, ใบแจ้งหนี้, จัดการผู้ใช้, โหมดคนแก่, เลือกรอบบิลได้ทุกเดือน',
    createdAt: '2025-01-01',
  },
  {
    id: 'user-staff',
    name: 'สมศักดิ์ ช่างดูแลหอพัก (พนักงาน)',
    username: 'staff',
    email: 'staff@propmanage.com',
    password: 'staff',
    role: 'caretaker',
    isMom: false,
    avatar: '👷‍♂️',
    phone: '089-123-4567',
    pinCode: '0891234567',
    notes: 'พนักงานดูแลหอ (Staff) - ดูแดชบอร์ด, จดมิเตอร์, ห้องพัก, ใบแจ้งหนี้, เลือกรอบบิลได้ทุกเดือน (ซ่อนข้อมูลเรื่องเงินทั้งหมด)',
    createdAt: '2025-01-05',
  },
];

export const DEFAULT_LANDLORD_CONFIG: LandlordConfig = {
  propertyName: 'พีแอนด์เจ อพาร์ตเมนต์ & ลีสซิ่ง (P&J Living & Factory)',
  landlordName: 'คุณประดิษฐ์ เจริญสุขสิริ',
  address: 'เลขที่ 88/19 หมู่ 4 ถ.สรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
  taxId: '0-1055-64019-88-2',
  phone: '081-987-6543, 02-566-7890',
  promptPayId: '0819876543',
  bankName: 'ธนาคารกสิกรไทย',
  bankAccount: '743-2-89012-3',

  // House Rental Payment Account Option (บัญชีรับเงินของบ้านเช่า - ทางเลือกบัญชีที่ 2)
  houseAccountEnabled: true,
  houseAccountLabel: 'บัญชีบ้านเช่า',
  houseBankName: 'ธนาคารไทยพาณิชย์ (SCB)',
  houseBankAccount: '408-2-88910-1',
  housePromptPayId: '0840411115',
  houseAccountName: 'คุณพลอย (Ploy)',
  houseAccountNotes: 'บัญชีรับเงินเฉพาะสำหรับบ้านเช่า & ที่พักส่วนตัว',

  waterRateDefault: 18, // 1. คิดตามมิเตอร์ (18 บาท/หน่วย)
  waterPerPersonRateDefault: 100, // 2. คิดเหมาจ่ายรายคน (100 บาท/คน)
  elecRateDefault: 8,
  minWaterFee: 100,
  commonFeeDefault: 0,
  paymentDueDay: 5, // กำหนดชำระทุกวันที่ 5 ของทุกเดือน
  lateFeePerDayDefault: 100, // ค่าปรับชำระล่าช้าวันละ 100 บาท
  latePolicyNotice: 'กำหนดชำระเงินทุกวันที่ 5 ของเดือน หากชำระล่าช้าคิดค่าปรับวันละ 100 บาท (Payment Due: 5th of month. Late fee: 100 THB/day)',
  carryOverArrearsDefault: false, // ไม่มีค้างจ่ายเป็น default
};

export const DEFAULT_BUILDINGS: BuildingProfile[] = OCTOBER_BUILDINGS;

export const AVAILABLE_MONTHS = [
  '01 ม.ค.',
  '02 ก.พ.',
  '03 มี.ค.',
  '04 เม.ย.',
  '05 พ.ค.',
  '06 มิ.ย.',
  '07 ก.ค.',
  '08 ส.ค.',
  '09 ก.ย.',
  '10 ต.ค.',
  '11 พ.ย.',
  '12 ธ.ค.',
];

export interface BaseRoomTemplate {
  key: string;
  buildingId: string;
  building: string;
  roomNo: string;
  floor: number;
  tenantName: string;
  phone: string;
  occupants: number;
  occupancyStatus: OccupancyStatus;
  renovationReason?: string;
  waterCalcType: WaterCalcType;
  waterPerPersonRate: number;
  rent: number;
  baseWater: number;
  waterStep: number;
  baseElec: number;
  elecStep: number;
  otherFees: number;
  paymentAccountOption?: 'default' | 'house' | 'custom';
}

const BASE_ROOM_TEMPLATES: BaseRoomTemplate[] = [
  {
    key: 'DM-101',
    buildingId: 'BLD-DM01',
    building: 'อาคารดอนเมือง',
    roomNo: '101',
    floor: 1,
    tenantName: 'นายสมชาย มั่งมีทรัพย์',
    phone: '089-112-3344',
    occupants: 2,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 3800,
    baseWater: 1360,
    waterStep: 8,
    baseElec: 2400,
    elecStep: 135,
    otherFees: 0,
  },
  {
    key: 'DM-102',
    buildingId: 'BLD-DM01',
    building: 'อาคารดอนเมือง',
    roomNo: '102',
    floor: 1,
    tenantName: 'นางสาวกานดา รักษ์ดี',
    phone: '086-445-5667',
    occupants: 1,
    occupancyStatus: 'occupied',
    waterCalcType: 'per_person', // เหมาจ่ายรายคน (100 บาท/คน)
    waterPerPersonRate: 100,
    rent: 3800,
    baseWater: 850,
    waterStep: 6,
    baseElec: 1600,
    elecStep: 125,
    otherFees: 0,
  },
  {
    key: 'DM-201',
    buildingId: 'BLD-DM01',
    building: 'อาคารดอนเมือง',
    roomNo: '201',
    floor: 2,
    tenantName: 'นายวรวิทย์ วัฒนพงษ์',
    phone: '091-778-8990',
    occupants: 3,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 4200,
    baseWater: 1030,
    waterStep: 10,
    baseElec: 2800,
    elecStep: 180,
    otherFees: 0,
  },
  {
    key: 'DM-202',
    buildingId: 'BLD-DM01',
    building: 'อาคารดอนเมือง',
    roomNo: '202',
    floor: 2,
    tenantName: 'นางสาวสุภาภรณ์ ชัยชนะ',
    phone: '082-334-9988',
    occupants: 2,
    occupancyStatus: 'occupied',
    waterCalcType: 'per_person', // เหมาจ่ายรายคน (2 คน = 200 บาท)
    waterPerPersonRate: 100,
    rent: 4200,
    baseWater: 890,
    waterStep: 8,
    baseElec: 2600,
    elecStep: 160,
    otherFees: 0,
  },
  {
    key: 'DM-301',
    buildingId: 'BLD-DM01',
    building: 'อาคารดอนเมือง',
    roomNo: '301',
    floor: 3,
    tenantName: 'นายธนกฤต ทรัพย์เจริญ',
    phone: '095-881-2233',
    occupants: 1,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 4500,
    baseWater: 1270,
    waterStep: 9,
    baseElec: 3800,
    elecStep: 175,
    otherFees: 0,
  },
  {
    key: 'DM-302',
    buildingId: 'BLD-DM01',
    building: 'อาคารดอนเมือง',
    roomNo: '302',
    floor: 3,
    tenantName: '',
    phone: '',
    occupants: 0,
    occupancyStatus: 'vacant', // ห้องว่าง พร้อมให้เช่า
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 4500,
    baseWater: 1620,
    waterStep: 0,
    baseElec: 3900,
    elecStep: 0,
    otherFees: 0,
  },
  {
    key: 'DM-303',
    buildingId: 'BLD-DM01',
    building: 'อาคารดอนเมือง',
    roomNo: '303',
    floor: 3,
    tenantName: '',
    phone: '',
    occupants: 0,
    occupancyStatus: 'under_renovation', // กำลังปรับปรุง / ทาสีใหม่
    renovationReason: 'ปรับปรุงห้องน้ำและทาสีผนังใหม่ กำหนดเสร็จสิ้นเดือนนี้',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 4500,
    baseWater: 1100,
    waterStep: 0,
    baseElec: 2900,
    elecStep: 0,
    otherFees: 0,
  },
  {
    key: 'FAC-01',
    buildingId: 'BLD-FAC01',
    building: 'อาคารโรงงาน',
    roomNo: 'Unit-01',
    floor: 1,
    tenantName: 'บจก. สยาม โลจิสติกส์ พลัส',
    phone: '02-998-1234',
    occupants: 8,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 18000,
    baseWater: 3100,
    waterStep: 45,
    baseElec: 4000,
    elecStep: 1200,
    otherFees: 0,
  },
  {
    key: 'FAC-02',
    buildingId: 'BLD-FAC01',
    building: 'อาคารโรงงาน',
    roomNo: 'Unit-02',
    floor: 1,
    tenantName: 'หจก. แสงทอง การพิมพ์ แอนด์ แพ็คเกจจิ้ง',
    phone: '02-887-5544',
    occupants: 12,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 22000,
    baseWater: 1900,
    waterStep: 32,
    baseElec: 7000,
    elecStep: 1600,
    otherFees: 0,
  },
  {
    key: 'FAC-03',
    buildingId: 'BLD-FAC01',
    building: 'อาคารโรงงาน',
    roomNo: 'Unit-03',
    floor: 1,
    tenantName: 'นายชูเกียรติ ยานยนต์ เซอร์วิส',
    phone: '081-445-9988',
    occupants: 5,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 15000,
    baseWater: 1580,
    waterStep: 28,
    baseElec: 3500,
    elecStep: 800,
    otherFees: 0,
  },
  {
    key: 'FAC-Staff1',
    buildingId: 'BLD-FAC01',
    building: 'อาคารโรงงาน',
    roomNo: 'Staff-101',
    floor: 1,
    tenantName: 'นายมานะ ใจดี (หัวหน้าช่าง)',
    phone: '088-223-1122',
    occupants: 2,
    occupancyStatus: 'occupied',
    waterCalcType: 'per_person', // เหมาจ่ายรายคน (2 คน = 200 บาท)
    waterPerPersonRate: 100,
    rent: 2500,
    baseWater: 490,
    waterStep: 7,
    baseElec: 1200,
    elecStep: 90,
    otherFees: 0,
  },
  {
    key: 'FAC-Staff2',
    buildingId: 'BLD-FAC01',
    building: 'อาคารโรงงาน',
    roomNo: 'Staff-102',
    floor: 1,
    tenantName: '',
    phone: '',
    occupants: 0,
    occupancyStatus: 'vacant', // ห้องพักช่างว่าง
    waterCalcType: 'per_person',
    waterPerPersonRate: 100,
    rent: 2500,
    baseWater: 350,
    waterStep: 0,
    baseElec: 900,
    elecStep: 0,
    otherFees: 0,
  },
  {
    key: 'SOI8-01',
    buildingId: 'BLD-SOI8',
    building: 'อาคาร ซอย 8',
    roomNo: '1',
    floor: 1,
    tenantName: 'MG AUNG KYAW',
    phone: '',
    occupants: 1,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 3800,
    baseWater: 245,
    waterStep: 5,
    baseElec: 1810,
    elecStep: 140,
    otherFees: 0,
  },
  {
    key: 'SOI8-02',
    buildingId: 'BLD-SOI8',
    building: 'อาคาร ซอย 8',
    roomNo: '2',
    floor: 1,
    tenantName: 'คุณ กัน',
    phone: '',
    occupants: 1,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 3500,
    baseWater: 200,
    waterStep: 4,
    baseElec: 3040,
    elecStep: 110,
    otherFees: 0,
  },
  {
    key: '399-40-01',
    buildingId: 'BLD-399-40',
    building: 'อาคาร 399/40',
    roomNo: '1',
    floor: 1,
    tenantName: 'คุณ เล็ก',
    phone: '',
    occupants: 1,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 6000,
    baseWater: 0,
    waterStep: 0,
    baseElec: 0,
    elecStep: 0,
    otherFees: 0,
  },
];

function generate12MonthData(): Record<string, RoomRecord[]> {
  const result: Record<string, RoomRecord[]> = {};

  AVAILABLE_MONTHS.forEach((monthStr, monthIndex) => {
    // monthIndex: 0 = 01 ม.ค. ... 7 = 08 ส.ค. ... 11 = 12 ธ.ค.
    result[monthStr] = BASE_ROOM_TEMPLATES.map((tmpl, idx) => {
      const isFactory = tmpl.building.includes('โรงงาน');
      const waterRate = isFactory ? 20 : 18;
      const elecRate = isFactory ? 8.5 : 8;

      const isOccupied = tmpl.occupancyStatus === 'occupied';

      const waterPrev = tmpl.baseWater + monthIndex * tmpl.waterStep;
      const elecPrev = tmpl.baseElec + monthIndex * tmpl.elecStep;

      // In recorded months:
      const isRecorded = isOccupied && (monthIndex < 7 || (monthIndex === 7 && idx !== 3 && idx !== 8));
      const waterCurr = isRecorded ? waterPrev + tmpl.waterStep : (isOccupied ? 0 : waterPrev);
      const elecCurr = isRecorded ? elecPrev + tmpl.elecStep : (isOccupied ? 0 : elecPrev);

      let waterUnits = 0;
      let waterCost = 0;

      if (isOccupied) {
        if (tmpl.waterCalcType === 'per_person') {
          waterUnits = 0;
          waterCost = (tmpl.occupants || 1) * (tmpl.waterPerPersonRate || 100);
        } else {
          waterUnits = isRecorded ? Math.max(0, waterCurr - waterPrev) : 0;
          waterCost = waterUnits * waterRate;
        }
      }

      const elecUnits = isOccupied && isRecorded ? Math.max(0, elecCurr - elecPrev) : 0;
      const elecCost = elecUnits * elecRate;

      const rentAmount = isOccupied ? tmpl.rent : 0;
      const otherFeesAmount = isOccupied ? tmpl.otherFees : 0;
      const total = rentAmount + waterCost + elecCost + otherFeesAmount;
      
      const isPaid = isOccupied ? (monthIndex < 7 ? true : (monthIndex === 7 ? (idx % 2 === 0) : false)) : false;
      const paddedMonth = (monthIndex + 1).toString().padStart(2, '0');

      // Sample liabilities for unpaid rooms in month 8 (August / Current cycle)
      let previousBalance = 0;
      let lateDays = 0;
      const lateFeePerDay = 100;

      if (isOccupied && !isPaid && monthIndex === 7) {
        if (idx === 1) {
          lateDays = 2; // 2 days late (e.g. now 7th, due 5th)
        } else if (idx === 3) {
          previousBalance = 500; // Arrears from previous month
          lateDays = 3; // 3 days late
        } else if (idx === 5) {
          lateDays = 1; // 1 day late
        }
      }

      const lateFeeTotal = lateDays * lateFeePerDay;
      const liabilityTotal = previousBalance + lateFeeTotal;
      const grandTotal = total + liabilityTotal;

      return {
        key: tmpl.key,
        buildingId: tmpl.buildingId,
        building: tmpl.building,
        roomNo: tmpl.roomNo,
        floor: tmpl.floor,
        tenantName: tmpl.tenantName,
        phone: tmpl.phone,
        occupants: tmpl.occupants,
        occupancyStatus: tmpl.occupancyStatus,
        isOccupied,
        renovationReason: tmpl.renovationReason,
        waterCalcType: tmpl.waterCalcType || 'meter',
        waterPerPersonRate: tmpl.waterPerPersonRate || 100,
        rent: tmpl.rent,
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
        otherFees: tmpl.otherFees,
        total,
        previousBalance,
        lateDays,
        lateFeePerDay,
        lateFeeTotal,
        liabilityTotal,
        grandTotal,
        isPaid,
        paymentDate: isPaid ? `2026-${paddedMonth}-05` : undefined,
        hasMeterUpdated: isRecorded,
        meterUpdatedDate: isRecorded ? `2026-${paddedMonth}-01 10:00` : undefined,
        notes: isOccupied 
          ? (isPaid 
              ? 'ชำระผ่านพร้อมเพย์แล้ว' 
              : (lateDays > 0 
                  ? `เลยกำหนดชำระ ${lateDays} วัน (ค่าปรับ ฿${lateFeeTotal})` 
                  : (isRecorded ? 'รอชำระเงิน (ครบกำหนด 5 ส.ค.)' : 'รอกดบันทึกมิเตอร์')))
          : (tmpl.occupancyStatus === 'vacant' ? 'ห้องว่าง พร้อมเปิดให้เช่า' : 'กำลังปิดปรับปรุง/ทาสี'),
      };
    });
  });

  return result;
}

export const INITIAL_ROOMS_DATA: Record<string, RoomRecord[]> = generateAllOctoberRooms();
