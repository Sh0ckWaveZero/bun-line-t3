import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { AttendanceSummaryCards } from '@/components/attendance/AttendanceSummaryCards'
import type { MonthlyAttendanceReport } from '@/lib/types'

// 🧪 Test ส่วน Accessibility และ Readability Improvements
describe('AttendanceSummaryCards - Accessibility & Readability', () => {
  const mockReport: MonthlyAttendanceReport = {
    userId: 'test-user-123',
    totalDaysWorked: 20,
    workingDaysInMonth: 22,
    totalHoursWorked: 160.5,
    averageHoursPerDay: 8.0,
    attendanceRate: 90.9,
    complianceRate: 85.0,
    completeDays: 17,
    month: '6',
    attendanceRecords: []
  }

  it('ควรมี ARIA labels และ semantic HTML ที่ถูกต้อง', () => {
    render(<AttendanceSummaryCards report={mockReport} />)
    
    // ✅ ตรวจสอบ region และ aria-label หลัก
    const region = screen.getByRole('region', { name: /สรุปข้อมูลการเข้างาน/i })
    expect(region).toBeDefined()
    
    // ✅ ตรวจสอบ articles (cards) ทั้ง 5 อัน
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(5)
    
    // ✅ ตรวจสอบ headings ทั้งหมด
    expect(screen.getByText('วันที่ทำงาน')).toBeDefined()
    expect(screen.getByText('ชั่วโมงรวม')).toBeDefined()
    expect(screen.getByText('เปอร์เซ็นต์การเข้างาน')).toBeDefined()
    expect(screen.getByText('ชั่วโมงเฉลี่ย/วัน')).toBeDefined()
    expect(screen.getByText('อัตราการทำงานครบเวลา')).toBeDefined()
  })

  it('ควรมี aria-label ที่อธิบายข้อมูลให้ screen readers', () => {
    render(<AttendanceSummaryCards report={mockReport} />)
    
    // ✅ ตรวจสอบ aria-label สำหรับตัวเลขหลัก
    expect(screen.getByLabelText(/ทำงานไป 20 วัน/i)).toBeDefined()
    expect(screen.getByLabelText(/ทำงานรวม 160.5 ชั่วโมง/i)).toBeDefined()
    expect(screen.getByLabelText(/อัตราการเข้างาน 90.9 เปอร์เซ็นต์/i)).toBeDefined()
    expect(screen.getByLabelText(/ทำงานเฉลี่ย 8 ชั่วโมงต่อวัน/i)).toBeDefined()
    expect(screen.getByLabelText(/ทำงานครบเวลา 85 เปอร์เซ็นต์/i)).toBeDefined()
  })

  it('ควรมี tabIndex และ focus states สำหรับ keyboard navigation', () => {
    render(<AttendanceSummaryCards report={mockReport} />)
    
    // ✅ ตรวจสอบว่าทุก card สามารถ focus ได้
    const articles = screen.getAllByRole('article')
    articles.forEach(article => {
      expect(article.getAttribute('tabIndex')).toBe('0')
    })
  })

  it('ควรแสดงข้อมูลที่ถูกต้องตามที่ส่งเข้ามา', () => {
    render(<AttendanceSummaryCards report={mockReport} />)
    
    // ✅ ตรวจสอบตัวเลขทั้งหมด
    expect(screen.getByText('20')).toBeDefined() // วันทำงาน
    expect(screen.getByText('160.5')).toBeDefined() // ชั่วโมงรวม  
    expect(screen.getByText('90.9%')).toBeDefined() // เปอร์เซ็นต์เข้างาน
    expect(screen.getByText('8%')).toBeDefined() // ชั่วโมงเฉลี่ย
    expect(screen.getByText('85%')).toBeDefined() // อัตราครบเวลา
    
    // ✅ ตรวจสอบข้อความเสริม
    expect(screen.getByText(/จาก 22 วันทำงาน/)).toBeDefined()
    expect(screen.getByText(/17 วัน ครบ 9 ชม./)).toBeDefined()
  })

  it('ควรมี high contrast design แทน pastel colors', () => {
    render(<AttendanceSummaryCards report={mockReport} />)
    
    const articles = screen.getAllByRole('article')
    
    // ✅ ตรวจสอบว่าใช้ background สีขาว/เทาแทน pastel
    articles.forEach(article => {
      expect(article.className).toMatch(/bg-white/)
      expect(article.className).toMatch(/dark:bg-gray-800/)
      // ✅ ตรวจสอบ border ที่มี contrast สูง
      expect(article.className).toMatch(/border-2/)
      // ✅ ตรวจสอบ focus ring
      expect(article.className).toMatch(/focus-within:ring-2/)
    })
  })

  it('ควรมี visual indicators (dots) ที่ accessible', () => {
    render(<AttendanceSummaryCards report={mockReport} />)
    
    // ✅ ตรวจสอบว่า dots มี aria-hidden="true" เพราะเป็น decorative elements
    const dots = document.querySelectorAll('[role="presentation"][aria-hidden="true"]')
    expect(dots).toHaveLength(5)
  })

  it('ควรมี typography hierarchy ที่ชัดเจน', () => {
    render(<AttendanceSummaryCards report={mockReport} />)
    
    // ✅ ตรวจสอบขนาดตัวอักษรของตัวเลขหลัก (ต้องใหญ่และหนา)
    const mainNumbers = screen.getAllByText(/^\d+(\.\d+)?%?$/)
    mainNumbers.forEach(number => {
      expect(number.className).toMatch(/text-4xl/)
      expect(number.className).toMatch(/font-bold/)
    })
  })

  it('ควร handle dark mode correctly', () => {
    render(<AttendanceSummaryCards report={mockReport} />)
    
    const articles = screen.getAllByRole('article')
    
    // ✅ ตรวจสอบ dark mode classes
    articles.forEach(article => {
      expect(article.className).toMatch(/dark:bg-gray-800/)
      expect(article.className).toMatch(/dark:border-\w+-700/)
    })
  })
})
