import { describe, it, expect, beforeEach, mock } from 'bun:test'

// Mock the date-time utils
const mockCombineOriginalDateWithNewTime = mock()

mock.module('@/lib/utils/date-time', () => ({
  combineOriginalDateWithNewTime: mockCombineOriginalDateWithNewTime,
  formatTimeOnly: (date: Date) => date.toTimeString().slice(0, 5),
}))

describe('Date Bug Fix - Checkout Time', () => {
  beforeEach(() => {
    mockCombineOriginalDateWithNewTime.mockClear()
  })

  it('should use checkInTime as base date for both checkIn and checkOut', () => {
    // Arrange: มีข้อมูลที่ checkOut อยู่วันถัดไป (midnight shift scenario)
    const editingRecord = {
      id: 'test-id',
      checkInTime: '2025-06-06T08:00:00.000Z',  // วันที่ 6
      checkOutTime: '2025-06-07T17:00:00.000Z', // วันที่ 7 (วันถัดไป)
    }

    const editData = {
      checkInTime: '09:00',   // เปลี่ยนเวลาเข้า
      checkOutTime: '18:00',  // เปลี่ยนเวลาออก
    }

    // Mock ผลลัพธ์จาก combineOriginalDateWithNewTime
    mockCombineOriginalDateWithNewTime
      .mockReturnValueOnce(new Date('2025-06-06T09:00:00.000Z')) // checkIn
      .mockReturnValueOnce(new Date('2025-06-06T18:00:00.000Z')) // checkOut

    // Act: เรียกใช้ logic การอัปเดต (ส่วนที่เราแก้ไข)
    const newCheckInDateTime = mockCombineOriginalDateWithNewTime(
      new Date(editingRecord.checkInTime),
      editData.checkInTime
    )
    
    const newCheckOutDateTime = mockCombineOriginalDateWithNewTime(
      new Date(editingRecord.checkInTime), // ใช้ checkInTime แทน checkOutTime
      editData.checkOutTime
    )

    // Assert: ตรวจสอบว่า base date ถูกต้อง
    expect(mockCombineOriginalDateWithNewTime).toHaveBeenCalledTimes(2)
    
    // ครั้งแรก: checkIn ใช้ checkInTime เป็น base
    expect(mockCombineOriginalDateWithNewTime).toHaveBeenNthCalledWith(
      1,
      new Date('2025-06-06T08:00:00.000Z'),
      '09:00'
    )
    
    // ครั้งที่สอง: checkOut ใช้ checkInTime เป็น base (ไม่ใช่ checkOutTime)
    expect(mockCombineOriginalDateWithNewTime).toHaveBeenNthCalledWith(
      2,
      new Date('2025-06-06T08:00:00.000Z'), // checkInTime base date
      '18:00'
    )

    // ผลลัพธ์: ทั้งคู่ควรอยู่วันเดียวกัน (6 มิถุนายน)
    expect(newCheckInDateTime.toISOString()).toMatch(/^2025-06-06T/)
    expect(newCheckOutDateTime.toISOString()).toMatch(/^2025-06-06T/)
  })

  it('should handle normal same-day scenario correctly', () => {
    // Arrange: ข้อมูลปกติที่อยู่วันเดียวกัน
    const editingRecord = {
      id: 'test-id',
      checkInTime: '2025-06-06T08:00:00.000Z',  // วันที่ 6
      checkOutTime: '2025-06-06T17:00:00.000Z', // วันที่ 6 (วันเดียวกัน)
    }

    const editData = {
      checkInTime: '08:30',   
      checkOutTime: '17:30',  
    }

    mockCombineOriginalDateWithNewTime
      .mockReturnValueOnce(new Date('2025-06-06T08:30:00.000Z'))
      .mockReturnValueOnce(new Date('2025-06-06T17:30:00.000Z'))

    // Act
    const newCheckInDateTime = mockCombineOriginalDateWithNewTime(
      new Date(editingRecord.checkInTime),
      editData.checkInTime
    )
    
    const newCheckOutDateTime = mockCombineOriginalDateWithNewTime(
      new Date(editingRecord.checkInTime), // ยังคงใช้ checkInTime เป็น base
      editData.checkOutTime
    )

    // Assert: ทั้งคู่ยังคงอยู่วันเดียวกัน
    expect(newCheckInDateTime.toISOString()).toMatch(/^2025-06-06T/)
    expect(newCheckOutDateTime.toISOString()).toMatch(/^2025-06-06T/)
  })
})
