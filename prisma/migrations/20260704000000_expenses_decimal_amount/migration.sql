-- AlterTable: เปลี่ยน amount columns จาก Float (DOUBLE PRECISION) → Decimal(14,2)
-- เพื่อความแม่นยำทางการเงิน (ป้องกัน floating-point precision loss)
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

ALTER TABLE "budgets" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

ALTER TABLE "recurring_transactions" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

ALTER TABLE "savings_goals" ALTER COLUMN "target_amount" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "saved_amount" SET DATA TYPE DECIMAL(14,2);
