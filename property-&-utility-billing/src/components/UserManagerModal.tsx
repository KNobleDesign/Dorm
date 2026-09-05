import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';
import { 
  Users, 
  UserCheck, 
  Plus, 
  X, 
  Check, 
  Lock, 
  Phone, 
  Crown, 
  Info, 
  Trash2, 
  Edit3, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';

interface UserManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser;
  onAddUser: (newUser: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onUpdateUser?: (updatedUser: AppUser) => void;
  onDeleteUser?: (userId: string) => void;
  initialTab?: 'accounts' | 'my-pin';
  isSeniorMode?: boolean;
}

// Utility to clean phone numbers for comparison
const cleanPhone = (val?: string) => (val || '').replace(/[^0-9]/g, '');

export const UserManagerModal: React.FC<UserManagerModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  initialTab = 'accounts',
  isSeniorMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'my-pin'>(
    initialTab === 'my-pin' ? 'my-pin' : 'accounts'
  );
  
  // Add User Form State
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newUsername, setNewUsername] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('caretaker');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newPinCode, setNewPinCode] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newAvatar, setNewAvatar] = useState<string>('👷‍♂️');

  // Edit User State
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editRole, setEditRole] = useState<UserRole>('caretaker');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editPinCode, setEditPinCode] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Self-service Password Change State (Tab: my-pin)
  const [myNewPassword, setMyNewPassword] = useState<string>('');
  const [myConfirmPassword, setMyConfirmPassword] = useState<string>('');
  const [showMyPassText, setShowMyPassText] = useState<boolean>(false);
  const [myPinSuccess, setMyPinSuccess] = useState<string>('');
  const [myPinError, setMyPinError] = useState<string>('');

  if (!isOpen) return null;

  // Handle Add New User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const phoneValue = newPhone.trim();
    const pinValue = newPinCode.trim() || cleanPhone(phoneValue) || '1234';

    onAddUser({
      name: newName.trim(),
      username: newUsername.trim() || undefined,
      role: newRole,
      isMom: false,
      avatar: newRole === 'ploy' ? '💎' : newRole === 'owner' ? '👑' : newAvatar,
      phone: phoneValue || undefined,
      pinCode: pinValue || undefined,
      password: pinValue || undefined,
      notes: newNotes.trim() || (newRole === 'ploy' ? 'คุณพลอย - Super Admin ดูและแก้ไขได้ทุกระบบ บันทึกลง Firebase เรียลไทม์' : newRole === 'owner' ? 'เจ้าของหอพัก (Owner) - แดชบอร์ด จดมิเตอร์ ห้องพัก ใบแจ้งหนี้' : 'พนักงานดูแลหอพัก - กรอกมิเตอร์น้ำไฟ (ซ่อนข้อมูลเงิน)')
    });

    setNewName('');
    setNewUsername('');
    setNewPhone('');
    setNewPinCode('');
    setNewNotes('');
    setNewRole('caretaker');
    setIsAddingNew(false);
  };

  // Handle Save Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !onUpdateUser) return;

    const phoneVal = editPhone.trim();
    const pinVal = editPinCode.trim() || cleanPhone(phoneVal);

    const updated: AppUser = {
      ...editingUser,
      name: editName.trim() || editingUser.name,
      username: editUsername.trim() || editingUser.username,
      role: editRole,
      avatar: editRole === 'ploy' ? '💎' : editRole === 'owner' ? '👑' : '👷‍♂️',
      phone: phoneVal || undefined,
      pinCode: pinVal || undefined,
      password: pinVal || editingUser.password || undefined,
      notes: editNotes.trim() || undefined,
    };

    onUpdateUser(updated);
    setEditingUser(null);
  };

  // Start Editing User
  const startEditUser = (user: AppUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username || '');
    setEditRole(user.role);
    setEditPhone(user.phone || '');
    setEditPinCode(user.password || user.pinCode || cleanPhone(user.phone) || '');
    setEditNotes(user.notes || '');
  };

  // Handle Self-service Password Change for active user
  const handleSaveMyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMyPinError('');
    setMyPinSuccess('');

    const val1 = myNewPassword.trim();
    const val2 = myConfirmPassword.trim();

    if (val1.length < 4) {
      setMyPinError('กรุณาระบุรหัสผ่านหรือเบอร์โทรศัพท์อย่างน้อย 4 ตัวอักษร/ตัวเลข');
      return;
    }

    if (val1 !== val2) {
      setMyPinError('รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    if (onUpdateUser) {
      const isDigitsOnly = /^\d+$/.test(val1);
      const formattedPhone = (isDigitsOnly && val1.length === 10)
        ? `${val1.slice(0, 3)}-${val1.slice(3, 6)}-${val1.slice(6)}`
        : currentUser.phone;

      const updated: AppUser = {
        ...currentUser,
        phone: formattedPhone || currentUser.phone,
        pinCode: val1,
        password: val1,
      };

      onUpdateUser(updated);
      setMyPinSuccess(`บันทึกรหัสผ่านใหม่เรียบร้อยแล้ว! รหัสผ่านคือ "${val1}" สำหรับผู้ใช้งาน "${currentUser.name}"`);
      setMyNewPassword('');
      setMyConfirmPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in font-google-sans">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                จัดการบัญชีผู้ใช้งาน & รหัสผ่าน
              </h2>
              <p className="text-xs text-indigo-200/80">
                กำหนดสิทธิ์ ดูแลรหัสผ่าน และความปลอดภัยของระบบ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (2 Clean Tabs) */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2">
          <button
            onClick={() => {
              setActiveTab('accounts');
              setEditingUser(null);
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>รายชื่อผู้ใช้งาน & สิทธิ์ ({users.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('my-pin');
              setEditingUser(null);
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'my-pin'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>เปลี่ยนรหัสผ่านของฉัน</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto max-h-[72vh]">
          
          {/* TAB 1: ACCOUNTS LIST */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {/* Active User Highlight Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{currentUser.avatar || (currentUser.role === 'ploy' ? '💎' : currentUser.role === 'owner' ? '👑' : '👷‍♂️')}</div>
                  <div>
                    <div className="text-[11px] text-indigo-700 font-semibold uppercase tracking-wider">
                      บัญชีปัจจุบันที่เข้าสู่ระบบอยู่
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{currentUser.name}</span>
                      {currentUser.role === 'ploy' ? (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
                          💎 เจ้าของ & Super Admin (ดูได้ทุกอย่าง รวมเงิน)
                        </span>
                      ) : currentUser.role === 'owner' ? (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-600" /> เจ้าของหอ (สิทธิ์เต็ม+การเงิน)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                          👷‍♂️ พนักงานดูแล (ซ่อนเงิน)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                      <span>ชื่อผู้ใช้: <strong className="font-mono text-indigo-900">{currentUser.username || currentUser.phone || 'ploy'}</strong></span>
                      <span>•</span>
                      <span>รหัสผ่าน: <strong className="font-mono text-slate-800">••••••••</strong></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('my-pin')}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  title="เปลี่ยนรหัสผ่านของคุณ"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">เปลี่ยนรหัส</span>
                </button>
              </div>

              {/* Strict Security Policy Notice */}
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-900">🔒 ต้องการเปลี่ยนไปใช้งานบัญชีอื่น?</span>
                  <span>
                    ระบบรักษาความปลอดภัยกำหนดให้ทำการ <strong>ออกจากระบบ (Log Out)</strong> ก่อน แล้วจึงเข้าสู่ระบบใหม่ด้วยชื่อผู้ใช้และรหัสผ่านของบัญชีที่ต้องการ
                  </span>
                </div>
              </div>

              {/* User List Heading */}
              <div className="flex items-center justify-between pt-1">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>รายชื่อผู้ใช้งานทั้งหมด ({users.length} บัญชี)</span>
                </h3>
                {(currentUser.role === 'owner' || currentUser.role === 'ploy') && !isAddingNew && !editingUser && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มผู้ใช้งานใหม่</span>
                  </button>
                )}
              </div>

              {/* User List Item Cards */}
              <div className="space-y-2.5">
                {users.map((u) => {
                  const isActive = u.id === currentUser.id;
                  const isPloyUser = u.role === 'ploy' || u.username === 'ploy';
                  const isOwnerUser = u.role === 'owner' || u.username === 'mom';

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          u.role === 'ploy' ? 'bg-purple-100' : u.role === 'owner' ? 'bg-amber-100' : 'bg-slate-100'
                        }`}>
                          {u.avatar || (u.role === 'ploy' ? '💎' : u.role === 'owner' ? '👑' : '👷‍♂️')}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm truncate">{u.name}</span>
                            {u.role === 'ploy' ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 shrink-0">
                                💎 เจ้าของ & Super Admin
                              </span>
                            ) : u.role === 'owner' ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                                👑 เจ้าของหอ
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 shrink-0">
                                👷‍♂️ พนักงาน
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono text-slate-700">
                              user: <strong>{u.username || u.phone || '-'}</strong>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 text-slate-600 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.phone || '-'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              <Lock className="w-2.5 h-2.5" /> มีรหัสผ่าน
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit User Button: Ploy, Owner, or self */}
                        {(currentUser.role === 'ploy' || currentUser.role === 'owner' || u.id === currentUser.id) && (
                          <button
                            type="button"
                            onClick={() => startEditUser(u)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="แก้ไขชื่อ / เบอร์โทร / รหัสผ่าน"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {isActive ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Check className="w-3.5 h-3.5" /> ใช้งานอยู่
                          </span>
                        ) : null}

                        {/* Delete User Button (only Ploy or Owner can delete, cannot delete Ploy or Mom) */}
                        {(currentUser.role === 'ploy' || currentUser.role === 'owner') && !isPloyUser && !isOwnerUser && onDeleteUser && users.length > 1 && u.id !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`ต้องการลบผู้ใช้งาน "${u.name}" หรือไม่?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="ลบผู้ใช้งาน"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Role Permissions Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                  <div className="font-bold text-purple-900 flex items-center gap-1.5">
                    <span>💎 Super Admin (คุณพลอย)</span>
                  </div>
                  <p className="text-[11px] text-purple-950">
                    ดูและแก้ไขได้ทุกระบบ อัปเดตและบันทึกลง Cloud Firebase แบบเรียลไทม์
                  </p>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>👑 เจ้าของหอ (คุณแม่)</span>
                  </div>
                  <p className="text-[11px] text-amber-950">
                    แดชบอร์ด จดมิเตอร์ สถานะห้อง ใบแจ้งหนี้ จัดการผู้ใช้ เลือกรอบบิลได้
                  </p>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span>👷‍♂️ พนักงานดูแล</span>
                  </div>
                  <p className="text-[11px] text-blue-950">
                    แดชบอร์ด จดมิเตอร์ ห้องพัก ใบแจ้งหนี้ <strong>(ซ่อนข้อมูลเงินทั้งหมด)</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHANGE MY PASSWORD */}
          {activeTab === 'my-pin' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 border border-amber-200 text-2xl">
                  {currentUser.avatar || (currentUser.role === 'ploy' ? '💎' : currentUser.role === 'owner' ? '👑' : '👷‍♂️')}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบ
                </h3>
                <p className="text-xs text-slate-500">
                  สำหรับบัญชี: <strong className="text-indigo-900 font-bold">{currentUser.name}</strong> ({currentUser.username || currentUser.phone || 'ploy'})
                </p>
              </div>

              {myPinSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-start gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{myPinSuccess}</span>
                </div>
              )}

              {myPinError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{myPinError}</span>
                </div>
              )}

              <form onSubmit={handleSaveMyPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่านใหม่ (เช่น 0840411115 หรือตัวอักษร/ตัวเลขที่คุณต้องการ)
                  </label>
                  <div className="relative">
                    <input
                      type={showMyPassText ? 'text' : 'password'}
                      required
                      placeholder="กรอกรหัสผ่านใหม่"
                      value={myNewPassword}
                      onChange={(e) => setMyNewPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMyPassText(!showMyPassText)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showMyPassText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    * สามารถใช้เป็นเบอร์โทรศัพท์ 10 หลัก หรือรหัสผ่านส่วนตัวที่คุณจำได้ง่าย
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    พิมพ์รหัสผ่านใหม่อีกครั้งเพื่อยืนยัน
                  </label>
                  <input
                    type={showMyPassText ? 'text' : 'password'}
                    required
                    placeholder="พิมพ์ยืนยันรหัสผ่านเดิมอีกครั้ง"
                    value={myConfirmPassword}
                    onChange={(e) => setMyConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>บันทึกรหัสผ่านใหม่</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADD NEW USER FORM */}
          {isAddingNew && (
            <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เพิ่มผู้ใช้งาน / พนักงานใหม่</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕ ปิด
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน (Display Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น คุณสมศักดิ์ (ช่าง)"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อเข้าสู่ระบบ (Username)
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="เช่น somsak หรือเบอร์โทร"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ (Phone)
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสผ่านเข้าสู่ระบบ (Password / PIN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPinCode}
                    onChange={(e) => setNewPinCode(e.target.value)}
                    placeholder="รหัสผ่านเข้าสู่ระบบ เช่น 1234"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ระดับสิทธิ์ (Role) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setNewRole(r);
                      if (r === 'ploy') setNewAvatar('💎');
                      else if (r === 'owner') setNewAvatar('👑');
                      else setNewAvatar('👷‍♂️');
                    }}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ploy">💎 คุณพลอย (Owner & Super Admin - ดูและแก้ไขได้ทุกระบบ รวมถึงการเงิน)</option>
                    <option value="owner">👑 เจ้าของหอ (ดูแดชบอร์ด จดมิเตอร์ ห้องพัก บิล การเงิน จัดการผู้ใช้)</option>
                    <option value="caretaker">👷‍♂️ พนักงานดูแล (จดมิเตอร์ ห้องพัก บิล - ซ่อนข้อมูลเงิน)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมายเหตุ
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="เช่น ประจำอาคารดอนเมือง จดมิเตอร์ทุกวันที่ 30"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  บันทึกผู้ใช้งานใหม่
                </button>
              </div>
            </form>
          )}

          {/* EDIT USER FORM */}
          {editingUser && (
            <form onSubmit={handleSaveEditUser} className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>แก้ไขข้อมูลและรหัสผ่าน: {editingUser.name}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕ ปิด
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อเข้าสู่ระบบ (Username)
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ (Phone)
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสผ่านเข้าสู่ระบบ (Password)
                  </label>
                  <input
                    type="text"
                    value={editPinCode}
                    onChange={(e) => setEditPinCode(e.target.value)}
                    placeholder="กำหนดรหัสผ่านใหม่"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ระดับสิทธิ์ (Role)
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    disabled={editingUser.isMom || editingUser.role === 'ploy'}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                  >
                    <option value="ploy">💎 คุณพลอย (Owner & Super Admin - ดูและแก้ไขทุกอย่าง รวมถึงการเงิน)</option>
                    <option value="owner">👑 เจ้าของหอ (ดูแดชบอร์ด จดมิเตอร์ ห้องพัก ใบแจ้งหนี้ การเงิน จัดการผู้ใช้)</option>
                    <option value="caretaker">👷‍♂️ พนักงานดูแล (แดชบอร์ด จดมิเตอร์ ห้องพัก ใบแจ้งหนี้ ซ่อนข้อมูลเงิน)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมายเหตุ
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            * สลับผู้ใช้โดยการกด <strong>ออกจากระบบ</strong> ที่แถบด้านบน
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            เรียบร้อย
          </button>
        </div>

      </div>
    </div>
  );
};
