import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  ExternalLink, 
  BookOpen, 
  Terminal, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CODE_GS_SOURCE, INDEX_HTML_SOURCE } from '../data/gasSourceCode';

export const GasCodeView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'codegs' | 'indexhtml' | 'guide'>('codegs');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Google Apps Script Source Code
            </span>
            <span className="text-xs text-slate-500 font-medium">Production-Ready (Code.gs + Index.html)</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
            ซอร์สโค้ด Google Apps Script & วิธีนำไปติดตั้ง
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            โค้ดครบถ้วนสำหรับระบบบันทึกมิเตอร์และสร้างใบแจ้งหนี้ PDF บน Google Spreadsheet
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveCodeTab('codegs')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeCodeTab === 'codegs'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            Code.gs (Backend)
          </button>
          <button
            onClick={() => setActiveCodeTab('indexhtml')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeCodeTab === 'indexhtml'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            Index.html (Frontend)
          </button>
          <button
            onClick={() => setActiveCodeTab('guide')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeCodeTab === 'guide'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            คู่มือการติดตั้ง (3 ขั้นตอน)
          </button>
        </div>
      </div>

      {activeCodeTab === 'codegs' && (
        <div className="bg-[#111827] rounded-xl border border-slate-800 shadow-sm overflow-hidden">
          {/* Code Header Bar */}
          <div className="bg-slate-900 px-5 py-3.5 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-200 ml-2">Code.gs</span>
              <span className="text-[11px] text-slate-400 font-mono">(Google Apps Script Backend)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(CODE_GS_SOURCE, 'codegs')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedType === 'codegs' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอก Code.gs</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownloadFile(CODE_GS_SOURCE, 'Code.gs', 'text/javascript')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดไฟล์ .gs</span>
              </button>
            </div>
          </div>

          <div className="p-5 max-h-[640px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#111827]">
            <pre className="whitespace-pre">{CODE_GS_SOURCE}</pre>
          </div>
        </div>
      )}

      {activeCodeTab === 'indexhtml' && (
        <div className="bg-[#111827] rounded-xl border border-slate-800 shadow-sm overflow-hidden">
          {/* Code Header Bar */}
          <div className="bg-slate-900 px-5 py-3.5 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-200 ml-2">Index.html</span>
              <span className="text-[11px] text-slate-400 font-mono">(Bootstrap 5 + JS Frontend)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(INDEX_HTML_SOURCE, 'indexhtml')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedType === 'indexhtml' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอก Index.html</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownloadFile(INDEX_HTML_SOURCE, 'Index.html', 'text/html')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด Index.html</span>
              </button>
            </div>
          </div>

          <div className="p-5 max-h-[640px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#111827]">
            <pre className="whitespace-pre">{INDEX_HTML_SOURCE}</pre>
          </div>
        </div>
      )}

      {activeCodeTab === 'guide' && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              ขั้นตอนการนำโค้ดไปติดตั้งบน Google Apps Script ใน 3 นาที
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ทำตามขั้นตอนง่ายๆ ดังนี้เพื่อเชื่อมต่อ Web App เข้ากับ Google Spreadsheet ของท่าน:
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm">
                <span className="w-6 h-6 rounded bg-[#111827] text-white flex items-center justify-center text-xs font-mono">1</span>
                เปิด Google Spreadsheet และเข้าสู่ Apps Script Editor
              </div>
              <p className="text-xs text-slate-600 ml-8.5 leading-relaxed">
                1. เปิดไฟล์ Google Spreadsheet ที่มีชีต <code>Rooms</code> และชีตประจำเดือน เช่น <code>08 ส.ค.</code><br />
                2. คลิกเมนูด้านบน <strong>ส่วนขยาย (Extensions) &rarr; Apps Script</strong>
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm">
                <span className="w-6 h-6 rounded bg-[#111827] text-white flex items-center justify-center text-xs font-mono">2</span>
                วางโค้ด Code.gs และ Index.html
              </div>
              <p className="text-xs text-slate-600 ml-8.5 leading-relaxed">
                1. ในไฟล์ <code>Code.gs</code> ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดจากแท็บ <strong>Code.gs</strong> ด้านบน<br />
                2. คลิกปุ่ม <strong>+ (เพิ่มไฟล์) &rarr; HTML</strong> ตั้งชื่อไฟล์ว่า <code>Index</code><br />
                3. วางโค้ดจากแท็บ <strong>Index.html</strong> ลงไป แล้วกดบันทึก (Save Project)
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm">
                <span className="w-6 h-6 rounded bg-[#111827] text-white flex items-center justify-center text-xs font-mono">3</span>
                ทำการ Deploy เป็น Web App
              </div>
              <p className="text-xs text-slate-600 ml-8.5 leading-relaxed">
                1. คลิกปุ่ม <strong>ทำให้ใช้งานได้ (Deploy) &rarr; การทำให้ใช้งานได้รายการใหม่ (New deployment)</strong><br />
                2. เลือกประเภทเป็น <strong>เว็บแอปพลิเคชัน (Web app)</strong><br />
                3. ตั้งค่าการเข้าถึง: <strong>Execute as: Me</strong> และ <strong>Who has access: Anyone (ทุกคน)</strong><br />
                4. กดปุ่ม <strong>ทำให้ใช้งานได้ (Deploy)</strong> พร้อมให้สิทธิ์การเข้าถึง Google Drive และ Spreadsheet<br />
                5. คัดลอก Web App URL ไปใช้งานได้ทันทีทั้งบนคอมพิวเตอร์และสมาร์ตโฟน!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
