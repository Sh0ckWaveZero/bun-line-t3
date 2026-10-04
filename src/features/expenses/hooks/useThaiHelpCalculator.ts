import { useEffect, useState } from "react";
import { useToast } from "@/components/common/ToastProvider";
import {
  CO_PAY_DAILY_MAX_SUBSIDY,
  formatCoPaymentDetails,
} from "@/features/expenses/helpers/coPayment";
import {
  computeDailyCoPayStats,
  computeMonthlyCoPayStats,
  computeMonthlyRemainingCombined,
  computeSplitBill,
  computeTopUp,
  findDefaultCoPayCategoryId,
  resolveSelectedCoPayCategoryId,
  type CoPayCategory,
  type CoPayTransactionLike,
  type DailyCoPayStats,
  type MonthlyCoPayStats,
} from "@/features/expenses/helpers/coPayStats";

export type CoPayTab = "split" | "topup" | "stats";

interface UseThaiHelpCalculatorArgs {
  categories: CoPayCategory[];
  transactions: CoPayTransactionLike[];
  onSave: (input: {
    categoryId: string;
    type: "EXPENSE";
    amount: number;
    note: string;
    tags: string;
    transDate: string;
  }) => Promise<void>;
  refetch: () => void;
}

/**
 * State + calculation logic ของ ThaiHelpCalculatorContent
 * (ย้ายมาจาก component เดิม — ลำดับ state/effect และพฤติกรรมเดิมทุกอย่าง)
 */
export function useThaiHelpCalculator({
  categories,
  transactions,
  onSave,
  refetch,
}: UseThaiHelpCalculatorArgs) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CoPayTab>("split");

  // Tab 1: Split Bill State
  const [totalBill, setTotalBill] = useState("");
  const [userSelectedCategoryId, setUserSelectedCategoryId] = useState<
    string | null
  >(null);
  const defaultCategoryId = findDefaultCoPayCategoryId(categories);
  const selectedCategoryId = resolveSelectedCoPayCategoryId(
    categories,
    userSelectedCategoryId,
    defaultCategoryId,
  );

  // Tab 2: Top Up State
  const [desiredSubsidy, setDesiredSubsidy] = useState("");
  const [copied, setCopied] = useState(false);

  // Save error state for inline retry
  const [saveError, setSaveError] = useState(false);

  // Daily Stats (client-side only to avoid SSR hydration mismatch)
  const [dailyStats, setDailyStats] = useState<DailyCoPayStats>({
    todaySubsidyUsed: 0,
    todayUserSpent: 0,
    todayTotalBill: 0,
    todayRemaining: CO_PAY_DAILY_MAX_SUBSIDY,
  });

  useEffect(() => {
    // client-side only เพื่อเลี่ยง SSR hydration mismatch — setState ใน effect จึงจำเป็น
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDailyStats(computeDailyCoPayStats(transactions));
  }, [transactions]);

  // Monthly Stats (client-side only to avoid SSR hydration mismatch)
  const [stats, setStats] = useState<MonthlyCoPayStats>({
    totalSubsidyUsed: 0,
    remainingSubsidy: 1000,
    totalUserSpent: 0,
    count: 0,
  });

  useEffect(() => {
    // client-side only เพื่อเลี่ยง SSR hydration mismatch — setState ใน effect จึงจำเป็น
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(computeMonthlyCoPayStats(transactions));
  }, [transactions]);

  // Calculations for Split Bill
  const { numericBill, subsidy60, userPaid40, monthlyQuotaExceeded } =
    computeSplitBill(totalBill, stats.remainingSubsidy);

  // Calculations for Top Up
  const { numericSubsidy, topUpNeeded, purchaseValue } =
    computeTopUp(desiredSubsidy);

  // Remaining combined purchasing power (state + user) for this month
  const monthlyRemainingCombined = computeMonthlyRemainingCombined(
    stats.remainingSubsidy,
  );

  const toggleIsOpen = () => setIsOpen(!isOpen);

  // Handle Save Transaction
  const handleSaveExpense = async () => {
    if (numericBill <= 0) {
      showToast({
        title: "กรุณาระบุยอดสินค้า",
        description: "ยอดสินค้าต้องมากกว่า 0 บาท",
        type: "warning",
      });
      return;
    }

    if (!selectedCategoryId) {
      showToast({
        title: "กรุณาเลือกหมวดหมู่",
        description: "เลือกหมวดหมู่เพื่อจัดเก็บรายจ่าย",
        type: "warning",
      });
      return;
    }

    try {
      const todayStr = new Date().toISOString().split("T")[0]!;

      // Standardize co-payment details using the isolated helper
      const { note, tags } = formatCoPaymentDetails(
        numericBill,
        subsidy60,
        null, // No original note
        [], // No original tags
      );

      await onSave({
        categoryId: selectedCategoryId,
        type: "EXPENSE",
        amount: userPaid40, // Only log user's actual share!
        note,
        tags: tags.join(","),
        transDate: todayStr,
      });

      showToast({
        title: "บันทึกสำเร็จ!",
        description: `บันทึกส่วนที่คุณจ่ายเอง ฿${userPaid40.toFixed(2)} เรียบร้อยแล้ว`,
        type: "success",
      });

      setSaveError(false);
      setTotalBill("");
      refetch();
    } catch (error) {
      console.error(error);
      setSaveError(true);
    }
  };

  const handleCopyTopUp = () => {
    void navigator.clipboard.writeText(topUpNeeded.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    isOpen,
    toggleIsOpen,
    activeTab,
    setActiveTab,
    totalBill,
    setTotalBill,
    selectedCategoryId,
    setUserSelectedCategoryId,
    desiredSubsidy,
    setDesiredSubsidy,
    copied,
    handleCopyTopUp,
    saveError,
    dailyStats,
    stats,
    numericBill,
    subsidy60,
    userPaid40,
    monthlyQuotaExceeded,
    numericSubsidy,
    topUpNeeded,
    purchaseValue,
    monthlyRemainingCombined,
    handleSaveExpense,
  };
}
