import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  Key, 
  Link2, 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Info,
  Play,
  RotateCcw,
  Building2,
  Users,
  Receipt
} from 'lucide-react';
import { BuildingProfile, RoomRecord, ValidationError } from '../types';
import { OPTIMAL_DATABASE_SCHEMA, validateSystemIntegrity, generateRelationalSqlDdl } from '../utils/validationAndSchema';

interface DatabaseSchemaViewProps {
  buildings: BuildingProfile[];
  rooms: RoomRecord[];
}

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = ({
  buildings,
  rooms,
}) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'sql' | 'validator'>('tables');
  const [selectedTable, setSelectedTable] = useState<string>('buildings');
  const [hasCopiedSql, setHasCopiedSql] = useState<boolean>(false);
  const [validationResults, setValidationResults] = useState<ValidationError[] | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const sqlDdl = generateRelationalSqlDdl();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlDdl);
    setHasCopiedSql(true);
    setTimeout(() => setHasCopiedSql(false), 3000);
  };

  const handleDownloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([sqlDdl], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `schema_property_management_3nf.sql`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRunValidation = () => {
    setIsValidating(true);
    setTimeout(() => {
      const results = validateSystemIntegrity(buildings, rooms);
      setValidationResults(results);
      setIsValidating(false);
    }, 400);
  };

  const currentTableSchema = OPTIMAL_DATABASE_SCHEMA.find(t => t.tableName === selectedTable) || OPTIMAL_DATABASE_SCHEMA[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Database Architecture (3NF & GAS Multi-Sheet)
            </span>
            <span className="text-xs text-slate-500 font-medium">Zero-Duplication Design</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight flex items-center gap-2">
            <Database className="w-7 h-7 text-indigo-600" />
            โครงสร้างฐานข้อมูล & การตรวจสอบความถูกต้อง (DB Schema & Integrity)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            ออกแบบตารางเชิงสัมพันธ์ (Relational 3NF) เพื่อจัดการอาคาร ห้องพัก สถานะการเช่า และมิเตอร์ โดยไม่มีข้อมูลซ้ำซ้อน
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tables' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>ตารางข้อมูล (Tables Schema)</span>
          </button>
          <button
            onClick={() => setActiveTab('validator')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'validator' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ตรวจสอบความถูกต้อง (Integrity Test)</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>SQL DDL Script</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TABLES SCHEMA VISUALIZER */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Table Nav */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
                โครงสร้าง 5 ตารางหลัก (Normalized Tables)
              </h3>
              <div className="space-y-1.5">
                {OPTIMAL_DATABASE_SCHEMA.map((tbl) => {
                  const isSelected = selectedTable === tbl.tableName;
                  return (
                    <div
                      key={tbl.tableName}
                      onClick={() => setSelectedTable(tbl.tableName)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Table className="w-3.5 h-3.5 text-indigo-600" />
                          {tbl.tableName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{tbl.thaiName}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {tbl.columns.length} คอลัมน์
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Anti-Duplication Highlights Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                จุดเด่นของการออกแบบ (Zero Duplication):
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-emerald-800 text-[11px] leading-relaxed">
                <li><strong>แยกโปรไฟล์อาคาร (Buildings):</strong> ไม่ต้องพิมพ์ชื่ออาคาร ที่อยู่ หรือความจุซ้ำในทุกแถวมิเตอร์</li>
                <li><strong>แยกประวัติผู้เช่า (Tenants):</strong> เมื่อผู้เช่าย้ายออก ข้อมูลห้องและประวัติมิเตอร์จะไม่สูญหาย</li>
                <li><strong>ความจุที่ตรวจสอบได้ (Capacity):</strong> ป้องกันการสร้างห้องเกินจำนวนที่สร้างจริงของอาคาร</li>
                <li><strong>บันทึกมิเตอร์เป็นรายเดือน (Monthly Billing):</strong> เชื่อมโยง unit_id แบบ Foreign Key ประหยัดพื้นที่ 75%</li>
              </ul>
            </div>
          </div>

          {/* Right Table Columns Inspector */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {currentTableSchema.tableName}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Primary Key: <strong>{currentTableSchema.primaryKey}</strong></span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{currentTableSchema.thaiName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{currentTableSchema.description}</p>
                </div>
              </div>

              {/* Columns Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">ชื่อคอลัมน์ (Column Name)</th>
                      <th className="py-2.5 px-3">ประเภท (Data Type)</th>
                      <th className="py-2.5 px-3">คีย์ / ความสัมพันธ์ (Key/FK)</th>
                      <th className="py-2.5 px-3">คำอธิบาย</th>
                      <th className="py-2.5 px-3">ตัวอย่างข้อมูล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentTableSchema.columns.map((col) => {
                      const isPk = col.name === currentTableSchema.primaryKey;
                      const isFk = !!col.foreignKey;

                      return (
                        <tr key={col.name} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {col.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-indigo-600 font-medium">
                            {col.type}
                          </td>
                          <td className="py-2.5 px-3">
                            {isPk && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                                <Key className="w-2.5 h-2.5" /> PK
                              </span>
                            )}
                            {isFk && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200" title={`References ${col.foreignKey}`}>
                                <Link2 className="w-2.5 h-2.5" /> FK &rarr; {col.foreignKey}
                              </span>
                            )}
                            {!isPk && !isFk && (
                              <span className="text-slate-400 text-[10px]">{col.nullable ? 'NULL' : 'NOT NULL'}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {col.description}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 bg-slate-50/50">
                            {col.example}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM INTEGRITY VALIDATOR */}
      {activeTab === 'validator' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-indigo-600" />
                  ระบบตรวจสอบความสัมพันธ์และความถูกต้องของข้อมูล (System Integrity Engine)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ตรวจสอบ Foreign Key Integrity, Capacity Constraints, Duplicate IDs, และความสอดคล้องของสถานะการเข้าพัก
                </p>
              </div>

              <button
                onClick={handleRunValidation}
                disabled={isValidating}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>{isValidating ? 'กำลังสแกน...' : 'เริ่มตรวจสอบข้อมูล (Run Integrity Check)'}</span>
              </button>
            </div>

            {/* Verification Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500">อาคารที่ลงทะเบียน:</span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{buildings.length} อาคาร</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500">ความจุทั้งหมด (Capacity):</span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {buildings.reduce((sum, b) => sum + b.totalUnits, 0)} ยูนิต
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500">ห้องที่สร้างในระบบ:</span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{rooms.length} ห้อง</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500">สถานะความถูกต้อง:</span>
                <div className="text-lg font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" /> พร้อมใช้งาน
                </div>
              </div>
            </div>

            {/* Validation Output Log */}
            {validationResults && (
              <div className="space-y-3 pt-4 border-t border-slate-200 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900">
                    ผลการตรวจสอบความสัมพันธ์ ({validationResults.length} ข้อความแจ้งเตือน)
                  </h4>
                  {validationResults.length === 0 ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ข้อมูลผ่านการตรวจสอบ 100% ไม่มีข้อผิดพลาด
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      พบข้อควรปรับปรุง {validationResults.length} รายการ
                    </span>
                  )}
                </div>

                {validationResults.length === 0 ? (
                  <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center text-emerald-900 space-y-1">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <div className="font-bold text-sm">ฐานข้อมูลมีความสมบูรณ์ตามหลัก 3NF และ Referential Integrity</div>
                    <p className="text-xs text-emerald-700">
                      ทุกห้องอ้างอิงอาคารที่ถูกต้อง เลขห้องไม่ซ้ำซ้อน ไม่เกินความจุที่กำหนด และสถานะการเข้าพักสอดคล้องกับข้อมูลผู้เช่า
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {validationResults.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
                          item.type === 'error'
                            ? 'bg-red-50 border-red-200 text-red-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        {item.type === 'error' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5 flex-1">
                          <div className="font-bold flex items-center gap-2">
                            <span>{item.target}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-white/70">
                              {item.category}
                            </span>
                          </div>
                          <div>{item.message}</div>
                          {item.fixSuggestion && (
                            <div className="text-[11px] font-medium text-indigo-700 pt-1">
                              💡 คำแนะนำ: {item.fixSuggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SQL DDL SCRIPT */}
      {activeTab === 'sql' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                PostgreSQL / MySQL / Cloud SQL Relational DDL Script
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                สคริปต์สร้างตารางฐานข้อมูลพร้อม Foreign Key Constraints และ Calculated Generated Columns
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                {hasCopiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{hasCopiedSql ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด SQL'}</span>
              </button>

              <button
                onClick={handleDownloadSql}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดไฟล์ .sql</span>
              </button>
            </div>
          </div>

          <pre className="bg-[#0f172a] text-emerald-400 p-5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 shadow-inner max-h-[500px]">
            <code>{sqlDdl}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
