export interface DcaEvent {
  type: string;
  data: {
    lineUserId: string;
    id?: string;
  };
}

interface DcaListener {
  lineUserId: string;
  callback: (event: DcaEvent) => void;
}

// Global event emitter for DCA updates. Every listener is scoped to one LINE ID.
class DCAEventManager {
  private listeners: Set<DcaListener> = new Set();

  subscribe(lineUserId: string, callback: (event: DcaEvent) => void) {
    const listener = { lineUserId, callback };
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: DcaEvent) {
    this.listeners.forEach(({ lineUserId, callback }) => {
      if (event.data.lineUserId !== lineUserId) return;

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
const g = globalThis as typeof globalThis & {
  __dcaEventManager?: DCAEventManager;
};
if (!g.__dcaEventManager) {
  g.__dcaEventManager = new DCAEventManager();
}

export const dcaEventManager: DCAEventManager = g.__dcaEventManager;
