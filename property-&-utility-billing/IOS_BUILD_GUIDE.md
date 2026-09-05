# 📱 คู่มือการสร้างไฟล์ .IPA และติดตั้งแอปบน iPhone / iPad

โปรเจกต์นี้ได้รับการตั้งค่า **Capacitor iOS** และ **GitHub Actions (.github/workflows/build-ios-ipa.yml)** ไว้อย่างสมบูรณ์แบบ คุณสามารถสร้างไฟล์ `.ipa` เพื่อติดตั้งบน iPhone หรือเปิดใช้งานเป็นแอปบน iPhone ได้ทันที 4 ช่องทาง:

---

## ⚡ ช่องทางที่ 1: ใช้งานบน iPhone ทันทีผ่าน Safari (ไม่ต้องสร้างไฟล์ .ipa)
หากคุณต้องการใช้งานบน iPhone ตอนนี้ทันทีโดยไม่ต้องผ่านคอมพิวเตอร์:
1. เปิดแอป **Safari** บน iPhone แล้วไปที่ URL ของระบบนี้
2. แตะปุ่ม **"แชร์" (Share icon - สี่เหลี่ยมลูกศรชี้ขึ้น 📤)** ที่แถบด้านล่าง
3. เลื่อนลงมาเลือก **"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen 📲)**
4. กด **"เพิ่ม" (Add)** ที่มุมบนขวา
5. หน้าจอโฮมของ iPhone จะมีไอคอนแอปปรากฏขึ้น และเปิดใช้งานแบบ **Full Screen ไร้ขอบ เสมือนแอปแท้ 100%**!

---

## ☁️ ช่องทางที่ 2: สร้างไฟล์ .IPA อัตโนมัติบน Cloud ผ่าน GitHub Actions (ฟรี ไม่ต้องมี Mac!)
หากคุณใช้ Windows หรือไม่มีเครื่อง Mac:
1. กดเมนู **Settings ➔ Export to GitHub** เพื่อส่งโค้ดขึ้น GitHub Repository
2. GitHub จะตรวจพบไฟล์ `.github/workflows/build-ios-ipa.yml` และใช้เซิร์ฟเวอร์ macOS 14 ของ GitHub คอมไพล์โปรเจกต์อัตโนมัติ
3. ไปที่แท็บ **Actions** ในหน้า GitHub ➔ เลือก Workflow **"Build and Export iOS IPA"**
4. ดาวน์โหลดไฟล์จาก Artifacts ชื่อ **`PropManage-iOS-App-IPA`** จะได้ไฟล์ **`App.ipa`** ทันที!

---

## 🍎 ช่องทางที่ 3: คอมไพล์ด้วย Xcode บนเครื่อง Mac
หากคุณมีเครื่อง Mac:
1. เปิด Terminal ในโฟลเดอร์โปรเจกต์ แล้วรันคำสั่ง:
   ```bash
   npm install
   npm run cap:init:ios
   ```
2. รันสคริปต์สร้างไฟล์ .ipa อัตโนมัติ:
   ```bash
   bash scripts/build-ipa.sh
   ```
   หรือเปิด Xcode ขึ้นมาเพื่อจัดการ Signing:
   ```bash
   npm run cap:open:ios
   ```
3. ใน Xcode:
   - ไปที่แท็บ **Signing & Capabilities** ➔ เลือก **Automatically manage signing** แล้วเลือก Apple ID ของคุณ
   - เลือก Target Device เป็น **Any iOS Device (arm64)**
   - ไปที่เมนูบาร์ด้านบน เลือก **Product ➔ Archive**
   - ในหน้าต่าง Organizer กด **Distribute App** ➔ **Export** จะได้ไฟล์ `.ipa` พร้อมใช้งาน

---

## 📲 ช่องทางที่ 4: วิธีนำไฟล์ .IPA ติดตั้งลง iPhone (Sideloading)

เมื่อคุณได้ไฟล์ `App.ipa` มาแล้ว สามารถติดตั้งลงใน iPhone ได้อย่างง่ายดายโดยไม่ต้องผ่าน App Store:

### 1. ใช้โปรแกรม Sideloadly (แนะนำที่สุด - รองรับทั้ง Windows และ Mac ฟรี 100%)
- ดาวน์โหลดโปรแกรม [Sideloadly](https://sideloadly.io/) ติดตั้งลงคอมพิวเตอร์
- เสียบสาย iPhone เข้ากับคอมพิวเตอร์ (กดกดยอมรับ Trust บน iPhone)
- ลากไฟล์ `App.ipa` วางลงในหน้าต่างโปรแกรม Sideloadly
- กรอก Apple ID ของคุณ แล้วกดปุ่ม **Start**
- ระบบจะเซ็น Certificate และส่งแอปเข้าติดตั้งบน iPhone ทันที
- บน iPhone: ไปที่ **Settings (การตั้งค่า) ➔ General (ทั่วไป) ➔ VPN & Device Management (การจัดการอุปกรณ์) ➔ แตะที่อีเมลของคุณ แล้วกด Trust (เชื่อถือ)**

### 2. ใช้ AltStore หรือ Scarlet
- ส่งไฟล์ `App.ipa` เข้าไปที่แอป Files (ไฟล์) บน iPhone
- เปิดแอป AltStore หรือ Scarlet บน iPhone แล้วเลือกเปิดไฟล์ .ipa เพื่อติดตั้งโดยตรงผ่าน Wi-Fi
