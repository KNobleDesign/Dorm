import React, { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check, 
  Sparkles, 
  Clock, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { 
  getMonthInfo, 
  parseMonthKey, 
  formatMonthKey, 
  getSelectableYears, 
  THAI_MONTH_NAMES_SHORT, 
  THAI_MONTH_NAMES_FULL,
  getPreviousMonthKey,
  getNextMonthKey
} from '../utils/billingCycle';

interface YearMonthPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMonth: string;
  onSelectMonth: (monthKey: string) => void;
  availableDataMonths?: string[];
  isSeniorMode?: boolean;
}

export const YearMonthPickerModal: React.FC<YearMonthPickerModalProps> = ({
  isOpen,
  onClose,
  activeMonth,
  onSelectMonth,
  availableDataMonths = [],
  isSeniorMode = false,
}) => {
  if (!isOpen) return null;

  const currentParsed = parseMonthKey(activeMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentParsed.year);
  
  const selectableYears = getSelectableYears(2026);
  const activeInfo = getMonthInfo(activeMonth);

  const handleSelectYearMonth = (year: number, month: number) => {
    const key = formatMonthKey(year, month);
    onSelectMonth(key);
    onClose();
  };

  const handleQuickCurrent = () => {
    const now = new Date();
    // Default system baseline or real current date
    const targetKey = formatMonthKey(2026, 8);
    onSelectMonth(targetKey);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="year-month-picker-title"
        className={`w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] ${
          isSeniorMode ? 'text-lg' : 'text-sm'
        }`}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 id="year-month-picker-title" className="font-bold text-base md:text-lg flex items-center gap-2 text-white">
                <span>เลือกปีและรอบบิลเดือน</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/50 text-blue-100 font-mono font-normal">
                  กดเลือกปีได้ทันที
                </span>
              </h2>
              <p className="text-xs text-blue-100/90 mt-0.5">
                รอบบิลที่เลือกอยู่: <strong className="text-amber-200 font-semibold">{activeInfo.displayName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-2 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5">
          {/* Quick Year Selection Pill Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. กดเลือกปี (พ.ศ. / ค.ศ.)</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedYear(prev => prev - 1)}
                  className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                  title="ลดลง 1 ปี"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold font-mono text-blue-700 px-2 py-0.5 bg-blue-50 rounded-lg">
                  พ.ศ. {selectedYear + 543} ({selectedYear})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedYear(prev => prev + 1)}
                  className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                  title="เพิ่มขึ้น 1 ปี"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid of Clickable Years */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {selectableYears.map((year) => {
                const thaiYear = year + 543;
                const isSelected = selectedYear === year;
                const isCurrentActiveYear = currentParsed.year === year;

                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className={`py-2.5 px-2 rounded-xl text-center font-bold transition-all border cursor-pointer relative flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/40 scale-102'
                        : isCurrentActiveYear
                          ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs md:text-sm font-black tracking-tight">
                      พ.ศ. {thaiYear}
                    </span>
                    <span className={`text-[10px] font-mono font-medium ${
                      isSelected ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {year}
                    </span>
                    {year === 2026 && (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-bold mt-0.5 ${
                        isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        ปีตั้งต้น
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Month Selection Grid for the selected year */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>2. กดเลือกเดือนสำหรับปี พ.ศ. {selectedYear + 543} ({selectedYear})</span>
              </label>
              <span className="text-[11px] text-slate-500">
                คลิกเดือนที่ต้องการเพื่อเปิดดูข้อมูลทันที
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => {
                const monthInfo = getMonthInfo(selectedYear, monthNum);
                const isCurrentActive = currentParsed.year === selectedYear && currentParsed.month === monthNum;
                const paddedM = monthNum.toString().padStart(2, '0');
                const hasExistingData = availableDataMonths.some(m => {
                  const p = parseMonthKey(m);
                  return p.year === selectedYear && p.month === monthNum;
                });

                return (
                  <button
                    key={monthNum}
                    type="button"
                    onClick={() => handleSelectYearMonth(selectedYear, monthNum)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isCurrentActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
                        : hasExistingData
                          ? 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-950 border-emerald-200 hover:border-emerald-300'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                        isCurrentActive 
                          ? 'bg-emerald-700 text-emerald-100' 
                          : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                      }`}>
                        {paddedM}
                      </span>
                      {isCurrentActive ? (
                        <span className="flex items-center gap-1 text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-bold">
                          <Check className="w-3 h-3" /> ใช้งานอยู่
                        </span>
                      ) : hasExistingData ? (
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">
                          มีข้อมูล
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1">
                      <div className="font-bold text-sm leading-snug">
                        {monthInfo.monthNameFull}
                      </div>
                      <div className={`text-[11px] font-mono mt-0.5 ${
                        isCurrentActive ? 'text-emerald-100' : 'text-slate-500'
                      }`}>
                        {monthInfo.shortDisplay} {monthInfo.yearThai}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> ทางลัดด่วน:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(2025);
                  handleSelectYearMonth(2025, 8);
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium transition cursor-pointer"
              >
                ปี 2568 (2025)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(2026);
                  handleSelectYearMonth(2026, 8);
                }}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-bold transition cursor-pointer"
              >
                ปี 2569 (2026 - ปัจจุบัน)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(2027);
                  handleSelectYearMonth(2027, 8);
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium transition cursor-pointer"
              >
                ปี 2570 (2027)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ระบบคำนวณยอดยกมาจากงวดก่อนหน้าให้อัตโนมัติเมื่อเปิดรอบบิลใหม่</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
