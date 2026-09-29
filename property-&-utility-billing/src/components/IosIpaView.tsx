import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  Terminal, 
  Apple, 
  Github, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink, 
  FolderDown, 
  FileCode, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Play, 
  ArrowRight,
  Info,
  Laptop
} from 'lucide-react';
import { LandlordConfig } from '../types';

interface IosIpaViewProps {
  config: LandlordConfig;
}

export const IosIpaView: React.FC<IosIpaViewProps> = ({ config }) => {
  const [activeSubTab, setActiveSubTab] = useState<'instant-web' | 'github-actions' | 'mac-xcode' | 'sideload-install'>('instant-web');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Customizable IPA App Config State
  const [appDisplayName, setAppDisplayName] = useState<string>(config.propertyName || 'PropManage App');
  const [bundleId, setBundleId] = useState<string>('com.remixproperty.billing');
  const [appVersion, setAppVersion] = useState<string>('1.0.0');

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-gvb4d4luzklk7tu7mtbrrg-156504435485.asia-southeast1.run.app';

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadFile = (filename: string, content: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buildScriptContent = `#!/usr/bin/env bash
# Script to build iOS .IPA file for ${appDisplayName}
set -e

echo "🚀 Starting iOS IPA build process for ${appDisplayName} (${bundleId})..."

# 1. Compile web application
npm run build

# 2. Add or sync Capacitor iOS platform
if [ ! -d "ios" ]; then
  echo "📱 Adding iOS platform via Capacitor..."
  npx cap add ios
fi

echo "🔄 Syncing iOS project assets..."
npx cap sync ios

# 3. Build Xcode Archive
echo "🔨 Building Xcode Archive..."
cd ios/App

rm -rf build
mkdir -p build

xcodebuild -workspace App.xcworkspace \\
  -scheme App \\
  -configuration Release \\
  -destination "generic/platform=iOS" \\
  -archivePath "$PWD/build/App.xcarchive" \\
  CODE_SIGNING_ALLOWED=NO \\
  CODE_SIGNING_REQUIRED=NO \\
  CODE_SIGN_IDENTITY="" \\
  archive

# 4. Package as .IPA
echo "📦 Packaging App.ipa..."
mkdir -p "$PWD/build/Payload"
cp -r "$PWD/build/App.xcarchive/Products/Applications/App.app" "$PWD/build/Payload/"
cd "$PWD/build"
zip -qr "${bundleId.split('.').pop() || 'App'}.ipa" Payload

echo "✅ SUCCESS! Your iOS IPA file has been built at:"
echo "📁 $(pwd)/${bundleId.split('.').pop() || 'App'}.ipa"
echo "📲 You can now install it on iPhone using Sideloadly, AltStore, or TrollStore!"
`;

  const githubWorkflowContent = `name: Build and Export iOS IPA

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-ipa:
    name: Build iOS IPA Package
    runs-on: macos-14
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Build Web Production Assets
        run: npm run build

      - name: Initialize & Sync Capacitor iOS
        run: |
          npx cap add ios || true
          npx cap sync ios

      - name: Build Xcode Archive & Create .ipa
        run: |
          cd ios/App
          xcodebuild -workspace App.xcworkspace \\
            -scheme App \\
            -configuration Release \\
            -destination "generic/platform=iOS" \\
            -archivePath "$PWD/build/App.xcarchive" \\
            CODE_SIGNING_ALLOWED=NO \\
            CODE_SIGNING_REQUIRED=NO \\
            CODE_SIGN_IDENTITY="" \\
            archive

          mkdir -p "$PWD/build/Payload"
          cp -r "$PWD/build/App.xcarchive/Products/Applications/App.app" "$PWD/build/Payload/"
          cd "$PWD/build"
          zip -qr "App.ipa" Payload
          echo "IPA Created Successfully at $PWD/App.ipa"

      - name: Upload IPA Artifact
        uses: actions/upload-artifact@v4
        with:
          name: PropManage-iOS-App-IPA
          path: ios/App/build/App.ipa
          retention-days: 14
`;

  const capacitorConfigContent = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${bundleId}',
  appName: '${appDisplayName}',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
`;

  // QR Code URL Generator using simple clean image API for Safari scanning
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentAppUrl)}&margin=10`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <Apple className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">iOS .IPA & iPhone Installer Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                  iPhone / iPad Ready
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                สร้างไฟล์ <span className="font-mono text-amber-300 font-bold">.ipa</span> สำหรับติดตั้งบน iPhone ทุกรุ่น หรือติดตั้งเป็น Web App ไร้ขอบทันที
              </p>
            </div>
          </div>

          {/* Quick Stats / Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadFile('build-ipa.sh', buildScriptContent)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              title="ดาวน์โหลดสคริปต์สร้าง .IPA อัตโนมัติ"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด build-ipa.sh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('instant-web')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
            activeSubTab === 'instant-web'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>1. ใช้งานบน iPhone ทันที (Safari Web App)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('github-actions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
            activeSubTab === 'github-actions'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Github className="w-4 h-4" />
          <span>2. สร้างไฟล์ .IPA ผ่าน GitHub Actions (ไม่ต้องมี Mac)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mac-xcode')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
            activeSubTab === 'mac-xcode'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>3. คอมไพล์ .IPA บน Mac ด้วย Xcode</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sideload-install')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
            activeSubTab === 'sideload-install'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. วิธีลง .IPA ใน iPhone (Sideloadly / AltStore)</span>
        </button>
      </div>

      {/* Tab 1: Instant iPhone Web App Install */}
      {activeSubTab === 'instant-web' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* QR Code Scanner Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">สแกนด้วยกล้อง iPhone</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              เปิดกล้องบน iPhone ของคุณ ส่องที่ QR Code ด้านล่างเพื่อเปิดลิงก์บน Safari ทันที
            </p>

            <div className="p-4 bg-slate-50 border-2 border-dashed border-blue-300 rounded-2xl my-4 shadow-inner">
              <img 
                src={qrImageUrl} 
                alt="Scan to open on iPhone" 
                className="w-48 h-48 rounded-xl object-contain mx-auto shadow-xs"
              />
            </div>

            <div className="w-full bg-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs font-mono text-slate-700 border border-slate-200 truncate">
              <span className="truncate mr-2">{currentAppUrl}</span>
              <button
                onClick={() => handleCopy('app-url', currentAppUrl)}
                className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 text-slate-800 rounded-md border border-slate-300 font-sans font-bold flex-shrink-0 cursor-pointer"
              >
                {copiedKey === 'app-url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'app-url' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>
          </div>

          {/* Step-by-Step Visual Tutorial */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-bold text-slate-900">3 ขั้นตอนเพิ่มแอปบนหน้าจอโฮม iPhone (Full Screen)</h2>
            </div>
            <p className="text-xs text-slate-600">
              ระบบนี้รองรับ <strong className="text-blue-700">Apple Web App Standalone</strong> เต็มรูปแบบ เมื่อบันทึกลงหน้าจอโฮม จะเปิดใช้งานแบบไร้ขอบ ไม่มีแถบ URL เหมือนแอปแท้ 100%
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">เปิดเว็บไซต์ด้วยแอป Safari บน iPhone</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    สแกน QR Code หรือเปิดลิงก์นี้ในเบราว์เซอร์ Safari (จำเป็นต้องใช้ Safari สำหรับ iOS Web App)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span>แตะปุ่ม "แชร์" (Share Icon)</span>
                    <Share2 className="w-4 h-4 text-blue-600 inline" />
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    แตะที่ไอคอนรูปสี่เหลี่ยมที่มีลูกศรชี้ขึ้น (ปุ่ม Share) ที่แถบเมนูด้านล่างสุดของจอ iPhone
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span>เลือก "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold">📲</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    เลื่อนเมนูลงมาแล้วกด <strong>"Add to Home Screen"</strong> จากนั้นกด <strong>"Add (เพิ่ม)"</strong> ที่มุมบนขวา
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3 mt-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div className="text-xs text-emerald-900">
                <strong>เรียบร้อย!</strong> ไอคอนของแอป <strong>"{appDisplayName}"</strong> จะปรากฏบนหน้าจอ iPhone พร้อมเปิดใช้งานแบบเร็วลื่นไหล ออฟไลน์แคช และเต็มจอทันที
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GitHub Actions Cloud Build .IPA */}
      {activeSubTab === 'github-actions' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Github className="w-6 h-6 text-slate-900" />
                <h2 className="text-lg font-bold text-slate-900">สร้างไฟล์ .IPA ฟรีบน Cloud ผ่าน GitHub Actions</h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                คุณสามารถใช้เซิร์ฟเวอร์ macOS 14 ของ GitHub คอมไพล์และส่งไฟล์ <strong>.ipa</strong> ออกมาให้ดาวน์โหลดได้ฟรี โดยไม่ต้องมีเครื่อง Mac!
              </p>
            </div>

            <button
              onClick={() => handleDownloadFile('.github/workflows/build-ios-ipa.yml', githubWorkflowContent, 'text/yaml')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด build-ios-ipa.yml</span>
            </button>
          </div>

          {/* Step list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">Push โค้ดขึ้น GitHub</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export โค้ดโปรเจกต์นี้ไปยัง GitHub Repository ของคุณ (ผ่านเมนู Settings ➔ Export to GitHub)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">GitHub รัน Workflow อัตโนมัติ</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ไฟล์ <code className="bg-slate-200 px-1 rounded text-indigo-700">.github/workflows/build-ios-ipa.yml</code> จะถูกรันบนเครื่อง Mac M1 Cloud ของ GitHub ทันที
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">ดาวน์โหลดไฟล์ .IPA</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ไปที่แท็บ <strong>Actions</strong> บน GitHub แล้วคลิกโหลด Artifact ชื่อ <strong className="text-emerald-700">PropManage-iOS-App-IPA</strong> ได้ทันที
              </p>
            </div>
          </div>

          {/* Workflow Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-mono font-bold">.github/workflows/build-ios-ipa.yml</span>
              <button
                onClick={() => handleCopy('github-yml', githubWorkflowContent)}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold border border-slate-300 cursor-pointer"
              >
                {copiedKey === 'github-yml' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'github-yml' ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด YAML'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 custom-scrollbar">
              {githubWorkflowContent}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Mac + Xcode Build Instructions */}
      {activeSubTab === 'mac-xcode' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Laptop className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">คอมไพล์บน Mac ด้วย Xcode & Capacitor</h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                ขั้นตอนการสร้างโฟลเดอร์ iOS Native และคอมไพล์ไฟล์ .ipa ด้วยคำสั่ง Terminal บนเครื่อง Mac
              </p>
            </div>

            <button
              onClick={() => handleDownloadFile('build-ipa.sh', buildScriptContent)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด build-ipa.sh</span>
            </button>
          </div>

          {/* Quick Terminal Command Cards */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">ขั้นตอนที่ 1: ติดตั้ง & แปลงเว็บเป็นโปรเจกต์ iOS</span>
                </div>
                <button
                  onClick={() => handleCopy('cmd-1', 'npm install && npm run cap:init:ios')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 font-sans cursor-pointer"
                >
                  {copiedKey === 'cmd-1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cmd-1' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
              <code className="block font-mono text-emerald-400 text-xs bg-black/40 p-2.5 rounded-lg">
                npm install && npm run cap:init:ios
              </code>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">ขั้นตอนที่ 2: สร้างไฟล์ .ipa ด้วยสคริปต์ 1 คลิก</span>
                </div>
                <button
                  onClick={() => handleCopy('cmd-2', 'bash scripts/build-ipa.sh')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 font-sans cursor-pointer"
                >
                  {copiedKey === 'cmd-2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cmd-2' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
              <code className="block font-mono text-emerald-400 text-xs bg-black/40 p-2.5 rounded-lg">
                bash scripts/build-ipa.sh
              </code>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-300">หรือเปิดในโปรแกรม Xcode โดยตรง</span>
                </div>
                <button
                  onClick={() => handleCopy('cmd-3', 'npm run cap:open:ios')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 font-sans cursor-pointer"
                >
                  {copiedKey === 'cmd-3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cmd-3' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
              <code className="block font-mono text-cyan-400 text-xs bg-black/40 p-2.5 rounded-lg">
                npm run cap:open:ios
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Sideloadly / AltStore .IPA Installation */}
      {activeSubTab === 'sideload-install' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">วิธีติดตั้งไฟล์ .IPA ลงบน iPhone (ไม่ต้องผ่าน App Store)</h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              หลังจากได้ไฟล์ <strong className="text-slate-800 font-mono">App.ipa</strong> มาแล้ว คุณสามารถติดตั้งลง iPhone ได้ทันทีด้วยเครื่องมือฟรีเหล่านี้:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tool 1: Sideloadly (Recommended) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-xs">
                  แนะนำที่สุด ⭐
                </span>
                <span className="text-xs font-bold text-slate-500">Windows & Mac</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">วิธีที่ 1: ใช้โปรแกรม Sideloadly (ฟรี 100%)</h3>
              <p className="text-xs text-slate-600">
                โปรแกรมฟรีสำหรับลากไฟล์ .ipa ลง iPhone โดยใช้ Apple ID ทั่วไป ไม่ต้องเสียเงินซื้อบัญชี Developer
              </p>

              <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside pt-1">
                <li>ดาวน์โหลด <strong>Sideloadly</strong> (sideloadly.io) ลงคอมพิวเตอร์</li>
                <li>เสียบสาย iPhone เข้ากับคอมพิวเตอร์ (กดเชื่อถือ Trust)</li>
                <li>ลากไฟล์ <strong>App.ipa</strong> วางลงในช่อง IPA ของ Sideloadly</li>
                <li>กรอก Apple ID ของคุณ แล้วกด <strong>Start</strong></li>
                <li>บน iPhone: ไปที่ <em>ตั้งค่า ➔ ทั่วไป ➔ การจัดการ VPN และอุปกรณ์ ➔ กดเชื่อถือนักพัฒนา</em></li>
                <li>เปิดใช้งานแอปบน iPhone ได้ทันที!</li>
              </ol>
            </div>

            {/* Tool 2: AltStore / Scarlet */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-xs">
                  ไร้สาย (Wi-Fi)
                </span>
                <span className="text-xs font-bold text-slate-500">iOS 15 / 16 / 17 / 18</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">วิธีที่ 2: ใช้ AltStore หรือ Scarlet</h3>
              <p className="text-xs text-slate-600">
                ติดตั้ง .ipa ลงเครื่องผ่านเครือข่าย Wi-Fi ภายในบ้านโดยตรง
              </p>

              <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside pt-1">
                <li>ติดตั้ง <strong>AltServer</strong> บนคอมพิวเตอร์</li>
                <li>ส่งไฟล์ <strong>App.ipa</strong> ไปยังแอป Files บน iPhone</li>
                <li>เปิดแอป <strong>AltStore</strong> บน iPhone ➔ แตะปุ่มเครื่องหมายบวก <strong>(+)</strong></li>
                <li>เลือกไฟล์ .ipa ที่ส่งมา ระบบจะติดตั้งแอปให้ทันที</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Customizer */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileCode className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">ตั้งค่าชื่อแอป & Bundle ID สำหรับ iOS App</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อแอปบนหน้าจอ iPhone (App Display Name):
            </label>
            <input
              type="text"
              value={appDisplayName}
              onChange={(e) => setAppDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. พีแอนด์เจ อพาร์ตเมนต์"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bundle Identifier (iOS App ID):
            </label>
            <input
              type="text"
              value={bundleId}
              onChange={(e) => setBundleId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. com.remixproperty.billing"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              เวอร์ชัน (App Version):
            </label>
            <input
              type="text"
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="1.0.0"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => handleDownloadFile('capacitor.config.ts', capacitorConfigContent, 'text/typescript')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด capacitor.config.ts</span>
          </button>

          <button
            onClick={() => handleDownloadFile('build-ipa.sh', buildScriptContent, 'text/x-sh')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด build-ipa.sh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
