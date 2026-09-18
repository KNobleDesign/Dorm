/**
 * Production-ready Google Apps Script Backend (Code.gs)
 * and Frontend (Index.html) Templates
 */

export const CODE_GS_SOURCE = `/**
 * =========================================================================
 * Property & Utility Management System - Google Apps Script Backend (Code.gs)
 * =========================================================================
 * 
 * Schema Mapping:
 * 1. "Rooms" Sheet:
 *    [Key, อาคาร, เลขห้อง, ชื่อผู้เช่า, ค่าเช่า, เลขน้ำเดือนก่อน, เลขน้ำเดือนนี้, หน่วยน้ำ, ค่าน้ำ, เลขไฟเดือนก่อน, เลขไฟเดือนนี้, หน่วยไฟ, ค่าไฟ, รวมทั้งสิ้น]
 * 2. Monthly Sheets (e.g. "08 ส.ค.", "01 ม.ค."):
 *    [Col A: อาคาร, Col B: ห้อง, Col C: ผู้เช่า, Col D: ค่าเช่า, Col E: น้ำเดือนก่อน, Col F: น้ำเดือนนี้, Col G: ค่าน้ำ, 
 *     Col H: ไฟเดือนก่อน, Col I: ไฟเดือนนี้, Col J: ค่าไฟ, Col K: ค่าอื่นๆ, Col L: ยอดรวม, Col M: ชำระแล้ว]
 * 3. Invoices (e.g. "INV-ดอนเมือง", "INV-โรงงาน"):
 *    Template layout used for printable receipts & PDF generation.
 * 4. Settings / Config:
 *    Landlord name, Tax ID, PromptPay, Bank details, Water/Elec rates per building.
 */

// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const CONFIG = {
  DEFAULT_WATER_RATE: 18,     // บาท / หน่วย
  DEFAULT_ELEC_RATE: 8,       // บาท / หน่วย
  MIN_WATER_FEE: 100,         // ค่าน้ำขั้นต่ำ (ถ้ามี)
  DEFAULT_COMMON_FEE: 150,    // ค่าส่วนกลาง
  PDF_FOLDER_NAME: "Property_Invoices_PDF", // โฟลเดอร์ใน Google Drive สำหรับเก็บไฟล์ PDF
  PROPERTY_NAME: "พีแอนด์เจ อพาร์ตเมนต์ & ลีสซิ่ง",
  LANDLORD_NAME: "คุณประดิษฐ์ เจริญสุขสิริ",
  ADDRESS: "เลขที่ 88/19 หมู่ 4 ถ.สรงประภา แขวงสีกัน เขตดอนเมือง กทม. 10210",
  TAX_ID: "0-1055-64019-88-2",
  PHONE: "081-987-6543, 02-566-7890",
  PROMPTPAY: "0819876543",
  BANK_NAME: "ธนาคารกสิกรไทย (KBANK)",
  BANK_ACCOUNT: "743-2-89012-3 (นายประดิษฐ์ เจริญสุขสิริ)"
};

/**
 * Web App Entrypoint
 * Renders Index.html in standard responsive SaaS mode
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile("Index");
  return template.evaluate()
    .setTitle("PropManage - ระบบบริหารจัดการห้องเช่าและมิเตอร์น้ำ-ไฟ")
    .addMetaTag("viewport", "width=device-width, initial-scale=1, shrink-to-fit=no")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include helper for modular HTML files (if needed)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Returns initial application data: Building list, available months, and active sheet overview
 */
function getInitialData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    
    // Identify monthly sheets (names matching format e.g. "08 ส.ค." or digits)
    const monthSheets = [];
    sheets.forEach(sheet => {
      const name = sheet.getName().trim();
      if (name.includes("ม.ค.") || name.includes("ก.พ.") || name.includes("มี.ค.") || 
          name.includes("เม.ย.") || name.includes("พ.ค.") || name.includes("มิ.ย.") || 
          name.includes("ก.ค.") || name.includes("ส.ค.") || name.includes("ก.ย.") || 
          name.includes("ต.ค.") || name.includes("พ.ย.") || name.includes("ธ.ค.")) {
        monthSheets.push(name);
      }
    });

    const activeMonth = monthSheets.length > 0 ? monthSheets[0] : "08 ส.ค.";
    const roomsData = getMonthlySheetData(activeMonth);
    
    // Extract unique building names
    const buildings = [...new Set(roomsData.map(r => r.building))].filter(Boolean);

    return {
      success: true,
      activeMonth: activeMonth,
      availableMonths: monthSheets.length > 0 ? monthSheets : ["08 ส.ค.", "07 ก.ค.", "01 ม.ค."],
      buildings: buildings.length > 0 ? buildings : ["อาคารดอนเมือง", "อาคารโรงงาน"],
      rooms: roomsData,
      config: CONFIG
    };
  } catch (err) {
    Logger.log("getInitialData error: " + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Fetch all room records from a specific monthly sheet (e.g. "08 ส.ค.")
 * Maps columns:
 * Col A (1): อาคาร
 * Col B (2): ห้อง
 * Col C (3): ผู้เช่า
 * Col D (4): ค่าเช่า
 * Col E (5): น้ำเดือนก่อน
 * Col F (6): น้ำเดือนนี้
 * Col G (7): ค่าน้ำ
 * Col H (8): ไฟเดือนก่อน
 * Col I (9): ไฟเดือนนี้
 * Col J (10): ค่าไฟ
 * Col K (11): ค่าอื่นๆ
 * Col L (12): ยอดรวม
 * Col M (13): ชำระแล้ว (TRUE/FALSE หรือ 'ชำระแล้ว' / 'ยังไม่ชำระ')
 */
function getMonthlySheetData(targetMonth) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(targetMonth);
  
  if (!sheet) {
    // If not found, fallback to first sheet or create sample
    sheet = ss.getSheets()[0];
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // Read data starting from row 2 (skipping header)
  const range = sheet.getRange(2, 1, lastRow - 1, 13);
  const values = range.getValues();

  const records = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const building = String(row[0] || "").trim();
    const roomNo = String(row[1] || "").trim();
    const tenantName = String(row[2] || "").trim();
    
    if (!roomNo) continue; // Skip empty rows

    const rent = Number(row[3]) || 0;
    const waterPrev = Number(row[4]) || 0;
    const waterCurr = Number(row[5]) || 0;
    const waterUnits = waterCurr >= waterPrev && waterCurr > 0 ? (waterCurr - waterPrev) : 0;
    const waterCost = Number(row[6]) || (waterUnits * CONFIG.DEFAULT_WATER_RATE);

    const elecPrev = Number(row[7]) || 0;
    const elecCurr = Number(row[8]) || 0;
    const elecUnits = elecCurr >= elecPrev && elecCurr > 0 ? (elecCurr - elecPrev) : 0;
    const elecCost = Number(row[9]) || (elecUnits * CONFIG.DEFAULT_ELEC_RATE);

    const otherFees = Number(row[10]) || 0;
    const total = Number(row[11]) || (rent + waterCost + elecCost + otherFees);
    const isPaid = row[12] === true || String(row[12]).trim().toLowerCase() === "true" || String(row[12]).trim() === "ชำระแล้ว";

    records.push({
      rowIndex: i + 2,
      key: building + "-" + roomNo,
      building: building,
      roomNo: roomNo,
      tenantName: tenantName,
      rent: rent,
      waterPrev: waterPrev,
      waterCurr: waterCurr,
      waterUnits: waterUnits,
      waterCost: waterCost,
      elecPrev: elecPrev,
      elecCurr: elecCurr,
      elecUnits: elecUnits,
      elecCost: elecCost,
      otherFees: otherFees,
      total: total,
      isPaid: isPaid,
      hasMeterUpdated: (waterCurr > 0 && elecCurr > 0)
    });
  }

  return records;
}

/**
 * =========================================================================
 * ENHANCEMENT 1: Meter Reading Data Entry Backend
 * =========================================================================
 * Updates current water and electricity meter readings for a specific room.
 * Recalculates formula / units and writes to the active month sheet.
 * 
 * @param {string} building - e.g. "อาคารดอนเมือง"
 * @param {string} room - e.g. "101"
 * @param {number} waterMeter - Current Water Reading (น้ำเดือนนี้)
 * @param {number} elecMeter - Current Electricity Reading (ไฟเดือนนี้)
 * @param {string} targetMonth - Active month sheet name e.g. "08 ส.ค."
 */
function updateMeterReading(building, room, waterMeter, elecMeter, targetMonth) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(targetMonth);
    
    if (!sheet) {
      throw new Error("ไม่พบแผ่นงานประจำเดือน: " + targetMonth);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      throw new Error("ไม่มีข้อมูลในแผ่นงาน " + targetMonth);
    }

    const range = sheet.getRange(2, 1, lastRow - 1, 13);
    const values = range.getValues();
    
    let targetRowIndex = -1;
    let currentRowData = null;

    for (let i = 0; i < values.length; i++) {
      const rowBuilding = String(values[i][0] || "").trim();
      const rowRoom = String(values[i][1] || "").trim();

      // Match building and room (or room if building not specified)
      if ((!building || rowBuilding === building) && rowRoom === String(room).trim()) {
        targetRowIndex = i + 2; // +2 for 1-based index and header offset
        currentRowData = values[i];
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error("ไม่พบห้อง " + room + " ในอาคาร " + building + " บนชีต " + targetMonth);
    }

    const waterCurrVal = Number(waterMeter);
    const elecCurrVal = Number(elecMeter);
    const waterPrevVal = Number(currentRowData[4]) || 0;
    const elecPrevVal = Number(currentRowData[7]) || 0;
    const rentVal = Number(currentRowData[3]) || 0;
    const otherFeesVal = Number(currentRowData[10]) || 0;

    if (waterCurrVal < waterPrevVal) {
      throw new Error("เลขน้ำเดือนนี้ (" + waterCurrVal + ") ต้องไม่น้อยกว่าเดือนก่อน (" + waterPrevVal + ")");
    }
    if (elecCurrVal < elecPrevVal) {
      throw new Error("เลขไฟเดือนนี้ (" + elecCurrVal + ") ต้องไม่น้อยกว่าเดือนก่อน (" + elecPrevVal + ")");
    }

    // Determine water and electric rates per building
    const isFactory = (building && building.includes("โรงงาน"));
    const waterRate = isFactory ? 20 : CONFIG.DEFAULT_WATER_RATE;
    const elecRate = isFactory ? 8.5 : CONFIG.DEFAULT_ELEC_RATE;

    const waterUnits = waterCurrVal - waterPrevVal;
    const waterCost = waterUnits * waterRate;

    const elecUnits = elecCurrVal - elecPrevVal;
    const elecCost = elecUnits * elecRate;

    const grandTotal = rentVal + waterCost + elecCost + otherFeesVal;

    // Write back to sheet columns:
    // Col F (6): น้ำเดือนนี้
    // Col G (7): ค่าน้ำ (เขียนค่า หรือคงสูตร =(F{row}-E{row})*Rate)
    // Col I (9): ไฟเดือนนี้
    // Col J (10): ค่าไฟ
    // Col L (12): ยอดรวม
    sheet.getRange(targetRowIndex, 6).setValue(waterCurrVal);
    sheet.getRange(targetRowIndex, 7).setValue(waterCost);
    sheet.getRange(targetRowIndex, 9).setValue(elecCurrVal);
    sheet.getRange(targetRowIndex, 10).setValue(elecCost);
    sheet.getRange(targetRowIndex, 12).setValue(grandTotal);

    SpreadsheetApp.flush();

    return {
      success: true,
      message: "บันทึกมิเตอร์ห้อง " + room + " เรียบร้อยแล้ว",
      data: {
        building: building,
        roomNo: room,
        waterPrev: waterPrevVal,
        waterCurr: waterCurrVal,
        waterUnits: waterUnits,
        waterCost: waterCost,
        elecPrev: elecPrevVal,
        elecCurr: elecCurrVal,
        elecUnits: elecUnits,
        elecCost: elecCost,
        rent: rentVal,
        otherFees: otherFeesVal,
        total: grandTotal
      }
    };

  } catch (error) {
    Logger.log("updateMeterReading error: " + error.toString());
    return { success: false, error: error.message || error.toString() };
  }
}

/**
 * =========================================================================
 * ENHANCEMENT 2: PDF Invoice Generation Backend
 * =========================================================================
 * Maps calculated totals from the monthly sheet into an HTML template,
 * converts that HTML to a PDF using DriveApp.createFile(blob),
 * and returns the downloadable PDF URL to the frontend.
 * 
 * @param {string} roomNo - Room number e.g. "101" or "Unit-01"
 * @param {string} building - (Optional) Building name e.g. "อาคารดอนเมือง"
 * @param {string} targetMonth - (Optional) Month sheet e.g. "08 ส.ค."
 */
function generateInvoicePDF(roomNo, building, targetMonth) {
  try {
    const activeMonth = targetMonth || "08 ส.ค.";
    const rooms = getMonthlySheetData(activeMonth);
    
    // Locate specific room record
    const record = rooms.find(r => {
      if (building) {
        return r.roomNo === String(roomNo) && r.building === building;
      }
      return r.roomNo === String(roomNo);
    });

    if (!record) {
      throw new Error("ไม่พบข้อมูลห้อง " + roomNo + " ในระบบ");
    }

    // Build or get Google Drive folder for saving invoices
    const folder = getOrCreatePdfFolder();

    // Generate HTML content for invoice
    const htmlContent = buildInvoiceHtmlTemplate(record, activeMonth);

    // Convert HTML to PDF Blob
    const blob = Utilities.newBlob(htmlContent, "text/html", "invoice_" + record.building + "_" + record.roomNo + ".html")
      .getAs("application/pdf");
    
    const fileName = "ใบแจ้งหนี้_" + record.building + "_ห้อง_" + record.roomNo + "_" + activeMonth.replace(/\\s+/g, "") + ".pdf";
    blob.setName(fileName);

    // Create PDF File in Google Drive
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const downloadUrl = file.getDownloadUrl();
    const viewUrl = file.getUrl();

    return {
      success: true,
      message: "สร้างไฟล์ PDF ใบแจ้งหนี้สำเร็จ",
      pdfUrl: viewUrl,
      downloadUrl: downloadUrl,
      fileId: file.getId(),
      fileName: fileName,
      roomNo: record.roomNo,
      building: record.building,
      total: record.total
    };

  } catch (err) {
    Logger.log("generateInvoicePDF error: " + err.toString());
    return { success: false, error: err.message || err.toString() };
  }
}

/**
 * Builds standard, clean, printable HTML template for PDF conversion
 */
function buildInvoiceHtmlTemplate(r, monthName) {
  const issueDate = Utilities.formatDate(new Date(), "Asia/Bangkok", "dd/MM/yyyy");
  const dueDate = "05/" + (new Date().getMonth() + 1).toString().padStart(2, '0') + "/" + (new Date().getFullYear() + 543);
  const promptPayUrl = "https://promptpay.io/" + CONFIG.PROMPTPAY + "/" + r.total + ".png";

  return \`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ใบแจ้งค่าเช่าและสาธารณูปโภค</title>
      <style>
        body {
          font-family: 'Sarabun', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 24px;
          color: #1e293b;
          font-size: 13px;
          line-height: 1.5;
        }
        .invoice-card {
          max-width: 750px;
          margin: 0 auto;
          border: 1px solid #cbd5e1;
          padding: 32px;
          border-radius: 8px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 20px;
          font-weight: bold;
          color: #0369a1;
          margin-bottom: 4px;
        }
        .company-info {
          font-size: 12px;
          color: #64748b;
          max-width: 420px;
        }
        .meta-box {
          text-align: right;
          font-size: 12px;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          background: #e0f2fe;
          color: #0369a1;
          border-radius: 4px;
          font-weight: 600;
          margin-top: 6px;
        }
        .tenant-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #0284c7;
          color: #ffffff;
          font-weight: 600;
          text-align: left;
          padding: 8px 12px;
          font-size: 12px;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row {
          font-size: 15px;
          font-weight: bold;
          background-color: #f0fdf4;
          color: #166534;
        }
        .payment-section {
          margin-top: 24px;
          border-top: 1px dashed #cbd5e1;
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .qr-code {
          width: 110px;
          height: 110px;
          border: 1px solid #e2e8f0;
          padding: 4px;
          border-radius: 6px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <div class="title">\${CONFIG.PROPERTY_NAME}</div>
            <div class="company-info">
              \${CONFIG.ADDRESS}<br>
              เลขประจำตัวผู้เสียภาษี: \${CONFIG.TAX_ID} | โทร: \${CONFIG.PHONE}
            </div>
          </div>
          <div class="meta-box">
            <h3 style="margin:0; color:#0f172a;">ใบแจ้งค่าเช่า / INVOICE</h3>
            <div style="margin-top:4px;">ประจำงวด: <strong>\${monthName}</strong></div>
            <div>วันที่ออก: \${issueDate}</div>
            <div>กำหนดชำระ: \${dueDate}</div>
            <div class="badge">\${r.building}</div>
          </div>
        </div>

        <div class="tenant-box">
          <table style="margin:0; width:100%; border:none;">
            <tr style="border:none;">
              <td style="padding:4px; border:none; width:50%;">
                <strong>ชื่อผู้เช่า:</strong> \${r.tenantName || 'ไม่ระบุชื่อ'}
              </td>
              <td style="padding:4px; border:none; width:50%; text-align:right;">
                <strong>ห้องพักเลขที่:</strong> <span style="font-size:16px; font-weight:bold; color:#0284c7;">\${r.roomNo}</span>
              </td>
            </tr>
          </table>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 8%;">ลำดับ</th>
              <th style="width: 44%;">รายการ (Description)</th>
              <th style="width: 18%;" class="text-center">การอ่านมิเตอร์</th>
              <th style="width: 15%;" class="text-right">จำนวนหน่วย</th>
              <th style="width: 15%;" class="text-right">จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td>ค่าเช่าห้องพักประจำเดือน (Monthly Rent)</td>
              <td class="text-center">-</td>
              <td class="text-right">1 ห้อง</td>
              <td class="text-right">\${Number(r.rent).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td class="text-center">2</td>
              <td>
                ค่าน้ำประปา (Water Supply)<br>
                <small style="color:#64748b;">(เลขก่อน: \${r.waterPrev} | เลขปัจจุบัน: \${r.waterCurr})</small>
              </td>
              <td class="text-center">\${r.waterPrev} &rarr; \${r.waterCurr}</td>
              <td class="text-right">\${r.waterUnits} หน่วย</td>
              <td class="text-right">\${Number(r.waterCost).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td class="text-center">3</td>
              <td>
                ค่าไฟฟ้า (Electricity)<br>
                <small style="color:#64748b;">(เลขก่อน: \${r.elecPrev} | เลขปัจจุบัน: \${r.elecCurr})</small>
              </td>
              <td class="text-center">\${r.elecPrev} &rarr; \${r.elecCurr}</td>
              <td class="text-right">\${r.elecUnits} หน่วย</td>
              <td class="text-right">\${Number(r.elecCost).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            </tr>
            \${r.otherFees > 0 ? \`
            <tr>
              <td class="text-center">4</td>
              <td>ค่าบริการส่วนกลาง / ค่าขยะ / อื่นๆ</td>
              <td class="text-center">-</td>
              <td class="text-right">1 รายการ</td>
              <td class="text-right">\${Number(r.otherFees).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            </tr>\` : ''}
            <tr class="total-row">
              <td colspan="4" style="text-align: right; padding: 12px;"><strong>ยอดรวมที่ต้องชำระทั้งสิ้น (Grand Total):</strong></td>
              <td class="text-right" style="padding: 12px; font-size:16px;">
                <strong>\${Number(r.total).toLocaleString('th-TH', {minimumFractionDigits: 2})} ฿</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="payment-section">
          <div>
            <strong>ช่องทางการชำระเงิน:</strong><br>
            - ธนาคาร: \${CONFIG.BANK_NAME}<br>
            - เลขที่บัญชี: <strong>\${CONFIG.BANK_ACCOUNT}</strong><br>
            - สแกน QR PromptPay: \${CONFIG.PROMPTPAY}<br>
            <span style="color:#dc2626; font-size:11px;">* กรุณาส่งสลิปยืนยันการโอนเงินที่ไลน์นิติบุคคลทันทีหลังชำระเงิน</span>
          </div>
          <div style="text-align:center;">
            <img src="\${promptPayUrl}" class="qr-code" alt="PromptPay QR Code" /><br>
            <small style="font-size:10px; color:#64748b;">Scan to Pay</small>
          </div>
        </div>

        <div class="footer">
          ขอบพระคุณที่ไว้วางใจใช้บริการ | เอกสารฉบับนี้สร้างโดยระบบอัตโนมัติ PropManage GAS
        </div>
      </div>
    </body>
    </html>
  \`;
}

/**
 * Utility helper to get or create folder in Google Drive
 */
function getOrCreatePdfFolder() {
  const folders = DriveApp.getFoldersByName(CONFIG.PDF_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(CONFIG.PDF_FOLDER_NAME);
}

/**
 * Updates payment status of a room (Paid / Unpaid)
 */
function updatePaymentStatus(building, room, targetMonth, isPaid) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(targetMonth);
    if (!sheet) throw new Error("ไม่พบชีต " + targetMonth);

    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(2, 1, lastRow - 1, 13);
    const values = range.getValues();

    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]).trim() === building && String(values[i][1]).trim() === String(room)) {
        sheet.getRange(i + 2, 13).setValue(isPaid ? "ชำระแล้ว" : "ยังไม่ชำระ");
        SpreadsheetApp.flush();
        return { success: true, message: "อัปเดตสถานะชำระเงินเรียบร้อย" };
      }
    }
    throw new Error("ไม่พบห้องพัก");
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
`;

export const INDEX_HTML_SOURCE = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PropManage - Property & Utility Billing</title>
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Google Fonts: Sarabun & Plus Jakarta Sans -->
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css">
  
  <style>
    :root {
      --primary: #0284c7;
      --primary-dark: #0369a1;
      --secondary: #64748b;
      --sidebar-bg: #0f172a;
      --sidebar-hover: #1e293b;
      --bg-body: #f8fafc;
      --card-border: #e2e8f0;
    }
    body {
      font-family: 'Plus Jakarta Sans', 'Sarabun', sans-serif;
      background-color: var(--bg-body);
      color: #1e293b;
      min-height: 100vh;
      overflow-x: hidden;
    }
    /* SaaS Sidebar Styling */
    .sidebar {
      background-color: var(--sidebar-bg);
      color: #f8fafc;
      min-height: 100vh;
      width: 260px;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      transition: all 0.3s;
    }
    .sidebar-brand {
      padding: 24px 20px;
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #ffffff;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .nav-item-link {
      color: #94a3b8;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      font-weight: 500;
      border-radius: 8px;
      margin: 4px 12px;
      transition: all 0.2s;
    }
    .nav-item-link:hover {
      background-color: var(--sidebar-hover);
      color: #ffffff;
    }
    .nav-item-link.active {
      background-color: var(--primary);
      color: #ffffff;
      font-weight: 600;
    }
    .main-content {
      margin-left: 260px;
      padding: 28px 36px;
    }
    .stat-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid var(--card-border);
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .badge-paid {
      background-color: #dcfce7;
      color: #15803d;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 20px;
    }
    .badge-pending {
      background-color: #fee2e2;
      color: #b91c1c;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 20px;
    }
    .table-custom th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 600;
      font-size: 0.85rem;
      border-top: none;
      padding: 12px 16px;
    }
    .table-custom td {
      padding: 14px 16px;
      vertical-align: middle;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.9rem;
    }
    /* Print & Modal Styles */
    .invoice-preview-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 32px;
    }
  </style>
</head>
<body>

  <!-- Sidebar Navigation -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <i class="bi bi-buildings-fill text-info fs-4"></i>
      <div>
        <div>PropManage</div>
        <small class="text-secondary" style="font-size: 0.75rem; font-weight: normal;">GAS Utility System</small>
      </div>
    </div>
    
    <div class="px-3 py-3">
      <label class="text-secondary text-uppercase fw-semibold" style="font-size: 0.7rem; letter-spacing: 0.5px;">ประจำงวดเดือน</label>
      <select id="monthSelector" class="form-select form-select-sm bg-dark text-light border-secondary mt-1" onchange="switchMonth(this.value)">
        <option value="08 ส.ค.">08 ส.ค. (Active)</option>
        <option value="07 ก.ค.">07 ก.ค.</option>
        <option value="01 ม.ค.">01 ม.ค.</option>
      </select>
    </div>

    <nav class="mt-2">
      <a href="javascript:void(0)" class="nav-item-link active" id="nav-dashboard" onclick="showView('dashboard')">
        <i class="bi bi-speedometer2"></i> Dashboard (ภาพรวม)
      </a>
      <a href="javascript:void(0)" class="nav-item-link" id="nav-meter" onclick="showView('meter')">
        <i class="bi bi-speedometer"></i> Meter Entry (บันทึกมิเตอร์)
      </a>
      <a href="javascript:void(0)" class="nav-item-link" id="nav-invoice" onclick="showView('invoice')">
        <i class="bi bi-file-earmark-pdf"></i> Invoices (ออกใบแจ้งหนี้)
      </a>
    </nav>
  </aside>

  <!-- Main Application Body -->
  <main class="main-content">
    
    <!-- Top Header Bar -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0" id="view-title">ภาพรวมระบบ & สรุปยอดค่าบริการ</h4>
        <p class="text-muted small mb-0">ระบบบริหารจัดการห้องพัก สรุปมิเตอร์น้ำ-ไฟ และออกใบเสร็จรับเงินอัตโนมัติ</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-primary btn-sm px-3" onclick="openMeterModal()">
          <i class="bi bi-plus-circle me-1"></i> บันทึกมิเตอร์เร็ว
        </button>
        <button class="btn btn-outline-secondary btn-sm" onclick="loadInitialData()">
          <i class="bi bi-arrow-clockwise"></i> รีเฟรชข้อมูล
        </button>
      </div>
    </div>

    <!-- 1. DASHBOARD VIEW -->
    <div id="view-dashboard-container">
      <!-- KPI Stats Row -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="text-muted small fw-semibold">ยอดรวมทั้งสิ้น (Total Revenue)</div>
                <h3 class="fw-bold mt-2 text-primary" id="kpi-total-revenue">฿0</h3>
                <small class="text-success"><i class="bi bi-arrow-up-right"></i> ประจำงวดเดือนนี้</small>
              </div>
              <div class="stat-icon bg-primary-subtle text-primary">
                <i class="bi bi-cash-stack"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="text-muted small fw-semibold">ชำระแล้ว (Paid)</div>
                <h3 class="fw-bold mt-2 text-success" id="kpi-paid-revenue">฿0</h3>
                <small id="kpi-paid-count" class="text-muted">0 ห้อง</small>
              </div>
              <div class="stat-icon bg-success-subtle text-success">
                <i class="bi bi-check-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="text-muted small fw-semibold">ค้างชำระ (Pending Balance)</div>
                <h3 class="fw-bold mt-2 text-danger" id="kpi-pending-revenue">฿0</h3>
                <small id="kpi-pending-count" class="text-danger">0 ห้องค้างชำระ</small>
              </div>
              <div class="stat-icon bg-danger-subtle text-danger">
                <i class="bi bi-exclamation-triangle"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="text-muted small fw-semibold">ความคืบหน้าบันทึกมิเตอร์</div>
                <h3 class="fw-bold mt-2 text-info" id="kpi-meter-progress">0%</h3>
                <small id="kpi-meter-count" class="text-muted">0/0 ห้อง</small>
              </div>
              <div class="stat-icon bg-info-subtle text-info">
                <i class="bi bi-speedometer2"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Building Cards -->
      <div class="row g-3 mb-4" id="building-summary-cards">
        <!-- Injected via JavaScript -->
      </div>

      <!-- Room Summary Table -->
      <div class="card border-0 shadow-sm rounded-3">
        <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h6 class="fw-bold mb-0"><i class="bi bi-table me-2 text-primary"></i>รายการห้องพักและสถานะบิล</h6>
          <div class="d-flex gap-2">
            <select id="filterBuilding" class="form-select form-select-sm" style="width: 180px;" onchange="renderDashboardTable()">
              <option value="ALL">ทุกอาคาร</option>
            </select>
            <select id="filterStatus" class="form-select form-select-sm" style="width: 150px;" onchange="renderDashboardTable()">
              <option value="ALL">ทุกสถานะ</option>
              <option value="PAID">ชำระแล้ว</option>
              <option value="UNPAID">ค้างชำระ</option>
            </select>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-custom table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>อาคาร / ห้อง</th>
                <th>ผู้เช่า</th>
                <th>ค่าเช่า</th>
                <th>น้ำ (ก่อน &rarr; นี้ = หน่วย)</th>
                <th>ไฟ (ก่อน &rarr; นี้ = หน่วย)</th>
                <th>ยอดรวมทั้งสิ้น</th>
                <th>สถานะชำระ</th>
                <th class="text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody id="dashboard-table-body">
              <tr>
                <td colspan="8" class="text-center py-4 text-muted">กำลังโหลดข้อมูลจาก Google Sheet...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 2. METER ENTRY VIEW -->
    <div id="view-meter-container" style="display: none;">
      <div class="row g-4">
        <!-- Form Section -->
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm rounded-3 p-4">
            <h5 class="fw-bold mb-3 text-primary"><i class="bi bi-speedometer me-2"></i>แบบฟอร์มบันทึกมิเตอร์น้ำ-ไฟ</h5>
            <p class="text-muted small">เลือกอาคารและห้องพักเพื่อบันทึกเลขมิเตอร์ปัจจุบัน ระบบจะคำนวณส่วนต่างและยอดเงินให้อัตโนมัติ</p>
            
            <form id="meterForm" onsubmit="submitMeterReading(event)">
              <div class="mb-3">
                <label class="form-label fw-semibold">1. เลือกอาคาร (Building)</label>
                <select id="formBuilding" class="form-select" required onchange="onBuildingSelected(this.value)">
                  <option value="">-- กรุณาเลือกอาคาร --</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">2. เลือกห้องพัก (Room No)</label>
                <select id="formRoom" class="form-select" required onchange="onRoomSelected(this.value)" disabled>
                  <option value="">-- เลือกอาคารก่อน --</option>
                </select>
              </div>

              <div class="p-3 bg-light rounded-3 mb-3 border" id="room-info-preview" style="display: none;">
                <div class="d-flex justify-content-between small mb-1">
                  <span class="text-muted">ผู้เช่า:</span>
                  <span class="fw-bold" id="previewTenant">-</span>
                </div>
                <div class="d-flex justify-content-between small">
                  <span class="text-muted">ค่าเช่าห้อง:</span>
                  <span class="fw-bold" id="previewRent">0 ฿</span>
                </div>
              </div>

              <!-- Water Meter Inputs -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-primary"><i class="bi bi-droplet-fill me-1"></i>มิเตอร์น้ำประปา</label>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label small text-muted">น้ำเดือนก่อน</label>
                    <input type="number" id="formWaterPrev" class="form-control bg-light" readonly>
                  </div>
                  <div class="col-6">
                    <label class="form-label small text-primary fw-semibold">น้ำเดือนนี้ *</label>
                    <input type="number" id="formWaterCurr" class="form-control" required min="0" step="1" oninput="calculateLivePreview()">
                  </div>
                </div>
                <div class="d-flex justify-content-between small mt-1 text-muted">
                  <span>หน่วยน้ำ: <strong id="liveWaterUnits" class="text-primary">0</strong> หน่วย</span>
                  <span>ค่าน้ำ: <strong id="liveWaterCost" class="text-primary">0</strong> ฿</span>
                </div>
              </div>

              <!-- Electricity Meter Inputs -->
              <div class="mb-4">
                <label class="form-label fw-semibold text-warning"><i class="bi bi-lightning-charge-fill me-1"></i>มิเตอร์ไฟฟ้า</label>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label small text-muted">ไฟเดือนก่อน</label>
                    <input type="number" id="formElecPrev" class="form-control bg-light" readonly>
                  </div>
                  <div class="col-6">
                    <label class="form-label small text-warning fw-semibold">ไฟเดือนนี้ *</label>
                    <input type="number" id="formElecCurr" class="form-control" required min="0" step="1" oninput="calculateLivePreview()">
                  </div>
                </div>
                <div class="d-flex justify-content-between small mt-1 text-muted">
                  <span>หน่วยไฟ: <strong id="liveElecUnits" class="text-warning">0</strong> หน่วย</span>
                  <span>ค่าไฟ: <strong id="liveElecCost" class="text-warning">0</strong> ฿</span>
                </div>
              </div>

              <!-- Total Estimated Summary -->
              <div class="p-3 bg-primary-subtle rounded-3 mb-4 text-primary d-flex justify-content-between align-items-center">
                <span class="fw-semibold">ยอดรวมประมาณการทั้งสิ้น:</span>
                <span class="fs-4 fw-bold" id="liveGrandTotal">0 ฿</span>
              </div>

              <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold" id="btnSubmitMeter">
                <i class="bi bi-save me-1"></i> บันทึกข้อมูลลง Google Sheet
              </button>
            </form>
          </div>
        </div>

        <!-- Meter Status List -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm rounded-3">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0"><i class="bi bi-list-check me-2 text-primary"></i>สถานะการบันทึกมิเตอร์ทุกห้อง</h6>
              <span class="badge bg-secondary" id="meter-counter-badge">บันทึกแล้ว 0/0 ห้อง</span>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 table-custom">
                <thead>
                  <tr>
                    <th>ห้อง</th>
                    <th>น้ำ (ก่อน &rarr; นี้)</th>
                    <th>ไฟ (ก่อน &rarr; นี้)</th>
                    <th>สถานะ</th>
                    <th class="text-center">การกระทำ</th>
                  </tr>
                </thead>
                <tbody id="meter-status-table-body">
                  <!-- Injected via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. INVOICE GENERATION VIEW -->
    <div id="view-invoice-container" style="display: none;">
      <div class="card border-0 shadow-sm rounded-3 p-4 mb-4">
        <div class="row align-items-center">
          <div class="col-md-6">
            <h5 class="fw-bold mb-1 text-primary"><i class="bi bi-file-earmark-pdf-fill me-2"></i>พิมพ์และสร้างใบแจ้งหนี้ (PDF Invoices)</h5>
            <p class="text-muted small mb-0">สร้างไฟล์ PDF ใบแจ้งหนี้บันทึกลง Google Drive พร้อมลิงก์ดาวน์โหลดและ QR Code ชำระเงิน</p>
          </div>
          <div class="col-md-6 text-md-end mt-3 mt-md-0">
            <button class="btn btn-success" onclick="generateAllPendingInvoices()">
              <i class="bi bi-file-earmark-zip me-1"></i> สร้าง PDF ทุกห้องที่ยังไม่ชำระ
            </button>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-3">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 table-custom">
            <thead>
              <tr>
                <th>อาคาร / ห้อง</th>
                <th>ชื่อผู้เช่า</th>
                <th>ยอดค่าเช่า</th>
                <th>ค่าน้ำ</th>
                <th>ค่าไฟ</th>
                <th>รวมสุทธิ</th>
                <th>สถานะ</th>
                <th class="text-center">สร้าง / ดูใบแจ้งหนี้</th>
              </tr>
            </thead>
            <tbody id="invoice-table-body">
              <!-- Injected via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </main>

  <!-- PDF / Invoice Preview Modal -->
  <div class="modal fade" id="invoiceModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title fw-bold"><i class="bi bi-receipt me-2"></i>ตัวอย่างใบแจ้งหนี้ / ใบเสร็จรับเงิน</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4" id="modalInvoiceContent">
          <!-- Dynamic Invoice Render -->
        </div>
        <div class="modal-footer bg-light">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิดหน้าต่าง</button>
          <button type="button" class="btn btn-outline-primary" onclick="window.print()">
            <i class="bi bi-printer me-1"></i> พิมพ์เอกสาร
          </button>
          <button type="button" class="btn btn-primary" id="btnModalGeneratePdf" onclick="onModalTriggerPdf()">
            <i class="bi bi-file-pdf me-1"></i> สร้าง PDF ใน Google Drive
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1080">
    <div id="appToast" class="toast align-items-center text-white bg-dark border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body" id="toastMessage">
          ข้อความแจ้งเตือน
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  </div>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Application Logic (GAS Client Side) -->
  <script>
    // State management
    let appState = {
      activeMonth: "08 ส.ค.",
      availableMonths: [],
      buildings: [],
      rooms: [],
      config: {
        DEFAULT_WATER_RATE: 18,
        DEFAULT_ELEC_RATE: 8,
        PROMPTPAY: "0819876543"
      },
      selectedRoomForPdf: null
    };

    // Initialize on page load
    document.addEventListener("DOMContentLoaded", function() {
      loadInitialData();
    });

    /**
     * Load initial data via google.script.run
     */
    function loadInitialData() {
      showToast("กำลังเชื่อมต่อ Google Spreadsheet...", "info");
      
      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(handleInitialDataSuccess)
          .withFailureHandler(handleInitialDataFailure)
          .getInitialData();
      } else {
        // Fallback demo data if running outside Apps Script environment
        console.warn("Running in preview mode (Mocking google.script.run)");
        mockDemoData();
      }
    }

    function handleInitialDataSuccess(res) {
      if (res && res.success) {
        appState.activeMonth = res.activeMonth;
        appState.availableMonths = res.availableMonths || [];
        appState.buildings = res.buildings || [];
        appState.rooms = res.rooms || [];
        if (res.config) appState.config = res.config;
        
        populateBuildingSelectors();
        renderDashboard();
        renderMeterStatusList();
        renderInvoiceList();
        showToast("โหลดข้อมูลสำเร็จ", "success");
      } else {
        showToast("เกิดข้อผิดพลาด: " + (res.error || "ไม่สามารถโหลดข้อมูลได้"), "danger");
      }
    }

    function handleInitialDataFailure(err) {
      showToast("ล้มเหลวในการเชื่อมต่อ GAS: " + err.toString(), "danger");
    }

    /**
     * View Switcher: dashboard, meter, invoice
     */
    function showView(viewId) {
      document.getElementById("view-dashboard-container").style.display = (viewId === "dashboard" ? "block" : "none");
      document.getElementById("view-meter-container").style.display = (viewId === "meter" ? "block" : "none");
      document.getElementById("view-invoice-container").style.display = (viewId === "invoice" ? "block" : "none");

      document.querySelectorAll(".nav-item-link").forEach(el => el.classList.remove("active"));
      const activeNav = document.getElementById("nav-" + viewId);
      if (activeNav) activeNav.classList.add("active");

      const titleMap = {
        dashboard: "ภาพรวมระบบ & สรุปยอดค่าบริการ",
        meter: "บันทึกมิเตอร์น้ำ-ไฟประจำเดือน",
        invoice: "ออกใบแจ้งหนี้และสร้างไฟล์ PDF"
      };
      document.getElementById("view-title").innerText = titleMap[viewId] || "PropManage";
    }

    /**
     * Populate Building dropdown filters
     */
    function populateBuildingSelectors() {
      const formBuilding = document.getElementById("formBuilding");
      const filterBuilding = document.getElementById("filterBuilding");
      
      formBuilding.innerHTML = '<option value="">-- กรุณาเลือกอาคาร --</option>';
      filterBuilding.innerHTML = '<option value="ALL">ทุกอาคาร</option>';

      appState.buildings.forEach(b => {
        formBuilding.innerHTML += \`<option value="\${b}">\${b}</option>\`;
        filterBuilding.innerHTML += \`<option value="\${b}">\${b}</option>\`;
      });
    }

    /**
     * Render Dashboard Stats & Table
     */
    function renderDashboard() {
      const rooms = appState.rooms;
      let totalRevenue = 0;
      let paidRevenue = 0;
      let pendingRevenue = 0;
      let paidCount = 0;
      let meterCount = 0;

      rooms.forEach(r => {
        totalRevenue += (r.total || 0);
        if (r.isPaid) {
          paidRevenue += r.total;
          paidCount++;
        } else {
          pendingRevenue += r.total;
        }
        if (r.hasMeterUpdated) {
          meterCount++;
        }
      });

      document.getElementById("kpi-total-revenue").innerText = "฿" + totalRevenue.toLocaleString();
      document.getElementById("kpi-paid-revenue").innerText = "฿" + paidRevenue.toLocaleString();
      document.getElementById("kpi-pending-revenue").innerText = "฿" + pendingRevenue.toLocaleString();
      document.getElementById("kpi-paid-count").innerText = \`\${paidCount} จาก \${rooms.length} ห้อง\`;
      
      const meterPercent = rooms.length > 0 ? Math.round((meterCount / rooms.length) * 100) : 0;
      document.getElementById("kpi-meter-progress").innerText = meterPercent + "%";
      document.getElementById("kpi-meter-count").innerText = \`\${meterCount}/\${rooms.length} ห้อง\`;

      renderDashboardTable();
    }

    function renderDashboardTable() {
      const bFilter = document.getElementById("filterBuilding").value;
      const sFilter = document.getElementById("filterStatus").value;
      const tbody = document.getElementById("dashboard-table-body");

      const filtered = appState.rooms.filter(r => {
        if (bFilter !== "ALL" && r.building !== bFilter) return false;
        if (sFilter === "PAID" && !r.isPaid) return false;
        if (sFilter === "UNPAID" && r.isPaid) return false;
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">ไม่พบข้อมูลห้องพักตามเงื่อนไข</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(r => \`
        <tr>
          <td>
            <strong>\${r.building}</strong><br>
            <span class="badge bg-light text-dark border">ห้อง \${r.roomNo}</span>
          </td>
          <td>\${r.tenantName || '<span class="text-muted">ห้องว่าง</span>'}</td>
          <td>฿\${r.rent.toLocaleString()}</td>
          <td>
            <small class="text-muted">\${r.waterPrev} &rarr; \${r.waterCurr || '-'}</small><br>
            <span class="text-primary fw-semibold">\${r.waterUnits} หน่วย (฿\${r.waterCost.toLocaleString()})</span>
          </td>
          <td>
            <small class="text-muted">\${r.elecPrev} &rarr; \${r.elecCurr || '-'}</small><br>
            <span class="text-warning fw-semibold">\${r.elecUnits} หน่วย (฿\${r.elecCost.toLocaleString()})</span>
          </td>
          <td><strong class="text-dark">฿\${r.total.toLocaleString()}</strong></td>
          <td>
            \${r.isPaid 
              ? '<span class="badge-paid"><i class="bi bi-check-circle-fill me-1"></i>ชำระแล้ว</span>' 
              : '<span class="badge-pending"><i class="bi bi-clock-fill me-1"></i>ค้างชำระ</span>'}
          </td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary" onclick="quickMeterSelect('\${r.building}', '\${r.roomNo}')" title="บันทึกมิเตอร์">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger ms-1" onclick="previewInvoice('\${r.roomNo}', '\${r.building}')" title="พิมพ์/ออก PDF">
              <i class="bi bi-file-earmark-pdf"></i>
            </button>
          </td>
        </tr>
      \`).join("");
    }

    /**
     * Quick meter select from table
     */
    function quickMeterSelect(building, roomNo) {
      showView("meter");
      document.getElementById("formBuilding").value = building;
      onBuildingSelected(building);
      document.getElementById("formRoom").value = roomNo;
      onRoomSelected(roomNo);
    }

    /**
     * Building change handler in Meter Form
     */
    function onBuildingSelected(building) {
      const roomSelect = document.getElementById("formRoom");
      if (!building) {
        roomSelect.disabled = true;
        roomSelect.innerHTML = '<option value="">-- เลือกอาคารก่อน --</option>';
        return;
      }

      const roomsInBuilding = appState.rooms.filter(r => r.building === building);
      roomSelect.disabled = false;
      roomSelect.innerHTML = '<option value="">-- เลือกห้องพัก --</option>' + 
        roomsInBuilding.map(r => \`<option value="\${r.roomNo}">ห้อง \${r.roomNo} (\${r.tenantName || 'ว่าง'})\` + (r.hasMeterUpdated ? ' ✓' : '') + \`</option>\`).join("");
    }

    /**
     * Room change handler in Meter Form
     */
    function onRoomSelected(roomNo) {
      const building = document.getElementById("formBuilding").value;
      const room = appState.rooms.find(r => r.building === building && r.roomNo === roomNo);
      
      const previewBox = document.getElementById("room-info-preview");
      if (!room) {
        previewBox.style.display = "none";
        return;
      }

      previewBox.style.display = "block";
      document.getElementById("previewTenant").innerText = room.tenantName || "ห้องว่าง";
      document.getElementById("previewRent").innerText = "฿" + room.rent.toLocaleString();

      document.getElementById("formWaterPrev").value = room.waterPrev;
      document.getElementById("formWaterCurr").value = room.waterCurr > 0 ? room.waterCurr : "";
      
      document.getElementById("formElecPrev").value = room.elecPrev;
      document.getElementById("formElecCurr").value = room.elecCurr > 0 ? room.elecCurr : "";

      calculateLivePreview();
    }

    /**
     * Real-time calculation on input change
     */
    function calculateLivePreview() {
      const building = document.getElementById("formBuilding").value;
      const roomNo = document.getElementById("formRoom").value;
      const room = appState.rooms.find(r => r.building === building && r.roomNo === roomNo);

      const waterPrev = Number(document.getElementById("formWaterPrev").value) || 0;
      const waterCurr = Number(document.getElementById("formWaterCurr").value) || waterPrev;
      const elecPrev = Number(document.getElementById("formElecPrev").value) || 0;
      const elecCurr = Number(document.getElementById("formElecCurr").value) || elecPrev;

      const isFactory = (building && building.includes("โรงงาน"));
      const waterRate = isFactory ? 20 : appState.config.DEFAULT_WATER_RATE;
      const elecRate = isFactory ? 8.5 : appState.config.DEFAULT_ELEC_RATE;

      const waterUnits = Math.max(0, waterCurr - waterPrev);
      const waterCost = waterUnits * waterRate;

      const elecUnits = Math.max(0, elecCurr - elecPrev);
      const elecCost = elecUnits * elecRate;

      const rent = room ? room.rent : 0;
      const otherFees = room ? room.otherFees : 0;
      const grandTotal = rent + waterCost + elecCost + otherFees;

      document.getElementById("liveWaterUnits").innerText = waterUnits;
      document.getElementById("liveWaterCost").innerText = waterCost.toLocaleString();
      document.getElementById("liveElecUnits").innerText = elecUnits;
      document.getElementById("liveElecCost").innerText = elecCost.toLocaleString();
      document.getElementById("liveGrandTotal").innerText = "฿" + grandTotal.toLocaleString();
    }

    /**
     * Submit Meter Reading to GAS Backend
     */
    function submitMeterReading(e) {
      e.preventDefault();
      const building = document.getElementById("formBuilding").value;
      const room = document.getElementById("formRoom").value;
      const waterCurr = Number(document.getElementById("formWaterCurr").value);
      const elecCurr = Number(document.getElementById("formElecCurr").value);

      if (!building || !room) {
        showToast("กรุณาเลือกอาคารและห้องพัก", "warning");
        return;
      }

      const btn = document.getElementById("btnSubmitMeter");
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังบันทึกลง Google Sheet...';

      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-save me-1"></i> บันทึกข้อมูลลง Google Sheet';
            if (res && res.success) {
              showToast(res.message, "success");
              loadInitialData(); // Refresh UI
            } else {
              showToast("ข้อผิดพลาด: " + (res.error || "บันทึกไม่สำเร็จ"), "danger");
            }
          })
          .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-save me-1"></i> บันทึกข้อมูลลง Google Sheet';
            showToast("ล้มเหลว: " + err.toString(), "danger");
          })
          .updateMeterReading(building, room, waterCurr, elecCurr, appState.activeMonth);
      } else {
        // Local simulation update
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-save me-1"></i> บันทึกข้อมูลลง Google Sheet';
          const target = appState.rooms.find(r => r.building === building && r.roomNo === room);
          if (target) {
            target.waterCurr = waterCurr;
            target.waterUnits = waterCurr - target.waterPrev;
            target.waterCost = target.waterUnits * appState.config.DEFAULT_WATER_RATE;
            target.elecCurr = elecCurr;
            target.elecUnits = elecCurr - target.elecPrev;
            target.elecCost = target.elecUnits * appState.config.DEFAULT_ELEC_RATE;
            target.total = target.rent + target.waterCost + target.elecCost + target.otherFees;
            target.hasMeterUpdated = true;
          }
          renderDashboard();
          renderMeterStatusList();
          showToast("บันทึกข้อมูลมิเตอร์จำลองสำเร็จ", "success");
        }, 600);
      }
    }

    /**
     * Render Invoices Table
     */
    function renderInvoiceList() {
      const tbody = document.getElementById("invoice-table-body");
      tbody.innerHTML = appState.rooms.map(r => \`
        <tr>
          <td>
            <strong>\${r.building}</strong><br>
            <span class="badge bg-secondary">ห้อง \${r.roomNo}</span>
          </td>
          <td>\${r.tenantName || '-'}</td>
          <td>฿\${r.rent.toLocaleString()}</td>
          <td>฿\${r.waterCost.toLocaleString()}</td>
          <td>฿\${r.elecCost.toLocaleString()}</td>
          <td><strong class="text-primary">฿\${r.total.toLocaleString()}</strong></td>
          <td>
            \${r.isPaid 
              ? '<span class="badge-paid">ชำระแล้ว</span>' 
              : '<span class="badge-pending">รอชำระ</span>'}
          </td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary" onclick="previewInvoice('\${r.roomNo}', '\${r.building}')">
              <i class="bi bi-eye me-1"></i> ดูใบแจ้งหนี้
            </button>
            <button class="btn btn-sm btn-danger ms-1" onclick="triggerGeneratePdf('\${r.roomNo}', '\${r.building}')">
              <i class="bi bi-file-earmark-pdf me-1"></i> สร้าง PDF
            </button>
          </td>
        </tr>
      \`).join("");
    }

    /**
     * Invoice Preview in Modal
     */
    function previewInvoice(roomNo, building) {
      const room = appState.rooms.find(r => r.roomNo === roomNo && (!building || r.building === building));
      if (!room) return;

      appState.selectedRoomForPdf = { roomNo: room.roomNo, building: room.building };
      const modalContent = document.getElementById("modalInvoiceContent");
      const promptPayUrl = "https://promptpay.io/" + appState.config.PROMPTPAY + "/" + room.total + ".png";

      modalContent.innerHTML = \`
        <div class="invoice-preview-container">
          <div class="d-flex justify-content-between border-bottom pb-3 mb-3">
            <div>
              <h5 class="fw-bold text-primary mb-1">ใบแจ้งค่าเช่าและสาธารณูปโภค</h5>
              <div class="small text-muted">\${room.building} | งวดประจำเดือน \${appState.activeMonth}</div>
            </div>
            <div class="text-end">
              <span class="badge bg-primary fs-6">ห้อง \${room.roomNo}</span>
              <div class="small text-muted mt-1">ผู้เช่า: <strong>\${room.tenantName}</strong></div>
            </div>
          </div>

          <table class="table table-bordered align-middle">
            <thead class="table-light">
              <tr>
                <th>รายการ</th>
                <th class="text-center">เลขมิเตอร์</th>
                <th class="text-end">จำนวนหน่วย</th>
                <th class="text-end">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ค่าเช่าห้องพัก</td>
                <td class="text-center">-</td>
                <td class="text-end">1 ห้อง</td>
                <td class="text-end">฿\${room.rent.toLocaleString()}</td>
              </tr>
              <tr>
                <td>ค่าน้ำประปา</td>
                <td class="text-center">\${room.waterPrev} &rarr; \${room.waterCurr}</td>
                <td class="text-end">\${room.waterUnits} หน่วย</td>
                <td class="text-end">฿\${room.waterCost.toLocaleString()}</td>
              </tr>
              <tr>
                <td>ค่ากระแสไฟฟ้า</td>
                <td class="text-center">\${room.elecPrev} &rarr; \${room.elecCurr}</td>
                <td class="text-end">\${room.elecUnits} หน่วย</td>
                <td class="text-end">฿\${room.elecCost.toLocaleString()}</td>
              </tr>
              \${room.otherFees > 0 ? \`
              <tr>
                <td>ค่าบริการส่วนกลาง / ค่าขยะ</td>
                <td class="text-center">-</td>
                <td class="text-end">1 รายการ</td>
                <td class="text-end">฿\${room.otherFees.toLocaleString()}</td>
              </tr>\` : ''}
              <tr class="table-success fw-bold">
                <td colspan="3" class="text-end">ยอดรวมทั้งสิ้น (Grand Total):</td>
                <td class="text-end text-success fs-5">฿\${room.total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="d-flex justify-content-between align-items-center mt-4 p-3 bg-light rounded-3">
            <div>
              <div class="fw-bold mb-1">สแกนชำระเงินผ่าน PromptPay</div>
              <small class="text-muted">หมายเลข: \${appState.config.PROMPTPAY}</small>
            </div>
            <img src="\${promptPayUrl}" style="width: 90px; height: 90px;" class="border rounded" alt="QR Code">
          </div>
        </div>
      \`;

      const modal = new bootstrap.Modal(document.getElementById("invoiceModal"));
      modal.show();
    }

    /**
     * Trigger GAS PDF Generator
     */
    function triggerGeneratePdf(roomNo, building) {
      showToast("กำลังประมวลผลสร้าง PDF ใน Google Drive...", "info");
      
      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (res && res.success) {
              showToast("สร้าง PDF สำเร็จ!", "success");
              window.open(res.pdfUrl, "_blank");
            } else {
              showToast("เกิดข้อผิดพลาด: " + res.error, "danger");
            }
          })
          .withFailureHandler(function(err) {
            showToast("ล้มเหลว: " + err.toString(), "danger");
          })
          .generateInvoicePDF(roomNo, building, appState.activeMonth);
      } else {
        setTimeout(() => {
          showToast("สร้างไฟล์ PDF ใน Google Drive (จำลอง) เรียบร้อยแล้ว", "success");
        }, 800);
      }
    }

    function onModalTriggerPdf() {
      if (appState.selectedRoomForPdf) {
        triggerGeneratePdf(appState.selectedRoomForPdf.roomNo, appState.selectedRoomForPdf.building);
      }
    }

    function renderMeterStatusList() {
      const tbody = document.getElementById("meter-status-table-body");
      let completed = 0;
      tbody.innerHTML = appState.rooms.map(r => {
        if (r.hasMeterUpdated) completed++;
        return \`
          <tr>
            <td><strong>\${r.building}</strong> - \${r.roomNo}</td>
            <td>\${r.waterPrev} &rarr; \${r.waterCurr > 0 ? r.waterCurr : '<span class="text-danger">ยังไม่ระบุ</span>'}</td>
            <td>\${r.elecPrev} &rarr; \${r.elecCurr > 0 ? r.elecCurr : '<span class="text-danger">ยังไม่ระบุ</span>'}</td>
            <td>
              \${r.hasMeterUpdated 
                ? '<span class="badge bg-success-subtle text-success">บันทึกแล้ว</span>' 
                : '<span class="badge bg-warning-subtle text-warning">รอดำเนินการ</span>'}
            </td>
            <td class="text-center">
              <button class="btn btn-sm btn-outline-primary" onclick="quickMeterSelect('\${r.building}', '\${r.roomNo}')">
                แก้ไข
              </button>
            </td>
          </tr>
        \`;
      }).join("");

      document.getElementById("meter-counter-badge").innerText = \`บันทึกแล้ว \${completed}/\${appState.rooms.length} ห้อง\`;
    }

    function showToast(message, type) {
      const toastEl = document.getElementById("appToast");
      const toastBody = document.getElementById("toastMessage");
      toastBody.innerText = message;
      toastEl.className = \`toast align-items-center text-white bg-\${type || 'dark'} border-0\`;
      const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
      toast.show();
    }
  </script>
</body>
</html>
`;
