// Global event emitter for DCA updates
class DCAEventManager {
  private listeners: Set<(data: any) => void> = new Set();

  subscribe(callback: (data: any) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit(event: { type: string; data?: any }) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error("Error in event listener:", err);
      }
    });
  }
}

// เก็บ singleton บน globalThis เพื่อให้แชร์ข้าม module boundary ได้
// (server.ts และ TanStack Start bundle เป็น module คนละตัว แต่ใช้ globalThis ร่วมกัน)
const g = globalThis as typeof globalThis & { __dcaEventManager?: DCAEventManager };
if (!g.__dcaEventManager) {
  g.__dcaEventManager = new DCAEventManager();
}

export const dcaEventManager: DCAEventManager = g.__dcaEventManager;
