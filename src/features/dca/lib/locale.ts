export type DcaLocale = "th" | "en";

export interface DcaLocaleStrings {
  // Topbar
  topbar: {
    title: string;
    subtitle: string;
    lastSync: string;
    refresh: string;
    import: string;
    addDca: string;
    switchLanguage: string;
  };

  // PnlCard
  pnl: {
    unrealizedPnl: string;
    live: string;
    noPurchases: string;
    loadingPrice: string;
    marketValue: string;
    invested: string;
    allTimeDays: (days: number) => string;
  };

  // DcaChartCard
  chart: {
    modePortfolio: string;
    modePnl: string;
    modeCost: string;
    modeSats: string;
    modeEntries: string;
    shortPortfolio: string;
    shortPnl: string;
    shortCost: string;
    shortSats: string;
    shortEntries: string;
    seriesPortfolioValue: string;
    seriesInvested: string;
    seriesUnrealizedPnl: string;
    seriesCumulativeSatoshi: string;
    seriesBtcPrice: string;
    seriesMarketPrice: string;
    seriesAvgCostBasis: string;
    tooltipPortfolio: string;
    tooltipInvested: string;
    tooltipUnrealized: string;
    tooltipPercent: string;
    tooltipCumulative: string;
    tooltipTodaysBuy: string;
    tooltipBtcPrice: string;
    tooltipBought: string;
    tooltipMarket: string;
    tooltipAvgCost: string;
    addFirstBuy: string;
  };

  // StatsGrid
  stats: {
    spendFiat: string;
    totalSatoshi: string;
    currentBtcPrice: string;
    marketValue: string;
    averageCost: string;
    todaySatPerThb: string;
    maxDrawdown: string;
    profitLoss: string;
    worstSingleBuy: string;
    bestSingleBuy: string;
    footDaysPerDay: (days: number, perDay: number) => string;
    footBtc: (btc: string) => string;
    footBitkubSpot: string;
    footPortfolioValue: string;
    footAcrossAllBuys: string;
    footVsAvg: (diff: string) => string;
    footPeakToTrough: string;
    footUnrealized: (value: string) => string;
    footNoLosingEntries: string;
    footNoDate: string;
  };

  // GoalsSection
  goals: {
    goalFiatInvested: string;
    goalTotalSatoshi: string;
    goalFiat: string;
    goalSatoshi: string;
    btc: (btc: string) => string;
    sat: string;
    editGoalTitle: string;
  };

  // DcaRecordsTable
  table: {
    searchPlaceholder: string;
    records: (count: number) => string;
    rowsPerPage: string;
    showingRange: (start: number, end: number, total: number) => string;
    showingEmpty: string;
    noRecordsFound: string;
    colDay: string;
    colDate: string;
    colFiat: string;
    colSatoshi: string;
    colPrice: string;
    colPortfolioValue: string;
    colInvested: string;
    colUnrealized: string;
    colPctUnrealized: string;
    actions: string;
    edit: string;
    delete: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    deleteHoldLabel: string;
    deleteHoldReleaseLabel: string;
    deleteHoldInstruction: string;
    deleteHoldComplete: string;
    deleteCancel: string;
    deletePending: string;
    deleteSuccess: string;
    deleteError: string;
    deleteRetry: string;
    deleteLocalOnly: string;
  };

  // SectionLabel
  section: {
    overviewTitle: string;
    overviewHint: string;
    metricsTitle: string;
    metricsHint: string;
    historyTitle: string;
    historyHint: string;
  };
}

export const dcaLocales: Record<DcaLocale, DcaLocaleStrings> = {
  th: {
    topbar: {
      title: "DCA Tracker",
      subtitle: "sats/THB",
      lastSync: "ซิงค์ล่าสุด",
      refresh: "รีเฟรช",
      import: "นำเข้าจากไฟล์",
      addDca: "เพิ่ม DCA",
      switchLanguage: "สลับภาษา",
    },
    pnl: {
      unrealizedPnl: "กำไร/ขาดทุน ยังไม่เกิด",
      live: "สด",
      noPurchases: "ยังไม่มีการซื้อ",
      loadingPrice: "กำลังโหลดราคา...",
      marketValue: "มูลค่าตลาด",
      invested: "ลงทุนแล้ว",
      allTimeDays: (days: number) => `ตลอดกาล · ${days} วัน`,
    },
    chart: {
      modePortfolio: "พอร์ตกับการลงทุน",
      modePnl: "กำไร/ขาดทุน ยังไม่เกิด",
      modeCost: "ต้นทุนกับราคาตลาด",
      modeSats: "การสะสม Satoshi",
      modeEntries: "จุดเข้าซื้อ",
      shortPortfolio: "พอร์ต",
      shortPnl: "P&L",
      shortCost: "ต้นทุน",
      shortSats: "Sats",
      shortEntries: "จุดเข้า",
      seriesPortfolioValue: "มูลค่าพอร์ต",
      seriesInvested: "ลงทุนแล้ว",
      seriesUnrealizedPnl: "กำไร/ขาดทุน ยังไม่เกิด",
      seriesCumulativeSatoshi: "Satoshi สะสม",
      seriesBtcPrice: "ราคา BTC",
      seriesMarketPrice: "ราคาตลาด",
      seriesAvgCostBasis: "ต้นทุนเฉลี่ย",
      tooltipPortfolio: "พอร์ต",
      tooltipInvested: "ลงทุนแล้ว",
      tooltipUnrealized: "ยังไม่เกิด",
      tooltipPercent: "%",
      tooltipCumulative: "สะสม",
      tooltipTodaysBuy: "ซื้อวันนี้",
      tooltipBtcPrice: "ราคา BTC",
      tooltipBought: "ซื้อ",
      tooltipMarket: "ตลาด",
      tooltipAvgCost: "ต้นทุนเฉลี่ย",
      addFirstBuy: "เพิ่มการซื้อครั้งแรกเพื่อดูกราฟ",
    },
    stats: {
      spendFiat: "ใช้ Fiat",
      totalSatoshi: "Satoshi รวม",
      currentBtcPrice: "ราคา BTC ปัจจุบัน",
      marketValue: "มูลค่าตลาด",
      averageCost: "ต้นทุนเฉลี่ย",
      todaySatPerThb: "วันนี้ sat/THB",
      maxDrawdown: "ดรอปดาวน์สูงสุด",
      profitLoss: "% กำไร / ขาดทุน",
      worstSingleBuy: "ซื้อที่แย่ที่สุด",
      bestSingleBuy: "ซื้อที่ดีที่สุด",
      footDaysPerDay: (days: number, perDay: number) =>
        `${days} วัน · ${perDay} ฿/วัน`,
      footBtc: (btc: string) => `${btc} BTC`,
      footBitkubSpot: "Bitkub · spot",
      footPortfolioValue: "พอร์ตของคุณเป็น THB",
      footAcrossAllBuys: "เฉลี่ยทุกการซื้อ",
      footVsAvg: (diff: string) => `${diff} กับเฉลี่ย`,
      footPeakToTrough: "จากจุดสูงสุดถึงต่ำสุด",
      footUnrealized: (value: string) => `฿${value} ยังไม่เกิด`,
      footNoLosingEntries: "ไม่มีรายการขาดทุน",
      footNoDate: "—",
    },
    goals: {
      goalFiatInvested: "เป้าหมาย · การลงทุน Fiat",
      goalTotalSatoshi: "เป้าหมาย · Satoshi รวม",
      goalFiat: "เป้าหมาย · ฿",
      goalSatoshi: "เป้าหมาย",
      btc: (btc: string) => `(${btc} ₿)`,
      sat: "sat",
      editGoalTitle: "คลิกเพื่อแก้ไขเป้าหมาย",
    },
    table: {
      searchPlaceholder: "ค้นหา...",
      records: (count: number) => `${count} รายการ`,
      rowsPerPage: "แถวต่อหน้า",
      showingRange: (start: number, end: number, total: number) =>
        `แสดง ${start}–${end} จาก ${total}`,
      showingEmpty: "แสดง 0 จาก 0",
      noRecordsFound: "ไม่พบรายการ",
      colDay: "วัน",
      colDate: "วันที่",
      colFiat: "฿",
      colSatoshi: "Sat",
      colPrice: "ราคา",
      colPortfolioValue: "พอร์ต",
      colInvested: "ลงทุนแล้ว",
      colUnrealized: "P&L",
      colPctUnrealized: "%",
      actions: "จัดการ",
      edit: "แก้ไข",
      delete: "ลบ",
      deleteConfirmTitle: "ลบรายการ DCA นี้หรือไม่?",
      deleteConfirmDescription:
        "ลบเฉพาะรายการใน DCA ประวัติซื้อจาก Bitkub ยังอยู่",
      deleteHoldLabel: "กดค้าง",
      deleteHoldReleaseLabel: "ปล่อย",
      deleteHoldInstruction:
        "กดค้างประมาณ 1.2 วินาทีจนแถบสีเต็ม แล้วปล่อยเพื่อยืนยันการลบ",
      deleteHoldComplete: "ปล่อยเพื่อยืนยันการลบ",
      deleteCancel: "ยกเลิก",
      deletePending: "กำลังลบรายการ...",
      deleteSuccess: "ลบรายการ DCA แล้ว",
      deleteError: "ลบรายการ DCA ไม่สำเร็จ",
      deleteRetry: "ลองอีกครั้ง",
      deleteLocalOnly: "ลบเฉพาะรายการในแอป ข้อมูลต้นทางจาก Bitkub ยังอยู่",
    },
    section: {
      overviewTitle: "ภาพรวม",
      overviewHint: "PNL · กราฟ · ชี้เพื่อดูค่ารายวัน",
      metricsTitle: "ตัวชี้วัดและเป้าหมาย",
      metricsHint: "ตัวเลขหลัก · ความคืบหน้า",
      historyTitle: "ประวัติการซื้อ",
      historyHint: "เรียงลำดับ · ค้นหา · แบ่งหน้า",
    },
  },
  en: {
    topbar: {
      title: "DCA Tracker",
      subtitle: "sats/THB",
      lastSync: "Last sync",
      refresh: "Refresh",
      import: "Import file",
      addDca: "Add DCA",
      switchLanguage: "Switch language",
    },
    pnl: {
      unrealizedPnl: "Unrealized P&L",
      live: "LIVE",
      noPurchases: "No purchases yet",
      loadingPrice: "Loading price...",
      marketValue: "Market Value",
      invested: "Invested",
      allTimeDays: (days: number) => `all-time · ${days} days`,
    },
    chart: {
      modePortfolio: "Portfolio vs Invested",
      modePnl: "Unrealized P&L",
      modeCost: "Cost vs Market",
      modeSats: "Sat Accumulation",
      modeEntries: "Entry Points",
      shortPortfolio: "Portfolio",
      shortPnl: "P&L",
      shortCost: "Cost",
      shortSats: "Sats",
      shortEntries: "Entry",
      seriesPortfolioValue: "Portfolio Value",
      seriesInvested: "Invested",
      seriesUnrealizedPnl: "Unrealized PNL",
      seriesCumulativeSatoshi: "Cumulative Satoshi",
      seriesBtcPrice: "BTC Price",
      seriesMarketPrice: "Market Price",
      seriesAvgCostBasis: "Avg Cost Basis",
      tooltipPortfolio: "Portfolio",
      tooltipInvested: "Invested",
      tooltipUnrealized: "Unrealized",
      tooltipPercent: "%",
      tooltipCumulative: "Cumulative",
      tooltipTodaysBuy: "Today's buy",
      tooltipBtcPrice: "BTC Price",
      tooltipBought: "Bought",
      tooltipMarket: "Market",
      tooltipAvgCost: "Avg Cost",
      addFirstBuy: "Add your first buy to see chart",
    },
    stats: {
      spendFiat: "Spend Fiat",
      totalSatoshi: "Total Satoshi",
      currentBtcPrice: "Current BTC Price",
      marketValue: "Market Value",
      averageCost: "Average Cost",
      todaySatPerThb: "Today sat/THB",
      maxDrawdown: "Max Drawdown",
      profitLoss: "% Profit / Loss",
      worstSingleBuy: "Worst Single Buy",
      bestSingleBuy: "Best Single Buy",
      footDaysPerDay: (days: number, perDay: number) =>
        `${days} days · ${perDay} ฿/day`,
      footBtc: (btc: string) => `${btc} BTC`,
      footBitkubSpot: "Bitkub · spot",
      footPortfolioValue: "Your portfolio in THB",
      footAcrossAllBuys: "Across all buys",
      footVsAvg: (diff: string) => `${diff} vs avg`,
      footPeakToTrough: "Peak-to-trough",
      footUnrealized: (value: string) => `฿${value} unrealized`,
      footNoLosingEntries: "No losing entries",
      footNoDate: "—",
    },
    goals: {
      goalFiatInvested: "Goal · Fiat Invested",
      goalTotalSatoshi: "Goal · Total Satoshi",
      goalFiat: "Goal · ฿",
      goalSatoshi: "Goal",
      btc: (btc: string) => `(${btc} ₿)`,
      sat: "sat",
      editGoalTitle: "Click to edit goal",
    },
    table: {
      searchPlaceholder: "Search...",
      records: (count: number) => `${count} records`,
      rowsPerPage: "Rows per page",
      showingRange: (start: number, end: number, total: number) =>
        `Showing ${start}–${end} of ${total}`,
      showingEmpty: "Showing 0 of 0",
      noRecordsFound: "No records found",
      colDay: "Day",
      colDate: "Date",
      colFiat: "฿",
      colSatoshi: "Sat",
      colPrice: "BTC Price",
      colPortfolioValue: "Portfolio Value",
      colInvested: "Invested",
      colUnrealized: "P&L",
      colPctUnrealized: "%",
      actions: "Actions",
      edit: "Edit",
      delete: "Delete",
      deleteConfirmTitle: "Delete this DCA entry?",
      deleteConfirmDescription:
        "Only the DCA entry is removed. Bitkub purchase history stays.",
      deleteHoldLabel: "Hold",
      deleteHoldReleaseLabel: "Release",
      deleteHoldInstruction:
        "Hold for about 1.2 seconds until the progress bar fills, then release to confirm deletion.",
      deleteHoldComplete: "Release to confirm deletion.",
      deleteCancel: "Cancel",
      deletePending: "Deleting entry...",
      deleteSuccess: "DCA entry deleted",
      deleteError: "Could not delete DCA entry",
      deleteRetry: "Retry",
      deleteLocalOnly:
        "Only the app entry was deleted. The Bitkub source record remains.",
    },
    section: {
      overviewTitle: "Overview",
      overviewHint: "PNL · chart · hover for daily values",
      metricsTitle: "Metrics & Goals",
      metricsHint: "core numbers · progress",
      historyTitle: "Buy History",
      historyHint: "sortable · searchable · paginated",
    },
  },
};
