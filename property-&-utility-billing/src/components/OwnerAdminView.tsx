import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Crown, 
  HardHat, 
  Trash2, 
  Edit3, 
  KeyRound, 
  Phone, 
  Mail, 
  User, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Eye, 
  EyeOff, 
  X, 
  Save, 
  ShieldAlert, 
  Sparkles,
  Info,
  Calendar,
  Check
} from 'lucide-react';
import { AppUser, UserRole } from '../types';

interface OwnerAdminViewProps {
  users: AppUser[];
  currentUser: AppUser;
  onAddUser: (newUser: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onUpdateUser: (updatedUser: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  isSeniorMode?: boolean;
}

export const OwnerAdminView: React.FC<OwnerAdminViewProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  isSeniorMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'owner' | 'caretaker' | 'user'>('ALL');
  
  // Add User State
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newUsername, setNewUsername] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('caretaker');
  const [newAvatar, setNewAvatar] = useState<string>('👷‍♂️');
  const [newNotes, setNewNotes] = useState<string>('');
  const [addError, setAddError] = useState<string>('');
  const [addSuccess, setAddSuccess] = useState<string>('');

  // Edit User State
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editRole, setEditRole] = useState<UserRole>('caretaker');
  const [editAvatar, setEditAvatar] = useState<string>('👷‍♂️');
  const [editNotes, setEditNotes] = useState<string>('');
  const [showEditPass, setShowEditPass] = useState<boolean>(false);

  // Security check: Only owner role can view this admin dashboard
  if (currentUser.role !== 'owner') {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border-2 border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          ปฏิเสธการเข้าถึง (Access Denied)
        </h2>
        <p className="text-sm text-slate-600">
          หน้าการจัดการผู้ใช้งานระบบนี้สงวนสิทธิ์สำหรับบัญชีระดับ <strong>เจ้าของหอ (Owner)</strong> เท่านั้น
          บัญชีของคุณ ({currentUser.name}) เป็นระดับผู้ใช้งานทั่วไป/พนักงาน ไม่สามารถดูหรือแก้ไขรายชื่อผู้ใช้ได้
        </p>
      </div>
    );
  }

  const cleanPhone = (val?: string) => (val || '').replace(/[^0-9]/g, '');

  // Handle Create User
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!newName.trim()) {
      setAddError('กรุณาระบุชื่อผู้ใช้งาน');
      return;
    }
    if (!newPassword.trim()) {
      setAddError('กรุณาระบุรหัสผ่านเริ่มต้นสำหรับผู้ใช้งานใหม่');
      return;
    }

    const usernameVal = newUsername.trim().toLowerCase() || `user_${Date.now().toString().slice(-4)}`;

    // Check duplicate username
    const exists = users.some(u => u.username && u.username.toLowerCase() === usernameVal);
    if (exists) {
      setAddError(`ชื่อผู้ใช้ "${usernameVal}" มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น`);
      return;
    }

    const phoneVal = newPhone.trim();
    const pinVal = cleanPhone(phoneVal) || cleanPhone(newPassword) || newPassword;

    onAddUser({
      name: newName.trim(),
      username: usernameVal,
      email: newEmail.trim() || undefined,
      password: newPassword.trim(),
      role: newRole,
      avatar: newAvatar,
      phone: phoneVal || undefined,
      pinCode: pinVal || undefined,
      notes: newNotes.trim() || (newRole === 'owner' ? 'เจ้าของหอพัก / ผู้บริหาร' : 'พนักงานดูแลหอพัก & จดมิเตอร์'),
      isMom: false,
    });

    setAddSuccess(`เพิ่มผู้ใช้งาน "${newName.trim()}" ในระบบสำเร็จแล้ว!`);
    setNewName('');
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewPhone('');
    setNewNotes('');
    setNewRole('caretaker');
    setIsAddingUser(false);
  };

  // Handle Start Edit
  const handleStartEdit = (u: AppUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditUsername(u.username || '');
    setEditEmail(u.email || '');
    setEditPassword(u.password || u.pinCode || '1234');
    setEditPhone(u.phone || '');
    setEditRole(u.role);
    setEditAvatar(u.avatar || (u.role === 'owner' ? '👑' : '👷‍♂️'));
    setEditNotes(u.notes || '');
  };

  // Handle Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const phoneVal = editPhone.trim();
    const pinVal = cleanPhone(phoneVal) || cleanPhone(editPassword) || editPassword;

    const updated: AppUser = {
      ...editingUser,
      name: editName.trim() || editingUser.name,
      username: editUsername.trim().toLowerCase() || editingUser.username,
      email: editEmail.trim() || undefined,
      password: editPassword.trim() || editingUser.password,
      phone: phoneVal || undefined,
      pinCode: pinVal || undefined,
      role: editRole,
      avatar: editAvatar,
      notes: editNotes.trim() || undefined,
    };

    onUpdateUser(updated);
    setEditingUser(null);
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchUser = u.username?.toLowerCase().includes(q);
      const matchPhone = u.phone?.includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      return matchName || matchUser || matchPhone || matchEmail;
    }
    return true;
  });

  const ownerCount = users.filter(u => u.role === 'owner').length;
  const userCount = users.filter(u => u.role !== 'owner').length;

  return (
    <div className="space-y-6 animate-fade-in font-google-sans">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
            <Crown className="w-3.5 h-3.5" />
            <span>Owner Administration • แผงควบคุมเจ้าของหอพัก</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>ระบบจัดการผู้ใช้งาน & กำหนดสิทธิ์ (RBAC)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            จัดการบัญชีผู้ใช้งาน เพิ่มพนักงาน กำหนดชื่อผู้ใช้/รหัสผ่าน และสิทธิ์การเข้าถึงข้อมูลระบบบริหารหอพัก
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsAddingUser(true);
              setEditingUser(null);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 text-xs sm:text-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มผู้ใช้งานใหม่</span>
          </button>
        </div>
      </div>

      {/* Stats KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">ผู้ใช้งานทั้งหมดในระบบ</div>
            <div className="text-xl font-bold text-slate-900">{users.length} <span className="text-xs font-normal text-slate-500">บัญชี</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">สิทธิ์เจ้าของหอ (Owner)</div>
            <div className="text-xl font-bold text-amber-700">{ownerCount} <span className="text-xs font-normal text-slate-500">บัญชี</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">ผู้ใช้งานทั่วไป / พนักงาน (User)</div>
            <div className="text-xl font-bold text-blue-700">{userCount} <span className="text-xs font-normal text-slate-500">บัญชี</span></div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {addSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{addSuccess}</span>
          </div>
          <button onClick={() => setAddSuccess('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* ADD NEW USER FORM MODAL / COLLAPSIBLE */}
      {isAddingUser && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-indigo-300 shadow-xl overflow-hidden animate-fade-in">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base">สร้างบัญชีผู้ใช้งานใหม่ (Add New User)</h3>
            </div>
            <button
              onClick={() => setIsAddingUser(false)}
              className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="p-5 sm:p-6 space-y-4">
            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล หรือชื่อเล่น <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น สมศักดิ์ (ช่างไฟ), น้องพลอย"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อผู้ใช้สำหรับล็อกอิน (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="เช่น somsak, staff2, owner2"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสผ่านเริ่มต้น (Initial Password) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="เช่น pass1234 หรือ 0891234567"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ระดับสิทธิ์การใช้งาน (Role) <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => {
                    const r = e.target.value as UserRole;
                    setNewRole(r);
                    if (r === 'owner') setNewAvatar('👑');
                    else setNewAvatar('👷‍♂️');
                  }}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="caretaker">👷‍♂️ User / พนักงาน (จดมิเตอร์ ดูแลห้องพัก - ซ่อนยอดเงิน)</option>
                  <option value="owner">👑 Owner / เจ้าของหอ (สิทธิ์เต็ม ดูยอดเงิน จัดการผู้ใช้)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ (สำหรับใช้ล็อกอินแบบ PIN)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อีเมล (ถ้ามี)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Avatar & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ไอคอนประจำตัว (Avatar)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['👑', '👩‍💼', '👷‍♂️', '👨‍🔧', '🧑‍💻', '👵', '👩', '👨'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewAvatar(emoji)}
                      className={`p-2 rounded-xl border text-lg transition cursor-pointer ${
                        newAvatar === emoji ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หน้าที่ความรับผิดชอบ / หมายเหตุ
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="เช่น ดูแลจดมิเตอร์อาคารดอนเมือง ทุกสิ้นเดือน"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกบัญชีผู้ใช้งาน</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">แก้ไขข้อมูลผู้ใช้: {editingUser.name}</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อผู้ใช้ (Username)
                    </label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      สิทธิ์ (Role)
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="caretaker">👷‍♂️ User / พนักงาน</option>
                      <option value="owner">👑 Owner / เจ้าของหอ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่าน (Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPass ? 'text' : 'password'}
                      required
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-10 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPass(!showEditPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showEditPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หมายเหตุ / ความรับผิดชอบ
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, username, เบอร์โทร..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">กรองสิทธิ์:</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                roleFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('owner')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                roleFilter === 'owner' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👑 เจ้าของ ({ownerCount})
            </button>
            <button
              onClick={() => setRoleFilter('caretaker')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                roleFilter === 'caretaker' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👷‍♂️ พนักงาน ({userCount})
            </button>
          </div>
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              รายชื่อผู้ใช้งานและข้อมูลการเข้าสู่ระบบ ({filteredUsers.length} รายการ)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            * คลิกไอคอนแก้ไขเพื่อเปลี่ยนรหัสผ่าน หรือคลิกถังขยะเพื่อลบบัญชี
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">ผู้ใช้งาน</th>
                <th className="py-3 px-4">ชื่อผู้ใช้ (Username)</th>
                <th className="py-3 px-4">ระดับสิทธิ์ (Role)</th>
                <th className="py-3 px-4">เบอร์โทรศัพท์ / PIN</th>
                <th className="py-3 px-4">รหัสผ่าน (Password)</th>
                <th className="py-3 px-4">วันที่สร้าง</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser.id;
                const isOwner = u.role === 'owner';

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isCurrent ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    {/* User Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl shrink-0">{u.avatar || (isOwner ? '👑' : '👷‍♂️')}</div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                บัญชีคุณ
                              </span>
                            )}
                          </div>
                          {u.notes && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{u.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-xs">
                        {u.username || 'staff'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {isOwner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                          <span>Owner (เจ้าของ)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                          <HardHat className="w-3.5 h-3.5 text-blue-600" />
                          <span>User (พนักงาน)</span>
                        </span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.phone || '-'}</span>
                      </div>
                    </td>

                    {/* Password */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-slate-800 font-semibold bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        {u.password || u.pinCode || '••••••••'}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                      {u.createdAt || '2025-01-01'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(u)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="แก้ไขข้อมูล / เปลี่ยนรหัสผ่าน"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={isCurrent || (isOwner && ownerCount <= 1)}
                          onClick={() => {
                            if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน "${u.name}" ออกจากระบบ?`)) {
                              onDeleteUser(u.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            isCurrent || (isOwner && ownerCount <= 1)
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                          }`}
                          title={
                            isCurrent
                              ? 'ไม่สามารถลบบัญชีที่กำลังล็อกอินอยู่ได้'
                              : isOwner && ownerCount <= 1
                              ? 'ต้องมีบัญชีระดับ Owner อย่างน้อย 1 บัญชี'
                              : 'ลบผู้ใช้งานนี้'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Permission Matrix Guide */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm sm:text-base">ตารางสิทธิ์การใช้งาน (Role-Based Access Matrix)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span>👑 Owner (เจ้าของหอพัก / ผู้บริหาร)</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>เข้าถึงแผงควบคุมเจ้าของหอ (Owner Administration)</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>เพิ่ม, แก้ไข, ลบบัญชีผู้ใช้งานระบบได้ทั้งหมด</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>ดูสรุปยอดรายได้, กำไรสุทธิ, ค่าใช้จ่าย และยอดหนี้สิน</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>พิมพ์ใบแจ้งหนี้, Export PDF, ตั้งค่าพร้อมเพย์และอัตราค่าน้ำไฟ</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
            <div className="font-bold text-blue-300 flex items-center gap-2">
              <HardHat className="w-4 h-4" />
              <span>👷‍♂️ User / Caretaker (พนักงานดูแลหอพัก)</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>เข้าใช้งาน Dashboard สรุปห้องพักและระบบจดมิเตอร์น้ำไฟ</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกและอัปเดตเลขมิเตอร์น้ำ-ไฟประจำเดือน</span>
              </li>
              <li className="flex items-center gap-2 text-red-400">
                <X className="w-3.5 h-3.5" />
                <span><strong>ไม่มีสิทธิ์</strong> เข้าถึงหรือจัดการบัญชีผู้ใช้งานระบบ</span>
              </li>
              <li className="flex items-center gap-2 text-red-400">
                <X className="w-3.5 h-3.5" />
                <span><strong>ซ่อนข้อมูล</strong> รายได้รวมและกำไรทางการเงินเพื่อความปลอดภัย</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};
