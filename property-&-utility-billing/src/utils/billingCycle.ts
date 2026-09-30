import { RoomRecord, LandlordConfig } from '../types';

export interface MonthInfo {
  key: string; // e.g. "2026-08" or legacy "08 ส.ค."
  year: number; // e.g. 2026
  yearThai: number; // e.g. 2569
  month: number; // 1 - 12
  monthNameShort: string; // e.g. "ส.ค."
  monthNameFull: string; // e.g. "สิงหาคม"
  displayName: string; // e.g. "08 ส.ค. 2569 (2026)"
  shortDisplay: string; // e.g. "08 ส.ค."
}

export const THAI_MONTH_NAMES_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_MONTH_NAMES_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Standardize month string into year and month number.
 * Supports "2026-10", "10 ต.ค.", "10 ต.ค. 2569", "2026-11", "11 พ.ย.", etc.
 */
export function parseMonthKey(key: string): { year: number; month: number } {
  if (!key) {
    return { year: 2026, month: 10 };
  }

  // Check format "YYYY-MM"
  if (/^\d{4}-\d{1,2}$/.test(key)) {
    const [y, m] = key.split('-').map(Number);
    return { year: y, month: m };
  }

  // Check format "MM ชื่อเดือน" or "MM ชื่อเดือน YYYY"
  const parts = key.trim().split(/\s+/);
  let monthNum = 10;
  let yearNum = 2026;

  // Try extracting month number
  const firstNum = parseInt(parts[0], 10);
  if (!isNaN(firstNum) && firstNum >= 1 && firstNum <= 12) {
    monthNum = firstNum;
  } else {
    // Search Thai month name
    const foundIdx = THAI_MONTH_NAMES_SHORT.findIndex(name => key.includes(name));
    if (foundIdx !== -1) {
      monthNum = foundIdx + 1;
    }
  }

  // Check if year is present in parts
  if (parts.length >= 3) {
    const yr = parseInt(parts[2], 10);
    if (!isNaN(yr)) {
      yearNum = yr > 2400 ? yr - 543 : yr;
    }
  }

  return { year: yearNum, month: monthNum };
}

/**
 * Standardizes month key into the canonical representation:
 * For 2026 (the master working year), standard format is "10 ต.ค.", "11 พ.ย.", "12 ธ.ค." etc.
 * matching AVAILABLE_MONTHS, expenses, and all UI views.
 * For other years, e.g. 2027 -> "01 ม.ค. 2570".
 */
export function formatMonthKey(year: number, month: number): string {
  if (year === 2026) {
    return formatLegacyMonthKey(month);
  }
  const m = month.toString().padStart(2, '0');
  const shortThai = THAI_MONTH_NAMES_SHORT[month - 1] || '';
  return `${m} ${shortThai} ${year + 543}`;
}

/**
 * Legacy & standard 2026 key representation matching existing mockData keys e.g. "10 ต.ค."
 */
export function formatLegacyMonthKey(month: number): string {
  const m = month.toString().padStart(2, '0');
  return `${m} ${THAI_MONTH_NAMES_SHORT[month - 1]}`;
}

/**
 * Normalizes any month key string into canonical format (e.g. "2026-11" -> "11 พ.ย.")
 */
export function normalizeMonthKey(key: string): string {
  if (!key) return '10 ต.ค.';
  const { year, month } = parseMonthKey(key);
  return formatMonthKey(year, month);
}

/**
 * Generate full month information object
 */
export function getMonthInfo(keyOrYear: string | number, monthOpt?: number): MonthInfo {
  let year = 2026;
  let month = 10;

  if (typeof keyOrYear === 'number') {
    year = keyOrYear;
    month = monthOpt || 1;
  } else {
    const parsed = parseMonthKey(keyOrYear);
    year = parsed.year;
    month = parsed.month;
  }

  // Bound month
  if (month < 1) month = 1;
  if (month > 12) month = 12;

  const mStr = month.toString().padStart(2, '0');
  const monthNameShort = THAI_MONTH_NAMES_SHORT[month - 1];
  const monthNameFull = THAI_MONTH_NAMES_FULL[month - 1];
  const yearThai = year + 543;

  return {
    key: formatMonthKey(year, month),
    year,
    yearThai,
    month,
    monthNameShort,
    monthNameFull,
    displayName: `${mStr} ${monthNameShort} ${yearThai} (${year})`,
    shortDisplay: `${mStr} ${monthNameShort}`,
  };
}

/**
 * Get Previous Month key (e.g. for "10 ต.ค." -> "09 ก.ย."; for "01 ม.ค." -> "12 ธ.ค. 2568")
 */
export function getPreviousMonthKey(currentKey: string): string {
  const { year, month } = parseMonthKey(currentKey);
  if (month === 1) {
    return formatMonthKey(year - 1, 12);
  }
  return formatMonthKey(year, month - 1);
}

/**
 * Get Next Month key (e.g. for "10 ต.ค." -> "11 พ.ย."; for "12 ธ.ค." -> "01 ม.ค. 2570")
 */
export function getNextMonthKey(currentKey: string): string {
  const { year, month } = parseMonthKey(currentKey);
  if (month === 12) {
    return formatMonthKey(year + 1, 1);
  }
  return formatMonthKey(year, month + 1);
}

/**
 * Generate a sequence of months for a given year (1 to 12)
 */
export function getMonthsForYear(year: number): MonthInfo[] {
  const list: MonthInfo[] = [];
  for (let m = 1; m <= 12; m++) {
    list.push(getMonthInfo(year, m));
  }
  return list;
}

/**
 * Generate list of available selectable years (Thai and Western)
 */
export function getSelectableYears(baseYear: number = 2026): number[] {
  const start = 2023; // พ.ศ. 2566
  const end = 2035;   // พ.ศ. 2578
  const years: number[] = [];
  for (let y = start; y <= end; y++) {
    years.push(y);
  }
  return years;
}

/**
 * Changes only the year for a given monthKey, preserving the month index (1-12)
 */
export function setYearForMonthKey(currentKey: string, targetYear: number): string {
  const { month } = parseMonthKey(currentKey);
  return formatMonthKey(targetYear, month);
}

/**
 * Changes only the month for a given monthKey, preserving the year
 */
export function setMonthForMonthKey(currentKey: string, targetMonth: number): string {
  const { year } = parseMonthKey(currentKey);
  return formatMonthKey(year, targetMonth);
}


/**
 * Calculate effective total for a room (including rent, water, elec, other fees + liabilities/arrears)
 */
export function calculateRoomEffectiveTotal(
  r: RoomRecord,
  defaultLateFeePerDay: number = 100
): number {
  if (r.grandTotal !== undefined && r.grandTotal !== null && r.grandTotal > 0) {
    return r.grandTotal;
  }
  const rent = r.isOccupied ? (r.rent || 0) : 0;
  const waterCost = r.isOccupied ? (r.waterCost || 0) : 0;
  const elecCost = r.isOccupied ? (r.elecCost || 0) : 0;
  const otherFees = r.isOccupied ? (r.otherFees || 0) : 0;
  const subtotal = rent + waterCost + elecCost + otherFees;

  const prevBalance = r.previousBalance || 0;
  const lateFeeTotal = r.lateFeeTotal !== undefined 
    ? r.lateFeeTotal 
    : ((r.lateDays || 0) * (r.lateFeePerDay || defaultLateFeePerDay));

  return subtotal + prevBalance + lateFeeTotal;
}

/**
 * Dynamically initialize a new month's room list based on previous month's data or template
 */
export function initializeNewMonthRooms(
  targetKey: string,
  allRoomsByMonth: Record<string, RoomRecord[]>,
  baseRoomTemplates: RoomRecord[] | null,
  config: LandlordConfig
): RoomRecord[] {
  const { year, month } = parseMonthKey(targetKey);
  const prevKey = getPreviousMonthKey(targetKey);
  const legacyPrevKey = formatLegacyMonthKey(parseMonthKey(prevKey).month);

  // 1. If baseRoomTemplates was passed in and has rooms (>= 78), ALWAYS prioritize it as the direct predecessor
  // 2. Otherwise lookup previous month via canonical key (prevKey) or legacy key (legacyPrevKey)
  // 3. Fallback to October 2026 master dataset or any valid 78-room month
  const prevRooms: RoomRecord[] | undefined = 
    (baseRoomTemplates && baseRoomTemplates.length >= 78 ? baseRoomTemplates : undefined) ||
    allRoomsByMonth[prevKey] || 
    allRoomsByMonth[legacyPrevKey] || 
    allRoomsByMonth['10 ต.ค.'] ||
    Object.values(allRoomsByMonth).find(list => list && list.length >= 78) ||
    baseRoomTemplates ||
    undefined;

  const templateList = prevRooms && prevRooms.length > 0 ? prevRooms : (baseRoomTemplates || []);

  return templateList.map((prevRoom) => {
    const isOccupied = prevRoom.occupancyStatus === 'occupied' || (prevRoom.occupancyStatus === undefined && prevRoom.isOccupied);
    
    // Carry over water and electricity readings:
    // The previous month's ending reading (waterCurr) becomes this month's starting reading (waterPrev)
    const waterPrev = (prevRoom.waterCurr && prevRoom.waterCurr > 0) 
      ? prevRoom.waterCurr 
      : (prevRoom.waterPrev || 0);

    const elecPrev = (prevRoom.elecCurr && prevRoom.elecCurr > 0)
      ? prevRoom.elecCurr
      : (prevRoom.elecPrev || 0);

    // Arrears Carryover (ช่องค้างจ่าย):
    // By default ("ไม่มีค้างจ่ายเป็น default"), carriedArrears is 0 unless carryOverArrearsDefault is explicitly true
    let carriedArrears = 0;
    if (config?.carryOverArrearsDefault && isOccupied && !prevRoom.isPaid) {
      carriedArrears = calculateRoomEffectiveTotal(prevRoom, config.lateFeePerDayDefault || 100);
    }

    const waterRate = prevRoom.waterRate || (prevRoom.building?.includes('โรงงาน') ? 20 : 18);
    const elecRate = prevRoom.elecRate || (prevRoom.building?.includes('โรงงาน') ? 8.5 : 8);
    const waterPerPersonRate = prevRoom.waterPerPersonRate || config.waterPerPersonRateDefault || 100;
    const occupants = prevRoom.occupants || (isOccupied ? 1 : 0);

    let waterCost = 0;
    if (isOccupied && prevRoom.waterCalcType === 'per_person') {
      waterCost = occupants * waterPerPersonRate;
    }

    const rent = isOccupied ? prevRoom.rent : 0;
    const otherFees = 0;
    const total = rent + waterCost + otherFees;
    const liabilityTotal = carriedArrears;
    const grandTotal = total + liabilityTotal;

    return {
      ...prevRoom,
      // Tenant name and details follow over from previous month
      tenantName: prevRoom.tenantName,
      phone: prevRoom.phone || '',
      occupants,
      occupancyStatus: prevRoom.occupancyStatus,
      isOccupied,
      rent,
      waterCalcType: prevRoom.waterCalcType,
      waterRate,
      waterPerPersonRate,
      waterPrev,
      waterCurr: 0,
      waterUnits: 0,
      waterCost,
      elecRate,
      elecPrev,
      elecCurr: 0,
      elecUnits: 0,
      elecCost: 0,
      otherFees: 0,
      previousBalance: carriedArrears,
      lateDays: 0,
      lateFeePerDay: config.lateFeePerDayDefault || 100,
      lateFeeTotal: 0,
      liabilityTotal,
      total,
      grandTotal,
      isPaid: false,
      paymentDate: undefined,
      hasMeterUpdated: false,
      meterUpdatedDate: undefined,
      isTenantCustomized: false, // In new month, not customized until user edits it
      notes: isOccupied 
        ? (carriedArrears > 0 
            ? `ยอดยกมาจากงวดก่อนหน้า (ค้างจ่าย ฿${carriedArrears.toLocaleString()})`
            : 'รอกดบันทึกมิเตอร์')
        : (prevRoom.occupancyStatus === 'vacant' ? 'ห้องว่าง' : 'ปิดปรับปรุง'),
    };
  });
}
