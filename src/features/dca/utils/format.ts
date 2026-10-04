const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Bangkok",
  hour12: false,
});
const DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});
const TIME_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
  hour12: false,
});

export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return DATE_TIME_FORMATTER.format(d);
};

export const formatDateOnly = (date: Date | string) => {
  const d = new Date(date);
  return DATE_FORMATTER.format(d);
};

export const formatTimeOnly = (date: Date | string) => {
  const d = new Date(date);
  return TIME_FORMATTER.format(d);
};

export const formatTHB = (n: number) =>
  n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatCoin = (n: number, decimals = 8) => n.toFixed(decimals);
