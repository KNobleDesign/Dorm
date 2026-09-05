import { RoomRecord, LandlordConfig, WaterCalcType, BuildingProfile, OccupancyStatus, AppUser, ExpenseRecord, ExpenseCategory } from '../types';

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
  // 08 ส.ค. (Current Month)
  {
    id: 'exp-08-01',
    building: 'อาคารดอนเมือง',
    title: 'ค่าไฟฟ้าการไฟฟ้านครหลวง (มิเตอร์ใหญ่ส่วนกลาง)',
    category: 'utility_bills',
    amount: 6850,
    date: '2026-08-02',
    month: '08 ส.ค.',
    notes: 'บิลค่าไฟรอบเดือน ก.ค. ครอบคลุมห้องพัก 8 ห้อง',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-02 09:30',
  },
  {
    id: 'exp-08-02',
    building: 'อาคารดอนเมือง',
    title: 'ค่าน้ำประปานครหลวง (มิเตอร์ประปาหลัก)',
    category: 'utility_bills',
    amount: 1420,
    date: '2026-08-03',
    month: '08 ส.ค.',
    notes: 'ค่าน้ำประปาประจำเดือน',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-03 10:15',
  },
  {
    id: 'exp-08-03',
    building: 'อาคารดอนเมือง',
    title: 'ล้างเครื่องปรับอากาศ ห้อง 101, 201 (4 เครื่อง)',
    category: 'maintenance',
    amount: 2000,
    date: '2026-08-06',
    month: '08 ส.ค.',
    notes: 'ช่างแอร์ประจำ ช่างหนุ่ม เครื่องละ 500 บาท',
    recordedBy: 'พนักงานดูแลหอ',
    createdAt: '2026-08-06 14:00',
  },
  {
    id: 'exp-08-04',
    building: 'อาคารดอนเมือง',
    title: 'ค่าแม่บ้านทำความสะอาดบันไดและทางเดินส่วนกลาง',
    category: 'cleaning_waste',
    amount: 3500,
    date: '2026-08-10',
    month: '08 ส.ค.',
    notes: 'กวาดถูทางเดินส่วนกลางสัปดาห์ละ 2 ครั้ง',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-10 11:00',
  },
  {
    id: 'exp-08-05',
    building: 'อาคารดอนเมือง',
    title: 'ค่าบริการอินเทอร์เน็ต Fiber WiFi หอพัก',
    category: 'internet_network',
    amount: 850,
    date: '2026-08-15',
    month: '08 ส.ค.',
    notes: '3BB Fiber 500/500 Mbps',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-15 16:30',
  },
  {
    id: 'exp-08-06',
    building: 'อาคารดอนเมือง',
    title: 'เปลี่ยนก๊อกน้ำและลูกลอยถังพักน้ำชั้นดาดฟ้า',
    category: 'maintenance',
    amount: 650,
    date: '2026-08-18',
    month: '08 ส.ค.',
    notes: 'ซื้ออุปกรณ์จากร้านวัสดุ ช่างดูแลหอติดตั้งเอง',
    recordedBy: 'พนักงานดูแลหอ',
    createdAt: '2026-08-18 13:20',
  },

  // อาคารโรงงาน
  {
    id: 'exp-08-07',
    building: 'อาคารโรงงาน',
    title: 'ค่าไฟฟ้าการไฟฟ้าส่วนภูมิภาค (หม้อแปลง 3 เฟส โรงงาน)',
    category: 'utility_bills',
    amount: 18500,
    date: '2026-08-02',
    month: '08 ส.ค.',
    notes: 'ค่าไฟโรงงานและโกดังเก็บสินค้า',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-02 11:45',
  },
  {
    id: 'exp-08-08',
    building: 'อาคารโรงงาน',
    title: 'ค่าน้ำประปาโรงงานและที่พักช่างประจำ',
    category: 'utility_bills',
    amount: 2400,
    date: '2026-08-04',
    month: '08 ส.ค.',
    notes: 'ค่าน้ำการประปาภูมิภาค',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-04 09:20',
  },
  {
    id: 'exp-08-09',
    building: 'อาคารโรงงาน',
    title: 'ตรวจเช็คระบบตู้ควบคุมไฟและเซอร์กิตเบรกเกอร์',
    category: 'maintenance',
    amount: 2800,
    date: '2026-08-08',
    month: '08 ส.ค.',
    notes: 'ตรวจเช็คประจำปีตามมาตรฐานความปลอดภัยโรงงาน',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-08 15:10',
  },
  {
    id: 'exp-08-10',
    building: 'อาคารโรงงาน',
    title: 'ค่าบริการจัดเก็บและกำจัดขยะเทศบาลบางกะดี',
    category: 'cleaning_waste',
    amount: 1500,
    date: '2026-08-12',
    month: '08 ส.ค.',
    notes: 'ค่าธรรมเนียมเก็บขยะเทศบาลรายเดือน',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-12 10:00',
  },
  {
    id: 'exp-08-11',
    building: 'อาคารโรงงาน',
    title: 'ค่าอินเทอร์เน็ตสำนักงานและระบบกล้องวงจรปิด',
    category: 'internet_network',
    amount: 799,
    date: '2026-08-15',
    month: '08 ส.ค.',
    notes: 'True Gigatex Fiber Pro',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-15 14:00',
  },
  {
    id: 'exp-08-12',
    building: 'อาคารโรงงาน',
    title: 'บำรุงรักษาระบบปั๊มน้ำแรงดันและวาล์วดับเพลิง',
    category: 'maintenance',
    amount: 1900,
    date: '2026-08-20',
    month: '08 ส.ค.',
    notes: 'เปลี่ยนลูกยางและเช็ควาล์ว',
    recordedBy: 'พนักงานดูแลหอ',
    createdAt: '2026-08-20 16:45',
  },

  // อาคารรังสิตภิรมย์
  {
    id: 'exp-08-13',
    building: 'อาคารรังสิตภิรมย์',
    title: 'ค่าไฟฟ้าการไฟฟ้านครหลวง (หม้อแปลงรวม & ลิฟต์)',
    category: 'utility_bills',
    amount: 8900,
    date: '2026-08-02',
    month: '08 ส.ค.',
    notes: 'ค่าไฟมิเตอร์หลัก 12 ห้อง + ไฟทางเดิน',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-02 10:00',
  },
  {
    id: 'exp-08-14',
    building: 'อาคารรังสิตภิรมย์',
    title: 'ค่าน้ำประปานครหลวง',
    category: 'utility_bills',
    amount: 2100,
    date: '2026-08-03',
    month: '08 ส.ค.',
    notes: 'มิเตอร์น้ำรวมตึกรังสิต',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-03 11:30',
  },
  {
    id: 'exp-08-15',
    building: 'อาคารรังสิตภิรมย์',
    title: 'ค่าแม่บ้านประจำตึกทำความสะอาดและดูแลขยะ',
    category: 'cleaning_waste',
    amount: 5000,
    date: '2026-08-07',
    month: '08 ส.ค.',
    notes: 'แม่บ้านพี่จิตร ทำความสะอาดทุกวันเว้นวันอาทิตย์',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-07 09:00',
  },
  {
    id: 'exp-08-16',
    building: 'อาคารรังสิตภิรมย์',
    title: 'ซ่อมเปลี่ยนสแกนนิ้ว/คีย์การ์ดประตูทางเข้าหลัก',
    category: 'security_cctv',
    amount: 1200,
    date: '2026-08-11',
    month: '08 ส.ค.',
    notes: 'เปลี่ยนชุดกลอนแม่เหล็กไฟฟ้า',
    recordedBy: 'พนักงานดูแลหอ',
    createdAt: '2026-08-11 13:00',
  },
  {
    id: 'exp-08-17',
    building: 'อาคารรังสิตภิรมย์',
    title: 'ระบบอินเทอร์เน็ต WiFi Access Points 4 ชั้น',
    category: 'internet_network',
    amount: 1600,
    date: '2026-08-15',
    month: '08 ส.ค.',
    notes: 'AIS Fibre 1000/500 Mbps สำหรับผู้เช่า',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-15 15:20',
  },
  {
    id: 'exp-08-18',
    building: 'อาคารรังสิตภิรมย์',
    title: 'เปลี่ยนหลอดไฟ LED ทางเดินและบันไดหนีไฟ 10 จุด',
    category: 'maintenance',
    amount: 750,
    date: '2026-08-22',
    month: '08 ส.ค.',
    notes: 'หลอด LED T8 Philips',
    recordedBy: 'พนักงานดูแลหอ',
    createdAt: '2026-08-22 17:00',
  },

  // ส่วนกลาง/สำนักงาน
  {
    id: 'exp-08-19',
    building: 'ส่วนกลาง/สำนักงาน',
    title: 'เงินเดือนพนักงานดูแลหอพักและช่างซ่อมบำรุง',
    category: 'staff_salary',
    amount: 12000,
    date: '2026-08-01',
    month: '08 ส.ค.',
    notes: 'เงินเดือนช่างสมศักดิ์ ดูแลทั้ง 3 อาคาร',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-01 08:30',
  },
  {
    id: 'exp-08-20',
    building: 'ส่วนกลาง/สำนักงาน',
    title: 'ค่าน้ำยาทำความสะอาด ไม้ถูพื้น และถุงขยะส่วนกลาง',
    category: 'supplies',
    amount: 950,
    date: '2026-08-05',
    month: '08 ส.ค.',
    notes: 'ซื้อจาก Makro สต็อกใช้ 1 เดือน',
    recordedBy: 'พนักงานดูแลหอ',
    createdAt: '2026-08-05 11:15',
  },
  {
    id: 'exp-08-21',
    building: 'ส่วนกลาง/สำนักงาน',
    title: 'ค่าธรรมเนียมโปรแกรมบัญชี & ภาษีป้าย',
    category: 'tax_insurance',
    amount: 1200,
    date: '2026-08-25',
    month: '08 ส.ค.',
    notes: 'ภาษีป้ายและใบอนุญาตรายปี',
    recordedBy: 'คุณแม่',
    createdAt: '2026-08-25 10:40',
  },

  // เดือนก่อนหน้า (07 ก.ค.) สำหรับ Trend Chart
  {
    id: 'exp-07-01',
    building: 'อาคารดอนเมือง',
    title: 'ค่าไฟฟ้าการไฟฟ้านครหลวง',
    category: 'utility_bills',
    amount: 6700,
    date: '2026-07-02',
    month: '07 ก.ค.',
    notes: 'บิลเดือน มิ.ย.',
  },
  {
    id: 'exp-07-02',
    building: 'อาคารดอนเมือง',
    title: 'ค่าน้ำประปานครหลวง',
    category: 'utility_bills',
    amount: 1350,
    date: '2026-07-03',
    month: '07 ก.ค.',
  },
  {
    id: 'exp-07-03',
    building: 'อาคารโรงงาน',
    title: 'ค่าไฟฟ้าการไฟฟ้าโรงงาน',
    category: 'utility_bills',
    amount: 17800,
    date: '2026-07-02',
    month: '07 ก.ค.',
  },
  {
    id: 'exp-07-04',
    building: 'อาคารรังสิตภิรมย์',
    title: 'ค่าไฟฟ้าหม้อแปลงรวม',
    category: 'utility_bills',
    amount: 8600,
    date: '2026-07-02',
    month: '07 ก.ค.',
  },
  {
    id: 'exp-07-05',
    building: 'ส่วนกลาง/สำนักงาน',
    title: 'เงินเดือนพนักงานดูแลหอพัก',
    category: 'staff_salary',
    amount: 12000,
    date: '2026-07-01',
    month: '07 ก.ค.',
  },
  {
    id: 'exp-07-06',
    building: 'อาคารดอนเมือง',
    title: 'ค่าแม่บ้านและเก็บขยะ',
    category: 'cleaning_waste',
    amount: 3500,
    date: '2026-07-10',
    month: '07 ก.ค.',
  },
  {
    id: 'exp-07-07',
    building: 'อาคารรังสิตภิรมย์',
    title: 'ค่าแม่บ้านประจำตึก',
    category: 'cleaning_waste',
    amount: 5000,
    date: '2026-07-07',
    month: '07 ก.ค.',
  },
  {
    id: 'exp-07-08',
    building: 'อาคารโรงงาน',
    title: 'ค่าซ่อมบำรุงประจำเดือน',
    category: 'maintenance',
    amount: 3200,
    date: '2026-07-15',
    month: '07 ก.ค.',
  },
  {
    id: 'exp-07-09',
    building: 'อาคารรังสิตภิรมย์',
    title: 'ค่าอินเทอร์เน็ต WiFi',
    category: 'internet_network',
    amount: 1600,
    date: '2026-07-15',
    month: '07 ก.ค.',
  },
  {
    id: 'exp-07-10',
    building: 'อาคารดอนเมือง',
    title: 'ค่าอินเทอร์เน็ต WiFi',
    category: 'internet_network',
    amount: 850,
    date: '2026-07-15',
    month: '07 ก.ค.',
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
    notes: 'เจ้าของหอพัก (Owner) - ดูแดชบอร์ด, จดมิเตอร์, ห้องพัก, ใบแจ้งหนี้, จัดการผู้ใช้, โหมดคนแก่, เลือกรอบบิลได้ทุกเดือน',
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
  waterRateDefault: 18, // 1. คิดตามมิเตอร์ (18 บาท/หน่วย)
  waterPerPersonRateDefault: 100, // 2. คิดเหมาจ่ายรายคน (100 บาท/คน)
  elecRateDefault: 8,
  minWaterFee: 100,
  commonFeeDefault: 0,
  paymentDueDay: 5, // กำหนดชำระทุกวันที่ 5 ของทุกเดือน
  lateFeePerDayDefault: 100, // ค่าปรับชำระล่าช้าวันละ 100 บาท
  latePolicyNotice: 'กำหนดชำระเงินทุกวันที่ 5 ของเดือน หากชำระล่าช้าคิดค่าปรับวันละ 100 บาท (Payment Due: 5th of month. Late fee: 100 THB/day)',
};

export const DEFAULT_BUILDINGS: BuildingProfile[] = [
  {
    id: 'BLD-DM01',
    name: 'อาคารดอนเมือง',
    totalUnits: 8,
    location: '88/19 หมู่ 4 ถ.สรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
    floors: 3,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'หอพักสไตล์โมเดิร์น 3 ชั้น ใกล้สนามบินดอนเมือง ห้องแอร์พร้อมเฟอร์นิเจอร์',
    createdAt: '2025-01-10',
  },
  {
    id: 'BLD-FAC01',
    name: 'อาคารโรงงาน',
    totalUnits: 6,
    location: '122/4 ซอยนิคมอุตสาหกรรมบางกะดี ต.บางกะดี อ.เมือง จ.ปทุมธานี 12000',
    floors: 1,
    defaultWaterRate: 20,
    defaultElecRate: 8.5,
    description: 'อาคารโกดังและโรงงานอุตสาหกรรม พร้อมสำนักงานและที่พักช่างประจำโรงงาน',
    createdAt: '2025-01-15',
  },
  {
    id: 'BLD-RNG01',
    name: 'อาคารรังสิตภิรมย์',
    totalUnits: 12,
    location: '99/5 ซอยรังสิตภิรมย์ ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120',
    floors: 4,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'หอพักนักศึกษาและคนทำงาน ใกล้มหาวิทยาลัยกรุงเทพ รังสิต ระบบคีย์การ์ด',
    createdAt: '2025-06-01',
  },
];

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
    key: 'RNG-101',
    buildingId: 'BLD-RNG01',
    building: 'อาคารรังสิตภิรมย์',
    roomNo: '101',
    floor: 1,
    tenantName: 'นายภูวดล อินทรประเสริฐ (นศ. ม.กรุงเทพ)',
    phone: '089-765-4321',
    occupants: 1,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 4800,
    baseWater: 520,
    waterStep: 7,
    baseElec: 1100,
    elecStep: 140,
    otherFees: 0,
  },
  {
    key: 'RNG-102',
    buildingId: 'BLD-RNG01',
    building: 'อาคารรังสิตภิรมย์',
    roomNo: '102',
    floor: 1,
    tenantName: '',
    phone: '',
    occupants: 0,
    occupancyStatus: 'vacant',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 4800,
    baseWater: 480,
    waterStep: 0,
    baseElec: 980,
    elecStep: 0,
    otherFees: 0,
  },
  {
    key: 'RNG-201',
    buildingId: 'BLD-RNG01',
    building: 'อาคารรังสิตภิรมย์',
    roomNo: '201',
    floor: 2,
    tenantName: 'นางสาวณิชากร พรรณราย',
    phone: '081-332-2114',
    occupants: 2,
    occupancyStatus: 'occupied',
    waterCalcType: 'meter',
    waterPerPersonRate: 100,
    rent: 5200,
    baseWater: 610,
    waterStep: 9,
    baseElec: 1400,
    elecStep: 190,
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

export const INITIAL_ROOMS_DATA: Record<string, RoomRecord[]> = generate12MonthData();
