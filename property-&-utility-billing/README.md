# 🏢 P&J Apartment & Utility Billing Management System

ระบบบริหารจัดการหอพักและอพาร์ตเมนต์ จัดการค่าเช่า บันทึกมิเตอร์น้ำ-ไฟ ออกใบแจ้งหนี้ PDF อัตโนมัติ พร้อมระบบเชื่อมต่อฐานข้อมูล **Firebase (Cloud Firestore & Realtime Database)** แบบ 2-way Realtime Sync และรองรับการนำขึ้น **GitHub** พร้อม Deploy ไปยัง **Firebase Hosting**

---

## 🚀 1. วิธีนำโค้ดขึ้น GitHub (Push to GitHub)

หากคุณดาวน์โหลดหรือ Clone โปรเจกต์นี้มา แล้วต้องการนำขึ้น Repository ของคุณบน GitHub:

### ขั้นตอนที่ 1: ติดตั้ง Git และเปิด Terminal / Command Prompt ในโฟลเดอร์โปรเจกต์
```bash
# 1. เริ่มต้น Git repository
git init

# 2. เพิ่มไฟล์ทั้งหมดเข้าสู่ Staging
git add .

# 3. บันทึก Commit แรก
git commit -m "feat: Property billing management with Firebase realtime sync"

# 4. เปลี่ยนชื่อ Branch หลักเป็น main
git branch -M main

# 5. เชื่อมโยงกับ GitHub Repository ของคุณ (เปลี่ยน URL เป็นของคุณ)
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git

# 6. Push โค้ดขึ้น GitHub
git push -u origin main
```

> **หมายเหตุความปลอดภัย**: ไฟล์ `.env` และข้อมูลส่วนตัวจะถูกกันไว้โดย `.gitignore` โดยอัตโนมัติ ทำให้คุณสามารถ Push โค้ดขึ้น GitHub ได้อย่างปลอดภัย

---

## ⚡ 2. การเชื่อมต่อกับ Firebase (Firebase Setup)

ระบบนี้รองรับการเชื่อมต่อ Firebase 2 รูปแบบ:

### รูปแบบ ก: ใช้งานระบบเดิมทันที (Out of the box)
ระบบมีค่าตั้งต้นเชื่อมต่อไปยัง Firebase Project `dorm-4263e` ที่เปิดใช้งาน Cloud Firestore และ Realtime Database ไว้อยู่แล้ว คุณสามารถรันโปรเจกต์และใช้งานได้ทันทีโดยไม่ต้องตั้งค่าใดๆ เพิ่มเติม

### รูปแบบ ข: ใช้งานกับ Firebase Project ของคุณเอง (แนะนำสำหรับการใช้งานส่วนตัว)
1. ไปที่ [Firebase Console](https://console.firebase.google.com/) แล้วกด **"Add project"**
2. เปิดใช้งานบริการ 2 ตัวดังนี้:
   - **Cloud Firestore**: เลือกสร้าง Database ในโหมด Test หรือ Production (Region แนะนำ: `asia-southeast1`)
   - **Realtime Database**: กดสร้าง Database (Location: `Singapore: asia-southeast1`)
3. ไปที่ **Project Settings** (ไอคอนฟันเฟือง) -> แถบ **General** -> หัวข้อ **Your apps** -> กดไอคอนเว็บ `</>` เพื่อสร้าง Web App
4. คัดลอกค่า Config ที่ได้มาใส่ในไฟล์ `.env` ที่ Root ของโปรเจกต์ (คัดลอกจาก `.env.example`):

```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef..."
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
```

5. อัปเดต Project ID ในไฟล์ `.firebaserc` ให้ตรงกับ Project ID ของคุณ:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

---

## 🔒 3. กฎความปลอดภัยของ Firebase (Security Rules)

ในโปรเจกต์นี้มีไฟล์ Security Rules เตรียมไว้ให้พร้อมใช้งานแล้ว:
- `firestore.rules`: สำหรับ Cloud Firestore (คอลเลกชัน `buildings`, `monthly_records`, `dorm_config`, `expenses`, `users`)
- `database.rules.json`: สำหรับ Realtime Database

### การส่ง Security Rules ขึ้น Firebase:
```bash
# ส่ง Rules ขึ้น Firebase ทันที
npm run deploy:rules
```
หรือสามารถคัดลอกโค้ดจาก `firestore.rules` และ `database.rules.json` ไปวางในแท็บ **Rules** บน Firebase Console ได้โดยตรง

---

## 💻 4. คำสั่งสำหรับพัฒนาและรันบนเครื่อง (Development)

```bash
# 1. ติดตั้ง Dependencies ทั้งหมด
npm install

# 2. รันโหมด Development (เปิดเบราว์เซอร์ที่ http://localhost:3000)
npm run dev

# 3. ตรวจสอบโค้ดและ Type-checking
npm run lint

# 4. ทดสอบ Build เวอร์ชัน Production
npm run build
```

---

## 🌐 5. การ Deploy ขึ้น Firebase Hosting

คุณสามารถ Deploy เว็บไซต์ขึ้นอินเทอร์เน็ตผ่าน Firebase Hosting ได้ฟรี:

```bash
# 1. ล็อกอิน Firebase CLI (ทำครั้งแรก)
npx firebase-tools login

# 2. Build และ Deploy เว็บแอปขึ้น Firebase Hosting
npm run deploy:firebase
```

เมื่อเสร็จสิ้น Firebase จะให้ URL สำหรับเข้าใช้งาน เช่น `https://<your-project-id>.web.app`

---

## 🛠 โครงสร้างโปรเจกต์ (Project Structure)

```
├── src/
│   ├── firebase/
│   │   ├── config.ts          # การตั้งค่า Firebase SDK & Environment Variables
│   │   └── realtimeSync.ts    # ระบบ 2-way Realtime Sync ระหว่าง Firestore & RTDB
│   ├── components/            # UI Components (Dashboard, Meter, Invoice, ฯลฯ)
│   ├── data/                  # ข้อมูลเริ่มต้นและ Mock Data
│   ├── utils/                 # ฟังก์ชันคำนวณมิเตอร์และรอบบิล
│   ├── App.tsx                # ตัวจัดการ State หลักและ Navigation
│   └── types.ts               # โครงสร้าง TypeScript Data Types
├── .github/workflows/         # CI/CD Automation (GitHub Actions)
├── firebase.json              # การตั้งค่า Firebase Hosting & Rules
├── firestore.rules            # กฎความปลอดภัย Cloud Firestore
├── database.rules.json        # กฎความปลอดภัย Realtime Database
├── .env.example               # ตัวอย่าง Environment Variables
└── package.json               # คำสั่งและ Dependencies
```
