import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Calendar, 
  Tag, 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp as TrendIcon, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Download, 
  FileText, 
  AlertCircle, 
  Receipt, 
  Sparkles,
  Zap,
  Wrench,
  Shield,
  Wifi,
  Package,
  Users,
  MoreHorizontal,
  ArrowRight,
  HelpCircle,
  EyeOff
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area,
  Line
} from 'recharts';
import { ExpenseRecord, ExpenseCategory, RoomRecord, AppUser } from '../types';
import { EXPENSE_CATEGORY_CONFIG } from '../data/mockData';

interface ExpenseDashboardSectionProps {
  expenses: ExpenseRecord[];
  rooms: RoomRecord[];
  buildings: string[];
  activeMonth: string;
  currentUser?: AppUser;
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpenseDashboardSection: React.FC<ExpenseDashboardSectionProps> = ({
  expenses,
  rooms,
  buildings,
  activeMonth,
  currentUser,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const isCaretaker = currentUser?.role === 'caretaker';
  
  // Filter states
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(activeMonth);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chartViewMode, setChartViewMode] = useState<'category' | 'comparison' | 'trend'>('category');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState<{
    building: string;
    title: string;
    category: ExpenseCategory;
    amount: string;
    date: string;
    month: string;
    notes: string;
    recordedBy: string;
  }>({
    building: buildings[0] || 'อาคารดอนเมือง',
    title: '',
    category: 'utility_bills',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    month: activeMonth,
    notes: '',
    recordedBy: currentUser?.name || 'คุณแม่',
  });

  // All possible building choices including Central / HQ
  const buildingOptions = useMemo(() => {
    return [...buildings, 'ส่วนกลาง/สำนักงาน'];
  }, [buildings]);

  // Open modal for add
  const handleOpenAddModal = (presetTitle?: string, presetCat?: ExpenseCategory) => {
    setFormData({
      building: selectedBuilding !== 'ALL' ? selectedBuilding : (buildings[0] || 'อาคารดอนเมือง'),
      title: presetTitle || '',
      category: presetCat || 'utility_bills',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      month: selectedMonthFilter !== 'ALL' ? selectedMonthFilter : activeMonth,
      notes: '',
      recordedBy: currentUser?.name || 'คุณแม่',
    });
    setEditingExpense(null);
    setIsAddModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (exp: ExpenseRecord) => {
    setEditingExpense(exp);
    setFormData({
      building: exp.building,
      title: exp.title,
      category: exp.category,
      amount: exp.amount.toString(),
      date: exp.date,
      month: exp.month,
      notes: exp.notes || '',
      recordedBy: exp.recordedBy || currentUser?.name || 'คุณแม่',
    });
    setIsAddModalOpen(true);
  };

  // Save handler
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount);
    if (!formData.title.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('กรุณากรอกชื่อรายการและจำนวนเงินให้ถูกต้อง');
      return;
    }

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        building: formData.building,
        title: formData.title.trim(),
        category: formData.category,
        amount: numAmount,
        date: formData.date,
        month: formData.month,
        notes: formData.notes.trim() || undefined,
        recordedBy: formData.recordedBy,
      });
    } else {
      onAddExpense({
        building: formData.building,
        title: formData.title.trim(),
        category: formData.category,
        amount: numAmount,
        date: formData.date,
        month: formData.month,
        notes: formData.notes.trim() || undefined,
        recordedBy: formData.recordedBy,
      });
    }

    setIsAddModalOpen(false);
    setEditingExpense(null);
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Building filter
      if (selectedBuilding !== 'ALL' && exp.building !== selectedBuilding) {
        return false;
      }
      // Month filter
      if (selectedMonthFilter !== 'ALL' && exp.month !== selectedMonthFilter) {
        return false;
      }
      // Category filter
      if (selectedCategoryFilter !== 'ALL' && exp.category !== selectedCategoryFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = exp.title.toLowerCase().includes(q);
        const matchBld = exp.building.toLowerCase().includes(q);
        const matchNotes = (exp.notes || '').toLowerCase().includes(q);
        const matchCat = EXPENSE_CATEGORY_CONFIG[exp.category]?.label.toLowerCase().includes(q);
        return matchTitle || matchBld || matchNotes || matchCat;
      }
      return true;
    });
  }, [expenses, selectedBuilding, selectedMonthFilter, selectedCategoryFilter, searchQuery]);

  // Relevant rooms based on building filter
  const relevantRooms = useMemo(() => {
    if (selectedBuilding === 'ALL' || selectedBuilding === 'ส่วนกลาง/สำนักงาน') {
      return rooms;
    }
    return rooms.filter(r => r.building === selectedBuilding);
  }, [rooms, selectedBuilding]);

  // Financial Metrics
  const metrics = useMemo(() => {
    // 1. Total Revenue from relevant rooms in current active month
    const totalRevenue = relevantRooms.reduce((sum, r) => {
      const roomTotal = r.grandTotal !== undefined && r.grandTotal !== null ? r.grandTotal : (r.total || 0);
      return sum + roomTotal;
    }, 0);

    const collectedRevenue = relevantRooms.filter(r => r.isPaid).reduce((sum, r) => {
      const roomTotal = r.grandTotal !== undefined && r.grandTotal !== null ? r.grandTotal : (r.total || 0);
      return sum + roomTotal;
    }, 0);

    // 2. Total Expenses in current filtered view
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // 3. Net Operating Profit & Margin
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // 4. Group by Category for current view
    const categoryTotals: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    let topCategory = { category: 'none', label: '-', amount: 0, percentage: 0 };
    let maxCatAmount = 0;
    Object.entries(categoryTotals).forEach(([catKey, amount]) => {
      if (amount > maxCatAmount) {
        maxCatAmount = amount;
        topCategory = {
          category: catKey,
          label: EXPENSE_CATEGORY_CONFIG[catKey as ExpenseCategory]?.label || catKey,
          amount,
          percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        };
      }
    });

    return {
      totalRevenue,
      collectedRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      categoryTotals,
      topCategory,
      expenseCount: filteredExpenses.length,
    };
  }, [relevantRooms, filteredExpenses]);

  // Chart Data 1: Category Breakdown (Donut Chart)
  const categoryChartData = useMemo(() => {
    const data = Object.entries(metrics.categoryTotals).map(([catKey, val]) => {
      const amount = typeof val === 'number' ? val : Number(val) || 0;
      const cfg = EXPENSE_CATEGORY_CONFIG[catKey as ExpenseCategory];
      return {
        name: cfg?.label || catKey,
        rawCategory: catKey,
        value: amount,
        color: cfg?.color || '#94a3b8',
        percentage: metrics.totalExpenses > 0 ? Math.round((amount / metrics.totalExpenses) * 100) : 0,
      };
    });
    // Sort descending
    return data.sort((a, b) => (b.value as number) - (a.value as number));
  }, [metrics.categoryTotals, metrics.totalExpenses]);

  // Chart Data 2: Building Comparison (Revenue vs. Expenses vs. Net Profit)
  const buildingComparisonData = useMemo(() => {
    const list = [...buildings, 'ส่วนกลาง/สำนักงาน'];
    return list.map(bldName => {
      const bldRooms = rooms.filter(r => r.building === bldName);
      const rev = bldRooms.reduce((sum, r) => sum + (r.grandTotal || r.total || 0), 0);
      
      const bldExps = expenses.filter(exp => {
        const matchBld = exp.building === bldName;
        const matchMonth = selectedMonthFilter === 'ALL' || exp.month === selectedMonthFilter;
        return matchBld && matchMonth;
      });
      const expTotal = bldExps.reduce((sum, e) => sum + e.amount, 0);
      const profit = rev - expTotal;

      return {
        building: bldName.replace('อาคาร', '').trim() || bldName,
        fullName: bldName,
        รายรับ: rev,
        รายจ่าย: expTotal,
        กำไรสุทธิ: profit,
      };
    });
  }, [buildings, rooms, expenses, selectedMonthFilter]);

  // Chart Data 3: Monthly Trend Data (Comparing months available in data)
  const monthlyTrendData = useMemo(() => {
    const monthList = ['07 ก.ค.', '08 ส.ค.'];
    return monthList.map(m => {
      const mExpenses = expenses.filter(exp => {
        const matchBld = selectedBuilding === 'ALL' || exp.building === selectedBuilding;
        return exp.month === m && matchBld;
      });
      const expTotal = mExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Estimated revenue for month (or current rooms total)
      const revTotal = relevantRooms.reduce((sum, r) => sum + (r.grandTotal || r.total || 0), 0);
      const profit = revTotal - expTotal;

      return {
        month: m,
        รายรับ: revTotal,
        รายจ่าย: expTotal,
        กำไรสุทธิ: profit,
      };
    });
  }, [expenses, selectedBuilding, relevantRooms]);

  // Helper for category badge
  const renderCategoryBadge = (cat: ExpenseCategory) => {
    const cfg = EXPENSE_CATEGORY_CONFIG[cat] || EXPENSE_CATEGORY_CONFIG.other;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.bgClass} ${cfg.textClass}`}>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }}></span>
        {cfg.label}
      </span>
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ลำดับ', 'อาคาร', 'รายการค่าใช้จ่าย', 'หมวดหมู่', 'จำนวนเงิน (บาท)', 'วันที่', 'งวดเดือน', 'ผู้บันทึก', 'หมายเหตุ'];
    const rows = filteredExpenses.map((e, idx) => [
      idx + 1,
      `"${e.building}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${EXPENSE_CATEGORY_CONFIG[e.category]?.label || e.category}"`,
      e.amount,
      e.date,
      e.month,
      `"${e.recordedBy || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานค่าใช้จ่าย_${selectedBuilding === 'ALL' ? 'ทุกอาคาร' : selectedBuilding}_งวด_${selectedMonthFilter}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isCaretaker) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-slate-500">
          <EyeOff className="w-5 h-5 text-amber-500" />
          <p className="text-sm">
            ส่วนค่าใช้จ่ายและผลประกอบการทางการเงินถูกซ่อนอยู่ในโหมดผู้ดูแลหอพัก (Caretaker Mode)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header & Building / Month Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                ส่วนค่าใช้จ่าย & สรุปผลประกอบการ
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Expense & Profit
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึกค่าใช้จ่าย วิเคราะห์สัดส่วนต้นทุน และสรุปกำไรสุทธิตามแต่ละอาคาร
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Building Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <Building2 className="w-4 h-4 text-slate-500 ml-2" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 pr-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">🏢 ทุกอาคาร ({buildings.length} ตึก + ส่วนกลาง)</option>
              {buildingOptions.map((b) => (
                <option key={b} value={b}>
                  📍 {b}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-2" />
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 pr-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ทุกงวดเดือน</option>
              <option value={activeMonth}>งวดปัจจุบัน ({activeMonth})</option>
              <option value="07 ก.ค.">07 ก.ค.</option>
              <option value="06 มิ.ย.">06 มิ.ย.</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title="ส่งออกรายงานค่าใช้จ่ายเป็น CSV/Excel"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ส่งออก CSV</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มค่าใช้จ่าย</span>
          </button>
        </div>
      </div>

      {/* Building Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium whitespace-nowrap text-[11px] mr-1">เลือกดูเฉพาะ:</span>
        <button
          onClick={() => setSelectedBuilding('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
            selectedBuilding === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          ทุกอาคารรวมกัน
        </button>
        {buildingOptions.map((b) => {
          const count = expenses.filter(e => e.building === b && (selectedMonthFilter === 'ALL' || e.month === selectedMonthFilter)).length;
          const sum = expenses
            .filter(e => e.building === b && (selectedMonthFilter === 'ALL' || e.month === selectedMonthFilter))
            .reduce((s, e) => s + e.amount, 0);

          return (
            <button
              key={b}
              onClick={() => setSelectedBuilding(b)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                selectedBuilding === b
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{b}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedBuilding === b ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-600'
              }`}>
                ฿{sum > 0 ? (sum >= 1000 ? `${(sum/1000).toFixed(1)}k` : sum) : '0'}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4 Financial KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900">
              รายรับรวม ({selectedBuilding === 'ALL' ? 'ทุกอาคาร' : selectedBuilding})
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-950">
              ฿{metrics.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-blue-700 mt-1 flex items-center justify-between">
              <span>เก็บแล้ว: ฿{metrics.collectedRevenue.toLocaleString()}</span>
              <span className="font-semibold">{metrics.totalRevenue > 0 ? Math.round((metrics.collectedRevenue / metrics.totalRevenue) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Operating Expenses */}
        <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900">
              รายจ่ายทั้งหมด ({metrics.expenseCount} รายการ)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-950">
              ฿{metrics.totalExpenses.toLocaleString()}
            </div>
            <div className="text-xs text-rose-700 mt-1 flex items-center justify-between">
              <span>งวด {selectedMonthFilter === 'ALL' ? 'ทั้งหมด' : selectedMonthFilter}</span>
              <span className="font-semibold">
                {metrics.totalRevenue > 0 ? `${Math.round((metrics.totalExpenses / metrics.totalRevenue) * 100)}% ของรายรับ` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Net Operating Profit */}
        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">
              กำไรสุทธิจากการดำเนินงาน (Net Profit)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${metrics.netProfit >= 0 ? 'text-emerald-950' : 'text-red-600'}`}>
              ฿{metrics.netProfit.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-800 mt-1 flex items-center justify-between">
              <span>อัตรากำไร (Net Margin):</span>
              <span className="font-black bg-emerald-100 px-2 py-0.5 rounded text-emerald-900">
                {metrics.profitMargin}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Top Expense Category */}
        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">
              หมวดหมู่รายจ่ายสูงสุด
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-amber-950 truncate" title={metrics.topCategory.label}>
              {metrics.topCategory.label}
            </div>
            <div className="text-xs text-amber-800 mt-1 flex items-center justify-between">
              <span>฿{metrics.topCategory.amount.toLocaleString()}</span>
              <span className="font-bold bg-amber-200/80 px-2 py-0.5 rounded text-amber-950">
                {metrics.topCategory.percentage}% ของรายจ่าย
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GRAPH SUMMARY SECTION */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
        {/* Chart View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-slate-900 text-sm">
              กราฟสรุปและวิเคราะห์ค่าใช้จ่าย {selectedBuilding !== 'ALL' ? `(${selectedBuilding})` : '(ภาพรวมทุกอาคาร)'}
            </h4>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold">
            <button
              onClick={() => setChartViewMode('category')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                chartViewMode === 'category'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>สัดส่วนตามหมวดหมู่</span>
            </button>

            <button
              onClick={() => setChartViewMode('comparison')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                chartViewMode === 'comparison'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>เปรียบเทียบรายรับ-รายจ่าย</span>
            </button>

            <button
              onClick={() => setChartViewMode('trend')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                chartViewMode === 'trend'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendIcon className="w-3.5 h-3.5" />
              <span>แนวโน้มตามงวดเดือน</span>
            </button>
          </div>
        </div>

        {/* Chart View Content */}
        {chartViewMode === 'category' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Donut Chart */}
            <div className="lg:col-span-6 h-[260px] flex items-center justify-center">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => [`฿${Number(val).toLocaleString()} บาท`, 'ยอดเงิน']}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  ยังไม่มีข้อมูลรายจ่ายในหมวดหมู่นี้
                </div>
              )}
            </div>

            {/* Category Legend & List with percentage bars */}
            <div className="lg:col-span-6 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {categoryChartData.length > 0 ? (
                categoryChartData.map((item) => (
                  <div key={item.name} className="bg-white p-2.5 rounded-lg border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="font-semibold text-slate-800">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">฿{item.value.toLocaleString()}</span>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  ไม่มีรายการค่าใช้จ่าย
                </div>
              )}
            </div>
          </div>
        )}

        {chartViewMode === 'comparison' && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildingComparisonData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="building" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip 
                  formatter={(val: number) => [`฿${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="รายรับ" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="รายจ่าย" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="กำไรสุทธิ" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartViewMode === 'trend' && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip 
                  formatter={(val: number) => [`฿${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="กำไรสุทธิ" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
                <Area type="monotone" dataKey="รายจ่าย" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Add Preset Buttons */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>บันทึกด่วน:</span>
        </span>
        <button
          onClick={() => handleOpenAddModal('ค่าไฟการไฟฟ้าส่วนกลาง', 'utility_bills')}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition font-medium cursor-pointer"
        >
          ⚡ ค่าไฟการไฟฟ้า
        </button>
        <button
          onClick={() => handleOpenAddModal('ค่าน้ำการประปาส่วนกลาง', 'utility_bills')}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition font-medium cursor-pointer"
        >
          💧 ค่าน้ำประปา
        </button>
        <button
          onClick={() => handleOpenAddModal('ล้างเครื่องปรับอากาศประจำปี', 'maintenance')}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition font-medium cursor-pointer"
        >
          🔧 ล้างแอร์
        </button>
        <button
          onClick={() => handleOpenAddModal('ค่าแม่บ้านทำความสะอาด', 'cleaning_waste')}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition font-medium cursor-pointer"
        >
          🧹 ค่าแม่บ้าน
        </button>
        <button
          onClick={() => handleOpenAddModal('ค่าอินเทอร์เน็ต WiFi หอพัก', 'internet_network')}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition font-medium cursor-pointer"
        >
          📶 อินเทอร์เน็ต
        </button>
        <button
          onClick={() => handleOpenAddModal('เงินเดือนพนักงานดูแล/ช่าง', 'staff_salary')}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition font-medium cursor-pointer"
        >
          👥 เงินเดือน
        </button>
      </div>

      {/* Expense Records List / Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>รายการค่าใช้จ่าย ({filteredExpenses.length} รายการ)</span>
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อรายการ, ผู้บันทึก..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="ALL">ทุกหมวดหมู่ค่าใช้จ่าย</option>
              {Object.entries(EXPENSE_CATEGORY_CONFIG).map(([k, cfg]) => (
                <option key={k} value={k}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase">วันที่ / งวด</th>
                <th className="py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase">อาคาร</th>
                <th className="py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase">รายการค่าใช้จ่าย</th>
                <th className="py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase">หมวดหมู่</th>
                <th className="py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase text-right">จำนวนเงิน</th>
                <th className="py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase">ผู้บันทึก / หมายเหตุ</th>
                <th className="py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    ไม่พบรายการค่าใช้จ่ายที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-mono font-medium text-slate-700">{exp.date}</div>
                      <div className="text-[10px] text-slate-400">{exp.month}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {exp.building}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{exp.title}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {renderCategoryBadge(exp.category)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <span className="font-mono font-bold text-rose-600 text-sm">
                        ฿{exp.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                      <div>บันทึกโดย: <strong className="text-slate-700">{exp.recordedBy || '-'}</strong></div>
                      {exp.createdAt && <div className="text-[10px] text-slate-400">{exp.createdAt}</div>}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(exp)}
                          title="แก้ไขรายการ"
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`ยืนยันลบรายการ "${exp.title}" จำนวน ฿${exp.amount.toLocaleString()}?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          title="ลบรายการ"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingExpense ? 'แก้ไขรายการค่าใช้จ่าย' : 'บันทึกค่าใช้จ่ายใหม่'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 mt-4 text-xs">
              {/* Building & Month Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อาคาร / สถานที่:</label>
                  <select
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    required
                  >
                    {buildingOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">งวดประจำเดือน:</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    required
                  >
                    <option value={activeMonth}>{activeMonth} (งวดปัจจุบัน)</option>
                    <option value="07 ก.ค.">07 ก.ค.</option>
                    <option value="06 มิ.ย.">06 มิ.ย.</option>
                    <option value="05 พ.ค.">05 พ.ค.</option>
                  </select>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อรายการค่าใช้จ่าย *:</label>
                <input
                  type="text"
                  placeholder="เช่น ค่าไฟการไฟฟ้านครหลวง, ล้างแอร์ห้อง 101, ซ่อมปั๊มน้ำ"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  required
                />
              </div>

              {/* Category & Amount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">หมวดหมู่ค่าใช้จ่าย:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    required
                  >
                    {Object.entries(EXPENSE_CATEGORY_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">จำนวนเงิน (บาท) *:</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">฿</span>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-sm text-rose-600"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Date & Recorded By Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">วันที่จ่ายเงิน:</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ผู้บันทึกรายการ:</label>
                  <input
                    type="text"
                    value={formData.recordedBy}
                    onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="เช่น คุณแม่, สมศักดิ์"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">หมายเหตุ / รายละเอียดเพิ่มเติม:</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="เช่น เลขที่ใบเสร็จ, เบอร์ช่าง, ซ่อมอะไรไปบ้าง..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingExpense ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
