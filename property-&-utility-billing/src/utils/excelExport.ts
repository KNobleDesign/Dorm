import * as XLSX from 'xlsx';
import { RoomRecord, LandlordConfig, ExpenseRecord, AppUser } from '../types';

export interface ExcelExportOptions {
  rooms: RoomRecord[];
  activeMonth: string;
  buildings: string[];
  config: LandlordConfig;
  expenses?: ExpenseRecord[];
  currentUser?: AppUser;
  allMonthsData?: Record<string, RoomRecord[]>;
}

/**
 * Export dashboard room data, financial metrics, building breakdown, and expenses
 * to a multi-sheet Microsoft Excel (.xlsx) file with full Thai UTF-8 character support.
 */
export function exportDashboardToExcel({
  rooms,
  activeMonth,
  buildings,
  config,
  expenses = [],
  currentUser,
}: ExcelExportOptions): void {
  // Helper to calculate total liability and effective total
  const getRoomEffectiveTotal = (r: RoomRecord) => {
    if (r.grandTotal !== undefined && r.grandTotal !== null) return r.grandTotal;
    const liability = (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || config.lateFeePerDayDefault || 100)));
    return (r.total || 0) + liability;
  };

  const getLiability = (r: RoomRecord) => {
    return (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || config.lateFeePerDayDefault || 100)));
  };

  // 1. Prepare Sheet 1: รายการห้องพักและมิเตอร์ประจำงวด (Detailed Rooms)
  const roomRows = rooms.map((r, idx) => {
    const isOccupied = r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied);
    let occupancyText = 'มีผู้เช่า';
    if (r.occupancyStatus === 'vacant' || (!isOccupied && !r.occupancyStatus)) occupancyText = 'ห้องว่าง';
    if (r.occupancyStatus === 'under_renovation') occupancyText = 'ปรับปรุง';

    const waterCalcTypeText = r.waterCalcType === 'per_person' ? `เหมาจ่าย (${r.occupants || 1} คน)` : 'ตามมิเตอร์';
    const liability = getLiability(r);
    const grandTotal = getRoomEffectiveTotal(r);
    const meterStatusText = r.hasMeterUpdated ? 'บันทึกแล้ว' : 'รอกรอก';
    const paymentStatusText = r.isPaid ? 'ชำระแล้ว' : 'ค้างชำระ';

    return {
      'ลำดับ': idx + 1,
      'อาคาร': r.building,
      'เลขห้อง': r.roomNo,
      'ชั้น': r.floor || 1,
      'สถานะห้อง': occupancyText,
      'ชื่อผู้เช่า': r.tenantName || '-',
      'เบอร์โทรศัพท์': r.phone || '-',
      'ค่าเช่าห้อง (บาท)': r.rent || 0,
      'วิธีคิดค่าน้ำ': waterCalcTypeText,
      'มิเตอร์น้ำก่อนหน้า': r.waterPrev || 0,
      'มิเตอร์น้ำปัจจุบัน': r.waterCurr || 0,
      'จำนวนหน่วยน้ำ': r.waterUnits || 0,
      'ค่าน้ำประปา (บาท)': r.waterCost || 0,
      'มิเตอร์ไฟก่อนหน้า': r.elecPrev || 0,
      'มิเตอร์ไฟปัจจุบัน': r.elecCurr || 0,
      'จำนวนหน่วยไฟ': r.elecUnits || 0,
      'ค่าไฟฟ้า (บาท)': r.elecCost || 0,
      'ค่าส่วนกลาง/ค่าอื่นๆ (บาท)': r.otherFees || 0,
      'ยอดยกมา/ค่าปรับ (บาท)': liability,
      'ยอดรวมสุทธิ (บาท)': grandTotal,
      'สถานะการจดมิเตอร์': meterStatusText,
      'สถานะการชำระเงิน': paymentStatusText,
      'วันที่ชำระเงิน': r.paymentDate || '-',
      'หมายเหตุ': r.notes || '-',
    };
  });

  // Calculate Column Totals for Summary Row
  const totalRent = rooms.reduce((sum, r) => sum + (r.rent || 0), 0);
  const totalWaterUnits = rooms.reduce((sum, r) => sum + (r.waterUnits || 0), 0);
  const totalWaterCost = rooms.reduce((sum, r) => sum + (r.waterCost || 0), 0);
  const totalElecUnits = rooms.reduce((sum, r) => sum + (r.elecUnits || 0), 0);
  const totalElecCost = rooms.reduce((sum, r) => sum + (r.elecCost || 0), 0);
  const totalOtherFees = rooms.reduce((sum, r) => sum + (r.otherFees || 0), 0);
  const totalLiability = rooms.reduce((sum, r) => sum + getLiability(r), 0);
  const totalGrand = rooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const paidCount = rooms.filter(r => r.isPaid).length;
  const unpaidCount = rooms.length - paidCount;

  // Add Summary Total Row to room rows
  const summaryRoomRow: any = {
    'ลำดับ': 'รวมทั้งสิ้น',
    'อาคาร': `ทั้งหมด ${buildings.length} อาคาร`,
    'เลขห้อง': `${rooms.length} ห้อง`,
    'ชั้น': '-',
    'สถานะห้อง': `มีผู้เช่า ${rooms.filter(r => r.occupancyStatus === 'occupied' || (!r.occupancyStatus && r.isOccupied)).length} ห้อง`,
    'ชื่อผู้เช่า': `ห้องว่าง ${rooms.filter(r => r.occupancyStatus === 'vacant').length} ห้อง`,
    'เบอร์โทรศัพท์': `ปรับปรุง ${rooms.filter(r => r.occupancyStatus === 'under_renovation').length} ห้อง`,
    'ค่าเช่าห้อง (บาท)': totalRent,
    'วิธีคิดค่าน้ำ': '-',
    'มิเตอร์น้ำก่อนหน้า': '-',
    'มิเตอร์น้ำปัจจุบัน': '-',
    'จำนวนหน่วยน้ำ': totalWaterUnits,
    'ค่าน้ำประปา (บาท)': totalWaterCost,
    'มิเตอร์ไฟก่อนหน้า': '-',
    'มิเตอร์ไฟปัจจุบัน': '-',
    'จำนวนหน่วยไฟ': totalElecUnits,
    'ค่าไฟฟ้า (บาท)': totalElecCost,
    'ค่าส่วนกลาง/ค่าอื่นๆ (บาท)': totalOtherFees,
    'ยอดยกมา/ค่าปรับ (บาท)': totalLiability,
    'ยอดรวมสุทธิ (บาท)': totalGrand,
    'สถานะการจดมิเตอร์': `บันทึกแล้ว ${rooms.filter(r => r.hasMeterUpdated).length}/${rooms.length}`,
    'สถานะการชำระเงิน': `ชำระแล้ว ${paidCount} (ค้าง ${unpaidCount})`,
    'วันที่ชำระเงิน': '-',
    'หมายเหตุ': `รวมรายรับที่ต้องเก็บ ฿${totalGrand.toLocaleString()}`,
  };

  const finalRoomRows = [...roomRows, summaryRoomRow];

  // 2. Prepare Sheet 2: สรุปภาพรวมรายรับ-รายจ่าย (Financial Overview)
  const collectedRevenue = rooms.filter(r => r.isPaid).reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
  const pendingRevenue = totalGrand - collectedRevenue;
  const currentMonthExpenses = expenses.filter(e => {
    if (!e.date) return false;
    return e.date.startsWith(activeMonth);
  });
  const totalExpenseAmount = currentMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = collectedRevenue - totalExpenseAmount;

  const financialOverviewRows = [
    { 'หัวข้อสรุปภาพรวม': 'ชื่ออพาร์ตเมนต์ / หอพัก', 'รายละเอียด': config.propertyName || 'อพาร์ตเมนต์' },
    { 'หัวข้อสรุปภาพรวม': 'งวดประจำเดือน (Billing Cycle)', 'รายละเอียด': activeMonth },
    { 'หัวข้อสรุปภาพรวม': 'ผู้จัดการ / ผู้ดูแล', 'รายละเอียด': config.landlordName || '-' },
    { 'หัวข้อสรุปภาพรวม': 'เบอร์โทรศัพท์ติดต่อ', 'รายละเอียด': config.phone || '-' },
    { 'หัวข้อสรุปภาพรวม': 'หมายเลขพร้อมเพย์ (PromptPay)', 'รายละเอียด': config.promptPayId || '-' },
    { 'หัวข้อสรุปภาพรวม': '--------------------------------', 'รายละเอียด': '--------------------------------' },
    { 'หัวข้อสรุปภาพรวม': 'จำนวนห้องพักทั้งหมด (Total Units)', 'รายละเอียด': `${rooms.length} ห้อง` },
    { 'หัวข้อสรุปภาพรวม': 'จำนวนห้องที่มีผู้เช่า (Occupied)', 'รายละเอียด': `${rooms.filter(r => r.occupancyStatus === 'occupied' || (!r.occupancyStatus && r.isOccupied)).length} ห้อง` },
    { 'หัวข้อสรุปภาพรวม': 'จำนวนห้องว่าง (Vacant)', 'รายละเอียด': `${rooms.filter(r => r.occupancyStatus === 'vacant').length} ห้อง` },
    { 'หัวข้อสรุปภาพรวม': 'อัตราการเข้าพัก (Occupancy Rate)', 'รายละเอียด': `${rooms.length > 0 ? Math.round((rooms.filter(r => r.occupancyStatus === 'occupied' || (!r.occupancyStatus && r.isOccupied)).length / rooms.length) * 100) : 0}%` },
    { 'หัวข้อสรุปภาพรวม': '--------------------------------', 'รายละเอียด': '--------------------------------' },
    { 'หัวข้อสรุปภาพรวม': 'ยอดรวมรายรับที่ประเมินทั้งหมด (Total Revenue)', 'รายละเอียด': `${totalGrand.toLocaleString()} บาท` },
    { 'หัวข้อสรุปภาพรวม': 'ยอดเงินที่ได้รับชำระแล้ว (Collected Revenue)', 'รายละเอียด': `${collectedRevenue.toLocaleString()} บาท (${paidCount} ห้อง)` },
    { 'หัวข้อสรุปภาพรวม': 'ยอดค้างชำระ (Pending Revenue)', 'รายละเอียด': `${pendingRevenue.toLocaleString()} บาท (${unpaidCount} ห้อง)` },
    { 'หัวข้อสรุปภาพรวม': '--------------------------------', 'รายละเอียด': '--------------------------------' },
    { 'หัวข้อสรุปภาพรวม': 'การใช้น้ำประปารวม (Water Units)', 'รายละเอียด': `${totalWaterUnits.toLocaleString()} หน่วย (${totalWaterCost.toLocaleString()} บาท)` },
    { 'หัวข้อสรุปภาพรวม': 'การใช้ไฟฟ้ารวม (Electricity Units)', 'รายละเอียด': `${totalElecUnits.toLocaleString()} หน่วย (${totalElecCost.toLocaleString()} บาท)` },
    { 'หัวข้อสรุปภาพรวม': '--------------------------------', 'รายละเอียด': '--------------------------------' },
    { 'หัวข้อสรุปภาพรวม': 'รายจ่ายหอพักประจำงวด (Total Expenses)', 'รายละเอียด': `${totalExpenseAmount.toLocaleString()} บาท (${currentMonthExpenses.length} รายการ)` },
    { 'หัวข้อสรุปภาพรวม': 'กำไรสุทธิเบื้องต้น (Net Profit = เงินที่รับแล้ว - รายจ่าย)', 'รายละเอียด': `${netProfit.toLocaleString()} บาท` },
    { 'หัวข้อสรุปภาพรวม': 'วันที่ส่งออกข้อมูล (Export Date)', 'รายละเอียด': new Date().toLocaleString('th-TH') },
  ];

  // 3. Prepare Sheet 3: สรุปแยกรายอาคาร (Building Breakdown)
  const buildingBreakdownRows = buildings.map((bName, idx) => {
    const bRooms = rooms.filter(r => r.building === bName);
    const bOccupied = bRooms.filter(r => r.occupancyStatus === 'occupied' || (!r.occupancyStatus && r.isOccupied)).length;
    const bTotalRev = bRooms.reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
    const bPaidRev = bRooms.filter(r => r.isPaid).reduce((sum, r) => sum + getRoomEffectiveTotal(r), 0);
    const bPendingRev = bTotalRev - bPaidRev;
    const bWaterUnits = bRooms.reduce((sum, r) => sum + (r.waterUnits || 0), 0);
    const bWaterCost = bRooms.reduce((sum, r) => sum + (r.waterCost || 0), 0);
    const bElecUnits = bRooms.reduce((sum, r) => sum + (r.elecUnits || 0), 0);
    const bElecCost = bRooms.reduce((sum, r) => sum + (r.elecCost || 0), 0);
    const bMeterDone = bRooms.filter(r => r.hasMeterUpdated).length;

    return {
      'ลำดับ': idx + 1,
      'ชื่ออาคาร': bName,
      'จำนวนห้องทั้งหมด': bRooms.length,
      'ห้องมีผู้เช่า': bOccupied,
      'ห้องว่าง': bRooms.length - bOccupied,
      'จดมิเตอร์แล้ว': `${bMeterDone}/${bRooms.length} ห้อง`,
      'ยอดรวมทั้งหมด (บาท)': bTotalRev,
      'ชำระแล้ว (บาท)': bPaidRev,
      'ค้างชำระ (บาท)': bPendingRev,
      'หน่วยน้ำรวม': bWaterUnits,
      'ค่าน้ำรวม (บาท)': bWaterCost,
      'หน่วยไฟรวม': bElecUnits,
      'ค่าไฟรวม (บาท)': bElecCost,
    };
  });

  // 4. Prepare Sheet 4: รายการค่าใช้จ่ายหอพัก (Expenses)
  const expenseRows = currentMonthExpenses.map((exp, idx) => {
    const catLabels: Record<string, string> = {
      utility_bills: 'ค่าน้ำ-ไฟหลวง',
      maintenance: 'ซ่อมแซม & บำรุงรักษา',
      cleaning_waste: 'ทำความสะอาด & เก็บขยะ',
      security_cctv: 'ความปลอดภัย & CCTV',
      internet_network: 'อินเทอร์เน็ต WiFi',
      supplies: 'วัสดุอุปกรณ์',
      tax_insurance: 'ภาษี & ประกันภัย',
      staff_salary: 'เงินเดือนพนักงาน/ผู้ดูแล',
      other: 'อื่นๆ'
    };

    return {
      'ลำดับ': idx + 1,
      'วันที่': exp.date,
      'รายการค่าใช้จ่าย': exp.title,
      'หมวดหมู่': catLabels[exp.category] || exp.category,
      'จำนวนเงิน (บาท)': exp.amount,
      'อาคาร': exp.building || 'ทุกอาคาร/ส่วนกลาง',
      'ผู้บันทึก': exp.recordedBy || '-',
      'หมายเหตุ': exp.notes || '-',
    };
  });

  // Create Workbook
  const workbook = XLSX.utils.book_new();

  // Create Worksheets from JSON data
  const wsRooms = XLSX.utils.json_to_sheet(finalRoomRows);
  const wsOverview = XLSX.utils.json_to_sheet(financialOverviewRows);
  const wsBuildings = XLSX.utils.json_to_sheet(buildingBreakdownRows);

  // Set Column Widths for Room Sheet (Readable spacing for Thai text)
  wsRooms['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 16 }, // อาคาร
    { wch: 12 }, // เลขห้อง
    { wch: 8 },  // ชั้น
    { wch: 14 }, // สถานะห้อง
    { wch: 22 }, // ชื่อผู้เช่า
    { wch: 16 }, // เบอร์โทรศัพท์
    { wch: 16 }, // ค่าเช่าห้อง (บาท)
    { wch: 20 }, // วิธีคิดค่าน้ำ
    { wch: 16 }, // มิเตอร์น้ำก่อนหน้า
    { wch: 16 }, // มิเตอร์น้ำปัจจุบัน
    { wch: 14 }, // จำนวนหน่วยน้ำ
    { wch: 16 }, // ค่าน้ำประปา (บาท)
    { wch: 16 }, // มิเตอร์ไฟก่อนหน้า
    { wch: 16 }, // มิเตอร์ไฟปัจจุบัน
    { wch: 14 }, // จำนวนหน่วยไฟ
    { wch: 16 }, // ค่าไฟฟ้า (บาท)
    { wch: 18 }, // ค่าขยะ/ส่วนกลาง (บาท)
    { wch: 18 }, // ค่าอินเทอร์เน็ต (บาท)
    { wch: 18 }, // ค่าใช้จ่ายอื่นๆ (บาท)
    { wch: 20 }, // ยอดยกมา/ค่าปรับ (บาท)
    { wch: 18 }, // ยอดรวมสุทธิ (บาท)
    { wch: 16 }, // สถานะการจดมิเตอร์
    { wch: 16 }, // สถานะการชำระเงิน
    { wch: 16 }, // วันที่ชำระเงิน
    { wch: 16 }, // วิธีชำระเงิน
  ];

  // Set Column Widths for Overview Sheet
  wsOverview['!cols'] = [
    { wch: 45 }, // หัวข้อสรุปภาพรวม
    { wch: 40 }, // รายละเอียด
  ];

  // Set Column Widths for Building Sheet
  wsBuildings['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 20 }, // ชื่ออาคาร
    { wch: 16 }, // จำนวนห้องทั้งหมด
    { wch: 14 }, // ห้องมีผู้เช่า
    { wch: 12 }, // ห้องว่าง
    { wch: 18 }, // จดมิเตอร์แล้ว
    { wch: 18 }, // ยอดรวมทั้งหมด (บาท)
    { wch: 16 }, // ชำระแล้ว (บาท)
    { wch: 16 }, // ค้างชำระ (บาท)
    { wch: 14 }, // หน่วยน้ำรวม
    { wch: 16 }, // ค่าน้ำรวม (บาท)
    { wch: 14 }, // หน่วยไฟรวม
    { wch: 16 }, // ค่าไฟรวม (บาท)
  ];

  // Append Sheets to Workbook
  XLSX.utils.book_append_sheet(workbook, wsRooms, 'รายการห้องพักและมิเตอร์');
  XLSX.utils.book_append_sheet(workbook, wsOverview, 'สรุปภาพรวมการเงิน');
  XLSX.utils.book_append_sheet(workbook, wsBuildings, 'สรุปแยกรายอาคาร');

  if (expenseRows.length > 0) {
    const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
    wsExpenses['!cols'] = [
      { wch: 8 },  // ลำดับ
      { wch: 14 }, // วันที่
      { wch: 26 }, // รายการค่าใช้จ่าย
      { wch: 22 }, // หมวดหมู่
      { wch: 16 }, // จำนวนเงิน (บาท)
      { wch: 18 }, // อาคาร
      { wch: 16 }, // ผู้บันทึก
      { wch: 24 }, // หมายเหตุ
    ];
    XLSX.utils.book_append_sheet(workbook, wsExpenses, 'รายการค่าใช้จ่ายหอพัก');
  }

  // Generate clean filename
  const cleanPropertyName = (config.propertyName || 'Dormitory').replace(/[/\\?%*:|"<>]/g, '-');
  const filename = `${cleanPropertyName}_รายงานประจำเดือน_${activeMonth}.xlsx`;

  // Write file - triggers native browser download
  XLSX.writeFile(workbook, filename, { compression: true });
}

/**
 * Export rooms data as a UTF-8 CSV with BOM (\uFEFF)
 * This guarantees that Microsoft Excel, Apple Numbers, and Notepad open Thai text perfectly without encoding errors.
 */
export function exportRoomsToCsv({
  rooms,
  activeMonth,
  config,
}: {
  rooms: RoomRecord[];
  activeMonth: string;
  config: LandlordConfig;
}): void {
  const getRoomEffectiveTotal = (r: RoomRecord) => {
    if (r.grandTotal !== undefined && r.grandTotal !== null) return r.grandTotal;
    const liability = (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || config.lateFeePerDayDefault || 100)));
    return (r.total || 0) + liability;
  };

  const headers = [
    'ลำดับ',
    'อาคาร',
    'เลขห้อง',
    'สถานะห้อง',
    'ชื่อผู้เช่า',
    'เบอร์โทรศัพท์',
    'ค่าเช่าห้อง (บาท)',
    'วิธีคิดค่าน้ำ',
    'มิเตอร์น้ำก่อน',
    'มิเตอร์น้ำหลัง',
    'หน่วยน้ำ',
    'ค่าน้ำ (บาท)',
    'มิเตอร์ไฟก่อน',
    'มิเตอร์ไฟหลัง',
    'หน่วยไฟ',
    'ค่าไฟ (บาท)',
    'ค่าส่วนกลาง/ขยะ',
    'ยอดค้าง/ปรับ',
    'ยอดรวมสุทธิ (บาท)',
    'สถานะมิเตอร์',
    'สถานะชำระเงิน'
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = rooms.map((r, idx) => {
    const isOccupied = r.occupancyStatus === 'occupied' || (r.occupancyStatus === undefined && r.isOccupied);
    let occupancyText = 'มีผู้เช่า';
    if (r.occupancyStatus === 'vacant' || (!isOccupied && !r.occupancyStatus)) occupancyText = 'ห้องว่าง';
    if (r.occupancyStatus === 'under_renovation') occupancyText = 'ปรับปรุง';

    const waterCalcTypeText = r.waterCalcType === 'per_person' ? `เหมาจ่าย (${r.occupants || 1}คน)` : 'ตามมิเตอร์';
    const liability = (r.previousBalance || 0) + (r.lateFeeTotal || ((r.lateDays || 0) * (r.lateFeePerDay || config.lateFeePerDayDefault || 100)));
    const grandTotal = getRoomEffectiveTotal(r);

    return [
      idx + 1,
      escapeCsv(r.building),
      escapeCsv(r.roomNo),
      escapeCsv(occupancyText),
      escapeCsv(r.tenantName || '-'),
      escapeCsv(r.phone || '-'),
      r.rent || 0,
      escapeCsv(waterCalcTypeText),
      r.waterPrev || 0,
      r.waterCurr || 0,
      r.waterUnits || 0,
      r.waterCost || 0,
      r.elecPrev || 0,
      r.elecCurr || 0,
      r.elecUnits || 0,
      r.elecCost || 0,
      r.otherFees || 0,
      liability,
      grandTotal,
      escapeCsv(r.hasMeterUpdated ? 'บันทึกแล้ว' : 'รอกรอก'),
      escapeCsv(r.isPaid ? 'ชำระแล้ว' : 'ค้างชำระ')
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) forces Excel on Windows to read Thai text correctly
  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanPropertyName = (config.propertyName || 'Dormitory').replace(/[/\\?%*:|"<>]/g, '-');
  link.setAttribute('download', `${cleanPropertyName}_ตารางห้องพัก_${activeMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
