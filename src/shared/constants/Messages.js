/**
 * User-facing messages and text constants
 */

export const MESSAGES = {
  errors: {
    clipboardEmpty: 'คลิปบอร์ดว่างเปล่า',
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
    extensionReady: (count) => `ตัวช่วยกรอกคะแนน พร้อมใช้งาน! ตรวจพบ ${count} คอลัมน์ที่เปิดใช้งาน`
  },
  
  info: {
    extensionLoaded: 'ตัวช่วยกรอกคะแนน โหลดแล้ว กรุณาเลือกรายวิชาและกลุ่มเพื่อตรวจหาคอลัมน์คะแนน',
    headersDetected: 'ตรวจพบหัวตาราง เริ่มต้นจากแถวที่ 2',
    noColumnsDetected: 'ไม่พบคอลัมน์คะแนนที่เปิดใช้งานในหน้านี้ โปรดตรวจสอบว่าคุณได้เลือกรายวิชาและกลุ่มแล้ว และหน้านี้โหลดสมบูรณ์แล้ว',
    detectedColumns: 'คอลัมน์ที่เปิดใช้งานที่ตรวจพบ:\n\n',
    clipboardDataFormat: '\n\nข้อมูลในคลิปบอร์ดของคุณควรมีคอลัมน์ตามลำดับนี้'
  },
  
  confirmations: {
    clearAll: (columns) => `คุณแน่ใจหรือไม่ว่าต้องการล้างค่าทั้งหมดในคอลัมน์เหล่านี้?\n\n${columns}\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`
  },
  
  ui: {
    buttons: {
      fillFromClipboard: 'กรอกข้อมูลจากคลิปบอร์ด',
      clearAllValues: 'ล้างค่าทั้งหมด',
      showDetectedColumns: 'แสดงคอลัมน์ที่ตรวจพบ',
      setRows: 'ตั้งค่า',
      minimize: '−',
      close: '×'
    },
    
    labels: {
      extensionTitle: 'ตัวช่วยกรอกคะแนน',
      rows: 'แถว:',
      columnsDetected: (count) => `ตรวจพบ ${count} คอลัมน์`,
      statusMessages: {
        selectFirst: 'กรุณาเลือกรายวิชาและกลุ่มก่อน'
      }
    },
    
    tooltips: {
      miniPanel: 'ตัวช่วยกรอกคะแนน - คลิกเพื่อขยาย'
    }
  }
};
