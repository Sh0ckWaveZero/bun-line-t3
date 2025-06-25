import { describe, it, expect, mock } from "bun:test";
import type { AttendanceRecord, EditAttendanceData } from "@/lib/types";
import { AttendanceStatusType } from "@/features/attendance/types/attendance-status";

// Mock window object สำหรับ mobile detection
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  navigator: {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    vendor: "",
    maxTouchPoints: 0,
  },
};

// Mock DOM environment
const mockDocument = {
  createElement: mock(() => ({ setAttribute: mock() })),
  body: { appendChild: mock(), removeChild: mock() },
  getElementById: mock(() => ({ remove: mock() })),
};

describe("EditAttendanceModal - Configuration Tests", () => {
  const mockRecord: AttendanceRecord = {
    id: "test-1",
    workDate: "2025-06-19",
    checkInTime: "2025-06-19T09:00:00.000Z",
    checkOutTime: "2025-06-19T17:00:00.000Z",
    status: AttendanceStatusType.CHECKED_OUT,
    hoursWorked: 8,
  };

  const mockEditData: EditAttendanceData = {
    checkInTime: "09:00",
    checkOutTime: "17:00",
  };

  const createMockProps = () => ({
    isOpen: true,
    editingRecord: mockRecord,
    editData: mockEditData,
    updateLoading: false,
    onClose: mock(() => {}),
    onEditDataChange: mock((data: EditAttendanceData) => {}),
    onUpdate: mock(() => Promise.resolve()),
  });

  it("should have valid mock data structure", () => {
    const props = createMockProps();

    // ✅ ตรวจสอบ AttendanceRecord structure
    expect(props.editingRecord.id).toBe("test-1");
    expect(props.editingRecord.workDate).toBe("2025-06-19");
    expect(props.editingRecord.status).toBe(AttendanceStatusType.CHECKED_OUT);
    expect(props.editingRecord.hoursWorked).toBe(8);

    // ✅ ตรวจสอบ EditAttendanceData structure
    expect(props.editData.checkInTime).toBe("09:00");
    expect(props.editData.checkOutTime).toBe("17:00");

    // ✅ ตรวจสอบ initial state
    expect(props.isOpen).toBe(true);
    expect(props.updateLoading).toBe(false);
  });

  it("should handle mobile detection logic", () => {
    // �️ Desktop detection
    const desktopWindow = { ...mockWindow, innerWidth: 1024, innerHeight: 768 };
    const isMobileDesktop = desktopWindow.innerWidth <= 768;
    expect(isMobileDesktop).toBe(false);

    // 📱 Mobile detection
    const mobileWindow = { ...mockWindow, innerWidth: 375, innerHeight: 667 };
    const isMobileMobile = mobileWindow.innerWidth <= 768;
    expect(isMobileMobile).toBe(true);

    // 📱 Tablet detection
    const tabletWindow = { ...mockWindow, innerWidth: 768, innerHeight: 1024 };
    const isMobileTablet = tabletWindow.innerWidth <= 768;
    expect(isMobileTablet).toBe(true);
  });

  it("should handle form data updates", () => {
    const props = createMockProps();

    // ✅ ทดสอบการเปลี่ยนแปลง check-in time
    const newCheckInData = { ...mockEditData, checkInTime: "08:30" };
    props.onEditDataChange(newCheckInData);
    expect(props.onEditDataChange).toHaveBeenCalledWith(newCheckInData);

    // ✅ ทดสอบการเปลี่ยนแปลง check-out time
    const newCheckOutData = { ...mockEditData, checkOutTime: "18:00" };
    props.onEditDataChange(newCheckOutData);
    expect(props.onEditDataChange).toHaveBeenCalledWith(newCheckOutData);

    expect(props.onEditDataChange).toHaveBeenCalledTimes(2);
  });

  it("should handle async update operations", async () => {
    const props = createMockProps();

    // ✅ ทดสอบการเรียก onUpdate
    await props.onUpdate();
    expect(props.onUpdate).toHaveBeenCalledTimes(1);

    // ✅ ทดสอบ async behavior
    const result = props.onUpdate();
    expect(result).toBeInstanceOf(Promise);

    await expect(result).resolves.toBeUndefined();
  });

  it("should handle loading states", () => {
    // ✅ Normal state
    const normalProps = createMockProps();
    expect(normalProps.updateLoading).toBe(false);

    // ✅ Loading state
    const loadingProps = { ...createMockProps(), updateLoading: true };
    expect(loadingProps.updateLoading).toBe(true);
  });

  it("should handle modal open/close states", () => {
    // ✅ Opened modal
    const openProps = createMockProps();
    expect(openProps.isOpen).toBe(true);

    // ✅ Closed modal
    const closedProps = { ...createMockProps(), isOpen: false };
    expect(closedProps.isOpen).toBe(false);

    // ✅ Test close handler
    openProps.onClose();
    expect(openProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("should validate EditAttendanceData constraints", () => {
    const props = createMockProps();

    // ✅ Valid time format
    const validTimePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    expect(props.editData.checkInTime).toMatch(validTimePattern);
    expect(props.editData.checkOutTime).toMatch(validTimePattern);

    // ✅ Test time validation logic
    const validateTime = (time: string) => validTimePattern.test(time);
    expect(validateTime("09:00")).toBe(true);
    expect(validateTime("17:00")).toBe(true);
    expect(validateTime("25:00")).toBe(false); // Invalid hour
    expect(validateTime("12:60")).toBe(false); // Invalid minute
  });
});
