/*
  Warnings:

  - The values [RETURN] on the enum `InventoryTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [SOLD,IN_REPAIR] on the enum `ProductInstanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `production_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `purchase_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `sales_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `work_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'SENT_TO_SUPPLIER', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PO_APPROVED', 'PO_RECEIVED', 'SO_APPROVED', 'SO_SHIPPED', 'PR_APPROVED', 'WO_COMPLETED', 'LOW_STOCK', 'MATERIAL_ISSUED', 'GENERAL');

-- AlterEnum
BEGIN;
CREATE TYPE "InventoryTransactionType_new" AS ENUM ('IMPORT_PO', 'EXPORT_PRODUCTION', 'IMPORT_PRODUCTION', 'EXPORT_SALES', 'TRANSFER', 'ADJUSTMENT', 'RETURN_IN', 'RETURN_OUT', 'SCRAP');
ALTER TABLE "inventory_transactions" ALTER COLUMN "transaction_type" TYPE "InventoryTransactionType_new" USING ("transaction_type"::text::"InventoryTransactionType_new");
ALTER TYPE "InventoryTransactionType" RENAME TO "InventoryTransactionType_old";
ALTER TYPE "InventoryTransactionType_new" RENAME TO "InventoryTransactionType";
DROP TYPE "public"."InventoryTransactionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProductInstanceStatus_new" AS ENUM ('WIP', 'IN_STOCK', 'RESERVED', 'SHIPPED', 'RETURNED', 'DEFECTIVE', 'SCRAPPED');
ALTER TABLE "public"."product_instances" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "product_instances" ALTER COLUMN "status" TYPE "ProductInstanceStatus_new" USING ("status"::text::"ProductInstanceStatus_new");
ALTER TYPE "ProductInstanceStatus" RENAME TO "ProductInstanceStatus_old";
ALTER TYPE "ProductInstanceStatus_new" RENAME TO "ProductInstanceStatus";
DROP TYPE "public"."ProductInstanceStatus_old";
ALTER TABLE "product_instances" ALTER COLUMN "status" SET DEFAULT 'WIP';
COMMIT;

-- AlterTable
ALTER TABLE "product_instances" ADD COLUMN     "sales_order_id" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'WIP';

-- AlterTable
ALTER TABLE "production_requests" ADD COLUMN     "sales_order_id" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "ProductionRequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "purchase_orders" DROP COLUMN "status",
ADD COLUMN     "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "actual_shipping_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "production_line_id" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "WorkOrderStatus" NOT NULL DEFAULT 'PLANNED';

-- DropEnum
DROP TYPE "OrderStatus";

-- DropEnum
DROP TYPE "ProductionStatus";

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "employee_id" INTEGER NOT NULL,
    "related_entity_type" TEXT,
    "related_entity_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "stocktaking" (
    "stocktake_id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "warehouse_id" INTEGER NOT NULL,
    "description" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocktaking_pkey" PRIMARY KEY ("stocktake_id")
);

-- CreateTable
CREATE TABLE "stocktake_items" (
    "stocktake_item_id" SERIAL NOT NULL,
    "stocktake_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "system_quantity" INTEGER NOT NULL,
    "actual_quantity" INTEGER,
    "notes" TEXT,

    CONSTRAINT "stocktake_items_pkey" PRIMARY KEY ("stocktake_item_id")
);

-- CreateIndex
CREATE INDEX "notifications_employee_id_is_read_idx" ON "notifications"("employee_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "stocktaking_code_key" ON "stocktaking"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stocktake_items_stocktake_id_component_id_key" ON "stocktake_items"("stocktake_id", "component_id");

-- AddForeignKey
ALTER TABLE "production_requests" ADD CONSTRAINT "production_requests_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("sales_order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_production_line_id_fkey" FOREIGN KEY ("production_line_id") REFERENCES "production_lines"("production_line_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_instances" ADD CONSTRAINT "product_instances_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("sales_order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocktaking" ADD CONSTRAINT "stocktaking_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocktaking" ADD CONSTRAINT "stocktaking_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_stocktake_id_fkey" FOREIGN KEY ("stocktake_id") REFERENCES "stocktaking"("stocktake_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;
