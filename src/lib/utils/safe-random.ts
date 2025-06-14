/**
 * 🛡️ Safe Random Selection Utilities
 * ป้องกัน hydration mismatch จากการใช้ Math.random() ใน components
 */

/**
 * 🎲 Safe random selection ที่ใช้ timestamp แทน Math.random()
 * ใช้สำหรับการสุ่มที่ไม่ต้องการความปลอดภัยสูงมาก แต่ต้องการความสม่ำเสมอ
 */
export const safeRandomSelect = <T>(array: readonly T[]): T => {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  
  if (array.length === 1) {
    return array[0]!;
  }
  
  // ใช้ current timestamp เป็น seed สำหรับการสุ่มที่ predictable มากขึ้น
  const timestamp = Date.now();
  const index = timestamp % array.length;
  
  return array[index]!;
};

/**
 * 🎯 Deterministic random selection based on input string
 * ให้ผลลัพธ์เดียวกันสำหรับ input เดียวกัน
 */
export const deterministicSelect = <T>(array: readonly T[], seed: string): T => {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  
  if (array.length === 1) {
    return array[0]!;
  }
  
  // สร้าง hash จาก seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % array.length;
  return array[index]!;
};

/**
 * 🌊 Time-based selection that changes gradually
 * เปลี่ยนไปตามเวลา แต่ไม่เปลี่ยนบ่อยมาก
 */
export const timeBasedSelect = <T>(array: readonly T[], intervalMinutes: number = 60): T => {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  
  if (array.length === 1) {
    return array[0]!;
  }
  
  // แบ่งเวลาเป็นช่วงๆ ตาม intervalMinutes
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;
  const timeSlot = Math.floor(now / intervalMs);
  
  const index = timeSlot % array.length;
  return array[index]!;
};

/**
 * 🔄 Round-robin selection based on counter
 * สำหรับการเลือกแบบเวียนรอบ
 */
export const roundRobinSelect = <T>(array: readonly T[], counter: number): T => {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  
  const index = counter % array.length;
  return array[index]!;
};

/**
 * 🎭 Context-aware selection for LINE messages
 * เลือกข้อความตามบริบท เช่น เวลาในวัน, สถานะผู้ใช้
 */
export const contextAwareSelect = <T>(
  array: readonly T[],
  context: {
    userId?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    isLate?: boolean;
    dayOfWeek?: number;
  } = {}
): T => {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  
  if (array.length === 1) {
    return array[0]!;
  }
  
  // สร้าง seed จาก context
  const contextSeed = [
    context.userId || 'anonymous',
    context.timeOfDay || 'unknown',
    context.isLate ? 'late' : 'ontime',
    (context.dayOfWeek || 0).toString(),
    Math.floor(Date.now() / (1000 * 60 * 30)).toString() // 30-minute intervals
  ].join('|');
  
  return deterministicSelect(array, contextSeed);
};

/**
 * 🎲 Generate deterministic random number (0-1) based on time interval
 * ใช้แทน Math.random() เพื่อป้องกัน hydration mismatch
 */
export const getDeterministicRandom = (intervalMinutes: number = 30): number => {
  const now = Date.now()
  const interval = intervalMinutes * 60 * 1000 // Convert to milliseconds
  const seed = Math.floor(now / interval)
  
  // Simple seeded random using sine
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * 🎯 Generate deterministic alpha value for colors
 */
export const getDeterministicAlpha = (): number => {
  return Math.round(getDeterministicRandom(60) * 100) / 100 // Round to 2 decimal places
}
