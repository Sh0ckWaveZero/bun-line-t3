import { useEffect, useState } from "react";

export function useToday(): Date | null {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const updateToday = () => setToday(new Date());
    updateToday();
    const interval = window.setInterval(updateToday, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  return today;
}
