/*
  Warnings:

  - The values [PENDING_APPROVAL,SENT_TO_SUPPLIER,PARTIALLY_RECEIVED] on the enum `PurchaseOrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PurchaseOrderStatus_new" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVING', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."purchase_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "purchase_orders" ALTER COLUMN "status" TYPE "PurchaseOrderStatus_new" USING ("status"::text::"PurchaseOrderStatus_new");
ALTER TYPE "PurchaseOrderStatus" RENAME TO "PurchaseOrderStatus_old";
ALTER TYPE "PurchaseOrderStatus_new" RENAME TO "PurchaseOrderStatus";
DROP TYPE "public"."PurchaseOrderStatus_old";
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- CreateTable
CREATE TABLE "component_lots" (
    "component_lot_id" SERIAL NOT NULL,
    "lot_code" TEXT NOT NULL,
    "component_id" INTEGER NOT NULL,
    "po_detail_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_lots_pkey" PRIMARY KEY ("component_lot_id")
);

-- CreateTable
CREATE TABLE "code_sequences" (
    "scope" TEXT NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "code_sequences_pkey" PRIMARY KEY ("scope")
);

-- CreateIndex
CREATE UNIQUE INDEX "component_lots_lot_code_key" ON "component_lots"("lot_code");

-- AddForeignKey
ALTER TABLE "component_lots" ADD CONSTRAINT "component_lots_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_lots" ADD CONSTRAINT "component_lots_po_detail_id_fkey" FOREIGN KEY ("po_detail_id") REFERENCES "purchase_order_details"("po_detail_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_lots" ADD CONSTRAINT "component_lots_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;
