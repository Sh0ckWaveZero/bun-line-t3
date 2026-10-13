CREATE TABLE "bitkub_connections" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "encrypted_credentials" TEXT,
  "key_hint" TEXT,
  "connected_at" TIMESTAMP(3),
  "last_synced_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bitkub_connections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bitkub_connections_user_id_key" ON "bitkub_connections"("user_id");
ALTER TABLE "bitkub_connections" ADD CONSTRAINT "bitkub_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bitkub_btc_buys" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "external_trade_identity" TEXT NOT NULL,
  "external_order_id" TEXT NOT NULL,
  "amount_thb" DECIMAL(38,18) NOT NULL,
  "fee_thb" DECIMAL(38,18) NOT NULL,
  "spent_thb" DECIMAL(38,18) NOT NULL,
  "received_btc" DECIMAL(38,18) NOT NULL,
  "rate" DECIMAL(38,18) NOT NULL,
  "executed_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bitkub_btc_buys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bitkub_btc_buys_user_id_external_trade_identity_key" ON "bitkub_btc_buys"("user_id", "external_trade_identity");
CREATE INDEX "bitkub_btc_buys_user_id_executed_at_idx" ON "bitkub_btc_buys"("user_id", "executed_at");
ALTER TABLE "bitkub_btc_buys" ADD CONSTRAINT "bitkub_btc_buys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dca_orders" ADD COLUMN "deduplication_key" TEXT, ADD COLUMN "bitkub_buy_id" TEXT;
-- PostgreSQL timestamps in this schema represent UTC. Match Date.toISOString() exactly.
UPDATE "dca_orders" SET "deduplication_key" = 'legacy:' || "coin" || ':' || to_char("executed_at", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
ALTER TABLE "dca_orders" ALTER COLUMN "deduplication_key" SET NOT NULL;
DROP INDEX "dca_orders_line_user_id_coin_executed_at_key";
CREATE UNIQUE INDEX "dca_orders_line_user_id_deduplication_key_key" ON "dca_orders"("line_user_id", "deduplication_key");
CREATE UNIQUE INDEX "dca_orders_bitkub_buy_id_key" ON "dca_orders"("bitkub_buy_id");
ALTER TABLE "dca_orders" ADD CONSTRAINT "dca_orders_bitkub_buy_id_fkey" FOREIGN KEY ("bitkub_buy_id") REFERENCES "bitkub_btc_buys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
