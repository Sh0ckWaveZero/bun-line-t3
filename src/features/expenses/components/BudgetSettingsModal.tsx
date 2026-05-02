/**
 * BudgetSettingsModal - จัดการงบประมาณ
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2 } from "lucide-react";
import type { BudgetWithCategory } from "@/features/expenses/services/budget.server";
import { formatAmount } from "@/features/expenses/helpers";

interface BudgetSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgets: BudgetWithCategory[];
  categories: Array<{ id: string; name: string; icon?: string | null }>;
  onCreateBudget: (data: {
    categoryId: string | null;
    amount: number;
    alertAt: number;
  }) => Promise<void>;
  onUpdateBudget: (id: string, data: { amount?: number; alertAt?: number }) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function BudgetSettingsModal({
  open,
  onOpenChange,
  budgets,
  categories,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
  isLoading = false,
}: BudgetSettingsModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [alertAt, setAlertAt] = useState([80]);

  const resetForm = () => {
    setCategoryId(null);
    setAmount("");
    setAlertAt([80]);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    if (editingId) {
      await onUpdateBudget(editingId, {
        amount: amountNum,
        alertAt: alertAt[0],
      });
    } else {
      await onCreateBudget({
        categoryId,
        amount: amountNum,
        alertAt: alertAt[0],
      });
    }
    resetForm();
  };

  const handleEdit = (budget: BudgetWithCategory) => {
    setEditingId(budget.id);
    setCategoryId(budget.categoryId);
    setAmount(budget.amount.toString());
    setAlertAt([budget.alertAt]);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบงบประมาณนี้?")) {
      await onDeleteBudget(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ตั้งค่างบประมาณ</DialogTitle>
          <DialogDescription>
            จัดการงบประมาณรายเดือนของคุณ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add/Edit Form */}
          {showAddForm ? (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {editingId ? "แก้ไขงบประมาณ" : "เพิ่มงบประมาณ"}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    ยกเลิกแก้ไข
                  </Button>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>หมวดหมู่</Label>
                  <select
                    value={categoryId || ""}
                    onChange={(e) => setCategoryId(e.target.value || null)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">งบรวมทุกหมวด</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label>จำนวนเงิน (บาท/เดือน)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="เช่น 5000"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Alert Threshold */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>แจ้งเตือนเมื่อใช้ถึง</Label>
                    <span className="text-sm text-muted-foreground">{alertAt[0]}%</span>
                  </div>
                  <Slider
                    value={alertAt}
                    onValueChange={setAlertAt}
                    min={50}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                    {editingId ? "อัปเดต" : "สร้าง"}
                  </Button>
                  <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                    ยกเลิก
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มงบประมาณ
            </Button>
          )}

          {/* Budget List */}
          <div className="space-y-2">
            {budgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">ยังไม่มีงบประมาณ</p>
                <p className="text-xs mt-1">คลิก "เพิ่มงบประมาณ" เพื่อเริ่มต้น</p>
              </div>
            ) : (
              budgets.map((budget) => (
                <Card key={budget.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {budget.category?.icon || "💰"}
                        </span>
                        <span className="font-medium">
                          {budget.category?.name || "งบรวม"}
                        </span>
                        {!budget.isActive && (
                          <span className="text-xs text-muted-foreground">(ปิดใช้งาน)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatAmount(budget.amount)} บาท/เดือน
                      </div>
                      <div className="text-xs text-muted-foreground">
                        แจ้งเตือนที่ {budget.alertAt}%
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(budget)}
                        disabled={isLoading}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(budget.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
