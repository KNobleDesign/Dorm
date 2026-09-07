import { RoomRecord, BuildingProfile, OccupancyStatus, WaterCalcType } from '../types';

export const SEPTEMBER_BUILDINGS: BuildingProfile[] = [
  {
    id: 'BLD-FAC01',
    name: 'อาคารโรงงาน',
    totalUnits: 15,
    location: '122/4 ซอยนิคมอุตสาหกรรมบางกะดี ต.บางกะดี อ.เมือง จ.ปทุมธานี 12000',
    floors: 1,
    defaultWaterRate: 20,
    defaultElecRate: 8.5,
    description: 'อาคารโรงงานและที่พักช่างประจำ ค่าน้ำเหมาจ่ายรายคน',
    paymentAccountOption: 'default',
    createdAt: '2025-01-15',
  },
  {
    id: 'BLD-399-38',
    name: 'อาคาร 399/38',
    totalUnits: 17,
    location: '399/38 ซอยสรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
    floors: 3,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'อาคาร 399/38 ค่าน้ำเหมาจ่ายรายคน (@ 100 บาท/คน)',
    paymentAccountOption: 'default',
    createdAt: '2025-02-01',
  },
  {
    id: 'BLD-399-40',
    name: 'อาคาร 399/40',
    totalUnits: 9,
    location: '399/40 ซอยสรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
    floors: 2,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'อาคาร 399/40 มิเตอร์น้ำและไฟตามจริง',
    paymentAccountOption: 'default',
    createdAt: '2025-02-15',
  },
  {
    id: 'BLD-SOI8',
    name: 'อาคาร ซอย 8',
    totalUnits: 15,
    location: 'ซอย 8 ถ.สรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
    floors: 3,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'อาคาร ซอย 8 มิเตอร์น้ำและไฟตามจริง',
    paymentAccountOption: 'default',
    createdAt: '2025-03-01',
  },
  {
    id: 'BLD-DM01',
    name: 'อาคาร ดอนเมือง',
    totalUnits: 21,
    location: '88/19 หมู่ 4 ถ.สรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
    floors: 4,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'อาคาร ดอนเมือง รวม 21 ห้องพัก มิเตอร์น้ำและไฟตามจริง',
    paymentAccountOption: 'default',
    createdAt: '2025-01-10',
  },
  {
    id: 'BLD-KSN01',
    name: 'อาคาร กศน',
    totalUnits: 1,
    location: 'อาคารสำนักงาน กศน ดอนเมือง กรุงเทพมหานคร',
    floors: 1,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'อาคารเช่าสำนักงาน กศน',
    paymentAccountOption: 'default',
    createdAt: '2025-01-01',
  },
];

export interface RawRoomSpec {
  key: string;
  buildingId: string;
  building: string;
  roomNo: string;
  tenantName: string;
  elecCurr: number;
  elecPrev: number;
  waterCurr?: number;
  waterPrev?: number;
  occupants?: number;
  waterCalcType: WaterCalcType;
  rent: number;
  status?: OccupancyStatus;
  waterRate?: number;
  elecRate?: number;
}

export const RAW_SEPTEMBER_SPECS: RawRoomSpec[] = [
  // 1. อาคารโรงงาน (15 ห้อง, ค่าน้ำเหมา 100บ./คน, ไฟ 8.5)
  { key: 'FAC-01', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '1', tenantName: 'คุณ อ้น', elecCurr: 3277, elecPrev: 3200, occupants: 1, waterCalcType: 'per_person', rent: 1700, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-02', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '2', tenantName: 'คุณ แพท', elecCurr: 2335, elecPrev: 2280, occupants: 2, waterCalcType: 'per_person', rent: 1400, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-03', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '3', tenantName: 'คุณ เอ๋', elecCurr: 2448, elecPrev: 2400, occupants: 0, waterCalcType: 'per_person', rent: 0, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-04', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '4', tenantName: 'คุณ หน่า', elecCurr: 373, elecPrev: 350, occupants: 0, waterCalcType: 'per_person', rent: 0, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-05', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '5', tenantName: 'คุณ บอส', elecCurr: 5614, elecPrev: 5540, occupants: 2, waterCalcType: 'per_person', rent: 1000, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-06', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '6', tenantName: 'คุณ ถาวร', elecCurr: 3793, elecPrev: 3700, occupants: 2, waterCalcType: 'per_person', rent: 2000, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-07', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '7', tenantName: 'คุณ เอนัน', elecCurr: 8423, elecPrev: 8350, occupants: 3, waterCalcType: 'per_person', rent: 1000, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-08', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '8', tenantName: 'คุณ หน่อย', elecCurr: 7380, elecPrev: 7300, occupants: 2, waterCalcType: 'per_person', rent: 2000, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-09', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '9', tenantName: 'คุณ บีนัน', elecCurr: 9578, elecPrev: 9500, occupants: 2, waterCalcType: 'per_person', rent: 1000, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-10', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '10', tenantName: 'คุณ สุนิน', elecCurr: 1515, elecPrev: 1480, occupants: 1, waterCalcType: 'per_person', rent: 1000, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-11', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '11', tenantName: 'คุณ บอย', elecCurr: 6227, elecPrev: 6180, occupants: 1, waterCalcType: 'per_person', rent: 1000, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-12', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '12', tenantName: 'คุณ เล็กบี', elecCurr: 10887, elecPrev: 10750, occupants: 3, waterCalcType: 'per_person', rent: 2500, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-13', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '13', tenantName: 'คุณ เปิ้ล', elecCurr: 7467, elecPrev: 7400, occupants: 1.5, waterCalcType: 'per_person', rent: 1700, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-14', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '14', tenantName: 'ใจชบาไพร2', elecCurr: 7481, elecPrev: 7400, occupants: 0, waterCalcType: 'per_person', rent: 0, waterRate: 20, elecRate: 8.5 },
  { key: 'FAC-15', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '15', tenantName: 'แหม่มร้าน2', elecCurr: 4732, elecPrev: 4680, occupants: 0, waterCalcType: 'per_person', rent: 0, waterRate: 20, elecRate: 8.5 },

  // 2. อาคาร 399/38 (17 ห้อง ตาม PDF, ค่าน้ำเหมา 100บ./คน, ไฟ 8)
  { key: '399-38-01', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '1', tenantName: 'คุณ ณเดชน์', elecCurr: 6941, elecPrev: 6860, occupants: 2, waterCalcType: 'per_person', rent: 3000, waterRate: 18, elecRate: 8 },
  { key: '399-38-02', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '2', tenantName: 'คุณ วัต', elecCurr: 1225, elecPrev: 1180, occupants: 2, waterCalcType: 'per_person', rent: 4500, waterRate: 18, elecRate: 8 },
  { key: '399-38-03', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '3', tenantName: 'คุณ แก้ว', elecCurr: 9079, elecPrev: 9000, occupants: 2, waterCalcType: 'per_person', rent: 4300, waterRate: 18, elecRate: 8 },
  { key: '399-38-04', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '4', tenantName: 'คุณ มาด', elecCurr: 1221, elecPrev: 1180, occupants: 1, waterCalcType: 'per_person', rent: 2400, waterRate: 18, elecRate: 8 },
  { key: '399-38-05', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '5', tenantName: 'คุณ เหมย', elecCurr: 2989, elecPrev: 2920, occupants: 1, waterCalcType: 'per_person', rent: 2000, waterRate: 18, elecRate: 8 },
  { key: '399-38-06', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '6', tenantName: 'คุณ พร', elecCurr: 9055, elecPrev: 8980, occupants: 2, waterCalcType: 'per_person', rent: 3200, waterRate: 18, elecRate: 8 },
  { key: '399-38-07', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '7', tenantName: 'คุณ โบ', elecCurr: 129, elecPrev: 100, occupants: 2, waterCalcType: 'per_person', rent: 2600, waterRate: 18, elecRate: 8 },
  { key: '399-38-08', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '8', tenantName: 'คุณ บิว', elecCurr: 511, elecPrev: 480, occupants: 2, waterCalcType: 'per_person', rent: 2000, waterRate: 18, elecRate: 8 },
  { key: '399-38-09', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '9', tenantName: 'คุณ วาด', elecCurr: 6613, elecPrev: 6540, occupants: 2, waterCalcType: 'per_person', rent: 3300, waterRate: 18, elecRate: 8 },
  { key: '399-38-10', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '10', tenantName: 'คุณ ฟ้า', elecCurr: 1102, elecPrev: 1050, occupants: 3, waterCalcType: 'per_person', rent: 2700, waterRate: 18, elecRate: 8 },
  { key: '399-38-11', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '11', tenantName: 'คุณ แมน', elecCurr: 2770, elecPrev: 2720, occupants: 1, waterCalcType: 'per_person', rent: 2000, waterRate: 18, elecRate: 8 },
  { key: '399-38-12', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '12', tenantName: 'คุณ พิม', elecCurr: 460, elecPrev: 420, occupants: 4, waterCalcType: 'per_person', rent: 2800, waterRate: 18, elecRate: 8 },
  { key: '399-38-14', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '14', tenantName: 'คุณ แพท', elecCurr: 10164, elecPrev: 10080, occupants: 2, waterCalcType: 'per_person', rent: 2700, waterRate: 18, elecRate: 8 },
  { key: '399-38-15', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '15', tenantName: 'คุณ แก้ว', elecCurr: 1449, elecPrev: 1400, occupants: 2, waterCalcType: 'per_person', rent: 2000, waterRate: 18, elecRate: 8 },
  { key: '399-38-16', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '16', tenantName: 'คุณ บี', elecCurr: 3395, elecPrev: 3320, occupants: 2, waterCalcType: 'per_person', rent: 2900, waterRate: 18, elecRate: 8 },
  { key: '399-38-17', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '17', tenantName: 'คุณ ปอย', elecCurr: 94, elecPrev: 70, occupants: 1, waterCalcType: 'per_person', rent: 2700, waterRate: 18, elecRate: 8 },
  { key: '399-38-18', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '18', tenantName: 'คุณ แต้ว', elecCurr: 125, elecPrev: 90, occupants: 1, waterCalcType: 'per_person', rent: 2400, waterRate: 18, elecRate: 8 },

  // 3. อาคาร 399/40 (9 ห้อง, ค่าน้ำมิเตอร์, ไฟ 8)
  { key: '399-40-01', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '1', tenantName: 'คุณ เล็ก', elecCurr: 5, elecPrev: 0, waterCurr: 5, waterPrev: 0, occupants: 1, waterCalcType: 'meter', rent: 6000, waterRate: 18, elecRate: 8 },
  { key: '399-40-02', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '2', tenantName: 'คุณ สืบอร์', elecCurr: 491, elecPrev: 420, waterCurr: 62, waterPrev: 50, occupants: 1, waterCalcType: 'meter', rent: 4800, waterRate: 18, elecRate: 8 },
  { key: '399-40-03', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '3', tenantName: 'คุณ HTET', elecCurr: 1186, elecPrev: 1120, waterCurr: 78, waterPrev: 65, occupants: 1, waterCalcType: 'meter', rent: 4500, waterRate: 18, elecRate: 8 },
  { key: '399-40-04', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '4', tenantName: 'คุณ Moeoo', elecCurr: 1319, elecPrev: 1240, waterCurr: 171, waterPrev: 150, occupants: 1, waterCalcType: 'meter', rent: 5500, waterRate: 18, elecRate: 8 },
  { key: '399-40-05', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '5', tenantName: 'คุณ แชน', elecCurr: 765, elecPrev: 700, waterCurr: 28, waterPrev: 20, occupants: 1, waterCalcType: 'meter', rent: 4500, waterRate: 18, elecRate: 8 },
  { key: '399-40-06', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '6', tenantName: 'คุณ ราม', elecCurr: 960, elecPrev: 900, waterCurr: 52, waterPrev: 42, occupants: 1, waterCalcType: 'meter', rent: 5000, waterRate: 18, elecRate: 8 },
  { key: '399-40-07', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '7', tenantName: 'คุณ ปอย', elecCurr: 494, elecPrev: 440, waterCurr: 46, waterPrev: 38, occupants: 1, waterCalcType: 'meter', rent: 4500, waterRate: 18, elecRate: 8 },
  { key: '399-40-08', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '8', tenantName: 'คุณ ดา', elecCurr: 2604, elecPrev: 2520, waterCurr: 145, waterPrev: 130, occupants: 1, waterCalcType: 'meter', rent: 5000, waterRate: 18, elecRate: 8 },
  { key: '399-40-09', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '9', tenantName: 'คุณ นิชา', elecCurr: 578, elecPrev: 520, waterCurr: 7, waterPrev: 0, occupants: 1, waterCalcType: 'meter', rent: 4000, waterRate: 18, elecRate: 8 },

  // 4. อาคาร ซอย 8 (15 ห้อง, ค่าน้ำมิเตอร์, ไฟ 8)
  { key: 'SOI8-01', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '1', tenantName: 'MG AUNG KYAW', elecCurr: 1897, elecPrev: 1810, waterCurr: 260, waterPrev: 245, occupants: 1, waterCalcType: 'meter', rent: 3800, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-02', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '2', tenantName: 'คุณ กัน', elecCurr: 3124, elecPrev: 3040, waterCurr: 214, waterPrev: 200, occupants: 1, waterCalcType: 'meter', rent: 3500, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-03', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '3', tenantName: 'SINGH', elecCurr: 2069, elecPrev: 1990, waterCurr: 289, waterPrev: 270, occupants: 1, waterCalcType: 'meter', rent: 4300, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-04', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '4', tenantName: 'คุณ นิโยฮารี', elecCurr: 3460, elecPrev: 3380, waterCurr: 225, waterPrev: 210, occupants: 1, waterCalcType: 'meter', rent: 4500, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-05', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '5', tenantName: 'คุณ อาว', elecCurr: 5216, elecPrev: 5120, waterCurr: 231, waterPrev: 215, occupants: 1, waterCalcType: 'meter', rent: 3800, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-06', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '6', tenantName: 'ZIN MARNAING', elecCurr: 2853, elecPrev: 2780, waterCurr: 227, waterPrev: 210, occupants: 1, waterCalcType: 'meter', rent: 3500, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-07', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '7', tenantName: 'คุณ นานาโกะ', elecCurr: 3197, elecPrev: 3120, waterCurr: 210, waterPrev: 195, occupants: 1, waterCalcType: 'meter', rent: 4000, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-08', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '8', tenantName: 'Chanthany', elecCurr: 4186, elecPrev: 4100, waterCurr: 342, waterPrev: 325, occupants: 1, waterCalcType: 'meter', rent: 4700, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-09', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '9', tenantName: 'คุณ นานอาย', elecCurr: 5966, elecPrev: 5880, waterCurr: 392, waterPrev: 375, occupants: 1, waterCalcType: 'meter', rent: 3800, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-10', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '10', tenantName: 'WINE CHIT', elecCurr: 4472, elecPrev: 4390, waterCurr: 306, waterPrev: 290, occupants: 1, waterCalcType: 'meter', rent: 3600, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-11', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '11', tenantName: 'คุณ โม', elecCurr: 1408, elecPrev: 1340, waterCurr: 246, waterPrev: 230, occupants: 1, waterCalcType: 'meter', rent: 3500, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-12', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '12', tenantName: 'คุณ นาเนีย', elecCurr: 429, elecPrev: 380, waterCurr: 445, waterPrev: 430, occupants: 1, waterCalcType: 'meter', rent: 4700, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-13', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '13', tenantName: 'คุณ วิจิตตรา', elecCurr: 3761, elecPrev: 3690, waterCurr: 207, waterPrev: 192, occupants: 1, waterCalcType: 'meter', rent: 4300, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-14', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '14', tenantName: 'คุณ โช', elecCurr: 6339, elecPrev: 6250, waterCurr: 256, waterPrev: 240, occupants: 1, waterCalcType: 'meter', rent: 4300, waterRate: 18, elecRate: 8 },
  { key: 'SOI8-15', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '15', tenantName: 'คุณ การ์ตูน', elecCurr: 3164, elecPrev: 3080, waterCurr: 378, waterPrev: 360, occupants: 1, waterCalcType: 'meter', rent: 4500, waterRate: 18, elecRate: 8 },

  // 5. อาคาร ดอนเมือง (21 ห้อง, ค่าน้ำมิเตอร์, ไฟ 8)
  { key: 'DM-01', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '1', tenantName: 'คุณ เอ', elecCurr: 2589, elecPrev: 2500, waterCurr: 484, waterPrev: 470, occupants: 1, waterCalcType: 'meter', rent: 2000, waterRate: 18, elecRate: 8 },
  { key: 'DM-02', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '2', tenantName: 'คุณชนัญทิดา', elecCurr: 2328, elecPrev: 2250, waterCurr: 448, waterPrev: 435, occupants: 1, waterCalcType: 'meter', rent: 2800, waterRate: 18, elecRate: 8 },
  { key: 'DM-03', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '3', tenantName: 'ห้องว่าง', elecCurr: 5263, elecPrev: 5263, waterCurr: 141, waterPrev: 141, occupants: 0, waterCalcType: 'meter', rent: 0, status: 'vacant', waterRate: 18, elecRate: 8 },
  { key: 'DM-04', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '4', tenantName: 'ห้องว่าง', elecCurr: 548, elecPrev: 548, waterCurr: 248, waterPrev: 248, occupants: 0, waterCalcType: 'meter', rent: 0, status: 'vacant', waterRate: 18, elecRate: 8 },
  { key: 'DM-05', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '5', tenantName: 'คุณ ฟริง', elecCurr: 5693, elecPrev: 5600, waterCurr: 411, waterPrev: 395, occupants: 1, waterCalcType: 'meter', rent: 2000, waterRate: 18, elecRate: 8 },
  { key: 'DM-06', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '6', tenantName: 'คุณคิม', elecCurr: 3106, elecPrev: 3020, waterCurr: 101, waterPrev: 90, occupants: 1, waterCalcType: 'meter', rent: 2000, waterRate: 18, elecRate: 8 },
  { key: 'DM-07', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '7', tenantName: 'คุณ ประสงค์', elecCurr: 7445, elecPrev: 7360, waterCurr: 392, waterPrev: 378, occupants: 1, waterCalcType: 'meter', rent: 2500, waterRate: 18, elecRate: 8 },
  { key: 'DM-08', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '8', tenantName: 'คุณวาสนา', elecCurr: 1906, elecPrev: 1840, waterCurr: 351, waterPrev: 338, occupants: 1, waterCalcType: 'meter', rent: 2000, waterRate: 18, elecRate: 8 },
  { key: 'DM-09', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '9', tenantName: 'ห้องว่าง', elecCurr: 3299, elecPrev: 3299, waterCurr: 486, waterPrev: 486, occupants: 0, waterCalcType: 'meter', rent: 0, status: 'vacant', waterRate: 18, elecRate: 8 },
  { key: 'DM-10', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '10', tenantName: 'ห้องว่าง', elecCurr: 6979, elecPrev: 6979, waterCurr: 252, waterPrev: 252, occupants: 0, waterCalcType: 'meter', rent: 0, status: 'vacant', waterRate: 18, elecRate: 8 },
  { key: 'DM-11', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '11', tenantName: 'ห้องว่าง', elecCurr: 6770, elecPrev: 6770, waterCurr: 247, waterPrev: 247, occupants: 0, waterCalcType: 'meter', rent: 0, status: 'vacant', waterRate: 18, elecRate: 8 },
  { key: 'DM-12', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '12', tenantName: 'ห้องว่าง', elecCurr: 6049, elecPrev: 6049, waterCurr: 670, waterPrev: 670, occupants: 0, waterCalcType: 'meter', rent: 0, status: 'vacant', waterRate: 18, elecRate: 8 },
  { key: 'DM-13', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '13', tenantName: 'ห้องว่าง', elecCurr: 3245, elecPrev: 3245, waterCurr: 47, waterPrev: 47, occupants: 0, waterCalcType: 'meter', rent: 0, status: 'vacant', waterRate: 18, elecRate: 8 },
  { key: 'DM-14', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '14', tenantName: 'คุณกันณ์', elecCurr: 7541, elecPrev: 7460, waterCurr: 502, waterPrev: 488, occupants: 1, waterCalcType: 'meter', rent: 2500, waterRate: 18, elecRate: 8 },
  { key: 'DM-15', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '15', tenantName: 'คุณ ก้า', elecCurr: 1130, elecPrev: 1060, waterCurr: 510, waterPrev: 495, occupants: 1, waterCalcType: 'meter', rent: 2500, waterRate: 18, elecRate: 8 },
  { key: 'DM-16', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '16', tenantName: 'คุณ', elecCurr: 9630, elecPrev: 9540, waterCurr: 553, waterPrev: 538, occupants: 1, waterCalcType: 'meter', rent: 2000, waterRate: 18, elecRate: 8 },
  { key: 'DM-17', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '17', tenantName: 'ห้องว่าง', elecCurr: 9817, elecPrev: 9817, waterCurr: 304, waterPrev: 304, occupants: 0, waterCalcType: 'meter', rent: 0, status: 'vacant', waterRate: 18, elecRate: 8 },
  { key: 'DM-18', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '18', tenantName: 'ห้องว่าง', elecCurr: 7232, elecPrev: 7232, waterCurr: 373, waterPrev: 373, occupants: 0, waterCalcType: 'meter', rent: 0, status: 'vacant', waterRate: 18, elecRate: 8 },
  { key: 'DM-19', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '19', tenantName: 'คุณ เคท', elecCurr: 6376, elecPrev: 6300, waterCurr: 377, waterPrev: 365, occupants: 1, waterCalcType: 'meter', rent: 0, waterRate: 18, elecRate: 8 },
  { key: 'DM-20', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '20', tenantName: 'คุณอัมรินทร์', elecCurr: 9044, elecPrev: 8950, waterCurr: 1123, waterPrev: 1105, occupants: 1, waterCalcType: 'meter', rent: 3500, waterRate: 18, elecRate: 8 },
  { key: 'DM-21', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '21', tenantName: 'คุณกมลชนก', elecCurr: 9508, elecPrev: 9420, waterCurr: 450, waterPrev: 435, occupants: 1, waterCalcType: 'meter', rent: 2500, waterRate: 18, elecRate: 8 },

  // 6. อาคาร กศน (1 ห้อง)
  { key: 'KSN-01', buildingId: 'BLD-KSN01', building: 'อาคาร กศน', roomNo: '1', tenantName: 'กศน', elecCurr: 0, elecPrev: 0, waterCurr: 0, waterPrev: 0, occupants: 1, waterCalcType: 'meter', rent: 30000, waterRate: 18, elecRate: 8 },
];

export function buildRoomRecord(spec: RawRoomSpec, monthIndex: number, monthStr: string): RoomRecord {
  // monthIndex: 8 = 09 ก.ย. (September 2569)
  const isTargetMonth = monthIndex === 8;
  const offset = monthIndex - 8; // difference from September

  const isVacant = spec.status === 'vacant' || spec.tenantName === 'ห้องว่าง';
  const occupancyStatus: OccupancyStatus = isVacant ? 'vacant' : 'occupied';
  const isOccupied = !isVacant;

  const waterRate = spec.waterRate || (spec.building.includes('โรงงาน') ? 20 : 18);
  const elecRate = spec.elecRate || (spec.building.includes('โรงงาน') ? 8.5 : 8);

  const elecStep = spec.elecCurr > spec.elecPrev ? (spec.elecCurr - spec.elecPrev) : 50;
  const waterStep = (spec.waterCurr !== undefined && spec.waterPrev !== undefined && spec.waterCurr > spec.waterPrev)
    ? (spec.waterCurr - spec.waterPrev)
    : 10;

  let elecCurr = spec.elecCurr;
  let elecPrev = spec.elecPrev;
  let waterCurr = spec.waterCurr ?? 0;
  let waterPrev = spec.waterPrev ?? 0;

  if (!isTargetMonth) {
    if (isOccupied) {
      elecCurr = Math.max(0, spec.elecCurr + offset * elecStep);
      elecPrev = Math.max(0, spec.elecPrev + offset * elecStep);
      waterCurr = Math.max(0, (spec.waterCurr ?? 0) + offset * waterStep);
      waterPrev = Math.max(0, (spec.waterPrev ?? 0) + offset * waterStep);
    }
  }

  let waterUnits = 0;
  let waterCost = 0;

  if (isOccupied) {
    if (spec.waterCalcType === 'per_person') {
      waterUnits = 0;
      const occ = spec.occupants !== undefined ? spec.occupants : 1;
      waterCost = occ * 100;
    } else {
      waterUnits = Math.max(0, waterCurr - waterPrev);
      waterCost = waterUnits * waterRate;
    }
  }

  const elecUnits = isOccupied ? Math.max(0, elecCurr - elecPrev) : 0;
  const elecCost = elecUnits * elecRate;

  const rentAmount = isOccupied ? spec.rent : 0;
  const otherFees = 0;
  const total = rentAmount + waterCost + elecCost + otherFees;

  // In initial master data, start month (September, monthIndex 8) and subsequent months
  // start fresh without arrears. For prior historical reference (months 0-7) they are marked paid.
  // For September (the initial setup month), all rooms start cleanly as pending collection (zero arrears/no past debt).
  const isPaid = isOccupied ? (monthIndex < 8 ? true : false) : false;

  const paddedMonth = (monthIndex + 1).toString().padStart(2, '0');

  // Determine floor logically
  let floor = 1;
  const num = parseInt(spec.roomNo.replace(/\D/g, '') || '1', 10);
  if (spec.building.includes('ดอนเมือง')) {
    if (num <= 5) floor = 1;
    else if (num <= 10) floor = 2;
    else if (num <= 15) floor = 3;
    else floor = 4;
  } else if (spec.building.includes('399/38')) {
    if (num <= 6) floor = 1;
    else if (num <= 12) floor = 2;
    else floor = 3;
  } else if (spec.building.includes('399/40')) {
    if (num <= 5) floor = 1;
    else floor = 2;
  } else if (spec.building.includes('ซอย 8')) {
    if (num <= 5) floor = 1;
    else if (num <= 10) floor = 2;
    else floor = 3;
  }

  return {
    key: spec.key,
    buildingId: spec.buildingId,
    building: spec.building,
    roomNo: spec.roomNo,
    floor,
    tenantName: spec.tenantName,
    phone: '',
    occupants: spec.occupants !== undefined ? spec.occupants : (isOccupied ? 1 : 0),
    occupancyStatus,
    isOccupied,
    waterCalcType: spec.waterCalcType,
    waterPerPersonRate: 100,
    rent: spec.rent,
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
    otherFees,
    total,
    previousBalance: 0,
    lateDays: 0,
    lateFeePerDay: 100,
    lateFeeTotal: 0,
    liabilityTotal: 0,
    grandTotal: total,
    isPaid,
    paymentDate: isPaid ? `2026-${paddedMonth}-05` : undefined,
    hasMeterUpdated: isOccupied,
    meterUpdatedDate: isOccupied ? `2026-${paddedMonth}-01 10:00` : undefined,
    notes: isOccupied
      ? (isPaid ? 'ชำระเงินแล้ว' : 'รอชำระเงินตามรอบบิล')
      : 'ห้องว่าง',
  };
}

export function generateAllSeptemberRooms(): Record<string, RoomRecord[]> {
  const months = [
    '01 ม.ค.', '02 ก.พ.', '03 มี.ค.', '04 เม.ย.',
    '05 พ.ค.', '06 มิ.ย.', '07 ก.ค.', '08 ส.ค.',
    '09 ก.ย.', '10 ต.ค.', '11 พ.ย.', '12 ธ.ค.',
  ];

  const result: Record<string, RoomRecord[]> = {};

  months.forEach((monthStr, monthIndex) => {
    result[monthStr] = RAW_SEPTEMBER_SPECS.map(spec => buildRoomRecord(spec, monthIndex, monthStr));
  });

  return result;
}
