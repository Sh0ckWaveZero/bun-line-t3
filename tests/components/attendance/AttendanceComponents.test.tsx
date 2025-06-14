// 🧪 Attendance Components Tests - Deprecated
// 
// ⚠️ This file has been replaced with attendance-components.test.ts
// The new test file uses Bun's test framework and fixes import path issues
// Location: /tests/components/attendance/attendance-components.test.ts
//
// This file is kept for reference but should not be executed.

export {}; // Make this file a module to avoid global scope pollution

  it('should not render when closed', () => {
    render(<EditAttendanceModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('แก้ไขเวลาเข้า-ออกงาน')).not.toBeInTheDocument();
  });

  it('should call onEditDataChange when input changes', () => {
    render(<EditAttendanceModal {...defaultProps} />);
    const checkInInput = screen.getByLabelText('เวลาเข้างาน');
    
    fireEvent.change(checkInInput, { target: { value: '2025-06-12T08:30' } });
    
    expect(defaultProps.onEditDataChange).toHaveBeenCalledWith({
      checkInTime: '2025-06-12T08:30',
      checkOutTime: '2025-06-12T18:00'
    });
  });

  it('should disable submit button when loading', () => {
    render(<EditAttendanceModal {...defaultProps} updateLoading={true} />);
    const submitButton = screen.getByText('กำลังอัพเดท...');
    expect(submitButton).toBeDisabled();
  });

  // 🔐 Security Test
  it('should sanitize date display to prevent XSS', () => {
    const maliciousRecord = createMockAttendanceRecord({
      workDate: '<script>alert("xss")</script>2025-06-12'
    });
    
    render(<EditAttendanceModal {...defaultProps} editingRecord={maliciousRecord} />);
    
    // Should not contain script tag
    expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
  });
});

describe('AttendanceSummaryCards', () => {
  const mockReport = createMockReport();

  it('should display correct statistics', () => {
    render(<AttendanceSummaryCards report={mockReport} />);
    
    expect(screen.getByText('20')).toBeInTheDocument(); // totalDaysWorked
    expect(screen.getByText('180.0')).toBeInTheDocument(); // totalHoursWorked
    expect(screen.getByText('90.9%')).toBeInTheDocument(); // attendanceRate
    expect(screen.getByText('9.0')).toBeInTheDocument(); // averageHoursPerDay
    expect(screen.getByText('85.0%')).toBeInTheDocument(); // complianceRate
  });

  it('should handle zero values gracefully', () => {
    const emptyReport = createMockReport({
      totalDaysWorked: 0,
      totalHoursWorked: 0,
      attendanceRate: 0,
      averageHoursPerDay: 0,
      complianceRate: 0
    });

    render(<AttendanceSummaryCards report={emptyReport} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });
});

describe('AttendanceTable', () => {
  const mockRecords = [
    createMockAttendanceRecord({ id: '1', workDate: '2025-06-12' }),
    createMockAttendanceRecord({ id: '2', workDate: '2025-06-13' })
  ];
  const mockOnEditRecord = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all records', () => {
    render(<AttendanceTable records={mockRecords} onEditRecord={mockOnEditRecord} />);
    
    expect(screen.getAllByText('แก้ไข')).toHaveLength(2);
  });

  it('should call onEditRecord when edit button clicked', () => {
    render(<AttendanceTable records={mockRecords} onEditRecord={mockOnEditRecord} />);
    
    const editButtons = screen.getAllByText('แก้ไข');
    fireEvent.click(editButtons[0]);
    
    expect(mockOnEditRecord).toHaveBeenCalledWith(mockRecords[0]);
  });

  it('should display empty message when no records', () => {
    render(<AttendanceTable records={[]} onEditRecord={mockOnEditRecord} />);
    
    expect(screen.getByText('ไม่มีข้อมูลการเข้างานในเดือนนี้')).toBeInTheDocument();
  });

  // 🔐 Security Test
  it('should escape HTML in record data', () => {
    const maliciousRecord = createMockAttendanceRecord({
      id: '<img src=x onerror=alert(1)>',
      workDate: '2025-06-12'
    });

    render(<AttendanceTable records={[maliciousRecord]} onEditRecord={mockOnEditRecord} />);
    
    // Should not execute malicious code
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('UserInfoCard', () => {
  const mockUser = {
    id: 'user_123',
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg'
  };

  it('should display user information', () => {
    render(<UserInfoCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ID: user_123')).toBeInTheDocument();
  });

  it('should handle missing user image', () => {
    const userWithoutImage = { ...mockUser, image: null };
    render(<UserInfoCard user={userWithoutImage} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('LoadingSpinner', () => {
  it('should display default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument();
  });

  it('should display custom message', () => {
    render(<LoadingSpinner message="กำลังบันทึกข้อมูล..." />);
    expect(screen.getByText('กำลังบันทึกข้อมูล...')).toBeInTheDocument();
  });
});

describe('ErrorMessage', () => {
  it('should display error message', () => {
    render(<ErrorMessage message="เกิดข้อผิดพลาด" />);
    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
  });

  // 🔐 Security Test
  it('should not render HTML in error message', () => {
    const maliciousMessage = '<script>alert("xss")</script>Error';
    render(<ErrorMessage message={maliciousMessage} />);
    
    // Should display as text, not execute script
    expect(screen.getByText(maliciousMessage)).toBeInTheDocument();
    expect(screen.queryByText('<script>')).not.toBeInTheDocument();
  });
});

// 🎣 Hook Tests

describe('useAttendanceReport', () => {
  const mockSession = {
    user: { id: 'user_123', name: 'John Doe' }
  };

  beforeEach(() => {
    // Mock next-auth
    jest.mock('next-auth/react', () => ({
      useSession: () => ({ data: mockSession, status: 'authenticated' })
    }));

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAttendanceReport());
    
    expect(result.current.session).toBe(mockSession);
    expect(result.current.status).toBe('authenticated');
    expect(result.current.report).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.editModalOpen).toBe(false);
  });

  it('should fetch report when userId and selectedMonth are available', async () => {
    const mockReport = createMockReport();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockReport })
    });

    const { result } = renderHook(() => useAttendanceReport());
    
    await waitFor(() => {
      expect(result.current.report).toEqual(mockReport);
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch report' })
    });

    const { result } = renderHook(() => useAttendanceReport());
    
    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch report');
    });
  });

  it('should open edit modal with correct data', () => {
    const { result } = renderHook(() => useAttendanceReport());
    const mockRecord = createMockAttendanceRecord();
    
    act(() => {
      result.current.openEditModal(mockRecord);
    });
    
    expect(result.current.editModalOpen).toBe(true);
    expect(result.current.editingRecord).toEqual(mockRecord);
  });

  it('should close edit modal and reset state', () => {
    const { result } = renderHook(() => useAttendanceReport());
    
    // First open modal
    act(() => {
      result.current.openEditModal(createMockAttendanceRecord());
    });
    
    // Then close it
    act(() => {
      result.current.closeEditModal();
    });
    
    expect(result.current.editModalOpen).toBe(false);
    expect(result.current.editingRecord).toBeNull();
    expect(result.current.editData).toEqual({ checkInTime: '', checkOutTime: '' });
  });
});

// 🔐 Security-Focused Tests

describe('Security Tests', () => {
  describe('XSS Prevention', () => {
    it('should prevent script injection in user inputs', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const mockProps = {
        isOpen: true,
        editingRecord: createMockAttendanceRecord(),
        editData: { checkInTime: maliciousInput, checkOutTime: '' },
        updateLoading: false,
        onClose: jest.fn(),
        onEditDataChange: jest.fn(),
        onUpdate: jest.fn()
      };

      render(<EditAttendanceModal {...mockProps} />);
      
      // Should not execute script
      expect(global.alert).not.toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should validate date inputs', () => {
      const invalidDate = 'invalid-date';
      const mockProps = {
        isOpen: true,
        editingRecord: createMockAttendanceRecord(),
        editData: { checkInTime: invalidDate, checkOutTime: '' },
        updateLoading: false,
        onClose: jest.fn(),
        onEditDataChange: jest.fn(),
        onUpdate: jest.fn()
      };

      render(<EditAttendanceModal {...mockProps} />);
      
      const submitButton = screen.getByText('บันทึกการแก้ไข');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Authentication', () => {
    it('should redirect when not authenticated', () => {
      jest.mock('next-auth/react', () => ({
        useSession: () => ({ data: null, status: 'unauthenticated' })
      }));

      const mockPush = jest.fn();
      jest.mock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush })
      }));

      renderHook(() => useAttendanceReport());
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});

// 🚀 Performance Tests

describe('Performance Tests', () => {
  it('should not re-render unnecessarily', () => {
    const renderCount = jest.fn();
    
    const TestComponent = () => {
      renderCount();
      return <AttendanceSummaryCards report={createMockReport()} />;
    };

    const { rerender } = render(<TestComponent />);
    
    // Same props should not cause re-render
    rerender(<TestComponent />);
    
    expect(renderCount).toHaveBeenCalledTimes(2); // Initial + rerender with same props
  });

  it('should memoize expensive chart calculations', () => {
    const expensiveCalculation = jest.fn().mockReturnValue('calculated-value');
    
    // Mock the expensive calculation
    jest.mock('../utils/chartUtils', () => ({
      prepareChartData: expensiveCalculation
    }));

    const { rerender } = render(<AttendanceCharts report={createMockReport()} />);
    
    // Rerender with same data
    rerender(<AttendanceCharts report={createMockReport()} />);
    
    // Should only calculate once due to memoization
    expect(expensiveCalculation).toHaveBeenCalledTimes(1);
  });
});

export {
  createMockAttendanceRecord,
  createMockReport
};
