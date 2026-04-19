-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionType') THEN
    CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "expense_categories" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "icon" TEXT,
  "color" TEXT,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- Backward compatibility for databases that were synced before categories
-- became shared across income and expense transactions.
DROP INDEX IF EXISTS "expense_categories_user_id_name_type_key";
DROP INDEX IF EXISTS "expense_categories_user_id_type_idx";
ALTER TABLE "expense_categories" DROP COLUMN IF EXISTS "type";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "expense_categories_user_id_name_key" ON "expense_categories"("user_id", "name");
CREATE INDEX IF NOT EXISTS "expense_categories_user_id_is_active_idx" ON "expense_categories"("user_id", "is_active");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expense_categories_user_id_fkey'
  ) THEN
    ALTER TABLE "expense_categories"
      ADD CONSTRAINT "expense_categories_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "transactions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "type" "TransactionType" NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "note" TEXT,
  "tags" TEXT,
  "trans_date" TEXT NOT NULL,
  "trans_month" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transactions_user_id_trans_month_idx" ON "transactions"("user_id", "trans_month");
CREATE INDEX IF NOT EXISTS "transactions_user_id_type_trans_month_idx" ON "transactions"("user_id", "type", "trans_month");
CREATE INDEX IF NOT EXISTS "transactions_category_id_idx" ON "transactions"("category_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_user_id_fkey'
  ) THEN
    ALTER TABLE "transactions"
      ADD CONSTRAINT "transactions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_category_id_fkey'
  ) THEN
    ALTER TABLE "transactions"
      ADD CONSTRAINT "transactions_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
