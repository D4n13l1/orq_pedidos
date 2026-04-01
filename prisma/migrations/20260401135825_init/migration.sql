-- CreateTable
CREATE TABLE "Orders" (
    "order_id" TEXT NOT NULL PRIMARY KEY,
    "currency" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "customer" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "Items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price" REAL NOT NULL,
    "order_id" TEXT NOT NULL,
    CONSTRAINT "Items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Orders" ("order_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Orders_idempotency_key_key" ON "Orders"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "Items_sku_order_id_key" ON "Items"("sku", "order_id");
