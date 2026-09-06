import { BuildingProfile, RoomRecord, ValidationError, OccupancyStatus } from '../types';

export interface DatabaseTableSchema {
  tableName: string;
  thaiName: string;
  description: string;
  primaryKey: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    foreignKey?: string;
    description: string;
    example: string;
  }[];
}

export const OPTIMAL_DATABASE_SCHEMA: DatabaseTableSchema[] = [
  {
    tableName: 'buildings',
    thaiName: 'ตารางข้อมูลอาคาร (Buildings Master)',
    description: 'เก็บข้อมูลอาคารทั้งหมด ป้องกันการพิมพ์ชื่ออาคารซ้ำซ้อน และกำหนดข้อจำกัดจำนวนห้องสูงสุด (Capacity)',
    primaryKey: 'building_id',
    columns: [
      { name: 'building_id', type: 'VARCHAR(20)', nullable: false, description: 'รหัสอาคารเฉพาะ (Primary Key)', example: 'BLD-DM01' },
      { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'ชื่ออาคาร', example: 'อาคารดอนเมือง' },
      { name: 'total_units', type: 'INT', nullable: false, description: 'จำนวนห้องพักทั้งหมดที่ออกแบบไว้ (Total Capacity)', example: '8' },
      { name: 'floors', type: 'INT', nullable: false, description: 'จำนวนชั้นของอาคาร', example: '3' },
      { name: 'location', type: 'TEXT', nullable: false, description: 'ที่ตั้ง / ที่อยู่อาคาร', example: '88/19 หมู่ 4 ถ.สรงประภา แขวงสีกัน ดอนเมือง กทม.' },
      { name: 'default_water_rate', type: 'DECIMAL(6,2)', nullable: false, description: 'อัตราค่าน้ำประปาเริ่มต้น (บาท/หน่วย)', example: '18.00' },
      { name: 'default_elec_rate', type: 'DECIMAL(6,2)', nullable: false, description: 'อัตราค่าไฟฟ้าเริ่มต้น (บาท/หน่วย)', example: '8.00' },
      { name: 'description', type: 'TEXT', nullable: true, description: 'คำอธิบายสิ่งอำนวยความสะดวก/หมายเหตุ', example: 'หอพักสไตล์โมเดิร์น 3 ชั้น' },
      { name: 'created_at', type: 'TIMESTAMP', nullable: false, description: 'วันที่บันทึกเข้าสู่ระบบ', example: '2025-01-10 09:00:00' },
    ]
  },
  {
    tableName: 'units',
    thaiName: 'ตารางห้องพัก (Units / Rooms Master)',
    description: 'เก็บข้อมูลเฉพาะของแต่ละห้อง อ้างอิง building_id เพื่อไม่ให้ข้อมูลอาคารซ้ำซ้อน และบันทึกสถานะการพักแบบไดนามิก',
    primaryKey: 'unit_id',
    columns: [
      { name: 'unit_id', type: 'VARCHAR(30)', nullable: false, description: 'รหัสห้องเฉพาะในระบบ (Primary Key)', example: 'DM-101' },
      { name: 'building_id', type: 'VARCHAR(20)', nullable: false, foreignKey: 'buildings.building_id', description: 'รหัสอาคารที่สังกัด (Foreign Key)', example: 'BLD-DM01' },
      { name: 'room_no', type: 'VARCHAR(20)', nullable: false, description: 'เลขห้อง', example: '101' },
      { name: 'floor', type: 'INT', nullable: false, description: 'ชั้นที่ห้องนี้ตั้งอยู่', example: '1' },
      { name: 'base_rent', type: 'DECIMAL(10,2)', nullable: false, description: 'อัตราค่าเช่ารายเดือนพื้นฐาน (บาท)', example: '3800.00' },
      { name: 'occupancy_status', type: 'ENUM', nullable: false, description: 'สถานะห้อง (occupied, vacant, under_renovation)', example: 'occupied' },
      { name: 'water_calc_type', type: 'ENUM', nullable: false, description: 'วิธีคิดค่าน้ำ (meter, per_person)', example: 'meter' },
      { name: 'water_per_person_rate', type: 'DECIMAL(6,2)', nullable: false, description: 'อัตราค่าน้ำเหมาจ่ายต่อคน (กรณีเลือก per_person)', example: '100.00' },
      { name: 'renovation_notes', type: 'TEXT', nullable: true, description: 'บันทึกสาเหตุการปรับปรุง (กรณี under_renovation)', example: 'ทาสีใหม่' },
    ]
  },
  {
    tableName: 'tenants',
    thaiName: 'ตารางผู้เช่าและสัญญา (Tenants & Contracts)',
    description: 'เก็บข้อมูลผู้เช่า สัญญาเช่า และจำนวนผู้อยู่อาศัยจริง แยกออกจากข้อมูลห้อง เพื่อรองรับการเปลี่ยนผู้เช่าโดยไม่สูญเสียประวัติ',
    primaryKey: 'tenant_id',
    columns: [
      { name: 'tenant_id', type: 'VARCHAR(30)', nullable: false, description: 'รหัสผู้เช่า (Primary Key)', example: 'TNT-2026-001' },
      { name: 'unit_id', type: 'VARCHAR(30)', nullable: false, foreignKey: 'units.unit_id', description: 'ห้องที่เช่าปัจจุบัน (Foreign Key)', example: 'DM-101' },
      { name: 'full_name', type: 'VARCHAR(150)', nullable: false, description: 'ชื่อ-นามสกุลผู้เช่า', example: 'นายสมชาย มั่งมีทรัพย์' },
      { name: 'phone', type: 'VARCHAR(50)', nullable: false, description: 'เบอร์โทรศัพท์ติดต่อ', example: '089-112-3344' },
      { name: 'occupants_count', type: 'INT', nullable: false, description: 'จำนวนผู้อยู่อาศัยจริง (ใช้คำนวณค่าน้ำเหมาจ่าย)', example: '2' },
      { name: 'contract_start', type: 'DATE', nullable: true, description: 'วันเริ่มต้นสัญญาเช่า', example: '2026-01-01' },
      { name: 'contract_end', type: 'DATE', nullable: true, description: 'วันสิ้นสุดสัญญาเช่า', example: '2026-12-31' },
      { name: 'status', type: 'VARCHAR(20)', nullable: false, description: 'สถานะผู้เช่า (active, moved_out)', example: 'active' },
    ]
  },
  {
    tableName: 'monthly_meter_billing',
    thaiName: 'ตารางบันทึกมิเตอร์และใบแจ้งหนี้รายเดือน (Monthly Billing)',
    description: 'เก็บข้อมูลการจดมิเตอร์และคำนวณเงินแต่ละเดือน เชื่อมโยงกับ unit_id โดยไม่บันทึกชื่อตึกหรือที่อยู่ซ้ำซ้อน',
    primaryKey: 'billing_id',
    columns: [
      { name: 'billing_id', type: 'VARCHAR(50)', nullable: false, description: 'รหัสรอบบิล (Primary Key)', example: 'BILL-2026-08-DM-101' },
      { name: 'period_month', type: 'VARCHAR(20)', nullable: false, description: 'รอบงวดเดือน (e.g. 08 ส.ค. หรือ 2026-08)', example: '08 ส.ค.' },
      { name: 'unit_id', type: 'VARCHAR(30)', nullable: false, foreignKey: 'units.unit_id', description: 'รหัสห้อง (Foreign Key)', example: 'DM-101' },
      { name: 'water_prev', type: 'DECIMAL(10,2)', nullable: false, description: 'เลขมิเตอร์น้ำครั้งก่อน', example: '1360.00' },
      { name: 'water_curr', type: 'DECIMAL(10,2)', nullable: false, description: 'เลขมิเตอร์น้ำครั้งนี้', example: '1368.00' },
      { name: 'water_units', type: 'DECIMAL(10,2)', nullable: false, description: 'หน่วยน้ำที่ใช้', example: '8.00' },
      { name: 'water_cost', type: 'DECIMAL(10,2)', nullable: false, description: 'ค่าน้ำรวม (บาท)', example: '144.00' },
      { name: 'elec_prev', type: 'DECIMAL(10,2)', nullable: false, description: 'เลขมิเตอร์ไฟครั้งก่อน', example: '2400.00' },
      { name: 'elec_curr', type: 'DECIMAL(10,2)', nullable: false, description: 'เลขมิเตอร์ไฟครั้งนี้', example: '2535.00' },
      { name: 'elec_units', type: 'DECIMAL(10,2)', nullable: false, description: 'หน่วยไฟที่ใช้', example: '135.00' },
      { name: 'elec_cost', type: 'DECIMAL(10,2)', nullable: false, description: 'ค่าไฟรวม (บาท)', example: '1080.00' },
      { name: 'rent_amount', type: 'DECIMAL(10,2)', nullable: false, description: 'ค่าเช่าห้องประจำงวด', example: '3800.00' },
      { name: 'other_fees', type: 'DECIMAL(10,2)', nullable: false, description: 'ค่าขยะ/ค่าส่วนกลาง', example: '150.00' },
      { name: 'total_amount', type: 'DECIMAL(10,2)', nullable: false, description: 'ยอดรวมทั้งสิ้น (บาท)', example: '5174.00' },
      { name: 'is_paid', type: 'BOOLEAN', nullable: false, description: 'สถานะการชำระเงิน', example: 'TRUE' },
      { name: 'paid_at', type: 'TIMESTAMP', nullable: true, description: 'วันเวลาที่ชำระเงิน', example: '2026-08-05 14:30:00' },
    ]
  },
  {
    tableName: 'occupancy_logs',
    thaiName: 'ตารางบันทึกประวัติการเปลี่ยนสถานะห้อง (Occupancy Audit Log)',
    description: 'เก็บบันทึกประวัติเมื่อมีการย้ายเข้า ย้ายออก หรือปิดปรับปรุง เพื่อติดตาม Occupancy Rate และการบริหารห้องพัก',
    primaryKey: 'log_id',
    columns: [
      { name: 'log_id', type: 'INT AUTO_INCREMENT', nullable: false, description: 'รหัสประวัติ', example: '101' },
      { name: 'unit_id', type: 'VARCHAR(30)', nullable: false, foreignKey: 'units.unit_id', description: 'รหัสห้อง', example: 'DM-303' },
      { name: 'previous_status', type: 'VARCHAR(30)', nullable: false, description: 'สถานะเดิม', example: 'vacant' },
      { name: 'new_status', type: 'VARCHAR(30)', nullable: false, description: 'สถานะใหม่', example: 'under_renovation' },
      { name: 'reason', type: 'TEXT', nullable: true, description: 'หมายเหตุหรือเหตุผล', example: 'ปรับปรุงห้องน้ำและทาสีผนัง' },
      { name: 'changed_at', type: 'TIMESTAMP', nullable: false, description: 'วันเวลาที่มีการเปลี่ยนแปลง', example: '2026-08-01 10:00:00' },
    ]
  }
];

// System Validation Engine
export function validateSystemIntegrity(
  buildings: BuildingProfile[],
  rooms: RoomRecord[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const buildingIdMap = new Map<string, BuildingProfile>();
  const buildingNameMap = new Map<string, BuildingProfile>();

  // 1. Validate Buildings
  buildings.forEach(b => {
    if (!b.id || !b.id.trim()) {
      errors.push({
        type: 'error',
        category: 'format',
        target: b.name || 'Unknown Building',
        message: 'รหัสอาคาร (Building ID) ห้ามเว้นว่าง',
        fixSuggestion: 'กรอกรหัสอาคาร เช่น BLD-DM01',
      });
    }

    if (buildingIdMap.has(b.id)) {
      errors.push({
        type: 'error',
        category: 'duplicate_id',
        target: `ID: ${b.id}`,
        message: `รหัสอาคาร "${b.id}" ซ้ำซ้อนกับอาคารอื่น`,
        fixSuggestion: 'เปลี่ยนรหัสอาคารให้ไม่ซ้ำกัน',
      });
    } else {
      buildingIdMap.set(b.id, b);
    }

    if (buildingNameMap.has(b.name)) {
      errors.push({
        type: 'error',
        category: 'duplicate_id',
        target: `ชื่ออาคาร: ${b.name}`,
        message: `ชื่ออาคาร "${b.name}" ซ้ำซ้อน`,
        fixSuggestion: 'ระบุชื่ออาคารให้ชัดเจนและไม่ซ้ำ',
      });
    } else {
      buildingNameMap.set(b.name, b);
    }

    if (!b.totalUnits || b.totalUnits <= 0) {
      errors.push({
        type: 'warning',
        category: 'format',
        target: b.name,
        message: `จำนวนห้องที่ออกแบบไว้ (Total Units) ควรมีค่าอย่างน้อย 1 ยูนิต (ปัจจุบันระบุ ${b.totalUnits})`,
        fixSuggestion: 'กำหนดจำนวนห้องทั้งหมดของอาคาร',
      });
    }
  });

  // 2. Validate Rooms Referential Integrity & Capacity
  const roomsPerBuilding = new Map<string, number>();
  const seenRoomKeys = new Set<string>();
  const seenBuildingRoomPair = new Set<string>();

  rooms.forEach(r => {
    // Check Duplicate Keys
    if (seenRoomKeys.has(r.key)) {
      errors.push({
        type: 'error',
        category: 'duplicate_room',
        target: `ห้อง ${r.roomNo} (Key: ${r.key})`,
        message: `รหัส Key ประจำห้อง "${r.key}" ซ้ำซ้อน`,
        fixSuggestion: 'กำหนด Key ให้เฉพาะเจาะจง เช่น BLD-ROOM',
      });
    }
    seenRoomKeys.add(r.key);

    const bldRoomKey = `${r.building}__${r.roomNo}`;
    if (seenBuildingRoomPair.has(bldRoomKey)) {
      errors.push({
        type: 'error',
        category: 'duplicate_room',
        target: `${r.building} - ห้อง ${r.roomNo}`,
        message: `เลขห้อง "${r.roomNo}" ซ้ำกันในอาคารเดียวกัน (${r.building})`,
        fixSuggestion: 'เปลี่ยนเลขห้องไม่ให้ซ้ำกันในอาคารเดียวกัน',
      });
    }
    seenBuildingRoomPair.add(bldRoomKey);

    // FOREIGN KEY VALIDATION: Building must exist!
    const matchingBuildingByName = buildingNameMap.get(r.building);
    const matchingBuildingById = r.buildingId ? buildingIdMap.get(r.buildingId) : undefined;

    if (!matchingBuildingByName && !matchingBuildingById) {
      errors.push({
        type: 'error',
        category: 'building_not_found',
        target: `ห้อง ${r.roomNo} (${r.building})`,
        message: `ไม่อาจบันทึกหรืออัปเดตห้อง ${r.roomNo} ได้ เนื่องจากอาคาร "${r.building}" ไม่มีอยู่ในระบบโปรไฟล์อาคาร! (Foreign Key Violation)`,
        fixSuggestion: 'เลือกอาคารที่ลงทะเบียนไว้แล้ว หรือเพิ่มโปรไฟล์อาคารนี้ในระบบก่อน',
      });
    }

    const bldName = matchingBuildingByName?.name || r.building;
    roomsPerBuilding.set(bldName, (roomsPerBuilding.get(bldName) || 0) + 1);

    // Occupancy Status Logic Validation
    if (r.occupancyStatus === 'occupied') {
      if (!r.tenantName || !r.tenantName.trim()) {
        errors.push({
          type: 'warning',
          category: 'invalid_occupancy',
          target: `ห้อง ${r.roomNo} (${r.building})`,
          message: `ห้องระบุสถานะ "มีผู้เช่า (Occupied)" แต่ยังไม่ได้ระบุชื่อผู้เช่า`,
          fixSuggestion: 'กรอกชื่อผู้เช่า หรือเปลี่ยนสถานะเป็นห้องว่าง',
        });
      }
      if (!r.occupants || r.occupants < 1) {
        errors.push({
          type: 'warning',
          category: 'invalid_occupancy',
          target: `ห้อง ${r.roomNo} (${r.building})`,
          message: `ห้องที่มีผู้เช่าควรมีจำนวนผู้อยู่อาศัยอย่างน้อย 1 คน (ปัจจุบันระบุ ${r.occupants})`,
          fixSuggestion: 'ระบุจำนวนผู้พักอาศัยอย่างน้อย 1 คน',
        });
      }
    } else if (r.occupancyStatus === 'vacant') {
      if (r.tenantName && r.tenantName.trim()) {
        errors.push({
          type: 'warning',
          category: 'invalid_occupancy',
          target: `ห้อง ${r.roomNo} (${r.building})`,
          message: `ห้องระบุสถานะ "ห้องว่าง (Vacant)" แต่มีชื่อผู้เช่าค้างอยู่ (${r.tenantName})`,
          fixSuggestion: 'ล้างชื่อผู้เช่า หรือเปลี่ยนสถานะเป็นมีผู้เช่า',
        });
      }
    } else if (r.occupancyStatus === 'under_renovation') {
      if (!r.renovationReason) {
        errors.push({
          type: 'warning',
          category: 'invalid_occupancy',
          target: `ห้อง ${r.roomNo} (${r.building})`,
          message: `ห้องระบุสถานะ "ปิดปรับปรุง (Under Renovation)" แนะนำให้ระบุหมายเหตุการซ่อมบำรุง`,
          fixSuggestion: 'ระบุรายละเอียด เช่น ทาสี ซ่อมท่อ หรือเปลี่ยนสุขภัณฑ์',
        });
      }
    }

    // Meter non-reversal validation
    if (r.hasMeterUpdated && r.waterCurr > 0 && r.waterCurr < r.waterPrev) {
      errors.push({
        type: 'error',
        category: 'meter_reversal',
        target: `ห้อง ${r.roomNo} (${r.building})`,
        message: `เลขมิเตอร์น้ำครั้งนี้ (${r.waterCurr}) น้อยกว่าเลขครั้งก่อน (${r.waterPrev}) ซึ่งผิดปกติ`,
        fixSuggestion: 'ตรวจสอบเลขมิเตอร์น้ำ หรือเช็ครอบการเปลี่ยนมาตรวัดใหม่',
      });
    }

    if (r.hasMeterUpdated && r.elecCurr > 0 && r.elecCurr < r.elecPrev) {
      errors.push({
        type: 'error',
        category: 'meter_reversal',
        target: `ห้อง ${r.roomNo} (${r.building})`,
        message: `เลขมิเตอร์ไฟครั้งนี้ (${r.elecCurr}) น้อยกว่าเลขครั้งก่อน (${r.elecPrev}) ซึ่งผิดปกติ`,
        fixSuggestion: 'ตรวจสอบเลขมิเตอร์ไฟฟ้า หรือเช็ครอบการเปลี่ยนมาตรวัดใหม่',
      });
    }
  });

  // 3. CAPACITY CHECK: Verify room count against totalUnits
  buildings.forEach(b => {
    const currentRoomCount = roomsPerBuilding.get(b.name) || 0;
    if (currentRoomCount > b.totalUnits) {
      errors.push({
        type: 'warning',
        category: 'capacity_exceeded',
        target: b.name,
        message: `จำนวนห้องที่สร้างจริง (${currentRoomCount} ห้อง) เกินความจุของอาคารที่ตั้งไว้ (${b.totalUnits} ยูนิต)`,
        fixSuggestion: `เพิ่ม Total Units ของอาคาร ${b.name} ให้สอดคล้องกัน`,
      });
    }
  });

  return errors;
}

// Generate Relational SQL DDL
export function generateRelationalSqlDdl(): string {
  return `-- ==========================================================
-- OPTIMAL NORMALIZED PROPERTY MANAGEMENT DATABASE SCHEMA (3NF)
-- Anti-Duplication: Buildings & Units & Tenants & Monthly Billing
-- ==========================================================

-- 1. Buildings Table (Master)
CREATE TABLE IF NOT EXISTS buildings (
    building_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    total_units INT NOT NULL DEFAULT 1,
    floors INT NOT NULL DEFAULT 1,
    location TEXT NOT NULL,
    default_water_rate DECIMAL(6,2) NOT NULL DEFAULT 18.00,
    default_elec_rate DECIMAL(6,2) NOT NULL DEFAULT 8.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Units Table (Rooms Master)
CREATE TABLE IF NOT EXISTS units (
    unit_id VARCHAR(30) PRIMARY KEY,
    building_id VARCHAR(20) NOT NULL,
    room_no VARCHAR(20) NOT NULL,
    floor INT NOT NULL DEFAULT 1,
    base_rent DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    occupancy_status VARCHAR(30) NOT NULL DEFAULT 'vacant', 
    -- Allowed: 'occupied', 'vacant', 'under_renovation'
    water_calc_type VARCHAR(20) NOT NULL DEFAULT 'meter', 
    -- Allowed: 'meter', 'per_person'
    water_per_person_rate DECIMAL(6,2) NOT NULL DEFAULT 100.00,
    other_fees DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    renovation_notes TEXT,
    CONSTRAINT fk_unit_building FOREIGN KEY (building_id) 
        REFERENCES buildings(building_id) ON DELETE RESTRICT,
    CONSTRAINT uq_building_room UNIQUE (building_id, room_no)
);

-- 3. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id VARCHAR(30) PRIMARY KEY,
    unit_id VARCHAR(30) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    occupants_count INT NOT NULL DEFAULT 1,
    contract_start DATE,
    contract_end DATE,
    deposit_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT fk_tenant_unit FOREIGN KEY (unit_id) 
        REFERENCES units(unit_id) ON DELETE CASCADE
);

-- 4. Monthly Readings & Billing Table
CREATE TABLE IF NOT EXISTS monthly_meter_billing (
    billing_id VARCHAR(60) PRIMARY KEY,
    period_month VARCHAR(20) NOT NULL, -- e.g. '2026-08' or '08 ส.ค.'
    unit_id VARCHAR(30) NOT NULL,
    water_prev DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    water_curr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    water_units DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE WHEN water_curr >= water_prev THEN water_curr - water_prev ELSE 0 END
    ) STORED,
    water_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    elec_prev DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    elec_curr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    elec_units DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE WHEN elec_curr >= elec_prev THEN elec_curr - elec_prev ELSE 0 END
    ) STORED,
    elec_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rent_charged DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    other_fees DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMP NULL,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_billing_unit FOREIGN KEY (unit_id) 
        REFERENCES units(unit_id) ON DELETE RESTRICT,
    CONSTRAINT uq_unit_period UNIQUE (unit_id, period_month)
);

-- 5. Occupancy Audit Log Table
CREATE TABLE IF NOT EXISTS occupancy_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id VARCHAR(30) NOT NULL,
    previous_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_unit FOREIGN KEY (unit_id) 
        REFERENCES units(unit_id) ON DELETE CASCADE
);`;
}
