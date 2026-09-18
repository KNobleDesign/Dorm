import { LandlordConfig, BuildingProfile, RoomRecord } from '../types';

export interface ThaiBankInfo {
  code: string;
  name: string;
  shortName: string;
  color: string;
  bgBadge: string;
  borderBadge: string;
  textBadge: string;
}

export const POPULAR_THAI_BANKS: ThaiBankInfo[] = [
  {
    code: 'KBANK',
    name: 'ธนาคารกสิกรไทย (KBANK)',
    shortName: 'กสิกรไทย',
    color: '#138f2d',
    bgBadge: 'bg-emerald-50',
    borderBadge: 'border-emerald-300',
    textBadge: 'text-emerald-800',
  },
  {
    code: 'SCB',
    name: 'ธนาคารไทยพาณิชย์ (SCB)',
    shortName: 'ไทยพาณิชย์',
    color: '#4e2a84',
    bgBadge: 'bg-purple-50',
    borderBadge: 'border-purple-300',
    textBadge: 'text-purple-800',
  },
  {
    code: 'BBL',
    name: 'ธนาคารกรุงเทพ (BBL)',
    shortName: 'กรุงเทพ',
    color: '#1e4598',
    bgBadge: 'bg-blue-50',
    borderBadge: 'border-blue-300',
    textBadge: 'text-blue-800',
  },
  {
    code: 'KTB',
    name: 'ธนาคารกรุงไทย (KTB)',
    shortName: 'กรุงไทย',
    color: '#00a5e5',
    bgBadge: 'bg-sky-50',
    borderBadge: 'border-sky-300',
    textBadge: 'text-sky-800',
  },
  {
    code: 'BAY',
    name: 'ธนาคารกรุงศรีอยุธยา (BAY)',
    shortName: 'กรุงศรี',
    color: '#fdb913',
    bgBadge: 'bg-amber-50',
    borderBadge: 'border-amber-300',
    textBadge: 'text-amber-900',
  },
  {
    code: 'TTB',
    name: 'ธนาคารทหารไทยธนชาต (TTB)',
    shortName: 'ทีทีบี',
    color: '#002d62',
    bgBadge: 'bg-indigo-50',
    borderBadge: 'border-indigo-300',
    textBadge: 'text-indigo-900',
  },
  {
    code: 'GSB',
    name: 'ธนาคารออมสิน (GSB)',
    shortName: 'ออมสิน',
    color: '#eb1985',
    bgBadge: 'bg-pink-50',
    borderBadge: 'border-pink-300',
    textBadge: 'text-pink-900',
  },
  {
    code: 'BAAC',
    name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)',
    shortName: 'ธ.ก.ส.',
    color: '#006633',
    bgBadge: 'bg-teal-50',
    borderBadge: 'border-teal-300',
    textBadge: 'text-teal-800',
  },
];

export interface ResolvedPaymentAccount {
  accountType: 'main' | 'house' | 'custom';
  accountLabel: string;
  badgeText: string;
  bankName: string;
  bankAccount: string;
  promptPayId: string;
  accountName: string;
  isHouseAccount: boolean;
  notes?: string;
}

/**
 * Clean strings like "(KBANK)" or "(ออมทรัพย์)" from displayed names
 */
export function cleanBankDetails(val?: string): string {
  if (!val) return '';
  return val.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Check if building or room text represents a rental house
 */
export function isRentalHouse(text?: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    text.includes('บ้าน') ||
    text.includes('บ้านเช่า') ||
    lower.includes('house') ||
    lower.includes('home') ||
    lower.includes('villa')
  );
}

/**
 * Resolves the active bank account for a given room record.
 * Handles the full loop: Default Landlord vs House Rental vs Custom.
 */
export function getPaymentAccountForRoom(
  room: RoomRecord,
  config: LandlordConfig,
  buildings?: BuildingProfile[]
): ResolvedPaymentAccount {
  // 1. Room-level custom bank
  if (room.paymentAccountOption === 'custom' && room.customBankAccount) {
    const customBank = cleanBankDetails(room.customBankName || config.bankName || 'ธนาคาร');
    const customAcc = cleanBankDetails(room.customBankAccount || config.bankAccount || '');
    return {
      accountType: 'custom',
      accountLabel: `บัญชีเฉพาะ (${customBank})`,
      badgeText: 'บัญชีเฉพาะห้อง',
      bankName: customBank,
      bankAccount: customAcc,
      promptPayId: room.customPromptPayId || config.promptPayId || '',
      accountName: room.customAccountName || config.landlordName || '',
      isHouseAccount: false,
    };
  }

  // 2. Identify building profile
  const buildingProfile = buildings?.find(
    (b) => b.id === room.buildingId || b.name === room.building
  );

  // Check if house account should be used
  const isRoomHouseExplicit = room.paymentAccountOption === 'house';
  const isRoomMainExplicit = room.paymentAccountOption === 'default';

  const isBldHouseExplicit = buildingProfile?.paymentAccountOption === 'house';
  const isBldMainExplicit = buildingProfile?.paymentAccountOption === 'default';

  const isHouseByContext =
    isRentalHouse(room.building) ||
    isRentalHouse(buildingProfile?.name) ||
    isRentalHouse(room.roomNo);

  const shouldUseHouseAccount =
    isRoomHouseExplicit ||
    (!isRoomMainExplicit && isBldHouseExplicit) ||
    (!isRoomMainExplicit && !isBldMainExplicit && isHouseByContext);

  // If house account is selected and not disabled
  if (shouldUseHouseAccount && config.houseAccountEnabled !== false) {
    const rawBank = config.houseBankName || 'ธนาคารไทยพาณิชย์ (SCB)';
    const rawAcc = config.houseBankAccount || '408-2-88910-1';
    const rawPp = config.housePromptPayId || '0840411115';
    const rawName = config.houseAccountName || 'คุณพลอย (Ploy)';
    const label = config.houseAccountLabel || 'บัญชีบ้านเช่า';

    return {
      accountType: 'house',
      accountLabel: label,
      badgeText: '🏠 บัญชีบ้านเช่า',
      bankName: cleanBankDetails(rawBank),
      bankAccount: cleanBankDetails(rawAcc),
      promptPayId: rawPp.trim(),
      accountName: rawName.trim(),
      isHouseAccount: true,
      notes: config.houseAccountNotes || 'บัญชีรับเงินเฉพาะสำหรับบ้านเช่า',
    };
  }

  // 3. Main Landlord Account (Default)
  const mainBank = cleanBankDetails(config.bankName || 'ธนาคารกสิกรไทย');
  const mainAcc = cleanBankDetails(config.bankAccount || '743-2-89012-3');
  const mainPp = (config.promptPayId || '0819876543').trim();
  const mainName = (config.landlordName || 'คุณประดิษฐ์ เจริญสุขสิริ').trim();

  return {
    accountType: 'main',
    accountLabel: 'บัญชีหลักหอพัก',
    badgeText: '👑 บัญชีหลัก',
    bankName: mainBank,
    bankAccount: mainAcc,
    promptPayId: mainPp,
    accountName: mainName,
    isHouseAccount: false,
  };
}

/**
 * Resolves the payment account for an entire building profile or building name
 */
export function getPaymentAccountForBuilding(
  building: BuildingProfile | string | undefined,
  config: LandlordConfig,
  buildings?: BuildingProfile[]
): ResolvedPaymentAccount {
  let profile: BuildingProfile | undefined;
  let bldName = '';

  if (typeof building === 'string') {
    bldName = building;
    profile = buildings?.find((b) => b.name === building || b.id === building);
  } else if (building) {
    profile = building;
    bldName = building.name;
  }

  const isBldHouseExplicit = profile?.paymentAccountOption === 'house';
  const isBldMainExplicit = profile?.paymentAccountOption === 'default';
  const isHouseByContext = isRentalHouse(bldName);

  const shouldUseHouseAccount =
    isBldHouseExplicit || (!isBldMainExplicit && isHouseByContext);

  if (shouldUseHouseAccount && config.houseAccountEnabled !== false) {
    const rawBank = config.houseBankName || 'ธนาคารไทยพาณิชย์ (SCB)';
    const rawAcc = config.houseBankAccount || '408-2-88910-1';
    const rawPp = config.housePromptPayId || '0840411115';
    const rawName = config.houseAccountName || 'คุณพลอย (Ploy)';
    const label = config.houseAccountLabel || 'บัญชีบ้านเช่า';

    return {
      accountType: 'house',
      accountLabel: label,
      badgeText: '🏠 บัญชีบ้านเช่า',
      bankName: cleanBankDetails(rawBank),
      bankAccount: cleanBankDetails(rawAcc),
      promptPayId: rawPp.trim(),
      accountName: rawName.trim(),
      isHouseAccount: true,
      notes: config.houseAccountNotes || 'บัญชีรับเงินเฉพาะสำหรับบ้านเช่า',
    };
  }

  const mainBank = cleanBankDetails(config.bankName || 'ธนาคารกสิกรไทย');
  const mainAcc = cleanBankDetails(config.bankAccount || '743-2-89012-3');
  const mainPp = (config.promptPayId || '0819876543').trim();
  const mainName = (config.landlordName || 'คุณประดิษฐ์ เจริญสุขสิริ').trim();

  return {
    accountType: 'main',
    accountLabel: 'บัญชีหลักหอพัก',
    badgeText: '👑 บัญชีหลัก',
    bankName: mainBank,
    bankAccount: mainAcc,
    promptPayId: mainPp,
    accountName: mainName,
    isHouseAccount: false,
  };
}
