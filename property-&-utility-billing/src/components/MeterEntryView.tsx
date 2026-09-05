import React, { useState, useEffect, useRef } from 'react';
import { RoomRecord, LandlordConfig, WaterCalcType, AppUser } from '../types';
import { 
  Droplet, 
  Droplets, 
  Zap, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ListOrdered, 
  Layers, 
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  Building2,
  Edit3,
  Plus,
  Minus,
  Check,
  Clock,
  Download,
  FileSpreadsheet,
  Printer,
  Camera,
  Smartphone,
  Copy,
  Trash2,
  Grid,
  List,
  SlidersHorizontal,
  Volume2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface MeterEntryViewProps {
  rooms: RoomRecord[];
  activeMonth: string;
  buildings: string[];
  config: LandlordConfig;
  initialBuilding?: string;
  initialRoomNo?: string;
  defaultTarget?: { building: string; roomNo: string } | null;
  currentUser?: AppUser;
  isSeniorMode?: boolean;
  onSaveMeterReading?: (
    building: string, 
    roomNo: string, 
    waterCurr: number, 
    elecCurr: number,
    waterCalcType?: WaterCalcType,
    occupants?: number,
    tenantName?: string,
    previousBalance?: number
  ) => void;
  onSaveReading?: (
    building: string, 
    roomNo: string, 
    waterCurr: number, 
    elecCurr: number,
    waterCalcType?: WaterCalcType,
    occupants?: number,
    tenantName?: string,
    previousBalance?: number
  ) => void;
  onToggleWaterCalc?: (room: RoomRecord) => void;
  onNavigateToRooms?: () => void;
}

export const MeterEntryView: React.FC<MeterEntryViewProps> = ({
  rooms,
  activeMonth,
  buildings,
  config,
  initialBuilding,
  initialRoomNo,
  defaultTarget,
  currentUser,
  isSeniorMode,
  onSaveMeterReading,
  onSaveReading,
  onToggleWaterCalc,
  onNavigateToRooms,
}) => {
  const isOwnerOrPloy = currentUser?.role === 'owner' || currentUser?.role === 'ploy';
  const isCaretaker = !isOwnerOrPloy;
  const saveHandler = onSaveMeterReading || onSaveReading;
  const initialBld = defaultTarget?.building || initialBuilding || buildings[0] || '';
  const initialRoom = defaultTarget?.roomNo || initialRoomNo || '';

  const [selectedBuilding, setSelectedBuilding] = useState<string>(initialBld);
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(initialRoom);
  
  // Single & Mobile form state
  const [waterCurrInput, setWaterCurrInput] = useState<string>('');
  const [elecCurrInput, setElecCurrInput] = useState<string>('');
  const [tenantNameInput, setTenantNameInput] = useState<string>('');
  const [occupantsInput, setOccupantsInput] = useState<number>(1);
  const [waterCalcTypeInput, setWaterCalcTypeInput] = useState<WaterCalcType>('meter');
  const [previousBalanceInput, setPreviousBalanceInput] = useState<number>(0);
  const [meterPhoto, setMeterPhoto] = useState<string | null>(null);
  
  // View mode state: 'walk-through' (Mobile-Optimized), 'single' (Desktop/Tablet Card), 'batch' (Table & Cards)
  const [activeTabMode, setActiveTabMode] = useState<'walk-through' | 'single' | 'batch'>('walk-through');
  const [showTouchKeypad, setShowTouchKeypad] = useState<boolean>(false);
  const [keypadTarget, setKeypadTarget] = useState<'water' | 'elec'>('elec');
  const [batchViewStyle, setBatchViewStyle] = useState<'cards' | 'table'>('cards');

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const batchTableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter rooms in selected building
  const buildingRooms = selectedBuilding === 'all' 
    ? rooms 
    : rooms.filter(r => r.building === selectedBuilding);

  // Available floors in selected building
  const floorList: number[] = buildingRooms.map(r => r.floor || parseInt(r.roomNo.charAt(0), 10) || 1);
  const availableFloors: number[] = Array.from(new Set<number>(floorList)).sort((a: number, b: number) => a - b);

  // Filter by floor if selected
  const filteredBuildingRooms = selectedFloor === 'ALL'
    ? buildingRooms
    : buildingRooms.filter(r => {
        const f = r.floor || (parseInt(r.roomNo.charAt(0), 10) || 1);
        return String(f) === selectedFloor;
      });

  const currentRoom = buildingRooms.find(r => r.roomNo === selectedRoomNo) || buildingRooms[0];
  const currentRoomIndex = buildingRooms.findIndex(r => r.roomNo === selectedRoomNo);

  // Sync with initial props if provided
  useEffect(() => {
    if (initialBuilding && buildings.includes(initialBuilding)) {
      setSelectedBuilding(initialBuilding);
    }
  }, [initialBuilding, buildings]);

  useEffect(() => {
    if (initialRoomNo && buildingRooms.some(r => r.roomNo === initialRoomNo)) {
      setSelectedRoomNo(initialRoomNo);
    } else if (buildingRooms.length > 0 && (!selectedRoomNo || !buildingRooms.some(r => r.roomNo === selectedRoomNo))) {
      setSelectedRoomNo(buildingRooms[0].roomNo);
    }
  }, [selectedBuilding, initialRoomNo, buildingRooms]);

  // Load current room values into inputs
  useEffect(() => {
    if (currentRoom) {
      setWaterCurrInput(currentRoom.waterCurr > 0 ? String(currentRoom.waterCurr) : '');
      setElecCurrInput(currentRoom.elecCurr > 0 ? String(currentRoom.elecCurr) : '');
      setTenantNameInput(currentRoom.tenantName || '');
      setOccupantsInput(currentRoom.occupants || 1);
      setWaterCalcTypeInput(currentRoom.waterCalcType || 'meter');
      setPreviousBalanceInput(currentRoom.previousBalance || 0);
      setMeterPhoto(currentRoom.meterPhotoUrl || null);
    } else {
      setWaterCurrInput('');
      setElecCurrInput('');
      setTenantNameInput('');
      setOccupantsInput(1);
      setWaterCalcTypeInput('meter');
      setPreviousBalanceInput(0);
      setMeterPhoto(null);
    }
    setSaveSuccessMsg(null);
  }, [selectedRoomNo, selectedBuilding, rooms]);

  // Utility calculation rates
  const isFactory = selectedBuilding.includes('โรงงาน');
  const waterRate = isFactory ? 20 : (currentRoom?.waterRate || config.waterRateDefault || 18);
  const elecRate = isFactory ? 8.5 : (currentRoom?.elecRate || config.elecRateDefault || 8);
  const perPersonRate = currentRoom?.waterPerPersonRate || config.waterPerPersonRateDefault || 100;

  const isPerPerson = waterCalcTypeInput === 'per_person';
  const occupants = Math.max(1, occupantsInput);

  const waterPrev = currentRoom ? currentRoom.waterPrev : 0;
  const elecPrev = currentRoom ? currentRoom.elecPrev : 0;

  const waterCurr = Number(waterCurrInput) || 0;
  const elecCurr = Number(elecCurrInput) || 0;

  const isWaterValid = isPerPerson || (waterCurr >= waterPrev || waterCurrInput === '');
  const isElecValid = elecCurr >= elecPrev || elecCurrInput === '';

  let waterUnits = 0;
  let waterCost = 0;
  if (isPerPerson) {
    waterUnits = 0;
    waterCost = occupants * perPersonRate;
  } else {
    waterUnits = Math.max(0, waterCurr - waterPrev);
    waterCost = waterUnits * waterRate;
  }

  const elecUnits = Math.max(0, elecCurr - elecPrev);
  const elecCost = elecUnits * elecRate;

  const rent = currentRoom ? currentRoom.rent : 0;
  const otherFees = currentRoom ? currentRoom.otherFees : 0;
  const prevBalance = Number(previousBalanceInput) || 0;
  const estimatedTotal = rent + waterCost + elecCost + otherFees + prevBalance;

  // Completion metrics
  const completedCount = buildingRooms.filter(r => r.hasMeterUpdated).length;
  const totalCount = buildingRooms.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Next and Previous Room navigation
  const handlePrevRoom = () => {
    if (buildingRooms.length === 0) return;
    const prevIdx = (currentRoomIndex - 1 + buildingRooms.length) % buildingRooms.length;
    setSelectedRoomNo(buildingRooms[prevIdx].roomNo);
  };

  const handleNextRoom = () => {
    if (buildingRooms.length === 0) return;
    const nextIdx = (currentRoomIndex + 1) % buildingRooms.length;
    setSelectedRoomNo(buildingRooms[nextIdx].roomNo);
  };

  const handleNextPendingRoom = () => {
    const nextPending = buildingRooms.find(r => !r.hasMeterUpdated && r.roomNo !== selectedRoomNo);
    if (nextPending) {
      setSelectedRoomNo(nextPending.roomNo);
    } else {
      handleNextRoom();
    }
  };

  // Quick Keypad handlers
  const handleKeypadPress = (val: string) => {
    if (keypadTarget === 'water') {
      if (val === 'backspace') {
        setWaterCurrInput(prev => prev.slice(0, -1));
      } else if (val === 'clear') {
        setWaterCurrInput('');
      } else {
        setWaterCurrInput(prev => prev + val);
      }
    } else {
      if (val === 'backspace') {
        setElecCurrInput(prev => prev.slice(0, -1));
      } else if (val === 'clear') {
        setElecCurrInput('');
      } else {
        setElecCurrInput(prev => prev + val);
      }
    }
  };

  // Quick preset increment helpers
  const handleQuickAddWater = (delta: number) => {
    const base = waterCurrInput ? Number(waterCurrInput) : waterPrev;
    setWaterCurrInput(String(Math.max(waterPrev, base + delta)));
  };

  const handleQuickAddElec = (delta: number) => {
    const base = elecCurrInput ? Number(elecCurrInput) : elecPrev;
    setElecCurrInput(String(Math.max(elecPrev, base + delta)));
  };

  const handleCopyPrevWater = () => {
    setWaterCurrInput(String(waterPrev));
  };

  const handleCopyPrevElec = () => {
    setElecCurrInput(String(elecPrev));
  };

  // Handle Photo Upload / Capture
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMeterPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save current room
  const handleSaveCurrent = (autoAdvance: boolean = true) => {
    if (!selectedBuilding || !selectedRoomNo) return;
    if (!isWaterValid || !isElecValid) return;

    if (saveHandler) {
      saveHandler(
        selectedBuilding, 
        selectedRoomNo, 
        waterCurr, 
        elecCurr, 
        waterCalcTypeInput,
        occupants,
        tenantNameInput,
        prevBalance
      );
    }

    setSaveSuccessMsg(`บันทึกห้อง ${selectedRoomNo} เรียบร้อยแล้ว!`);
    
    // Auto advance to next pending room if requested
    if (autoAdvance) {
      const nextPending = buildingRooms.find(r => !r.hasMeterUpdated && r.roomNo !== selectedRoomNo);
      if (nextPending) {
        setTimeout(() => {
          setSelectedRoomNo(nextPending.roomNo);
        }, 400);
      } else {
        setTimeout(() => {
          handleNextRoom();
        }, 400);
      }
    }
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const targetRooms = selectedBuilding === 'all' ? rooms : buildingRooms;
    const buildingLabel = selectedBuilding === 'all' ? 'ทุกอาคาร' : selectedBuilding;

    const headers = [
      'ลำดับ',
      'อาคาร',
      'ห้อง',
      'สถานะการเช่า',
      'ชื่อผู้เช่า',
      'เบอร์โทรศัพท์',
      'จำนวนคนพัก (คน)',
      'ค่าเช่าห้อง (บาท)',
      'รูปแบบค่าน้ำ',
      'อัตราค่าน้ำ',
      'เลขน้ำเดือนก่อน',
      'เลขน้ำเดือนนี้',
      'หน่วยน้ำที่ใช้',
      'ค่าน้ำรวม (บาท)',
      'อัตราค่าไฟ (บาท/หน่วย)',
      'เลขไฟเดือนก่อน',
      'เลขไฟเดือนนี้',
      'หน่วยไฟที่ใช้',
      'ค่าไฟรวม (บาท)',
      'ค่าบริการอื่นๆ (บาท)',
      'ยอดค้างเดือนก่อน (บาท)',
      'ยอดรวมสุทธิ (บาท)',
      'สถานะจดมิเตอร์',
      'สถานะการชำระเงิน'
    ];

    let totalOccupants = 0;
    let totalRent = 0;
    let totalWaterUnits = 0;
    let totalWaterCost = 0;
    let totalElecUnits = 0;
    let totalElecCost = 0;
    let totalOtherFees = 0;
    let totalArrears = 0;
    let totalGrand = 0;

    const rows = targetRooms.map((r, index) => {
      const isPerPerson = r.waterCalcType === 'per_person';
      const occ = r.occupants || 1;
      const wRate = r.waterRate || (r.building.includes('โรงงาน') ? 20 : 18);
      const pRate = r.waterPerPersonRate || 100;
      const eRate = r.elecRate || (r.building.includes('โรงงาน') ? 8.5 : 8);

      const wUnits = isPerPerson ? 0 : Math.max(0, (r.waterCurr > 0 ? r.waterCurr : r.waterPrev) - r.waterPrev);
      const wCost = isPerPerson ? occ * pRate : wUnits * wRate;
      const eUnits = Math.max(0, (r.elecCurr > 0 ? r.elecCurr : r.elecPrev) - r.elecPrev);
      const eCost = eUnits * eRate;
      const arrears = r.previousBalance || 0;
      const gTotal = (r.rent || 0) + wCost + eCost + (r.otherFees || 0) + arrears;

      totalOccupants += occ;
      totalRent += r.rent || 0;
      totalWaterUnits += wUnits;
      totalWaterCost += wCost;
      totalElecUnits += eUnits;
      totalElecCost += eCost;
      totalOtherFees += r.otherFees || 0;
      totalArrears += arrears;
      totalGrand += gTotal;

      const isVacant = r.occupancyStatus === 'vacant';
      const isRenov = r.occupancyStatus === 'under_renovation';
      const occStatusLabel = isVacant ? 'ห้องว่าง' : (isRenov ? 'ปิดปรับปรุง' : 'มีผู้เช่า');

      return [
        index + 1,
        `"${r.building}"`,
        `"${r.roomNo}"`,
        `"${occStatusLabel}"`,
        `"${(r.tenantName || '').replace(/"/g, '""')}"`,
        `"${r.phone || ''}"`,
        occ,
        r.rent || 0,
        `"${isPerPerson ? 'เหมาจ่ายรายคน' : 'ตามมิเตอร์'}"`,
        isPerPerson ? `${pRate} บ./คน` : `${wRate} บ./หน่วย`,
        r.waterPrev || 0,
        r.waterCurr > 0 ? r.waterCurr : r.waterPrev,
        wUnits,
        wCost,
        eRate,
        r.elecPrev || 0,
        r.elecCurr > 0 ? r.elecCurr : r.elecPrev,
        eUnits,
        eCost,
        r.otherFees || 0,
        arrears,
        gTotal,
        `"${r.hasMeterUpdated ? 'บันทึกแล้ว' : 'รอกรอก'}"`,
        `"${r.isPaid ? 'ชำระแล้ว' : 'รอชำระเงิน'}"`
      ];
    });

    const summaryRow = [
      '"รวมทั้งสิ้น"',
      `"${buildingLabel}"`,
      `"${targetRooms.length} ห้อง"`,
      '""',
      '""',
      '""',
      totalOccupants,
      totalRent,
      '""',
      '""',
      '""',
      '""',
      totalWaterUnits,
      totalWaterCost,
      '""',
      '""',
      '""',
      totalElecUnits,
      totalElecCost,
      totalOtherFees,
      totalArrears,
      totalGrand,
      '""',
      '""'
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(',')), summaryRow.join(',')].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ตารางบันทึกมิเตอร์_${buildingLabel}_งวด_${activeMonth}_(${targetRooms.length}ห้อง).csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMessage(`ส่งออกไฟล์ Excel/CSV สำเร็จ (${targetRooms.length} ห้อง)!`);
    setTimeout(() => setExportMessage(null), 4000);
  };

  // Export Batch Table to PDF
  const handleExportPdf = async () => {
    if (!batchTableRef.current) return;
    setIsGeneratingPdf(true);
    setExportMessage(null);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const element = batchTableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = 297;
      const pdfHeight = 210;
      const margin = 6;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = pdfHeight - (margin * 2);
      const totalImgHeight = (canvas.height * printWidth) / canvas.width;

      let heightLeft = totalImgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, printWidth, totalImgHeight);
      heightLeft -= printHeight;

      while (heightLeft > 0) {
        position = position - printHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, printWidth, totalImgHeight);
        heightLeft -= printHeight;
      }

      const buildingLabel = selectedBuilding === 'all' ? 'ทุกอาคาร' : selectedBuilding;
      pdf.save(`ตารางบันทึกมิเตอร์_${buildingLabel}_งวด_${activeMonth}.pdf`);
      setExportMessage(`ดาวน์โหลด PDF ตารางบันทึกมิเตอร์ (${buildingLabel}) สำเร็จ!`);
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
      setExportMessage('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 md:pb-8">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                ⚡ ระบบจดมิเตอร์มือถือ & ค่าน้ำ-ไฟ
              </span>
              <span className="text-xs text-slate-500 font-semibold">งวด {activeMonth}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                บันทึกแล้ว {completedCount}/{totalCount} ห้อง ({progressPercent}%)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
              ลงบันทึกมิเตอร์น้ำ-ไฟ (Meter Reading)
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              รองรับโหมดเดินจดมิเตอร์ตามห้องบนมือถือ พร้อมแป้นตัวเลขใหญ่ และระบบคำนวณค่าน้ำเหมาจ่าย/ตามมิเตอร์อัตโนมัติ
            </p>
          </div>

          {/* Mode Switchers */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-start md:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTabMode('walk-through')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === 'walk-through'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>เดินจดมือถือ</span>
            </button>

            <button
              onClick={() => setActiveTabMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ทีละห้อง (การ์ด)</span>
            </button>

            <button
              onClick={() => setActiveTabMode('batch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === 'batch'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>ตารางรวม</span>
            </button>
          </div>
        </div>

        {/* Building Selector Pill Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 shrink-0">เลือกตึก:</span>
          {buildings.map((bld) => {
            const bldRooms = rooms.filter(r => r.building === bld);
            const bldDone = bldRooms.filter(r => r.hasMeterUpdated).length;
            const isSelected = selectedBuilding === bld;
            return (
              <button
                key={bld}
                onClick={() => {
                  setSelectedBuilding(bld);
                  const firstRoomInBldg = rooms.find(r => r.building === bld);
                  if (firstRoomInBldg) setSelectedRoomNo(firstRoomInBldg.roomNo);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{bld}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected 
                    ? 'bg-slate-700 text-slate-200' 
                    : (bldDone === bldRooms.length ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600')
                }`}>
                  {bldDone}/{bldRooms.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Floor Filter Pills */}
        {availableFloors.length > 1 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">ชั้น:</span>
            <button
              onClick={() => setSelectedFloor('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedFloor === 'ALL'
                  ? 'bg-blue-100 text-blue-900 font-extrabold border border-blue-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทุกชั้น ({buildingRooms.length})
            </button>
            {availableFloors.map(floor => {
              const floorCount = buildingRooms.filter(r => (r.floor || (parseInt(r.roomNo.charAt(0), 10) || 1)) === floor).length;
              return (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(String(floor))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                    selectedFloor === String(floor)
                      ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ชั้น {floor} ({floorCount})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          MODE 1: MOBILE WALK-THROUGH MODE (โหมดเดินจดมิเตอร์ตามห้องบนมือถือ)
          ========================================================================= */}
      {activeTabMode === 'walk-through' && (
        <div className="space-y-4 pb-44 md:pb-24">
          {/* Room Carousel Bar & Status Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            {/* Navigation Buttons + Room No */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handlePrevRoom}
                className="flex items-center gap-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline">ห้องก่อน</span>
              </button>

              <div className="text-center min-w-0 flex-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                    ห้อง {selectedRoomNo}
                  </span>
                  {currentRoom?.hasMeterUpdated ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> จดแล้ว
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> รอกรอก
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 font-medium truncate mt-0.5">
                  👤 <strong>{currentRoom?.tenantName || 'ห้องว่าง'}</strong> • {currentRoom?.occupants || 1} คน • {selectedBuilding}
                </div>
              </div>

              <button
                onClick={handleNextRoom}
                className="flex items-center gap-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                <span className="hidden xs:inline">ห้องถัดไป</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Room Jump Horizontal Selector */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {filteredBuildingRooms.map((r) => {
                const isSelected = r.roomNo === selectedRoomNo;
                return (
                  <button
                    key={r.roomNo}
                    onClick={() => setSelectedRoomNo(r.roomNo)}
                    className={`min-w-[46px] h-9 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center cursor-pointer relative shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 scale-105'
                        : r.hasMeterUpdated
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {r.roomNo}
                    {r.hasMeterUpdated && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meter Input Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Water Meter Card (บัตรมิเตอร์น้ำประปา) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Droplet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      มิเตอร์น้ำประปา (Water Meter)
                    </h3>
                    <span className="text-[11px] text-blue-700 font-semibold">
                      อัตรา: ฿{waterRate} บ./หน่วย (หรือ ฿{perPersonRate} บ./คน)
                    </span>
                  </div>
                </div>

                {/* Water Calculation Mode Toggle Pill */}
                <button
                  type="button"
                  onClick={() => setWaterCalcTypeInput(prev => prev === 'meter' ? 'per_person' : 'meter')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                    isPerPerson
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-blue-50 text-blue-800 border-blue-300'
                  }`}
                >
                  {isPerPerson ? <Users className="w-3 h-3 text-emerald-600" /> : <Droplets className="w-3 h-3 text-blue-600" />}
                  <span>{isPerPerson ? 'เหมาคน' : 'ตามมิเตอร์'}</span>
                </button>
              </div>

              {isPerPerson ? (
                /* Water Per Person Box */
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950">คิดค่าน้ำแบบเหมาจ่ายรายคน:</span>
                    <span className="font-extrabold text-emerald-800">฿{perPersonRate} บ./คน</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-300">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">จำนวนคน:</span>
                      <button
                        type="button"
                        onClick={() => setOccupantsInput(Math.max(1, occupantsInput - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-base font-extrabold font-mono text-slate-900 w-8 text-center">
                        {occupants}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOccupantsInput(occupantsInput + 1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">ยอดค่าน้ำรวม</span>
                      <span className="text-base font-black text-emerald-700 font-mono">
                        ฿{waterCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Water Meter Inputs */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Previous Water Reading Box */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[11px] font-bold text-slate-500 block">เลขน้ำเดือนก่อน</span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-700">
                        {waterPrev}
                      </span>
                    </div>

                    {/* Current Water Reading Box */}
                    <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-300">
                      <label className="text-[11px] font-bold text-blue-900 block mb-1">
                        เลขน้ำเดือนนี้ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={String(waterPrev)}
                        value={waterCurrInput}
                        onFocus={() => {
                          setKeypadTarget('water');
                          setShowTouchKeypad(true);
                        }}
                        onChange={(e) => setWaterCurrInput(e.target.value)}
                        className={`w-full bg-white border rounded-xl py-2 px-3 text-xl font-black font-mono text-center focus:outline-none focus:ring-2 ${
                          !isWaterValid 
                            ? 'border-red-400 text-red-600 focus:ring-red-400' 
                            : 'border-blue-400 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Water Quick Increment Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">ปุ่มลัด:</span>
                    <button
                      type="button"
                      onClick={handleCopyPrevWater}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>เลขเดิม ({waterPrev})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddWater(1)}
                      className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
                    >
                      +1 น.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddWater(3)}
                      className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
                    >
                      +3 น.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddWater(5)}
                      className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
                    >
                      +5 น.
                    </button>
                  </div>

                  {/* Calculation Result */}
                  <div className="flex items-center justify-between p-2.5 bg-blue-100/60 rounded-xl text-xs text-blue-950 font-semibold">
                    <span>ใช้น้ำ: <strong className="font-mono text-sm text-blue-900">{waterUnits}</strong> หน่วย</span>
                    <span>ค่าน้ำ: <strong className="font-mono text-sm text-blue-900">฿{waterCost.toLocaleString()}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Electricity Meter Card (บัตรมิเตอร์ไฟฟ้า) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      มิเตอร์ไฟฟ้า (Electricity Meter)
                    </h3>
                    <span className="text-[11px] text-amber-700 font-semibold">
                      อัตรา: ฿{elecRate} บาท/หน่วย
                    </span>
                  </div>
                </div>

                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">
                  งวด {activeMonth}
                </span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Previous Elec Reading Box */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] font-bold text-slate-500 block">เลขไฟเดือนก่อน</span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-slate-700">
                      {elecPrev}
                    </span>
                  </div>

                  {/* Current Elec Reading Box */}
                  <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-300">
                    <label className="text-[11px] font-bold text-amber-900 block mb-1">
                      เลขไฟเดือนนี้ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={String(elecPrev)}
                      value={elecCurrInput}
                      onFocus={() => {
                        setKeypadTarget('elec');
                        setShowTouchKeypad(true);
                      }}
                      onChange={(e) => setElecCurrInput(e.target.value)}
                      className={`w-full bg-white border rounded-xl py-2 px-3 text-xl font-black font-mono text-center focus:outline-none focus:ring-2 ${
                        !isElecValid 
                          ? 'border-red-400 text-red-600 focus:ring-red-400' 
                          : 'border-amber-400 text-slate-900 focus:ring-amber-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Electricity Quick Increment Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">ปุ่มลัด:</span>
                  <button
                    type="button"
                    onClick={handleCopyPrevElec}
                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>เลขเดิม ({elecPrev})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddElec(10)}
                    className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer"
                  >
                    +10 น.
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddElec(25)}
                    className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer"
                  >
                    +25 น.
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddElec(50)}
                    className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer"
                  >
                    +50 น.
                  </button>
                </div>

                {/* Calculation Result */}
                <div className="flex items-center justify-between p-2.5 bg-amber-100/60 rounded-xl text-xs text-amber-950 font-semibold">
                  <span>ใช้ไฟ: <strong className="font-mono text-sm text-amber-900">{elecUnits}</strong> หน่วย</span>
                  <span>ค่าไฟ: <strong className="font-mono text-sm text-amber-900">฿{elecCost.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Dial Attachment & Tenant Quick Edit */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                รูปถ่ายมิเตอร์ & ข้อมูลผู้เช่า
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{meterPhoto ? 'เปลี่ยนรูปถ่าย' : 'ถ่ายรูป/แนบภาพมิเตอร์'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </div>

            {meterPhoto && (
              <div className="relative inline-block border rounded-xl overflow-hidden shadow-xs">
                <img 
                  src={meterPhoto} 
                  alt="Meter Dial Snapshot" 
                  className="w-32 h-24 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setMeterPhoto(null)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full text-xs shadow-md"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อผู้เช่าห้อง {selectedRoomNo}</label>
                <input
                  type="text"
                  placeholder="เช่น คุณสมชาย"
                  value={tenantNameInput}
                  onChange={(e) => setTenantNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!isCaretaker && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ยอดค้างชำระเดือนก่อน (฿)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={previousBalanceInput === 0 ? '' : previousBalanceInput}
                    onChange={(e) => setPreviousBalanceInput(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-amber-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* On-Screen Touch Keypad for 1-Thumb Input on Mobile */}
          {showTouchKeypad && (
            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl space-y-2 border border-slate-800">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">แป้นพิมพ์ตัวเลขสัมผัส:</span>
                  <button
                    type="button"
                    onClick={() => setKeypadTarget('water')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      keypadTarget === 'water' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    💧 มิเตอร์น้ำ ({waterCurrInput || '-'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeypadTarget('elec')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      keypadTarget === 'elec' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    ⚡ มิเตอร์ไฟ ({elecCurrInput || '-'})
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTouchKeypad(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-0.5"
                >
                  ปิดแป้น ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="h-12 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white text-xl font-bold font-mono rounded-xl transition flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('clear')}
                  className="h-12 bg-slate-800/60 hover:bg-slate-700 active:bg-red-700 text-red-400 text-sm font-bold rounded-xl transition flex items-center justify-center cursor-pointer"
                >
                  ล้าง
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-white text-xl font-bold font-mono rounded-xl transition flex items-center justify-center cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('backspace')}
                  className="h-12 bg-slate-800/60 hover:bg-slate-700 active:bg-amber-700 text-amber-300 text-base font-bold rounded-xl transition flex items-center justify-center cursor-pointer"
                >
                  ⌫
                </button>
              </div>
            </div>
          )}

          {/* Sticky Bottom Action Bar for Easy One-Thumb Save on Phone (Placed above mobile nav bar so toolbar is never hidden) */}
          <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 z-30 p-2.5 sm:p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl">
            <div className="max-w-2xl mx-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveCurrent(false)}
                disabled={!isElecValid || elecCurrInput === '' || (!isPerPerson && (!isWaterValid || waterCurrInput === ''))}
                className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                title="บันทึกห้องปัจจุบันโดยไม่อัตโนมัติไปห้องถัดไป"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>บันทึกห้องนี้</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveCurrent(true)}
                disabled={!isElecValid || elecCurrInput === '' || (!isPerPerson && (!isWaterValid || waterCurrInput === ''))}
                className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-extrabold rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>บันทึก & ไปห้องถัดไป ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: SINGLE ROOM CARD (เดิม - ทีละห้องแบบมีตารางสถานะด้านข้าง)
          ========================================================================= */}
      {activeTabMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Form */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                กรอกข้อมูลมิเตอร์ & ผู้เช่า (ห้อง {selectedRoomNo})
              </h3>
              {currentRoom?.hasMeterUpdated && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> บันทึกแล้ว
                </span>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveCurrent(true); }} className="space-y-4">
              {/* Building & Room Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อาคาร (Building)
                  </label>
                  <select
                    value={selectedBuilding}
                    onChange={(e) => {
                      setSelectedBuilding(e.target.value);
                      const firstRoomInBldg = rooms.find(r => r.building === e.target.value);
                      if (firstRoomInBldg) setSelectedRoomNo(firstRoomInBldg.roomNo);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {buildings.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขห้อง (Room Number)
                  </label>
                  <select
                    value={selectedRoomNo}
                    onChange={(e) => setSelectedRoomNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {buildingRooms.map((r) => (
                      <option key={r.roomNo} value={r.roomNo}>
                        ห้อง {r.roomNo} - {r.tenantName || 'ห้องว่าง'} {r.hasMeterUpdated ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tenant and Water Calc Mode Settings */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ชื่อผู้เช่า (Occupant Name)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น คุณสมชาย"
                      value={tenantNameInput}
                      onChange={(e) => setTenantNameInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      จำนวนคนพัก (Occupants)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOccupantsInput(Math.max(1, occupantsInput - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={occupantsInput}
                        onChange={(e) => setOccupantsInput(Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 text-center bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setOccupantsInput(occupantsInput + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-slate-500 font-medium">คน</span>
                    </div>
                  </div>
                </div>

                {/* Water Mode Switcher */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">วิธีคิดค่าน้ำ:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWaterCalcTypeInput('meter')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        waterCalcTypeInput === 'meter'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      ตามมิเตอร์ (฿{waterRate})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaterCalcTypeInput('per_person')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        waterCalcTypeInput === 'per_person'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      เหมาจ่าย (฿{perPersonRate}/คน)
                    </button>
                  </div>
                </div>
              </div>

              {/* Water Inputs */}
              {!isPerPerson && (
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      มิเตอร์น้ำประปา (฿{waterRate}/หน่วย)
                    </span>
                    <span className="text-blue-700 font-medium text-xs">
                      เลขเดิม: <strong className="font-mono">{waterPrev}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">เลขน้ำเดือนก่อน</label>
                      <input
                        type="number"
                        value={waterPrev}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 text-slate-600 rounded-xl p-2 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">
                        เลขน้ำเดือนนี้ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="เช่น 1428"
                        value={waterCurrInput}
                        onChange={(e) => setWaterCurrInput(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-xl p-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs pt-1 text-blue-800 font-medium">
                    <span>ใช้น้ำ: <strong className="text-blue-900 font-bold">{waterUnits}</strong> หน่วย</span>
                    <span>ค่าน้ำ: <strong className="text-blue-900 font-bold">฿{waterCost.toLocaleString()}</strong></span>
                  </div>
                </div>
              )}

              {/* Electricity Inputs */}
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    มิเตอร์ไฟฟ้า (฿{elecRate}/หน่วย)
                  </span>
                  <span className="text-amber-700 font-medium text-xs">
                    เลขเดิม: <strong className="font-mono">{elecPrev}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">เลขไฟเดือนก่อน</label>
                    <input
                      type="number"
                      value={elecPrev}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 text-slate-600 rounded-xl p-2 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      เลขไฟเดือนนี้ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="เช่น 3345"
                      value={elecCurrInput}
                      onChange={(e) => setElecCurrInput(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl p-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs pt-1 text-amber-800 font-medium">
                  <span>ใช้ไฟ: <strong className="text-amber-900 font-bold">{elecUnits}</strong> หน่วย</span>
                  <span>ค่าไฟ: <strong className="text-amber-900 font-bold">฿{elecCost.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isElecValid || elecCurrInput === '' || (!isPerPerson && (!isWaterValid || waterCurrInput === ''))}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Save className="w-4 h-4" />
                บันทึกค่ามิเตอร์ห้อง {selectedRoomNo} (Save Record)
              </button>
            </form>
          </div>

          {/* Right: Room Status List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-blue-600" />
                  ห้องใน {selectedBuilding} ({buildingRooms.length} ห้อง)
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {completedCount}/{totalCount}
                </span>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {buildingRooms.map((r) => {
                  const isSelected = r.roomNo === selectedRoomNo;
                  return (
                    <div
                      key={r.roomNo}
                      onClick={() => setSelectedRoomNo(r.roomNo)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                          r.hasMeterUpdated 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.roomNo}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs truncate max-w-[140px]">
                            {r.tenantName || 'ห้องว่าง'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            น้ำ: {r.waterPrev}&rarr;{r.waterCurr > 0 ? r.waterCurr : '-'} | ไฟ: {r.elecPrev}&rarr;{r.elecCurr > 0 ? r.elecCurr : '-'}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.hasMeterUpdated
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.hasMeterUpdated ? 'บันทึกแล้ว' : 'รอกรอก'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 3: BATCH VIEW (CARDS ON MOBILE + TABLE ON DESKTOP)
          ========================================================================= */}
      {activeTabMode === 'batch' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* Header Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>ตารางบันทึกมิเตอร์แบบชุด (Batch Quick Entry)</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {selectedBuilding === 'all' ? 'ทุกอาคาร' : selectedBuilding} ({buildingRooms.length} ห้อง)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                แก้ไขและบันทึกข้อมูลมิเตอร์ได้พร้อมกันทุกห้อง สะดวกสำหรับเปิดทำรายการบนมือถือหรือพิมพ์ส่งออก
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Card / Table View Toggle for Mobile */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setBatchViewStyle('cards')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    batchViewStyle === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>การ์ดมือถือ</span>
                </button>
                <button
                  onClick={() => setBatchViewStyle('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    batchViewStyle === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>ตารางกว้าง</span>
                </button>
              </div>

              {/* Export Excel */}
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ส่งออก Excel</span>
              </button>

              {/* Export PDF */}
              <button
                onClick={handleExportPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'สร้าง PDF...' : 'ส่งออก PDF'}</span>
              </button>
            </div>
          </div>

          {/* Banner message */}
          {exportMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{exportMessage}</span>
              </div>
              <button onClick={() => setExportMessage(null)}>✕</button>
            </div>
          )}

          {/* Sub-mode A: Mobile Batch Card View */}
          {batchViewStyle === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {buildingRooms.map((r) => (
                <MobileBatchRoomCard
                  key={`${r.building}-${r.roomNo}`}
                  room={r}
                  waterRate={waterRate}
                  elecRate={elecRate}
                  perPersonRate={config.waterPerPersonRateDefault || 100}
                  isCaretaker={isCaretaker}
                  onSave={(w, e, mode, occ, tName, pBal) => {
                    if (saveHandler) {
                      saveHandler(r.building, r.roomNo, w, e, mode, occ, tName, pBal);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            /* Sub-mode B: Desktop Batch Wide Table View */
            <div ref={batchTableRef} className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">ห้อง</th>
                    <th className="py-2.5 px-3 min-w-[140px]">ชื่อผู้เช่า</th>
                    <th className="py-2.5 px-3 w-20">คน</th>
                    <th className="py-2.5 px-3">ค่าน้ำ</th>
                    <th className="py-2.5 px-3">น้ำเดิม</th>
                    <th className="py-2.5 px-3 w-24">น้ำใหม่</th>
                    <th className="py-2.5 px-3">ไฟเดิม</th>
                    <th className="py-2.5 px-3 w-24">ไฟใหม่</th>
                    <th className="py-2.5 px-3 w-28">ค้าง/ปรับปรุง (฿)</th>
                    {!isCaretaker && <th className="py-2.5 px-3 text-right">ยอดรวม</th>}
                    <th className="py-2.5 px-3 text-center">บันทึก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {buildingRooms.map((r) => (
                    <BatchTableRow
                      key={`${r.building}-${r.roomNo}`}
                      room={r}
                      waterRate={waterRate}
                      elecRate={elecRate}
                      perPersonRate={config.waterPerPersonRateDefault || 100}
                      isCaretaker={isCaretaker}
                      onSave={(w, e, mode, occ, tName, pBal) => {
                        if (saveHandler) {
                          saveHandler(r.building, r.roomNo, w, e, mode, occ, tName, pBal);
                        }
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// MOBILE BATCH ROOM CARD (การ์ดบันทึกด่วนสำหรับมือถือ)
// =========================================================================
interface MobileBatchRoomCardProps {
  room: RoomRecord;
  waterRate: number;
  elecRate: number;
  perPersonRate: number;
  isCaretaker?: boolean;
  onSave: (waterCurr: number, elecCurr: number, mode: WaterCalcType, occupants: number, tenantName: string, previousBalance: number) => void;
}

const MobileBatchRoomCard: React.FC<MobileBatchRoomCardProps> = ({
  room,
  waterRate,
  elecRate,
  perPersonRate,
  isCaretaker,
  onSave
}) => {
  const [calcMode, setCalcMode] = useState<WaterCalcType>(room.waterCalcType || 'meter');
  const [tenantName, setTenantName] = useState<string>(room.tenantName || '');
  const [occupants, setOccupants] = useState<number>(room.occupants || 1);
  const [wCurr, setWCurr] = useState<string>(room.waterCurr > 0 ? String(room.waterCurr) : '');
  const [eCurr, setECurr] = useState<string>(room.elecCurr > 0 ? String(room.elecCurr) : '');
  const [prevBal, setPrevBal] = useState<string>(room.previousBalance !== undefined ? String(room.previousBalance) : '0');
  const [saved, setSaved] = useState<boolean>(room.hasMeterUpdated);

  useEffect(() => {
    setCalcMode(room.waterCalcType || 'meter');
    setTenantName(room.tenantName || '');
    setOccupants(room.occupants || 1);
    setWCurr(room.waterCurr > 0 ? String(room.waterCurr) : '');
    setECurr(room.elecCurr > 0 ? String(room.elecCurr) : '');
    setPrevBal(room.previousBalance !== undefined ? String(room.previousBalance) : '0');
    setSaved(room.hasMeterUpdated);
  }, [room]);

  const isPerPerson = calcMode === 'per_person';
  const numWCurr = Number(wCurr) || 0;
  const numECurr = Number(eCurr) || 0;
  const numPrevBal = Number(prevBal) || 0;

  const wUnits = isPerPerson ? 0 : Math.max(0, numWCurr - room.waterPrev);
  const eUnits = Math.max(0, numECurr - room.elecPrev);

  const handleSave = () => {
    onSave(numWCurr, numECurr, calcMode, occupants, tenantName, numPrevBal);
    setSaved(true);
  };

  return (
    <div className={`p-3.5 rounded-2xl border transition shadow-2xs space-y-3 ${
      saved ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center">
            {room.roomNo}
          </span>
          <div>
            <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px]">
              {tenantName || 'ห้องว่าง'}
            </span>
            <span className="text-[10px] text-slate-500">
              {occupants} คน • {room.building}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setCalcMode(prev => prev === 'meter' ? 'per_person' : 'meter');
            setSaved(false);
          }}
          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
            isPerPerson ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-blue-800 border-blue-300'
          }`}
        >
          {isPerPerson ? 'น้ำเหมา' : 'น้ำมิเตอร์'}
        </button>
      </div>

      {/* Dual Meter Inputs */}
      <div className="grid grid-cols-2 gap-2">
        {/* Water */}
        <div className="p-2 bg-blue-50/50 rounded-xl border border-blue-200">
          <div className="flex justify-between text-[10px] text-blue-900 font-bold mb-1">
            <span>💧 น้ำ (เดิม {room.waterPrev})</span>
            {wUnits > 0 && <span className="text-blue-700">+{wUnits}น.</span>}
          </div>
          {isPerPerson ? (
            <div className="text-xs font-bold text-emerald-800 text-center py-1">
              เหมา {occupants}คน
            </div>
          ) : (
            <input
              type="number"
              placeholder={String(room.waterPrev)}
              value={wCurr}
              onChange={(e) => {
                setWCurr(e.target.value);
                setSaved(false);
              }}
              className="w-full bg-white border border-blue-300 rounded-lg py-1 px-2 text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Electricity */}
        <div className="p-2 bg-amber-50/50 rounded-xl border border-amber-200">
          <div className="flex justify-between text-[10px] text-amber-900 font-bold mb-1">
            <span>⚡ ไฟ (เดิม {room.elecPrev})</span>
            {eUnits > 0 && <span className="text-amber-700">+{eUnits}น.</span>}
          </div>
          <input
            type="number"
            placeholder={String(room.elecPrev)}
            value={eCurr}
            onChange={(e) => {
              setECurr(e.target.value);
              setSaved(false);
            }}
            className="w-full bg-white border border-amber-300 rounded-lg py-1 px-2 text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Arrears / Adjustment Input */}
      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
          ค้าง/ปรับปรุง (฿):
        </span>
        <input
          type="number"
          step="any"
          placeholder="0"
          value={prevBal}
          onChange={(e) => {
            setPrevBal(e.target.value);
            setSaved(false);
          }}
          className="w-28 bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs font-mono font-bold text-right text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Save Action */}
      <div className="flex items-center justify-between pt-1">
        <span className={`text-[10px] font-bold ${saved ? 'text-emerald-700' : 'text-slate-400'}`}>
          {saved ? '✓ บันทึกแล้ว' : 'ยังไม่บันทึก'}
        </span>
        <button
          type="button"
          onClick={handleSave}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
            saved
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
          }`}
        >
          {saved ? 'บันทึกอีกครั้ง' : '💾 บันทึกห้องนี้'}
        </button>
      </div>
    </div>
  );
};

// =========================================================================
// DESKTOP BATCH TABLE ROW
// =========================================================================
interface BatchTableRowProps {
  room: RoomRecord;
  waterRate: number;
  elecRate: number;
  perPersonRate: number;
  isCaretaker?: boolean;
  onSave: (waterCurr: number, elecCurr: number, mode: WaterCalcType, occupants: number, tenantName: string, previousBalance: number) => void;
}

const BatchTableRow: React.FC<BatchTableRowProps> = ({ room, waterRate, elecRate, perPersonRate, isCaretaker, onSave }) => {
  const [calcMode, setCalcMode] = useState<WaterCalcType>(room.waterCalcType || 'meter');
  const [tenantName, setTenantName] = useState<string>(room.tenantName || '');
  const [occupants, setOccupants] = useState<number>(room.occupants || 1);
  const [wCurr, setWCurr] = useState<number>(room.waterCurr > 0 ? room.waterCurr : room.waterPrev);
  const [eCurr, setECurr] = useState<number>(room.elecCurr > 0 ? room.elecCurr : room.elecPrev);
  const [prevBal, setPrevBal] = useState<string>(room.previousBalance !== undefined ? String(room.previousBalance) : '0');
  const [saved, setSaved] = useState<boolean>(room.hasMeterUpdated);

  useEffect(() => {
    setCalcMode(room.waterCalcType || 'meter');
    setTenantName(room.tenantName || '');
    setOccupants(room.occupants || 1);
    setWCurr(room.waterCurr > 0 ? room.waterCurr : room.waterPrev);
    setECurr(room.elecCurr > 0 ? room.elecCurr : room.elecPrev);
    setPrevBal(room.previousBalance !== undefined ? String(room.previousBalance) : '0');
    setSaved(room.hasMeterUpdated);
  }, [room]);

  const isPerPerson = calcMode === 'per_person';
  const numPrevBal = Number(prevBal) || 0;

  let wCost = 0;
  let wUnits = 0;
  if (isPerPerson) {
    wCost = occupants * (room.waterPerPersonRate || perPersonRate);
    wUnits = 0;
  } else {
    wUnits = Math.max(0, wCurr - room.waterPrev);
    wCost = wUnits * waterRate;
  }

  const eUnits = Math.max(0, eCurr - room.elecPrev);
  const eCost = eUnits * elecRate;
  const monthlyTotal = room.rent + wCost + eCost + room.otherFees;
  const grandTotal = monthlyTotal + numPrevBal;

  const handleSave = () => {
    onSave(wCurr, eCurr, calcMode, occupants, tenantName, numPrevBal);
    setSaved(true);
  };

  const toggleMode = () => {
    const next = calcMode === 'per_person' ? 'meter' : 'per_person';
    setCalcMode(next);
    setSaved(false);
  };

  return (
    <tr className="hover:bg-slate-50/70">
      <td className="py-2.5 px-3 font-bold text-slate-900">{room.roomNo}</td>
      
      {/* Editable Tenant Name */}
      <td className="py-2.5 px-3">
        <input
          type="text"
          value={tenantName}
          placeholder="ชื่อผู้เช่า"
          onChange={(e) => {
            setTenantName(e.target.value);
            setSaved(false);
          }}
          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>

      {/* Editable Occupant Count */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="1"
            max="20"
            value={occupants}
            onChange={(e) => {
              setOccupants(Math.max(1, Number(e.target.value) || 1));
              setSaved(false);
            }}
            className="w-12 bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-bold font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-[11px] text-slate-500">คน</span>
        </div>
      </td>
      
      {/* Water Calc Type Toggle */}
      <td className="py-2.5 px-3">
        <button
          onClick={toggleMode}
          className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
            isPerPerson
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
          }`}
        >
          {isPerPerson ? (
            <>
              <Users className="w-3 h-3 text-emerald-600" />
              <span>เหมา {occupants}คน</span>
            </>
          ) : (
            <>
              <Droplet className="w-3 h-3 text-blue-600" />
              <span>ตามมิเตอร์</span>
            </>
          )}
        </button>
      </td>

      <td className="py-2.5 px-3 text-slate-500 font-mono">{room.waterPrev}</td>
      <td className="py-2.5 px-3">
        <input
          type="number"
          disabled={isPerPerson}
          value={isPerPerson ? '' : wCurr}
          placeholder={isPerPerson ? 'เหมาจ่าย' : 'เลขใหม่'}
          onChange={(e) => {
            setWCurr(Number(e.target.value));
            setSaved(false);
          }}
          className={`w-20 px-2 py-1 rounded font-mono text-xs font-semibold focus:outline-none focus:ring-1 ${
            isPerPerson
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed text-center'
              : 'bg-white border border-sky-200 focus:ring-sky-500'
          }`}
        />
      </td>

      <td className="py-2.5 px-3 text-slate-500 font-mono">{room.elecPrev}</td>
      <td className="py-2.5 px-3">
        <input
          type="number"
          value={eCurr}
          onChange={(e) => {
            setECurr(Number(e.target.value));
            setSaved(false);
          }}
          className="w-20 px-2 py-1 bg-white border border-amber-200 rounded font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </td>

      {/* Editable Arrears / Adjustment Input */}
      <td className="py-2.5 px-3">
        <input
          type="number"
          step="any"
          value={prevBal}
          placeholder="0"
          onChange={(e) => {
            setPrevBal(e.target.value);
            setSaved(false);
          }}
          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs font-semibold text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </td>

      {!isCaretaker && (
        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
          ฿{grandTotal.toLocaleString()}
        </td>
      )}

      <td className="py-2.5 px-3 text-center">
        <button
          onClick={handleSave}
          className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
            saved
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? 'บันทึกแล้ว' : 'บันทึก'}
        </button>
      </td>
    </tr>
  );
};
