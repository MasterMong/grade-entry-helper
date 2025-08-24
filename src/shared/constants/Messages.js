/**
 * User-facing messages and text constants
 */

export const MESSAGES = {
  errors: {
    clipboardEmpty: 'คุณยังไม่ได้คัดลอกข้อมูลใดๆ',
    clipboardApiUnavailable: 'ไม่สามารถใช้งาน Clipboard API ได้ โปรดตรวจสอบว่าคุณอยู่บน HTTPS',
    noEnabledColumns: 'ไม่พบช่องกรอกคะแนนที่เปิดใช้งานในหน้านี้',
    noStudentRows: 'ไม่พบช่องกรอกคะแนนของนักเรียนที่เปิดใช้งาน',
    noDataFound: 'ไม่พบข้อมูลในคลิปบอร์ด',
    invalidValue: (value, column, weight) => `ค่า ${value} สำหรับ ${column} ไม่ถูกต้อง ต้องอยู่ระหว่าง 0 ถึง ${weight}`,
    columnMismatch: (dataColumns, enabledColumns, columnNames) => 
      `ข้อมูลมี ${dataColumns} คอลัมน์ แต่พบช่องกรอกคะแนนที่เปิดใช้งาน ${enabledColumns} คอลัมน์\n\nคอลัมน์ที่เปิดใช้งาน: ${columnNames}\n\nโปรดตรวจสอบว่าข้อมูลในคลิปบอร์ดของคุณตรงกับคอลัมน์ที่เปิดใช้งาน`,
    dropdownNotSelected: {
      both: 'กรุณาเลือก "รายวิชา" และ "กลุ่ม" ก่อนใช้งานปลั๊กอิน',
      subject: 'กรุณาเลือก "รายวิชา" ก่อนใช้งานปลั๊กอิน',
      section: 'กรุณาเลือก "กลุ่ม" ก่อนใช้งานปลั๊กอิน'
    },
    pageNotFound: 'ไม่พบองค์ประกอบที่จำเป็นในหน้า',
    extensionInitFailed: 'ส่วนขยายเริ่มต้นไม่สำเร็จ'
  },
  
  success: {
    gradesUpdated: (count, columns) => `อัปเดตคะแนน ${count} ช่องเรียบร้อยแล้ว!\n\nคอลัมน์ที่ประมวลผล: ${columns}`,
    gradesCleared: (count, columns) => `ล้างข้อมูลคะแนน ${count} ช่องเรียบร้อยแล้ว!\n\nคอลัมน์ที่ล้าง: ${columns}`,
    rowCountSet: (count) => `ตั้งค่าการแสดงผลเป็น ${count} แถวต่อหน้าเรียบร้อยแล้ว`,
    extensionReady: (count) => `เครื่องมือช่วยกรอกคะแนน SGS พร้อมใช้งาน! ตรวจพบ ${count} คอลัมน์ที่เปิดใช้งาน`
  },
  
  info: {
    extensionLoaded: 'เครื่องมือช่วยกรอกคะแนน SGS โหลดแล้ว กรุณาเลือกรายวิชาและกลุ่มเพื่อตรวจหาคอลัมน์คะแนน',
    headersDetected: 'ตรวจพบหัวตาราง เริ่มต้นจากแถวที่ 2',
    noColumnsDetected: 'ไม่พบคอลัมน์คะแนนที่เปิดใช้งานในหน้านี้ โปรดตรวจสอบว่าคุณได้เลือกรายวิชาและกลุ่มแล้ว และหน้านี้โหลดสมบูรณ์แล้ว',
    detectedColumns: 'คอลัมน์ที่เปิดใช้งานที่ตรวจพบ:\n\n',
    clipboardDataFormat: '\n\nข้อมูลในคลิปบอร์ดของคุณควรมีคอลัมน์ตามลำดับนี้',
    howToUseContent: '1. คัดลอกข้อมูลคะแนนจากโปรแกรมสเปรดชีต (เช่น Google Sheets, Excel)\n2. คอลัมน์ในชีตของคุณต้องเรียงลำดับเหมือนกับคอลัมน์ในหน้านี้\n3. คลิกปุ่ม "กรอกข้อมูลจากคลิปบอร์ด"\n4. สคริปต์จะกรอกคะแนนให้คุณโดยอัตโนมัติ'
  },
  
  confirmations: {
    clearAll: (columns) => `คุณแน่ใจหรือไม่ว่าต้องการล้างค่าทั้งหมดในคอลัมน์เหล่านี้?\n\n${columns}\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`
  },
  
  ui: {
    buttons: {
      fillFromClipboard: 'กรอกข้อมูลที่คัดลอกไว้',
      clearAllValues: 'ลบคะแนนทั้งหมด',
      showDetectedColumns: 'แสดงคอลัมน์ที่เปิดใช้งาน',
      setRows: 'ตกลง',
      minimize: '−',
      close: '×',
      howToUse: 'วิธีใช้งาน'
    },
    
    labels: {
      extensionTitle: 'เครื่องมือช่วยกรอกคะแนน SGS',
      rows: 'แถว:',
      columnsDetected: (count) => `ตรวจพบ ${count} คอลัมน์`,
      devCredit: 'พัฒนาโดยครูมงคล',
      statusMessages: {
        selectFirst: 'กรุณาเลือกรายวิชาและกลุ่มก่อน'
      }
    },
    
    tooltips: {
      miniPanel: 'เครื่องมือช่วยกรอกคะแนน SGS - คลิกเพื่อขยาย'
    }
  }
};
