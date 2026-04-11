import { useEffect } from "react";

interface UseDcaRealtimeUpdatesOptions {
  onUpdate: () => void;
}

export const useDcaRealtimeUpdates = ({
  onUpdate,
}: UseDcaRealtimeUpdatesOptions) => {
  useEffect(() => {
    const eventSource = new EventSource("/api/dca/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type?: string };

        if (
          data.type === "dca-order-created" ||
          data.type === "dca-order-deleted"
        ) {
          onUpdate();
        }
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onUpdate]);

  useEffect(() => {
    const channel = new BroadcastChannel("dca-updates");

    channel.onmessage = (event) => {
      if (event.data.type === "update") {
        onUpdate();
      }
    };

    return () => {
      channel.close();
    };
  }, [onUpdate]);
};
