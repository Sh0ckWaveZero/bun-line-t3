export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Bangkok",
    hour12: false,
  }).format(d);
};

export const formatTHB = (n: number) =>
  n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatCoin = (n: number, decimals = 8) => n.toFixed(decimals);
