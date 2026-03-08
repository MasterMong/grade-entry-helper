# SGS Bot v2.1

Extension สำหรับ Chrome / Edge / Firefox ช่วยกรอกเกรดแบบ Bulk เข้าระบบ SGS (sgs.bopp-obec.info) โดยนำเข้าข้อมูลจาก Google Sheets ผ่าน Clipboard

---

## ฟีเจอร์หลัก

- **รองรับทั้ง 3 หน้ากรอกเกรด** — ตลอดภาค, ก่อนกลางภาค, หลังกลางภาค
- **โหมดเรียงแถว** — วางข้อมูลตามลำดับแถวในหน้า
- **โหมดจับคู่รหัสนักเรียน** — ใช้เลขประจำตัวนักเรียนจับคู่ ไม่ต้องเรียงลำดับให้ตรง
- **ปรับจำนวนแถวอัตโนมัติ** — ขยายรายการนักเรียนให้ครบก่อนกรอก
- **เปิดคอลัมน์อัตโนมัติ** — ติ๊กคอลัมน์เกรดให้ครบก่อนเริ่มกรอก
- **ป๊อปอัปลัด** — คลิกไอคอน Extension เพื่อเปิดหน้ากรอกเกรดได้โดยตรง
- **แผงควบคุมลากได้** — ย้ายตำแหน่ง UI ได้ตามต้องการ

---

## วิธีติดตั้ง

### จาก Store (แนะนำ)

- [Chrome Web Store](#) *(เร็วๆ นี้)*
- [Firefox Add-ons](#) *(เร็วๆ นี้)*

### Build เองจาก Source

```bash
git clone https://github.com/MasterMong/grade-entry-helper.git
cd grade-entry-helper
npm install
npm run build
```

จากนั้นโหลด Extension:

**Chrome / Edge**
1. เปิด `chrome://extensions/`
2. เปิด "Developer mode"
3. คลิก "Load unpacked" แล้วเลือกโฟลเดอร์ `dist/`

**Firefox**
1. เปิด `about:debugging` → "This Firefox"
2. คลิก "Load Temporary Add-on"
3. เลือกไฟล์ใดก็ได้ในโฟลเดอร์ `dist/`

---

## วิธีใช้งาน

1. เปิดหน้ากรอกเกรดใน SGS (หรือคลิกปุ่มลัดใน Popup)
2. เลือกวิชาและกลุ่มเรียน
3. คัดลอกข้อมูลเกรดจาก Google Sheets (Ctrl+C)
4. คลิก "วางเกรด" ในแผงควบคุม
5. ตรวจสอบเกรดแล้วกด Submit

### รูปแบบข้อมูล

**โหมดเรียงแถว** — ข้อมูล Tab-separated, แต่ละแถว = นักเรียน 1 คน, จำนวนคอลัมน์ต้องตรงกับคอลัมน์ที่เปิดอยู่ใน SGS

**โหมดจับคู่รหัส** — คอลัมน์แรก = เลขประจำตัวนักเรียน (5 หลัก), คอลัมน์ถัดไป = เกรดแต่ละคอลัมน์

---

## โครงสร้างโปรเจกต์

```
src/
├── core/                    # ระบบหลัก
│   ├── ExtensionCore.js     # ตัวประสานงานหลัก
│   ├── SGSPageDetector.js   # ตรวจจับประเภทหน้า
│   └── BasePageController.js
├── shared/                  # Utilities และ Constants
│   ├── constants/           # Selectors, Messages, Config
│   ├── ui/                  # NotificationManager, StyleManager
│   └── utils/               # DOMUtils, SGSFormHandler
├── pages/
│   └── gradeEntry/          # ฟีเจอร์กรอกเกรด
│       ├── GradeEntryController.js
│       ├── GradeEntryUI.js
│       ├── ColumnDetector.js
│       ├── ClipboardHandler.js
│       └── FieldUpdater.js
└── content-scripts/
    └── grade-entry.js       # Entry point
```

---

## คำสั่ง Build

```bash
npm run build          # Production build
npm run build:dev      # Development build (with source maps)
npm run build:watch    # Development build + auto-rebuild
npm run clean          # ลบ build artifacts
npm run validate       # ตรวจสอบโครงสร้างโค้ด
npm run lint           # ตรวจสอบ code quality
./release.sh           # Build + Pack ทั้ง Chrome และ Firefox
```

---

## Browser Compatibility

| Browser | เวอร์ชัน | Manifest |
|---------|---------|---------|
| Chrome | >= 88 | V3 |
| Edge | >= 88 | V3 |
| Firefox | >= 78 | V2 (แปลงอัตโนมัติ) |

---

## การมีส่วนร่วม (Contributing)

ยินดีรับ Pull Request และ Issue จากทุกคน!

### ขั้นตอนการ Contribute

**1. Fork และ Clone**
```bash
git clone https://github.com/<your-username>/grade-entry-helper.git
cd grade-entry-helper
npm install
```

**2. สร้าง Branch ใหม่**

ตั้งชื่อ Branch ให้สื่อความหมาย:
```bash
git checkout -b feature/ชื่อฟีเจอร์
# หรือ
git checkout -b fix/ชื่อบั๊กที่แก้
```

**3. เขียนโค้ดและทดสอบ**
```bash
npm run build:watch    # เปิด watch mode ระหว่างพัฒนา
npm run validate       # ตรวจสอบโครงสร้าง
npm run lint           # ตรวจสอบ code style
```

โหลด Extension จากโฟลเดอร์ `dist/` ในเบราว์เซอร์เพื่อทดสอบจริง

**4. Commit**

ใช้รูปแบบ [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: เพิ่มฟีเจอร์ใหม่
fix: แก้ไขบั๊ก
docs: อัปเดตเอกสาร
refactor: ปรับโครงสร้างโค้ด
```

**5. Push และเปิด Pull Request**
```bash
git push origin feature/ชื่อฟีเจอร์
```

จากนั้นไปที่ [GitHub](https://github.com/MasterMong/grade-entry-helper) แล้วคลิก "Compare & pull request"

ในคำอธิบาย PR ระบุ:
- สิ่งที่เปลี่ยนแปลง
- วิธีทดสอบ
- Screenshot (ถ้ามี)

### แนวทางการเขียนโค้ด

- ใช้ ES6+ modules (ไม่ใช้ CommonJS)
- ห้าม inject inline script — SGS CSP บล็อก (ใช้ background.js แทน)
- ข้อความที่แสดงผู้ใช้ต้องอยู่ใน `src/shared/constants/Messages.js` เท่านั้น
- DOM selectors อยู่ใน `src/shared/constants/SGSSelectors.js`
- อ่าน `CLAUDE.md` เพื่อทำความเข้าใจ Architecture ก่อน

### รายงานบั๊ก

เปิด [Issue](https://github.com/MasterMong/grade-entry-helper/issues) พร้อมระบุ:
- เบราว์เซอร์และเวอร์ชัน
- ขั้นตอนที่ทำให้เกิดบั๊ก
- สิ่งที่คาดหวัง vs สิ่งที่เกิดขึ้นจริง
- Screenshot หรือ Console error (ถ้ามี)

---

## License

MIT License — ดูรายละเอียดใน [LICENSE](LICENSE)

---

พัฒนาโดย [ครูมงคล](https://mongkon.ch) · [mongkon.org@gmail.com](mailto:mongkon.org@gmail.com)
