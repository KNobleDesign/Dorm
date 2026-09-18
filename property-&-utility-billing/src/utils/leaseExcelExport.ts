import * as XLSX from 'xlsx';
import { LeaseAgreementData } from '../types';

/**
 * Format date string (YYYY-MM-DD) to Thai date text
 */
function formatThaiDateFull(dateStr: string): string {
  if (!dateStr) return '........................................';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${day} ${month} พ.ศ. ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Export Lease Agreement Data to a formatted Microsoft Excel (.xlsx) file
 * with pre-configured page setup (A4 Portrait, Margins, Print Area).
 */
export function exportLeaseAgreementToExcel(data: LeaseAgreementData, fileName?: string): void {
  const wb = XLSX.utils.book_new();

  const agreementDateTh = formatThaiDateFull(data.agreementDate);
  const leaseStartDateTh = formatThaiDateFull(data.leaseStartDate);
  const leaseEndDateTh = formatThaiDateFull(data.leaseEndDate);
  const totalPaid = (data.securityDeposit || 0) + (data.advanceRent || 0);

  // 1. Prepare Rows for Contract Sheet
  const contractRows: (string | number)[][] = [
    ['สัญญาเช่าห้องพัก / RESIDENTIAL LEASE AGREEMENT'],
    [''],
    ['สัญญาฉบับนี้ทำขึ้น ณ / This Agreement is made at:', data.madeAt || ''],
    ['วันที่ / Date:', agreementDateTh, '', 'พ.ศ. / Year:', data.agreementDate ? new Date(data.agreementDate).getFullYear() + 543 : ''],
    [''],
    ['สัญญาฉบับนี้ทำขึ้นระหว่าง / This Agreement is made by and between:'],
    ['ผู้ให้เช่า (Lessor):', data.lessorName || ''],
    ['ที่อยู่ / Address:', data.lessorAddress || '', '', 'เบอร์โทรศัพท์ / Phone:', data.lessorPhone || ''],
    ['(ซึ่งต่อไปในสัญญานี้จะเรียกว่า "ผู้ให้เช่า" / hereinafter referred to as the "Lessor") ฝ่ายหนึ่ง กับ / of the one part, and'],
    [''],
    ['ผู้เช่า (Lessee):', data.lesseeName || ''],
    ['เลขประจำตัวประชาชน / Passport/ID No.:', data.lesseeIdCard || ''],
    ['ที่อยู่ / Address:', data.lesseeAddress || '', '', 'เบอร์โทรศัพท์ / Phone:', data.lesseePhone || ''],
    ['(ซึ่งต่อไปในสัญญานี้จะเรียกว่า "ผู้เช่า" / hereinafter referred to as the "Lessee") อีกฝ่ายหนึ่ง / of the other part.'],
    [''],
    ['คู่สัญญาทั้งสองฝ่ายตกลงทำสัญญากันโดยมีข้อความและเงื่อนไขดังต่อไปนี้:'],
    ['Both parties agree to enter into this Agreement under the following terms and conditions:'],
    [''],
    ['ข้อ 1. ทรัพย์สินที่เช่าและวัตถุประสงค์ / Leased Property and Purpose'],
    ['ผู้ให้เช่าตกลงให้เช่า และผู้เช่าตกลงเช่าห้องพักเลขที่:', data.roomNo || '', 'หอพัก / อาคาร:', data.buildingName || ''],
    ['ตั้งอยู่เลขที่:', data.propertyAddressNo || '', 'ซอย:', data.alley || '', 'ถนน:', data.road || ''],
    ['ตำบล/แขวง:', data.subdistrict || '', 'อำเภอ/เขต:', data.district || '', 'จังหวัด:', data.province || ''],
    ['วัตถุประสงค์:', 'เพื่อใช้เป็นที่อยู่อาศัยเท่านั้น ห้ามนำไปใช้เพื่อการค้า ธุรกิจ หรือการกระทำอื่นใดที่ผิดกฎหมาย'],
    ['The Leased Property shall be used solely for residential purposes, and shall not be used for any commercial, illegal, or unlawful purposes.'],
    [''],
    ['ข้อ 2. ระยะเวลาการเช่า / Lease Term'],
    ['กำหนดระยะเวลาขั้นต่ำ:', `${data.minimumYear || 1} ปี / year(s)`],
    ['เริ่มต้นตั้งแต่วันที่:', leaseStartDateTh, 'ถึงวันที่:', leaseEndDateTh],
    ['The term of this lease commences on and expires according to the dates specified above.'],
    [''],
    ['ข้อ 3. ค่าเช่าและการชำระเงิน / Rental Fee and Payment Terms'],
    ['3.1 ค่าเช่าห้องพักเดือนละ (บาท):', data.monthlyRent || 0, 'THB / month'],
    ['3.2 วันครบกำหนดชำระ:', `ภายในวันที่ ${data.paymentDueDay || 5} ของทุกเดือน (by the ${data.paymentDueDay || 5}th of each month)`],
    ['ธนาคาร (Bank):', data.bankName || '', 'เลขที่บัญชี (A/C No.):', data.bankAccountNo || ''],
    ['ชื่อบัญชี (Account Name):', data.bankAccountName || ''],
    ['3.3 ค่าปรับกรณีชำระล่าช้าเกิน 1 วัน:', `วันละ ${data.latePenaltyPerDay || 100} บาท (THB ${data.latePenaltyPerDay || 100} per day until settlement)`],
    [''],
    ['ข้อ 4. เงินประกันความเสียหายและค่าเช่าล่วงหน้า / Security Deposit and Advance Rent'],
    ['4.1 เงินประกันความเสียหาย (1 เดือน):', data.securityDeposit || 0, 'บาท (THB)'],
    ['4.2 ค่าเช่าล่วงหน้า (1 เดือน):', data.advanceRent || 0, 'บาท (THB)'],
    ['รวมยอดชำระทั้งสิ้น ณ วันทำสัญญา:', totalPaid, 'บาท (THB)'],
    ['เงื่อนไขเงินประกัน: คืนให้หลังจากสัญญาครบกำหนด ส่งมอบห้องพักในสภาพเรียบร้อย ภายใน:', `${data.refundDaysAfterExit || 15} วันทำการ / business days`],
    ['หากย้ายออกก่อนกำหนด 1 ปี หรือผิดสัญญา ผู้ให้เช่ามีสิทธิ์ริบเงินประกันความเสียหายเต็มจำนวนทันที'],
    [''],
    ['ข้อ 5. ค่าสาธารณูปโภค / Utilities'],
    ['5.1 ค่าน้ำประปา (Water Supply):', `หน่วยละ ${data.waterRatePerUnit || 28} บาท / THB ${data.waterRatePerUnit || 28} per unit`],
    ['5.2 ค่าไฟฟ้า (Electricity):', `หน่วยละ ${data.electricityRatePerUnit || 8} บาท / THB ${data.electricityRatePerUnit || 8} per unit`],
    [''],
    ['ข้อ 6. การดูแลรักษาและข้อห้าม / Maintenance and Restrictions'],
    ['6.1 ดูแลรักษาห้องและเฟอร์นิเจอร์ให้อยู่ในสภาพดี ห้ามเจาะ ดัดแปลง ทาสี หรือต่อเติมโดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษร'],
    ['6.2 ห้ามนำวัตถุไวไฟ สารเคมีอันตราย หรือสิ่งผิดกฎหมายเข้ามาในห้องพัก'],
    ['6.3 ห้ามเลี้ยงสัตว์ทุกชนิด และห้ามส่งเสียงดังรบกวนผู้อื่น (No pets & loud noise prohibited)'],
    ['6.4 ห้ามนำห้องพักไปให้เช่าช่วง หรือโอนสิทธิ์การเช่าให้บุคคลอื่น (Subletting strictly prohibited)'],
    [''],
    ['ข้อ 7. การตรวจสภาพห้องพัก / Inspection'],
    ['ผู้ให้เช่าหรือตัวแทนมีสิทธิ์เข้าตรวจสภาพห้องพักได้ โดยแจ้งล่วงหน้าไม่น้อยกว่า 24 ชั่วโมง เว้นแต่กรณีฉุกเฉิน'],
    [''],
    ['ข้อ 8. การบอกเลิกสัญญาและการส่งมอบห้องคืน / Termination and Vacating'],
    ['8.1 ค้างชำระค่าเช่าหรือค่าสาธารณูปโภคเกินกว่า:', `${data.terminationArrearsDays || 15} วัน ผู้ให้เช่ามีสิทธิ์บอกเลิกสัญญา ตัดระบบน้ำ/ไฟ และเข้าครอบครองห้องพัก`],
    ['8.2 เมื่อสัญญาเลิกกัน ผู้เช่าต้องขนย้ายทรัพย์สินออกภายใน:', `${data.vacateGraceDays || 7} วัน หากพ้นกำหนด ยินยอมให้ขนย้ายไปเก็บรักษาโดยผู้เช่ารับผิดชอบค่าใช้จ่าย`],
    [''],
    ['สัญญานี้ทำขึ้นเป็นสองฉบับ มีข้อความตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยละเอียดแล้ว จึงได้ลงลายมือชื่อไว้เป็นหลักฐาน'],
    [''],
    ['ลงชื่อ / Signed:', '............................................................', 'ผู้ให้เช่า / Lessor', `(${data.lessorSignName || data.lessorName || 'ผู้ให้เช่า'})`],
    ['ลงชื่อ / Signed:', '............................................................', 'ผู้เช่า / Lessee', `(${data.lesseeSignName || data.lesseeName || 'ผู้เช่า'})`],
    ['ลงชื่อ / Signed:', '............................................................', 'พยาน / Witness', `(${data.witness1Name || 'พยาน'})`],
    ['ลงชื่อ / Signed:', '............................................................', 'พยาน / Witness', `(${data.witness2Name || 'พยาน'})`],
  ];

  const wsContract = XLSX.utils.aoa_to_sheet(contractRows);

  // Column width setup for contract sheet
  wsContract['!cols'] = [
    { wch: 38 },
    { wch: 32 },
    { wch: 24 },
    { wch: 32 },
  ];

  // Set page setup for print preview in Excel (A4 Portrait)
  wsContract['!pageSetup'] = {
    paperSize: 9, // A4
    orientation: 'portrait',
    scale: 85,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  XLSX.utils.book_append_sheet(wb, wsContract, 'สัญญาเช่า (Lease Agreement)');

  // 2. Prepare Rows for Inventory Checklist Sheet (Page 4)
  const inventoryHeaders = [
    'ลำดับ / No.',
    'รายการทรัพย์สิน / Item Description',
    'จำนวน / Qty',
    'สภาพ ณ วันรับมอบ / Condition',
    'หมายเหตุ / Remark',
  ];

  const inventoryRows: (string | number)[][] = [
    ['บันทึกรายการทรัพย์สินตรวจรับมอบห้อง / Furniture & Equipment Inventory Checklist'],
    [`ห้องพักเลขที่ / Room No.: ${data.roomNo || '-'} | หอพัก: ${data.buildingName || '-'} | ผู้เช่า: ${data.lesseeName || '-'}`],
    [''],
    inventoryHeaders,
  ];

  const inventoryList = data.inventory && data.inventory.length > 0 ? data.inventory : [
    { no: 1, itemDescription: 'กุญแจและคีย์การ์ด', itemDescriptionEn: 'Keys & Keycards', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'เรียบร้อย', conditionEn: 'Intact', remark: '' },
    { no: 2, itemDescription: 'เครื่องปรับอากาศ + รีโมท', itemDescriptionEn: 'Air Conditioner & Remote', qty: '1', unitTh: 'เครื่อง', unitEn: 'Units', condition: 'ใช้งานได้ปกติ', conditionEn: 'Working', remark: '' },
    { no: 3, itemDescription: 'เตียงนอน / ที่นอน', itemDescriptionEn: 'Bed & Mattress', qty: '1', unitTh: 'หลัง', unitEn: 'Sets', condition: 'เรียบร้อย', conditionEn: 'Intact', remark: '' },
    { no: 4, itemDescription: 'ตู้เสื้อผ้า', itemDescriptionEn: 'Wardrobe', qty: '1', unitTh: 'หลัง', unitEn: 'Units', condition: 'เรียบร้อย', conditionEn: 'Intact', remark: '' },
    { no: 5, itemDescription: 'โต๊ะ / เก้าอี้', itemDescriptionEn: 'Table & Chairs', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'เรียบร้อย', conditionEn: 'Intact', remark: '' },
    { no: 6, itemDescription: 'เครื่องทำน้ำอุ่น / ฝักบัว', itemDescriptionEn: 'Water Heater & Shower', qty: '1', unitTh: 'ชุด', unitEn: 'Sets', condition: 'ใช้งานได้ปกติ', conditionEn: 'Working', remark: '' },
  ];

  inventoryList.forEach(item => {
    inventoryRows.push([
      item.no,
      `${item.itemDescription} / ${item.itemDescriptionEn}`,
      `${item.qty} ${item.unitTh} / ${item.unitEn}`,
      `${item.condition} / ${item.conditionEn}`,
      item.remark || '-',
    ]);
  });

  inventoryRows.push(
    [''],
    ['ผู้ให้เช่า / Lessor: ............................................................', '', `(${data.lessorSignName || data.lessorName || 'ผู้ให้เช่า'})`],
    ['ผู้เช่า / Lessee: ............................................................', '', `(${data.lesseeSignName || data.lesseeName || 'ผู้เช่า'})`]
  );

  const wsInventory = XLSX.utils.aoa_to_sheet(inventoryRows);

  wsInventory['!cols'] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 18 },
    { wch: 25 },
    { wch: 25 },
  ];

  wsInventory['!pageSetup'] = {
    paperSize: 9, // A4
    orientation: 'portrait',
    scale: 90,
    fitToWidth: 1,
    fitToHeight: 1,
  };

  XLSX.utils.book_append_sheet(wb, wsInventory, 'รายการทรัพย์สิน (Inventory)');

  // Generate Excel binary & Trigger download
  const defaultFileName = `สัญญาเช่าห้องพัก_ห้อง_${data.roomNo || 'ไม่ระบุ'}_${data.lesseeName || 'ผู้เช่า'}.xlsx`;
  XLSX.writeFile(wb, fileName || defaultFileName, { bookType: 'xlsx', type: 'binary' });
}
