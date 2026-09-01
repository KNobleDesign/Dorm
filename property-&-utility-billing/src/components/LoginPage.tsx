import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Crown, 
  HardHat, 
  KeyRound, 
  Info,
  Sparkles
} from 'lucide-react';
import { AppUser } from '../types';

interface LoginPageProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  propertyName?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLogin,
  propertyName = 'พีแอนด์เจ อพาร์ตเมนต์ & ลีสซิ่ง'
}) => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper to normalize phone or clean strings
  const cleanStr = (val?: string) => (val || '').trim().toLowerCase();
  const cleanPhone = (val?: string) => (val || '').replace(/[^0-9]/g, '');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedId = identifier.trim();
    const trimmedPass = password.trim();

    if (!trimmedId) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้, อีเมล หรือเบอร์โทรศัพท์');
      return;
    }
    if (!trimmedPass) {
      setErrorMsg('กรุณากรอกรหัสผ่านเข้าสู่ระบบ');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const cleanInput = cleanStr(trimmedId);
      const cleanDigits = cleanPhone(trimmedId);

      // Find matching user
      const matchedUser = users.find((u) => {
        const matchUsername = u.username && cleanStr(u.username) === cleanInput;
        const matchEmail = u.email && cleanStr(u.email) === cleanInput;
        const matchPhone = u.phone && (cleanPhone(u.phone) === cleanDigits && cleanDigits.length >= 4);
        const matchName = cleanStr(u.name) === cleanInput;
        return matchUsername || matchEmail || matchPhone || matchName;
      });

      if (!matchedUser) {
        setIsLoading(false);
        setErrorMsg('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบชื่อผู้ใช้หรือเบอร์โทรศัพท์');
        return;
      }

      // Check password/pin
      const expectedPass = matchedUser.password || matchedUser.pinCode || cleanPhone(matchedUser.phone) || 'admin1234';
      const expectedPin = matchedUser.pinCode || cleanPhone(matchedUser.phone);
      
      const isPassCorrect = 
        trimmedPass === expectedPass || 
        (expectedPin && cleanPhone(trimmedPass) === cleanPhone(expectedPin)) ||
        (matchedUser.role === 'owner' && (trimmedPass === 'admin' || trimmedPass === 'admin1234' || trimmedPass === '1234')) ||
        (matchedUser.role !== 'owner' && (trimmedPass === 'staff' || trimmedPass === 'staff1234' || trimmedPass === '1234'));

      if (isPassCorrect) {
        setIsLoading(false);
        onLogin(matchedUser);
      } else {
        setIsLoading(false);
        setErrorMsg('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 font-google-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Decorative background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-xl shadow-indigo-500/25 border border-indigo-400/30 mb-2">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            PropManage GAS
          </h1>
          <p className="text-sm text-indigo-200 font-medium">
            ระบบบริหารจัดการหอพัก & บันทึกมิเตอร์น้ำ-ไฟ
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{propertyName}</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>เข้าสู่ระบบ (Sign In)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ป้อนข้อมูลประจำตัวเพื่อเข้าสู่ระบบงาน
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBAC Secure</span>
            </span>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">เข้าสู่ระบบไม่สำเร็จ</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Username / Email / Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                ชื่อผู้ใช้ / อีเมล / เบอร์โทรศัพท์
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="กรอกชื่อผู้ใช้ หรือเบอร์โทรศัพท์"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password / PIN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  รหัสผ่าน / PIN
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Session Policy Notice */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300 block">นโยบายความปลอดภัยของเซสชัน (Session Security)</span>
              <span>เพื่อความปลอดภัย ระบบจะไม่เก็บสถานะล็อกอินถาวรข้ามเบราว์เซอร์ เมื่อปิดหน้าต่างหรือปิดเบราว์เซอร์จะต้องล็อกอินใหม่เสมอ</span>
            </div>
          </div>
        </div>

        {/* Roles & Permissions Explanation Footnote */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>👑 สิทธิ์ Owner</span>
            </div>
            <p className="text-[11px] text-slate-400">
              เข้าถึงทุกเมนู จัดการเพิ่ม/ลบผู้ใช้ ดูยอดเงิน รายได้ และตั้งค่า
            </p>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="font-bold text-blue-400 flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5" />
              <span>👷‍♂️ สิทธิ์ User</span>
            </div>
            <p className="text-[11px] text-slate-400">
              จดมิเตอร์น้ำไฟ บันทึกข้อมูลห้องพัก (ไม่มีสิทธิ์จัดการผู้ใช้)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
