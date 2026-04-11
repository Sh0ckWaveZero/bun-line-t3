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

// Global singleton
export const dcaEventManager = new DCAEventManager();
