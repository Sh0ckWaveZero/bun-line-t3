import { useState } from "react";
import { addMonths, getMonth, getYear, subMonths } from "date-fns";

export interface MonthNavigation {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  navigateMonth: (direction: "prev" | "next") => void;
  handleMonthChange: (month: number) => void;
  handleYearChange: (year: number) => void;
}

export function useMonthNavigation(): MonthNavigation {
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1),
    );
  };

  const handleMonthChange = (month: number) => {
    setCurrentDate((prev) => new Date(getYear(prev), month, 1));
  };

  const handleYearChange = (year: number) => {
    setCurrentDate((prev) => new Date(year, getMonth(prev), 1));
  };

  return {
    currentDate,
    setCurrentDate,
    navigateMonth,
    handleMonthChange,
    handleYearChange,
  };
}
