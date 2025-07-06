# 🧪 Test Structure Documentation

## 📂 Organized Test Structure

Tests are organized to mirror the `src/` directory structure for better maintainability and discoverability.

### 🏗️ Directory Structure

```
tests/
├── src/                    # Mirror of src/ structure
│   ├── app/api/           # API route tests
│   │   ├── cron/          # Cron job API tests
│   │   ├── attendance/    # Attendance API tests
│   │   ├── auth/          # Authentication API tests
│   │   └── ...
│   ├── features/          # Feature module tests
│   │   ├── attendance/    # Attendance feature tests
│   │   ├── line/          # LINE integration tests
│   │   └── ...
│   ├── lib/               # Library function tests
│   │   ├── utils/         # Utility function tests
│   │   ├── validation/    # Validation logic tests
│   │   └── ...
│   └── components/        # React component tests
│       ├── attendance/    # Attendance component tests
│       ├── ui/            # UI component tests
│       └── ...
├── integration/           # End-to-end integration tests
├── performance/           # Performance tests
├── e2e/                   # End-to-end tests
├── legacy/                # Old tests (to be refactored)
└── helpers/               # Test utilities and helpers
```

### 📋 Test Categories

#### 🎯 **Unit Tests** (`tests/src/`)

- **Location**: Mirror the exact structure of `src/`
- **Purpose**: Test individual functions, components, and modules
- **Example**: `tests/src/lib/utils/date-time.test.ts` tests `src/lib/utils/date-time.ts`

#### 🔗 **Integration Tests** (`tests/integration/`)

- **Purpose**: Test API endpoints and feature interactions
- **Example**: `enhanced-checkout-reminder-integration.test.ts`

#### 🚀 **Performance Tests** (`tests/performance/`)

- **Purpose**: Test performance characteristics
- **Example**: Load testing, memory usage

#### 🌐 **E2E Tests** (`tests/e2e/`)

- **Purpose**: Full user journey testing
- **Example**: Complete user workflows

#### 📚 **Legacy Tests** (`tests/legacy/`)

- **Purpose**: Old tests that need refactoring
- **Status**: To be reorganized or deprecated

### 🧩 Test File Naming

#### **Naming Convention:**

```
[feature/component/function].test.ts    # Unit tests
[feature]-integration.test.ts           # Integration tests
[feature]-e2e.test.ts                  # E2E tests
[feature]-performance.test.ts          # Performance tests
```

#### **Examples:**

```
✅ Good:
tests/src/features/attendance/helpers.test.ts
tests/src/lib/utils/date-time.test.ts
tests/integration/checkout-reminder-integration.test.ts

❌ Avoid:
tests/some-random-test.test.ts
tests/test123.test.ts
```

### 🚀 Running Tests

#### **Run All Tests:**

```bash
bun test
```

#### **Run Specific Category:**

```bash
# Unit tests only
bun test tests/src/

# Integration tests only
bun test tests/integration/

# Specific feature
bun test tests/src/features/attendance/

# Specific API route
bun test tests/src/app/api/cron/
```

#### **Run with Coverage:**

```bash
bun test --coverage
```

### 📝 Test Guidelines

#### **1. Mirror Source Structure**

- Test file location should mirror source file location
- `src/lib/utils/date.ts` → `tests/src/lib/utils/date.test.ts`

#### **2. Descriptive Test Names**

```typescript
// ✅ Good
describe("Enhanced Checkout Reminder API", () => {
  test("should send 10-minute reminder when due", () => {

// ❌ Avoid
describe("Test", () => {
  test("it works", () => {
```

#### **3. Test Categories**

```typescript
describe("calculateUserReminderTime", () => {
  describe("Happy Path", () => { // Normal scenarios
  describe("Edge Cases", () => { // Boundary conditions
  describe("Error Handling", () => { // Error scenarios
```

#### **4. Arrange-Act-Assert Pattern**

```typescript
test("should calculate reminder time correctly", () => {
  // Arrange
  const checkInTime = new Date("2025-06-30T01:00:00.000Z");

  // Act
  const reminderTime = calculateUserReminderTime(checkInTime);

  // Assert
  expect(reminderTime.getUTCHours()).toBe(9);
});
```

### 🔧 Test Configuration

- **Config File**: `tests/bun.test.config.ts`
- **Setup File**: `tests/setup.ts`
- **Path Mapping**: Configured in test config for clean imports

### 📊 Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical user paths
- **E2E Tests**: Main workflows
- **Performance Tests**: Key bottlenecks

### 🎯 Best Practices

1. **Test Naming**: Use descriptive names that explain behavior
2. **Test Organization**: Group related tests in describe blocks
3. **Mock External Dependencies**: Keep tests isolated
4. **Test Data**: Use realistic but anonymized test data
5. **Performance**: Keep unit tests fast (<100ms each)

---

_Last Updated: 2025-06-30_
_Structure follows src/ directory organization for maintainability_
