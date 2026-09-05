export type WaterCalcType = 'meter' | 'per_person';

export type OccupancyStatus = 'occupied' | 'vacant' | 'under_renovation';

export interface BuildingProfile {
  id: string; // e.g. "BLD-DM01", "BLD-FAC01"
  name: string; // e.g. "อาคารดอนเมือง", "อาคารโรงงาน", "บ้านเช่า"
  totalUnits: number; // Planned / maximum capacity of physical units
  location: string; // Full address or location
  floors: number; // Number of floors
  defaultWaterRate: number; // default water rate per unit or person
  defaultElecRate: number; // default electric rate per unit
  description?: string;
  notes?: string;
  createdAt?: string;

  // Receiving Bank Account Option for Building (e.g. 'default' for main dorm, 'house' for rental house, 'custom')
  paymentAccountOption?: 'default' | 'house' | 'custom';
  customBankName?: string;
  customBankAccount?: string;
  customPromptPayId?: string;
  customAccountName?: string;
}

export interface RoomRecord {
  key: string; // Unique key e.g. "DM-101", "FAC-01"
  buildingId?: string; // Foreign Key pointing to BuildingProfile.id
  building: string; // อาคาร e.g. "อาคารดอนเมือง", "อาคารโรงงาน", "บ้านเช่า"
  roomNo: string; // เลขห้อง e.g. "101", "102", "บ้าน 1"
  floor?: number; // ชั้นที่
  tenantName: string; // ชื่อผู้เช่า e.g. "สมชาย มั่งมี"
  phone?: string;
  occupants: number; // จำนวนผู้พักอาศัย (คน) e.g. 1, 2, 3
  
  // Dynamic occupancy status
  occupancyStatus: OccupancyStatus; // 'occupied' | 'vacant' | 'under_renovation'
  isOccupied: boolean; // Computed or legacy helper (true if occupancyStatus === 'occupied')
  renovationReason?: string; // เหตุผลหรือรายละเอียดการปรับปรุง/ซ่อมแซม
  moveInDate?: string; // วันที่เข้าพัก
  
  rent: number; // ค่าเช่า
  
  // Water billing settings & readings
  waterCalcType: WaterCalcType; // 'meter' (ตามมิเตอร์ 18 บ./หน่วย) หรือ 'per_person' (เหมาจ่ายรายคน 100 บ./คน)
  waterPerPersonRate?: number; // อัตราค่าน้ำต่อคนกรณีเหมาจ่าย (default 100)
  waterPrev: number; // เลขน้ำเดือนก่อน
  waterCurr: number; // เลขน้ำเดือนนี้
  waterUnits: number; // หน่วยน้ำ
  waterRate: number; // ค่าน้ำต่อหน่วย e.g. 18
  waterCost: number; // ค่าน้ำรวม
  
  // Electric billing settings & readings
  elecPrev: number; // เลขไฟเดือนก่อน
  elecCurr: number; // เลขไฟเดือนนี้
  elecUnits: number; // หน่วยไฟ
  elecRate: number; // ค่าไฟต่อหน่วย e.g. 8
  elecCost: number; // ค่าไฟรวม
  
  otherFees: number; // ค่าอื่นๆ เช่น ค่าขยะ, ค่าส่วนกลาง, ค่าอินเทอร์เน็ต
  total: number; // รวมทั้งสิ้นงวดปัจจุบัน (Rent + Water + Electric + Other)
  
  // Liability & Late Payment Policy
  previousBalance?: number; // ยอดหนี้ค้างชำระยกมาจากเดือนก่อน (Arrears)
  lateDays?: number; // จำนวนวันที่ค้างชำระเกินกำหนด (เกินวันที่ 5)
  lateFeePerDay?: number; // ค่าปรับชำระล่าช้าต่อวัน (default 100 บาท/วัน)
  lateFeeTotal?: number; // ค่าปรับชำระล่าช้ารวม (lateDays * lateFeePerDay)
  liabilityTotal?: number; // ยอดหนี้สินค้างชำระรวม (previousBalance + lateFeeTotal)
  grandTotal?: number; // ยอดรวมสุทธิที่ต้องชำระ (total + liabilityTotal)
  
  isPaid: boolean; // ชำระแล้ว
  paymentDate?: string;
  meterUpdatedDate?: string;
  hasMeterUpdated: boolean;
  meterPhotoUrl?: string; // รูปถ่ายหน้าปัดมิเตอร์สำหรับตรวจสอบ
  notes?: string;

  // Receiving Bank Account Option for Room ('default' | 'house' | 'custom')
  paymentAccountOption?: 'default' | 'house' | 'custom';
  customBankName?: string;
  customBankAccount?: string;
  customPromptPayId?: string;
  customAccountName?: string;
}

export interface BuildingSummary {
  building: string;
  buildingId?: string;
  totalCapacity: number; // From BuildingProfile.totalUnits
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  renovationRooms: number;
  occupancyRate: number; // %
  totalOccupants: number;
  totalRent: number;
  totalWaterUnits: number;
  totalWaterCost: number;
  totalElecUnits: number;
  totalElecCost: number;
  totalRevenue: number;
  totalLiability?: number; // ยอดหนี้สินค้างชำระรวม
  collectedRevenue: number;
  pendingRevenue: number;
  meterCompletedCount: number;
}

export interface LandlordConfig {
  propertyName: string;
  landlordName: string;
  address: string;
  taxId: string;
  phone: string;
  promptPayId: string;
  bankName: string;
  bankAccount: string;

  // Secondary / House Rental Payment Account Option (บัญชีรับเงินของบ้านเช่า - ทางเลือกบัญชีที่ 2)
  houseAccountEnabled?: boolean; // เปิดใช้งานบัญชีรับเงินเฉพาะสำหรับบ้านเช่า (default: true)
  houseAccountLabel?: string; // เช่น "บัญชีบ้านเช่า" หรือ "บ้านเช่า (House Rental)"
  houseBankName?: string; // ชื่อธนาคาร เช่น "ธนาคารไทยพาณิชย์"
  houseBankAccount?: string; // เลขที่บัญชี เช่น "408-2-88910-1"
  housePromptPayId?: string; // เบอร์พร้อมเพย์เฉพาะสำหรับบ้านเช่า เช่น "0840411115"
  houseAccountName?: string; // ชื่อเจ้าของบัญชีสำหรับบ้านเช่า เช่น "คุณพลอย (Ploy)"
  houseAccountNotes?: string; // หมายเหตุหรือคำแนะนำการโอน เช่น "สำหรับบ้านเช่าและที่พักเดี่ยว"

  waterRateDefault: number; // default 18 บาท/หน่วย
  waterPerPersonRateDefault: number; // default 100 บาท/คน
  elecRateDefault: number; // default 8 บาท/หน่วย
  minWaterFee: number;
  commonFeeDefault: number;
  
  // Payment Due & Late Policy
  paymentDueDay: number; // วันที่ครบกำหนดชำระของทุกเดือน เช่น วันที่ 5 (default 5)
  lateFeePerDayDefault: number; // อัตราค่าปรับล่าช้าต่อวัน เช่น 100 บาท/วัน (default 100)
  latePolicyNotice: string; // ข้อความแจ้งเตือนค่าปรับล่าช้า เช่น "กำหนดชำระเงินทุกวันที่ 5 ของเดือน หากชำระล่าช้าคิดค่าปรับวันละ 100 บาท"
}

export interface InvoiceTemplateData {
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  billingMonth: string;
  building: string;
  roomNo: string;
  tenantName: string;
  phone?: string;
  occupants: number;
  occupancyStatus: OccupancyStatus;
  rent: number;
  waterCalcType: WaterCalcType;
  waterPerPersonRate: number;
  waterPrev: number;
  waterCurr: number;
  waterUnits: number;
  waterRate: number;
  waterCost: number;
  elecPrev: number;
  elecCurr: number;
  elecUnits: number;
  elecRate: number;
  elecCost: number;
  otherFees: number;
  commonFee: number;
  total: number;
  
  // Liability on Invoice
  previousBalance?: number;
  lateDays?: number;
  lateFeePerDay?: number;
  lateFeeTotal?: number;
  liabilityTotal?: number;
  grandTotal?: number;
  paymentDueDay?: number;
  latePolicyNotice?: string;
  
  isPaid: boolean;
  landlord: LandlordConfig;
}

export interface ValidationError {
  type: 'error' | 'warning';
  category: 'building_not_found' | 'capacity_exceeded' | 'duplicate_id' | 'duplicate_room' | 'invalid_occupancy' | 'meter_reversal' | 'format';
  target: string;
  message: string;
  fixSuggestion?: string;
}

export type UserRole = 'ploy' | 'owner' | 'caretaker' | 'user';

export interface AppUser {
  id: string;
  name: string;
  username?: string; // e.g. "admin", "owner", "staff", "ploy"
  email?: string; // e.g. "ploy@propmanage.com"
  password?: string; // รหัสผ่านเข้าสู่ระบบ (เช่น "1234", "ploy")
  role: UserRole; // 'ploy' = คุณพลอย (Owner & Super Admin เจ้าของและผู้ดูแลระบบ ดูและแก้ไขได้ทุกระบบ รวมถึงข้อมูลการเงินและรายรับ-รายจ่ายทั้งหมด) | 'owner' = เจ้าของหอพัก (คุณแม่ - ดูแลห้องพัก จดมิเตอร์ จัดการอาคาร ใบแจ้งหนี้ และการเงิน) | 'caretaker' / 'user' = พนักงานดูแลหอพัก (ซ่อนข้อมูลเรื่องเงิน)
  isMom?: boolean;
  avatar?: string;
  phone?: string;
  pinCode?: string; // รหัสผ่านเข้าสู่ระบบสำรอง (เบอร์โทรศัพท์ที่ตั้งเอง)
  notes?: string;
  createdAt?: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'buildings' 
  | 'rooms' 
  | 'meter-entry' 
  | 'invoices' 
  | 'sheet-view' 
  | 'user-admin'
  | 'ios-app'
  | 'firebase-sync'
  | 'schema' 
  | 'gas-code';

export type ExpenseCategory = 
  | 'utility_bills'     // ค่าน้ำ-ค่าไฟหลวง (การประปา / การไฟฟ้า)
  | 'maintenance'       // ค่าซ่อมแซม & บำรุงรักษา (แอร์, ปั๊มน้ำ, ประปา, หลอดไฟ, ประตู)
  | 'cleaning_waste'    // ค่าแม่บ้าน & เก็บขยะ
  | 'security_cctv'     // ค่าระบบความปลอดภัย / กล้องวงจรปิด / คีย์การ์ด
  | 'internet_network'  // ค่าอินเทอร์เน็ต WiFi
  | 'supplies'          // วัสดุอุปกรณ์ & น้ำยาทำความสะอาด
  | 'tax_insurance'     // ภาษีที่ดิน/สิ่งปลูกสร้าง & ประกันภัย
  | 'staff_salary'      // เงินเดือนพนักงาน/ผู้ดูแล
  | 'other';            // ค่าใช้จ่ายอื่นๆ

export interface ExpenseRecord {
  id: string;
  building: string; // e.g. "อาคารดอนเมือง", "อาคารโรงงาน", "อาคารรังสิตภิรมย์", "ส่วนกลาง/สำนักงาน", "ทุกอาคาร"
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // e.g. "08 ส.ค."
  notes?: string;
  recordedBy?: string;
  receiptPhotoUrl?: string;
  createdAt?: string;
}

