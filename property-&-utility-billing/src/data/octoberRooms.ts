import { RoomRecord, BuildingProfile, OccupancyStatus, WaterCalcType } from '../types';

export const OCTOBER_BUILDINGS: BuildingProfile[] = [
  {
    id: 'BLD-FAC01',
    name: 'อาคารโรงงาน',
    totalUnits: 15,
    location: '122/4 ซอยนิคมอุตสาหกรรมบางกะดี ต.บางกะดี อ.เมือง จ.ปทุมธานี 12000',
    floors: 1,
    defaultWaterRate: 20,
    defaultElecRate: 8.5,
    description: 'อาคารโรงงาน ค่าน้ำเหมาจ่ายรายคน 100 บ./คน, ค่าไฟ 8.5 บ./หน่วย',
    paymentAccountOption: 'default',
    createdAt: '2025-01-15',
  },
  {
    id: 'BLD-DM01',
    name: 'อาคาร ดอนเมือง',
    totalUnits: 21,
    location: '88/19 หมู่ 4 ถ.สรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
    floors: 4,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'อาคาร ดอนเมือง รวม 21 ห้องพัก ค่าน้ำตามมิเตอร์ 18 บ./หน่วย, ค่าไฟ 8 บ./หน่วย',
    paymentAccountOption: 'default',
    createdAt: '2025-01-10',
  },
  {
    id: 'BLD-SOI8',
    name: 'อาคาร ซอย 8',
    totalUnits: 15,
    location: 'ซอย 8 ถ.สรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
    floors: 3,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'อาคาร ซอย 8 ค่าน้ำตามมิเตอร์ 18 บ./หน่วย, ค่าไฟ 8 บ./หน่วย',
    paymentAccountOption: 'default',
    createdAt: '2025-03-01',
  },
  {
    id: 'BLD-KSN01',
    name: 'อาคาร กศน',
    totalUnits: 1,
    location: 'อาคารสำนักงาน กศน ดอนเมือง กรุงเทพมหานคร',
    floors: 1,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'อาคารเช่าสำนักงาน กศน 30,000 บ./เดือน',
    paymentAccountOption: 'default',
    createdAt: '2025-01-01',
  },
  {
    id: 'BLD-399-40',
    name: 'อาคาร 399/40',
    totalUnits: 9,
    location: '399/40 ซอยสรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
    floors: 2,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'อาคาร 399/40 ค่าน้ำตามมิเตอร์ 18 บ./หน่วย, ค่าไฟ 8 บ./หน่วย',
    paymentAccountOption: 'default',
    createdAt: '2025-02-15',
  },
  {
    id: 'BLD-399-38',
    name: 'อาคาร 399/38',
    totalUnits: 17,
    location: '399/38 ซอยสรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
    floors: 3,
    defaultWaterRate: 18,
    defaultElecRate: 8,
    description: 'อาคาร 399/38 ค่าน้ำเหมาจ่ายรายคน 100 บ./คน, ค่าไฟ 8 บ./หน่วย',
    paymentAccountOption: 'default',
    createdAt: '2025-02-01',
  },
];

export interface OctoberRoomSpec {
  key: string;
  buildingId: string;
  building: string;
  roomNo: string;
  tenantName: string;
  phone?: string;
  occupants: number;
  rent: number;
  waterCalcType: WaterCalcType;
  waterRate?: number;
  waterPrev: number;
  elecRate: number;
  elecPrev: number;
  status?: OccupancyStatus;
}

// 78 Master Room Specifications starting in October 2026 (ต.ค. 2569) exactly matching user's CSV
export const RAW_OCTOBER_SPECS: OctoberRoomSpec[] = [
  // 1. อาคารโรงงาน (15 ห้อง: ค่าน้ำเหมา 100 บ./คน, ค่าไฟ 8.5 บ./หน่วย)
  { key: 'FAC-01', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '1', tenantName: 'คุณ อ้น', phone: '02-998-1234', occupants: 1, rent: 1700, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 3277 },
  { key: 'FAC-02', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '2', tenantName: 'คุณ แพท', phone: '', occupants: 2, rent: 1400, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 2335 },
  { key: 'FAC-03', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '3', tenantName: 'คุณ เอ๋', phone: '', occupants: 1, rent: 0, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 2448 },
  { key: 'FAC-04', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '4', tenantName: 'คุณ หน่า', phone: '', occupants: 1, rent: 0, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 373 },
  { key: 'FAC-05', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '5', tenantName: 'คุณ บอส', phone: '', occupants: 2, rent: 1000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 5614 },
  { key: 'FAC-06', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '6', tenantName: 'คุณ ถาวร', phone: '', occupants: 2, rent: 2000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 3793 },
  { key: 'FAC-07', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '7', tenantName: 'คุณ เออนัน', phone: '', occupants: 3, rent: 1000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 8423 },
  { key: 'FAC-08', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '8', tenantName: 'คุณ หน่อย', phone: '', occupants: 2, rent: 2000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 7380 },
  { key: 'FAC-09', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '9', tenantName: 'คุณ บีนัน', phone: '', occupants: 2, rent: 1000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 9578 },
  { key: 'FAC-10', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '10', tenantName: 'คุณ สุนิน', phone: '', occupants: 1, rent: 1000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 1515 },
  { key: 'FAC-11', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '11', tenantName: 'คุณ บอย', phone: '', occupants: 1, rent: 1000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 6227 },
  { key: 'FAC-12', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '12', tenantName: 'คุณ เล็กบี', phone: '', occupants: 3, rent: 2500, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 10887 },
  { key: 'FAC-13', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '13', tenantName: 'คุณ เปิ้ล', phone: '', occupants: 2, rent: 1700, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 7467 },
  { key: 'FAC-14', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '14', tenantName: 'ใจชบาไพร2', phone: '', occupants: 1, rent: 0, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 7481 },
  { key: 'FAC-15', buildingId: 'BLD-FAC01', building: 'อาคารโรงงาน', roomNo: '15', tenantName: 'แหม่มร้าน2', phone: '', occupants: 1, rent: 0, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8.5, elecPrev: 4732 },

  // 2. อาคาร ดอนเมือง (21 ห้อง: ค่าน้ำตามมิเตอร์ 18 บ./หน่วย, ค่าไฟ 8 บ./หน่วย)
  { key: 'DM-01', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '1', tenantName: 'คุณ เอ', occupants: 1, rent: 2000, waterCalcType: 'meter', waterRate: 18, waterPrev: 470, elecRate: 8, elecPrev: 2500 },
  { key: 'DM-02', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '2', tenantName: 'คุณชนัญทิดา', occupants: 1, rent: 2800, waterCalcType: 'meter', waterRate: 18, waterPrev: 435, elecRate: 8, elecPrev: 2250 },
  { key: 'DM-03', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '3', tenantName: 'ห้องว่าง', status: 'vacant', occupants: 1, rent: 0, waterCalcType: 'meter', waterRate: 18, waterPrev: 141, elecRate: 8, elecPrev: 5263 },
  { key: 'DM-04', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '4', tenantName: 'ห้องว่าง', status: 'vacant', occupants: 1, rent: 0, waterCalcType: 'meter', waterRate: 18, waterPrev: 248, elecRate: 8, elecPrev: 548 },
  { key: 'DM-05', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '5', tenantName: 'คุณ ฟริง', occupants: 1, rent: 2000, waterCalcType: 'meter', waterRate: 18, waterPrev: 395, elecRate: 8, elecPrev: 5600 },
  { key: 'DM-06', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '6', tenantName: 'คุณคิม', occupants: 1, rent: 2000, waterCalcType: 'meter', waterRate: 18, waterPrev: 90, elecRate: 8, elecPrev: 3020 },
  { key: 'DM-07', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '7', tenantName: 'คุณ ประสงค์', occupants: 1, rent: 2500, waterCalcType: 'meter', waterRate: 18, waterPrev: 378, elecRate: 8, elecPrev: 7360 },
  { key: 'DM-08', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '8', tenantName: 'คุณวาสนา', occupants: 1, rent: 2000, waterCalcType: 'meter', waterRate: 18, waterPrev: 338, elecRate: 8, elecPrev: 1840 },
  { key: 'DM-09', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '9', tenantName: 'ห้องว่าง', status: 'vacant', occupants: 1, rent: 0, waterCalcType: 'meter', waterRate: 18, waterPrev: 486, elecRate: 8, elecPrev: 3299 },
  { key: 'DM-10', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '10', tenantName: 'ห้องว่าง', status: 'vacant', occupants: 1, rent: 0, waterCalcType: 'meter', waterRate: 18, waterPrev: 252, elecRate: 8, elecPrev: 6979 },
  { key: 'DM-11', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '11', tenantName: 'ห้องว่าง', status: 'vacant', occupants: 1, rent: 0, waterCalcType: 'meter', waterRate: 18, waterPrev: 247, elecRate: 8, elecPrev: 6770 },
  { key: 'DM-12', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '12', tenantName: 'ห้องว่าง', status: 'vacant', occupants: 1, rent: 0, waterCalcType: 'meter', waterRate: 18, waterPrev: 670, elecRate: 8, elecPrev: 6049 },
  { key: 'DM-13', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '13', tenantName: 'ห้องว่าง', status: 'vacant', occupants: 1, rent: 0, waterCalcType: 'meter', waterRate: 18, waterPrev: 47, elecRate: 8, elecPrev: 3245 },
  { key: 'DM-14', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '14', tenantName: 'คุณกันณ์', occupants: 1, rent: 2500, waterCalcType: 'meter', waterRate: 18, waterPrev: 488, elecRate: 8, elecPrev: 7460 },
  { key: 'DM-15', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '15', tenantName: 'คุณ ก้า', occupants: 1, rent: 2500, waterCalcType: 'meter', waterRate: 18, waterPrev: 495, elecRate: 8, elecPrev: 1060 },
  { key: 'DM-16', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '16', tenantName: 'คุณ', occupants: 1, rent: 2000, waterCalcType: 'meter', waterRate: 18, waterPrev: 538, elecRate: 8, elecPrev: 9540 },
  { key: 'DM-17', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '17', tenantName: 'ห้องว่าง', status: 'vacant', occupants: 1, rent: 0, waterCalcType: 'meter', waterRate: 18, waterPrev: 304, elecRate: 8, elecPrev: 9817 },
  { key: 'DM-18', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '18', tenantName: 'ห้องว่าง', status: 'vacant', occupants: 1, rent: 0, waterCalcType: 'meter', waterRate: 18, waterPrev: 373, elecRate: 8, elecPrev: 7232 },
  { key: 'DM-19', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '19', tenantName: 'คุณ เคท', occupants: 1, rent: 2000, waterCalcType: 'meter', waterRate: 18, waterPrev: 365, elecRate: 8, elecPrev: 6300 },
  { key: 'DM-20', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '20', tenantName: 'คุณอัมรินทร์', occupants: 1, rent: 3500, waterCalcType: 'meter', waterRate: 18, waterPrev: 1105, elecRate: 8, elecPrev: 8950 },
  { key: 'DM-21', buildingId: 'BLD-DM01', building: 'อาคาร ดอนเมือง', roomNo: '21', tenantName: 'คุณกมลชนก', occupants: 1, rent: 2500, waterCalcType: 'meter', waterRate: 18, waterPrev: 435, elecRate: 8, elecPrev: 9420 },

  // 3. อาคาร ซอย 8 (15 ห้อง: ค่าน้ำตามมิเตอร์ 18 บ./หน่วย, ค่าไฟ 8 บ./หน่วย)
  { key: 'SOI8-01', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '1', tenantName: 'MG AUNG KYAW', occupants: 1, rent: 3800, waterCalcType: 'meter', waterRate: 18, waterPrev: 245, elecRate: 8, elecPrev: 1810 },
  { key: 'SOI8-02', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '2', tenantName: 'คุณ กัน', occupants: 1, rent: 3500, waterCalcType: 'meter', waterRate: 18, waterPrev: 200, elecRate: 8, elecPrev: 3040 },
  { key: 'SOI8-03', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '3', tenantName: 'SINGH', occupants: 1, rent: 4300, waterCalcType: 'meter', waterRate: 18, waterPrev: 270, elecRate: 8, elecPrev: 1990 },
  { key: 'SOI8-04', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '4', tenantName: 'คุณ นิโยฮารี', occupants: 1, rent: 4500, waterCalcType: 'meter', waterRate: 18, waterPrev: 210, elecRate: 8, elecPrev: 3380 },
  { key: 'SOI8-05', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '5', tenantName: 'คุณ อาว', occupants: 1, rent: 3800, waterCalcType: 'meter', waterRate: 18, waterPrev: 215, elecRate: 8, elecPrev: 5120 },
  { key: 'SOI8-06', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '6', tenantName: 'ZIN MARNAING', occupants: 1, rent: 3500, waterCalcType: 'meter', waterRate: 18, waterPrev: 210, elecRate: 8, elecPrev: 2780 },
  { key: 'SOI8-07', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '7', tenantName: 'คุณ นานาโกะ', occupants: 1, rent: 4000, waterCalcType: 'meter', waterRate: 18, waterPrev: 195, elecRate: 8, elecPrev: 3120 },
  { key: 'SOI8-08', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '8', tenantName: 'Chanthany', occupants: 1, rent: 4700, waterCalcType: 'meter', waterRate: 18, waterPrev: 325, elecRate: 8, elecPrev: 4100 },
  { key: 'SOI8-09', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '9', tenantName: 'คุณ นานอาย', occupants: 1, rent: 3800, waterCalcType: 'meter', waterRate: 18, waterPrev: 375, elecRate: 8, elecPrev: 5880 },
  { key: 'SOI8-10', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '10', tenantName: 'WINE CHIT', occupants: 1, rent: 3600, waterCalcType: 'meter', waterRate: 18, waterPrev: 290, elecRate: 8, elecPrev: 4390 },
  { key: 'SOI8-11', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '11', tenantName: 'คุณ โม', occupants: 1, rent: 3500, waterCalcType: 'meter', waterRate: 18, waterPrev: 230, elecRate: 8, elecPrev: 1340 },
  { key: 'SOI8-12', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '12', tenantName: 'คุณ นาเนีย', occupants: 1, rent: 4700, waterCalcType: 'meter', waterRate: 18, waterPrev: 430, elecRate: 8, elecPrev: 380 },
  { key: 'SOI8-13', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '13', tenantName: 'คุณ วิจิตตรา', occupants: 1, rent: 4300, waterCalcType: 'meter', waterRate: 18, waterPrev: 192, elecRate: 8, elecPrev: 3690 },
  { key: 'SOI8-14', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '14', tenantName: 'คุณ โช', occupants: 1, rent: 4300, waterCalcType: 'meter', waterRate: 18, waterPrev: 240, elecRate: 8, elecPrev: 6250 },
  { key: 'SOI8-15', buildingId: 'BLD-SOI8', building: 'อาคาร ซอย 8', roomNo: '15', tenantName: 'คุณ การ์ตูน', occupants: 1, rent: 4500, waterCalcType: 'meter', waterRate: 18, waterPrev: 360, elecRate: 8, elecPrev: 3080 },

  // 4. อาคาร กศน (1 ห้อง)
  { key: 'KSN-01', buildingId: 'BLD-KSN01', building: 'อาคาร กศน', roomNo: '1', tenantName: 'กศน', occupants: 1, rent: 30000, waterCalcType: 'meter', waterRate: 18, waterPrev: 0, elecRate: 8, elecPrev: 0 },

  // 5. อาคาร 399/40 (9 ห้อง: ค่าน้ำตามมิเตอร์ 18 บ./หน่วย, ค่าไฟ 8 บ./หน่วย)
  { key: '399-40-01', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '1', tenantName: 'คุณ เล็ก', occupants: 1, rent: 6000, waterCalcType: 'meter', waterRate: 18, waterPrev: 0, elecRate: 8, elecPrev: 0 },
  { key: '399-40-02', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '2', tenantName: 'คุณ สีบอร์', occupants: 1, rent: 4800, waterCalcType: 'meter', waterRate: 18, waterPrev: 50, elecRate: 8, elecPrev: 420 },
  { key: '399-40-03', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '3', tenantName: 'คุณ HTET', occupants: 1, rent: 4500, waterCalcType: 'meter', waterRate: 18, waterPrev: 65, elecRate: 8, elecPrev: 1120 },
  { key: '399-40-04', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '4', tenantName: 'คุณ Moeoo', occupants: 1, rent: 5500, waterCalcType: 'meter', waterRate: 18, waterPrev: 150, elecRate: 8, elecPrev: 1240 },
  { key: '399-40-05', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '5', tenantName: 'คุณ แซน', occupants: 1, rent: 4500, waterCalcType: 'meter', waterRate: 18, waterPrev: 20, elecRate: 8, elecPrev: 700 },
  { key: '399-40-06', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '6', tenantName: 'คุณ ราม', occupants: 1, rent: 5000, waterCalcType: 'meter', waterRate: 18, waterPrev: 42, elecRate: 8, elecPrev: 900 },
  { key: '399-40-07', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '7', tenantName: 'คุณ ปอย', occupants: 1, rent: 4500, waterCalcType: 'meter', waterRate: 18, waterPrev: 38, elecRate: 8, elecPrev: 440 },
  { key: '399-40-08', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '8', tenantName: 'คุณ ดา', occupants: 1, rent: 5000, waterCalcType: 'meter', waterRate: 18, waterPrev: 130, elecRate: 8, elecPrev: 2520 },
  { key: '399-40-09', buildingId: 'BLD-399-40', building: 'อาคาร 399/40', roomNo: '9', tenantName: 'คุณ นิชา', occupants: 1, rent: 4000, waterCalcType: 'meter', waterRate: 18, waterPrev: 0, elecRate: 8, elecPrev: 520 },

  // 6. อาคาร 399/38 (17 ห้อง: ค่าน้ำเหมา 100 บ./คน, ค่าไฟ 8 บ./หน่วย)
  { key: '399-38-01', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '1', tenantName: 'คุณ ณเดชน์', occupants: 2, rent: 3000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 6860 },
  { key: '399-38-02', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '2', tenantName: 'คุณ วัต', occupants: 2, rent: 4500, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 1180 },
  { key: '399-38-03', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '3', tenantName: 'คุณ แก้ว', occupants: 2, rent: 4300, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 9000 },
  { key: '399-38-04', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '4', tenantName: 'คุณ มาด', occupants: 1, rent: 2400, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 1180 },
  { key: '399-38-05', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '5', tenantName: 'คุณ เหมย', occupants: 1, rent: 2000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 2920 },
  { key: '399-38-06', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '6', tenantName: 'คุณ พร', occupants: 2, rent: 3200, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 8980 },
  { key: '399-38-07', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '7', tenantName: 'คุณ โบ', occupants: 2, rent: 2600, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 100 },
  { key: '399-38-08', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '8', tenantName: 'คุณ บิว', occupants: 2, rent: 2000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 480 },
  { key: '399-38-09', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '9', tenantName: 'คุณ วาด', occupants: 2, rent: 3300, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 6540 },
  { key: '399-38-10', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '10', tenantName: 'คุณ ฟ้า', occupants: 3, rent: 2700, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 1050 },
  { key: '399-38-11', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '11', tenantName: 'คุณ แมน', occupants: 1, rent: 2000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 2720 },
  { key: '399-38-12', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '12', tenantName: 'คุณ พิม', occupants: 4, rent: 2800, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 420 },
  { key: '399-38-14', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '14', tenantName: 'คุณ แพท', occupants: 2, rent: 2700, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 10080 },
  { key: '399-38-15', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '15', tenantName: 'คุณ แก้ว', occupants: 2, rent: 2000, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 1400 },
  { key: '399-38-16', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '16', tenantName: 'คุณ บี', occupants: 2, rent: 2900, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 3320 },
  { key: '399-38-17', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '17', tenantName: 'คุณ ปอย', occupants: 1, rent: 2700, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 70 },
  { key: '399-38-18', buildingId: 'BLD-399-38', building: 'อาคาร 399/38', roomNo: '18', tenantName: 'คุณ แต้ว', occupants: 1, rent: 2400, waterCalcType: 'per_person', waterPrev: 0, elecRate: 8, elecPrev: 90 },
];

function getRoomFloor(building: string, roomNo: string): number {
  const num = parseInt(roomNo, 10);
  if (isNaN(num)) return 1;
  if (building.includes('โรงงาน') || building.includes('กศน')) return 1;
  if (building.includes('ดอนเมือง')) {
    if (num <= 5) return 1;
    if (num <= 11) return 2;
    if (num <= 16) return 3;
    return 4;
  }
  if (building.includes('ซอย 8')) {
    if (num <= 5) return 1;
    if (num <= 10) return 2;
    return 3;
  }
  if (building.includes('399/40')) {
    return num <= 5 ? 1 : 2;
  }
  if (building.includes('399/38')) {
    if (num <= 6) return 1;
    if (num <= 12) return 2;
    return 3;
  }
  return 1;
}

export function buildOctoberRoomRecord(spec: OctoberRoomSpec): RoomRecord {
  const isVacant = spec.status === 'vacant' || spec.tenantName === 'ห้องว่าง';
  const occupancyStatus: OccupancyStatus = isVacant ? 'vacant' : 'occupied';
  const isOccupied = !isVacant;

  const floor = getRoomFloor(spec.building, spec.roomNo);
  const waterRate = spec.waterRate || (spec.building.includes('โรงงาน') ? 20 : 18);
  const elecRate = spec.elecRate;

  // In October 2026 starting state (waiting to be recorded - "รอกรอก"):
  // Current meters = 0, units = 0, elecCost = 0
  const elecPrev = spec.elecPrev;
  const elecCurr = 0;
  const elecUnits = 0;
  const elecCost = 0;

  // For per-person water: occupants * 100 THB
  // For meter water: current meter = 0, units = 0, cost = 0
  const waterPrev = spec.waterCalcType === 'meter' ? spec.waterPrev : 0;
  const waterCurr = 0;
  const waterUnits = 0;
  const waterCost = isOccupied
    ? (spec.waterCalcType === 'per_person' ? spec.occupants * 100 : 0)
    : 0;

  const rent = isOccupied ? spec.rent : 0;
  const total = rent + waterCost;

  return {
    key: spec.key,
    buildingId: spec.buildingId,
    building: spec.building,
    roomNo: spec.roomNo,
    floor,
    tenantName: spec.tenantName,
    phone: spec.phone || '',
    occupants: spec.occupants,
    occupancyStatus,
    isOccupied,
    waterCalcType: spec.waterCalcType,
    waterPerPersonRate: 100,
    rent,
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
    otherFees: 0,
    total,
    previousBalance: 0, // ยอดค้างเดือนก่อน = 0 ตาม CSV
    lateDays: 0,
    lateFeePerDay: 100,
    lateFeeTotal: 0,
    liabilityTotal: 0,
    grandTotal: total,
    isPaid: false, // สถานะการชำระเงิน = รอชำระเงิน ตาม CSV
    paymentDate: undefined,
    hasMeterUpdated: false, // สถานะจดมิเตอร์ = รอกรอก ตาม CSV
    meterUpdatedDate: undefined,
    notes: isOccupied ? 'รอกดบันทึกมิเตอร์' : 'ห้องว่าง',
  };
}

export function generateAllOctoberRooms(): Record<string, RoomRecord[]> {
  const months = [
    '01 ม.ค.', '02 ก.พ.', '03 มี.ค.', '04 เม.ย.',
    '05 พ.ค.', '06 มิ.ย.', '07 ก.ค.', '08 ส.ค.',
    '09 ก.ย.', '10 ต.ค.', '11 พ.ย.', '12 ธ.ค.',
  ];

  const result: Record<string, RoomRecord[]> = {};

  // Build the canonical October 2026 dataset (78 rooms)
  const octoberRooms = RAW_OCTOBER_SPECS.map(spec => buildOctoberRoomRecord(spec));
  result['10 ต.ค.'] = octoberRooms;

  // For future months (11 พ.ย., 12 ธ.ค.), copy October baseline
  result['11 พ.ย.'] = octoberRooms.map(r => ({ ...r, key: r.key }));
  result['12 ธ.ค.'] = octoberRooms.map(r => ({ ...r, key: r.key }));

  // For historical months (01 ม.ค. to 09 ก.ย.), create consistent room records
  months.slice(0, 9).forEach((m) => {
    result[m] = octoberRooms.map(r => ({
      ...r,
      // In past demo months, marked as paid for historical demo
      isPaid: true,
      hasMeterUpdated: true,
    }));
  });

  return result;
}
