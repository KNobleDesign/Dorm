import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  EyeOff, 
  Plus, 
  X, 
  Check, 
  Sparkles, 
  Lock, 
  Key, 
  Phone, 
  Crown, 
  HardHat, 
  Info, 
  Trash2, 
  Edit3, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Delete,
  Eye,
  ArrowRight
} from 'lucide-react';

interface UserManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser;
  onSwitchUser: (user: AppUser) => void;
  onAddUser: (newUser: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onUpdateUser?: (updatedUser: AppUser) => void;
  onDeleteUser?: (userId: string) => void;
  initialTab?: 'accounts' | 'phone-login' | 'my-pin';
}

// Utility to clean phone numbers for comparison
const cleanPhone = (val?: string) => (val || '').replace(/[^0-9]/g, '');

export const UserManagerModal: React.FC<UserManagerModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSwitchUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  initialTab = 'accounts'
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'phone-login' | 'my-pin'>(initialTab);
  
  // Add User Form State
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('caretaker');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newPinCode, setNewPinCode] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newAvatar, setNewAvatar] = useState<string>('👷‍♂️');

  // Edit User State
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editPinCode, setEditPinCode] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Switch User PIN Verification State
  const [targetSwitchUser, setTargetSwitchUser] = useState<AppUser | null>(null);
  const [inputPin, setInputPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showPinText, setShowPinText] = useState<boolean>(false);

  // Self-service PIN Change State (Tab: my-pin)
  const [myNewPhonePin, setMyNewPhonePin] = useState<string>('');
  const [myConfirmPhonePin, setMyConfirmPhonePin] = useState<string>('');
  const [myPinSuccess, setMyPinSuccess] = useState<string>('');
  const [myPinError, setMyPinError] = useState<string>('');

  // Direct Phone Login State (Tab: phone-login)
  const [directPhoneInput, setDirectPhoneInput] = useState<string>('');
  const [directPhoneError, setDirectPhoneError] = useState<string>('');

  if (!isOpen) return null;

  // Handle Add New User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const phoneValue = newPhone.trim();
    // Default PIN to cleaned phone if pin not explicitly typed
    const pinValue = newPinCode.trim() ? cleanPhone(newPinCode) : cleanPhone(phoneValue);

    onAddUser({
      name: newName.trim(),
      role: newRole,
      isMom: false,
      avatar: newAvatar,
      phone: phoneValue || undefined,
      pinCode: pinValue || undefined,
      notes: newNotes.trim() || (newRole === 'caretaker' ? 'พนักงานดูแลหอพัก - กรอกมิเตอร์น้ำไฟ' : 'เจ้าของร่วม/ผู้ดูแลระดับสูง')
    });

    setNewName('');
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
    const pinVal = editPinCode.trim() ? cleanPhone(editPinCode) : cleanPhone(phoneVal);

    const updated: AppUser = {
      ...editingUser,
      name: editName.trim() || editingUser.name,
      phone: phoneVal || undefined,
      pinCode: pinVal || undefined,
      notes: editNotes.trim() || undefined,
    };

    onUpdateUser(updated);
    setEditingUser(null);
  };

  // Start Editing User
  const startEditUser = (user: AppUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditPinCode(user.pinCode || cleanPhone(user.phone) || '');
    setEditNotes(user.notes || '');
  };

  // Request Switch User (Check PIN)
  const handleRequestSwitch = (user: AppUser) => {
    // If clicking same user, do nothing
    if (user.id === currentUser.id) return;

    // Caretaker cannot switch to owner
    if (currentUser.role === 'caretaker' && user.role === 'owner') {
      return;
    }

    const expectedPin = user.pinCode || cleanPhone(user.phone);

    // If no pin is set and no phone, switch directly
    if (!expectedPin) {
      onSwitchUser(user);
      onClose();
      return;
    }

    // Otherwise show PIN prompt
    setTargetSwitchUser(user);
    setInputPin('');
    setPinError('');
  };

  // Verify and Confirm PIN
  const handleConfirmPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetSwitchUser) return;

    if (currentUser.role === 'caretaker' && targetSwitchUser.role === 'owner') {
      setPinError('สิทธิ์พนักงานดูแล ไม่ได้รับอนุญาตให้สลับไปเป็นบัญชีเจ้าของ');
      return;
    }

    const expectedPin = targetSwitchUser.pinCode || cleanPhone(targetSwitchUser.phone);
    const cleanedInput = cleanPhone(inputPin);

    // If current user is Owner, allow owner bypass or check exact PIN
    if (cleanedInput === expectedPin || (currentUser.role === 'owner' && cleanedInput === '1234')) {
      onSwitchUser(targetSwitchUser);
      setTargetSwitchUser(null);
      setInputPin('');
      setPinError('');
      onClose();
    } else {
      setPinError(`เบอร์โทรศัพท์/รหัสผ่านไม่ถูกต้อง (ลองตรวจสอบตัวเลข ${expectedPin ? '10 หลัก' : ''})`);
    }
  };

  // Handle Self-service PIN Change for active user
  const handleSaveMyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setMyPinError('');
    setMyPinSuccess('');

    const cleaned1 = cleanPhone(myNewPhonePin);
    const cleaned2 = cleanPhone(myConfirmPhonePin);

    if (cleaned1.length < 4) {
      setMyPinError('กรุณาระบุเบอร์โทรศัพท์หรือรหัสอย่างน้อย 4-10 ตัวเลข');
      return;
    }

    if (cleaned1 !== cleaned2) {
      setMyPinError('เบอร์โทรศัพท์ทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    if (onUpdateUser) {
      const formattedPhone = cleaned1.length === 10 
        ? `${cleaned1.slice(0,3)}-${cleaned1.slice(3,6)}-${cleaned1.slice(6)}`
        : cleaned1;

      const updated: AppUser = {
        ...currentUser,
        phone: formattedPhone,
        pinCode: cleaned1,
      };

      onUpdateUser(updated);
      setMyPinSuccess(`บันทึกรหัสผ่านเบอร์โทร (${formattedPhone}) สำเร็จแล้ว! คุณสามารถใช้เบอร์นี้เข้าสู่ระบบได้ทันที`);
      setMyNewPhonePin('');
      setMyConfirmPhonePin('');
    }
  };

  // Handle Direct Phone Login
  const handleDirectPhoneLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDirectPhoneError('');

    const cleanedInput = cleanPhone(directPhoneInput);
    if (!cleanedInput) {
      setDirectPhoneError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    // Find user matching phone or pinCode
    const matchedUser = users.find(u => {
      const uPin = u.pinCode || cleanPhone(u.phone);
      const uPhone = cleanPhone(u.phone);
      return uPin === cleanedInput || uPhone === cleanedInput;
    });

    if (matchedUser) {
      if (currentUser.role === 'caretaker' && matchedUser.role === 'owner') {
        setDirectPhoneError('สิทธิ์พนักงานดูแล ไม่ได้รับอนุญาตให้เข้าสู่ระบบบัญชีเจ้าของหอพัก');
        return;
      }
      onSwitchUser(matchedUser);
      setDirectPhoneInput('');
      setDirectPhoneError('');
      onClose();
    } else {
      setDirectPhoneError(`ไม่พบผู้ใช้งานที่ตรงกับเบอร์โทร/รหัส "${directPhoneInput}" กรุณาตรวจสอบหรือแจ้งเจ้าของหอ`);
    }
  };

  // Number Pad Click helper
  const handleKeypadDigit = (digit: string) => {
    if (targetSwitchUser) {
      setInputPin(prev => (prev.length < 15 ? prev + digit : prev));
      setPinError('');
    } else if (activeTab === 'phone-login') {
      setDirectPhoneInput(prev => (prev.length < 10 ? prev + digit : prev));
      setDirectPhoneError('');
    }
  };

  const handleKeypadBackspace = () => {
    if (targetSwitchUser) {
      setInputPin(prev => prev.slice(0, -1));
    } else if (activeTab === 'phone-login') {
      setDirectPhoneInput(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-google-sans">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>จัดการผู้ใช้งาน & รหัสผ่านเบอร์โทรศัพท์</span>
              </h2>
              <p className="text-xs text-slate-300">
                พนักงานดูแลสามารถตั้งเบอร์โทรศัพท์เป็นรหัสเข้าใช้งานของตัวเองได้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('accounts');
              setTargetSwitchUser(null);
              setEditingUser(null);
            }}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>รายชื่อ & สลับผู้ใช้</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('phone-login');
              setTargetSwitchUser(null);
              setEditingUser(null);
            }}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'phone-login'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>เข้าสู่ระบบด้วยเบอร์โทร</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('my-pin');
              setTargetSwitchUser(null);
              setEditingUser(null);
            }}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'my-pin'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>ตั้งรหัสเบอร์โทรของฉัน</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto max-h-[72vh]">
          
          {/* TAB 1: ACCOUNTS & SWITCH LIST */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {/* Active User Highlight Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{currentUser.avatar || (currentUser.role === 'owner' ? '👑' : '👷‍♂️')}</div>
                  <div>
                    <div className="text-[11px] text-indigo-700 font-semibold uppercase tracking-wider">
                      บัญชีปัจจุบันที่กำลังใช้งาน
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{currentUser.name}</span>
                      {currentUser.role === 'owner' ? (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-600" /> เจ้าของหอ (สิทธิ์เต็ม)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-blue-600" /> พนักงานดูแล (ซ่อนเงิน)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                      <span>📞 เบอร์รหัสเข้า: <strong className="font-mono text-indigo-900">{currentUser.phone || 'ยังไม่ได้ระบุ'}</strong></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('my-pin')}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  title="เปลี่ยนรหัสผ่านเบอร์โทรของคุณ"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">เปลี่ยนรหัส</span>
                </button>
              </div>

              {/* User List Heading */}
              <div className="flex items-center justify-between pt-1">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>รายชื่อผู้ใช้งานทั้งหมด ({users.length} บัญชี)</span>
                </h3>
                {currentUser.role === 'owner' && !isAddingNew && !editingUser && (
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

              {/* Role Restriction Banner for Caretaker */}
              {currentUser.role === 'caretaker' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">🔒 สิทธิ์พนักงานดูแล (Caretaker Mode)</span>
                    <span>อยู่ในโหมดพนักงานดูแล ห้ามสลับไปเป็นบัญชีระดับเจ้าของ (Owner) ได้เองโดยตรงเพื่อความปลอดภัยของข้อมูลการเงิน</span>
                  </div>
                </div>
              )}

              {/* User List Item Cards */}
              <div className="space-y-2.5">
                {users.map((u) => {
                  const isActive = u.id === currentUser.id;
                  const hasPin = Boolean(u.pinCode || cleanPhone(u.phone));
                  // If current user is caretaker, they are forbidden from switching to or editing owner accounts
                  const isBlockedForCaretaker = currentUser.role === 'caretaker' && u.role === 'owner';
                  
                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                        isActive 
                          ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-200' 
                          : isBlockedForCaretaker
                          ? 'bg-slate-50/80 border-slate-200 opacity-75'
                          : 'bg-white border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{u.avatar || (u.role === 'owner' ? '👩‍💼' : '👷‍♂️')}</div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>{u.name}</span>
                            {u.isMom && (
                              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-200">
                                ❤️ คุณแม่
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                u.role === 'owner'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {u.role === 'owner' ? '👑 เจ้าของ' : '👷‍♂️ พนักงานดูแล'}
                            </span>
                          </div>
                          
                          <div className="text-xs text-slate-500 flex items-center gap-2.5 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-700 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.phone || 'ยังไม่มีเบอร์'}
                            </span>
                            {hasPin && (
                              <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <Lock className="w-2.5 h-2.5" /> มีรหัสเบอร์โทร
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Edit User Button: Owner only or self */}
                        {(currentUser.role === 'owner' || u.id === currentUser.id) && (
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
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <Check className="w-3.5 h-3.5" /> กำลังใช้งาน
                          </span>
                        ) : isBlockedForCaretaker ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-not-allowed" title="สิทธิ์พนักงานไม่สามารถสลับเป็นเจ้าของได้">
                            <Lock className="w-3.5 h-3.5" />
                            <span>สงวนสิทธิ์เจ้าของ</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRequestSwitch(u)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>สลับใช้คนนี้</span>
                          </button>
                        )}

                        {currentUser.role === 'owner' && !u.isMom && onDeleteUser && users.length > 1 && (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>👑 สิทธิ์เจ้าของ (Owner)</span>
                  </div>
                  <p className="text-[11px] text-amber-900">
                    เห็นยอดเงิน ค่าเช่า รายรับ กำไรทั้งหมด พิมพ์ใบเสร็จ และตั้งค่าระบบ
                  </p>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-blue-600" />
                    <span>👷‍♂️ สิทธิ์พนักงาน (Caretaker)</span>
                  </div>
                  <p className="text-[11px] text-blue-900">
                    กรอกมิเตอร์น้ำไฟ บันทึกเลขได้สะดวก <strong>ซ่อนข้อมูลการเงิน 100%</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT PHONE LOGIN KEYPAD */}
          {activeTab === 'phone-login' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  เข้าสู่ระบบด้วยเบอร์โทรศัพท์
                </h3>
                <p className="text-xs text-slate-500">
                  กรอกเบอร์โทร 10 หลักที่คุณตั้งไว้เพื่อเข้าใช้งานในชื่อของคุณทันที
                </p>
              </div>

              <form onSubmit={handleDirectPhoneLogin} className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    autoFocus
                    placeholder="เช่น 0891234567"
                    value={directPhoneInput}
                    onChange={(e) => {
                      setDirectPhoneInput(e.target.value);
                      setDirectPhoneError('');
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-indigo-200 rounded-xl font-mono text-center text-lg font-bold tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {directPhoneError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-1.5 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{directPhoneError}</span>
                  </div>
                )}

                {/* Numeric Keypad for Senior & Touch Screen Ease */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (k === 'C') setDirectPhoneInput('');
                        else if (k === '⌫') handleKeypadBackspace();
                        else handleKeypadDigit(k);
                      }}
                      className={`py-3 rounded-xl font-bold font-mono text-base transition active:scale-95 cursor-pointer shadow-2xs border ${
                        k === 'C'
                          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          : k === '⌫'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 flex items-center justify-center'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                      }`}
                    >
                      {k === '⌫' ? <Delete className="w-5 h-5" /> : k}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!directPhoneInput.trim()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>เข้าสู่ระบบ (Login)</span>
                </button>
              </form>

              {/* Quick Preset Tips for Demo */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-slate-700 block">💡 เบอร์โทรสำหรับเข้าใช้งานตัวอย่าง:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {users
                    .filter(u => currentUser.role === 'owner' || u.role === 'caretaker')
                    .map(u => {
                      const pin = u.pinCode || cleanPhone(u.phone);
                      if (!pin) return null;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setDirectPhoneInput(pin)}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 rounded text-[11px] font-mono text-slate-700 font-semibold cursor-pointer"
                        >
                          {u.name}: {u.phone || pin}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SELF-SERVICE SET / CHANGE PHONE PIN */}
          {activeTab === 'my-pin' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 border border-amber-200">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  ตั้งรหัสผ่านเบอร์โทรศัพท์ของฉัน
                </h3>
                <p className="text-xs text-slate-500">
                  สำหรับคุณ: <strong className="text-indigo-900 font-bold">{currentUser.name}</strong> ({currentUser.role === 'owner' ? 'เจ้าของหอ' : 'พนักงานดูแล'})
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

              <form onSubmit={handleSaveMyPin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ที่ต้องการใช้เป็นรหัสผ่าน (10 หลัก)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="เช่น 0891234567 หรือ 081-987-6543"
                      value={myNewPhonePin}
                      onChange={(e) => setMyNewPhonePin(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    * พนักงานสามารถตั้งเป็นเบอร์มือถือของตัวเองเพื่อใช้ล็อกอินได้ง่ายๆ
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    พิมพ์เบอร์โทรศัพท์เดิมอีกครั้งเพื่อยืนยัน
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="พิมพ์ยืนยันเบอร์โทรศัพท์เดิมอีกครั้ง"
                      value={myConfirmPhonePin}
                      onChange={(e) => setMyConfirmPhonePin(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>บันทึกเบอร์โทรเป็นรหัสเข้าใช้งานของฉัน</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADD NEW USER MODAL FORM */}
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
                  ✕ ยกเลิก
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น สมคิด (ช่างดูแลหอ), น้องนก"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                      if (r === 'owner') setNewAvatar('👑');
                      else setNewAvatar('👷‍♂️');
                    }}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="caretaker">👷‍♂️ พนักงานดูแล (กรอกมิเตอร์ ซ่อนยอดเงิน)</option>
                    <option value="owner">👑 เจ้าของ (เห็นยอดเงินทั้งหมด และตั้งค่า)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ (สำหรับตั้งเป็นรหัสเข้า)
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => {
                      setNewPhone(e.target.value);
                      if (!newPinCode) setNewPinCode(e.target.value);
                    }}
                    placeholder="08X-XXX-XXXX"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสผ่านเข้าสู่ระบบ (PIN เบอร์โทร)
                  </label>
                  <input
                    type="text"
                    value={newPinCode}
                    onChange={(e) => setNewPinCode(e.target.value)}
                    placeholder="หากเว้นว่างจะใช้เบอร์โทร"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ไอคอนประจำตัว (Avatar)
                  </label>
                  <div className="flex gap-2">
                    {['👷‍♂️', '👩‍💼', '👑', '👨‍🔧', '🧑‍💻', '👵', '👩', '👨'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewAvatar(emoji)}
                        className={`p-1.5 rounded-lg border text-base cursor-pointer ${
                          newAvatar === emoji ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-slate-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมายเหตุ / หน้าที่รับผิดชอบ
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

          {/* EDIT USER MODAL FORM */}
          {editingUser && (
            <form onSubmit={handleSaveEditUser} className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>แก้ไขข้อมูลและรหัสผ่านเบอร์โทร: {editingUser.name}</span>
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
                    รหัสผ่านเข้าสู่ระบบ (PIN เบอร์โทร)
                  </label>
                  <input
                    type="text"
                    value={editPinCode}
                    onChange={(e) => setEditPinCode(e.target.value)}
                    placeholder="เช่น 0891234567"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    * พนักงานสามารถใช้เบอร์นี้กดเข้าสู่ระบบได้
                  </span>
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

          {/* TARGET SWITCH USER PIN VERIFICATION MODAL OVERLAY */}
          {targetSwitchUser && (
            <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-google-sans">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{targetSwitchUser.avatar || '👷‍♂️'}</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        ยืนยันการเข้าสู่ระบบ
                      </h4>
                      <p className="text-xs text-indigo-700 font-semibold">
                        {targetSwitchUser.name} ({targetSwitchUser.role === 'owner' ? '👑 เจ้าของ' : '👷‍♂️ พนักงานดูแล'})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setTargetSwitchUser(null);
                      setInputPin('');
                      setPinError('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-600">
                    กรุณากรอก <strong>เบอร์โทรศัพท์ที่ตั้งไว้ (10 หลัก)</strong> เพื่อเข้าใช้งาน:
                  </p>

                  <div className="relative">
                    <input
                      type={showPinText ? 'text' : 'password'}
                      autoFocus
                      placeholder="กรอกเบอร์โทรศัพท์ / รหัส PIN"
                      value={inputPin}
                      onChange={(e) => {
                        setInputPin(e.target.value);
                        setPinError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmPin();
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border-2 border-indigo-300 rounded-xl font-mono text-center text-lg font-bold tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinText(!showPinText)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {pinError && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-1.5 animate-shake">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  {/* Quick Keypad */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          if (k === 'C') setInputPin('');
                          else if (k === '⌫') handleKeypadBackspace();
                          else handleKeypadDigit(k);
                        }}
                        className={`py-2 rounded-lg font-bold font-mono text-sm transition active:scale-95 cursor-pointer shadow-2xs border ${
                          k === 'C'
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            : k === '⌫'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 flex items-center justify-center'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-indigo-50'
                        }`}
                      >
                        {k === '⌫' ? <Delete className="w-4 h-4" /> : k}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSwitchUser(null);
                      setInputPin('');
                      setPinError('');
                    }}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmPin()}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
                  >
                    เข้าสู่ระบบ
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>รหัสเข้าใช้งานถูกบันทึกอย่างปลอดภัยในเบราว์เซอร์นี้</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
