const ENGLISH_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** จัดรูปแบบตัวเลข THB แบบย่อ (ล้านขึ้นไปแสดงเป็น M) */
export const fmtTHB = (n: number | null | undefined, decimals = 0): string => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
};

/** จัดรูปแบบตัวเลข THB แบบเต็ม 2 ตำแหน่ง */
export const fmtTHBFull = (n: number | null | undefined): string => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};

/** จัดรูปแบบจำนวน satoshi แบบย่อ (M / K) */
export const fmtSat = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return n.toLocaleString("en-US");
};

interface FormattedDateParts {
  year: string;
  month: string;
  day: string;
}

const formatDateParts = (value: string): string | FormattedDateParts => {
  const [year, month, day] = value.slice(0, 10).split("-");
  const monthIndex = Number(month) - 1;
  if (
    !year ||
    !day ||
    !Number.isInteger(monthIndex) ||
    !ENGLISH_MONTHS[monthIndex]
  ) {
    return "—";
  }
  return { year, month: ENGLISH_MONTHS[monthIndex], day };
};

/** จัดรูปแบบวันที่แบบสั้น เช่น "05 Jan" */
export const fmtDateShort = (value: string): string => {
  const date = formatDateParts(value);
  return typeof date === "string" ? date : `${date.day} ${date.month}`;
};

/** จัดรูปแบบวันที่แบบเต็ม เช่น "05 Jan 25" */
export const fmtDate = (value: string): string => {
  const date = formatDateParts(value);
  return typeof date === "string"
    ? date
    : `${date.day} ${date.month} ${date.year.slice(-2)}`;
};
