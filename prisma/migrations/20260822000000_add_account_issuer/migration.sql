-- better-auth >= 1.7 identifies accounts by (issuer, accountId) instead of
-- (providerId, accountId). LINE Login's issuer is "https://access.line.me";
-- providers without their own issuer use the synthetic "local:<providerId>".

-- AlterTable: add the new column as nullable first so existing rows survive
ALTER TABLE "accounts" ADD COLUMN "issuer" TEXT;

-- Backfill: LINE accounts get the real LINE issuer, everything else gets the
-- better-auth synthetic local issuer
UPDATE "accounts" SET "issuer" = 'https://access.line.me' WHERE "providerId" = 'line';
UPDATE "accounts" SET "issuer" = 'local:' || "providerId" WHERE "issuer" IS NULL;

-- AlterTable: tighten to NOT NULL once backfilled
ALTER TABLE "accounts" ALTER COLUMN "issuer" SET NOT NULL;

-- CreateIndex: unique (issuer, accountId) expected by better-auth 1.7
-- (the existing (providerId, accountId) unique is kept)
CREATE UNIQUE INDEX "accounts_issuer_account_id_key" ON "accounts"("issuer", "accountId");
