/*
  Warnings:

  - The values [RETURN_IN,RETURN_OUT,SCRAP] on the enum `InventoryTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [WIP,IN_STOCK,RETURNED,DEFECTIVE,SCRAPPED] on the enum `ProductInstanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING_APPROVAL,COMPLETED,RETURNED] on the enum `SalesOrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PLANNED,ON_HOLD,CLOSED] on the enum `WorkOrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `material_export_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MaterialRequestStatus" AS ENUM ('PENDING', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferRequestStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TransferEntityType" AS ENUM ('COMPONENT', 'PRODUCT');

-- AlterEnum
BEGIN;
CREATE TYPE "InventoryTransactionType_new" AS ENUM ('IMPORT_PO', 'EXPORT_PRODUCTION', 'IMPORT_PRODUCTION', 'EXPORT_SALES', 'TRANSFER', 'ADJUSTMENT');
ALTER TABLE "inventory_transactions" ALTER COLUMN "transaction_type" TYPE "InventoryTransactionType_new" USING ("transaction_type"::text::"InventoryTransactionType_new");
ALTER TYPE "InventoryTransactionType" RENAME TO "InventoryTransactionType_old";
ALTER TYPE "InventoryTransactionType_new" RENAME TO "InventoryTransactionType";
DROP TYPE "public"."InventoryTransactionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProductInstanceStatus_new" AS ENUM ('PENDING_QC', 'PASSED_QC', 'FAILED_QC', 'IN_STOCK_SALES', 'IN_STOCK_ERROR', 'SHIPPED');
ALTER TABLE "public"."product_instances" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "product_instances" ALTER COLUMN "status" TYPE "ProductInstanceStatus_new" USING ("status"::text::"ProductInstanceStatus_new");
ALTER TYPE "ProductInstanceStatus" RENAME TO "ProductInstanceStatus_old";
ALTER TYPE "ProductInstanceStatus_new" RENAME TO "ProductInstanceStatus";
DROP TYPE "public"."ProductInstanceStatus_old";
ALTER TABLE "product_instances" ALTER COLUMN "status" SET DEFAULT 'PENDING_QC';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SalesOrderStatus_new" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'IN_PROGRESS', 'PARTIALLY_SHIPPED', 'SHIPPED', 'CANCELLED');
ALTER TABLE "public"."sales_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "sales_orders" ALTER COLUMN "status" TYPE "SalesOrderStatus_new" USING ("status"::text::"SalesOrderStatus_new");
ALTER TYPE "SalesOrderStatus" RENAME TO "SalesOrderStatus_old";
ALTER TYPE "SalesOrderStatus_new" RENAME TO "SalesOrderStatus";
DROP TYPE "public"."SalesOrderStatus_old";
ALTER TABLE "sales_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WorkOrderStatus_new" AS ENUM ('DRAFT', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."work_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "work_orders" ALTER COLUMN "status" TYPE "WorkOrderStatus_new" USING ("status"::text::"WorkOrderStatus_new");
ALTER TYPE "WorkOrderStatus" RENAME TO "WorkOrderStatus_old";
ALTER TYPE "WorkOrderStatus_new" RENAME TO "WorkOrderStatus";
DROP TYPE "public"."WorkOrderStatus_old";
ALTER TABLE "work_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "inventory_transactions" DROP CONSTRAINT "inventory_transactions_material_req_id_fkey";

-- DropForeignKey
ALTER TABLE "material_export_requests" DROP CONSTRAINT "material_export_requests_approver_id_fkey";

-- DropForeignKey
ALTER TABLE "material_export_requests" DROP CONSTRAINT "material_export_requests_requester_id_fkey";

-- DropForeignKey
ALTER TABLE "material_export_requests" DROP CONSTRAINT "material_export_requests_work_order_id_fkey";

-- DropForeignKey
ALTER TABLE "material_request_details" DROP CONSTRAINT "material_request_details_material_req_id_fkey";

-- AlterTable
ALTER TABLE "product_instances" ALTER COLUMN "status" SET DEFAULT 'PENDING_QC';

-- AlterTable
ALTER TABLE "work_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- DropTable
DROP TABLE "material_export_requests";

-- DropEnum
DROP TYPE "RequestStatus";

-- CreateTable
CREATE TABLE "material_requests" (
    "material_req_id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MaterialRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "work_order_id" INTEGER NOT NULL,
    "completed_by" INTEGER,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "material_requests_pkey" PRIMARY KEY ("material_req_id")
);

-- CreateTable
CREATE TABLE "transfer_requests" (
    "transfer_request_id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TransferRequestStatus" NOT NULL DEFAULT 'PENDING',
    "source_warehouse_id" INTEGER NOT NULL,
    "target_warehouse_id" INTEGER NOT NULL,
    "entity_type" "TransferEntityType" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_requests_pkey" PRIMARY KEY ("transfer_request_id")
);

-- CreateTable
CREATE TABLE "transfer_request_details" (
    "transfer_detail_id" SERIAL NOT NULL,
    "transfer_request_id" INTEGER NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "transfer_request_details_pkey" PRIMARY KEY ("transfer_detail_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_requests_code_key" ON "material_requests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_requests_code_key" ON "transfer_requests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_request_details_transfer_request_id_entity_id_key" ON "transfer_request_details"("transfer_request_id", "entity_id");

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_material_req_id_fkey" FOREIGN KEY ("material_req_id") REFERENCES "material_requests"("material_req_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request_details" ADD CONSTRAINT "material_request_details_material_req_id_fkey" FOREIGN KEY ("material_req_id") REFERENCES "material_requests"("material_req_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_source_warehouse_id_fkey" FOREIGN KEY ("source_warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_target_warehouse_id_fkey" FOREIGN KEY ("target_warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_details" ADD CONSTRAINT "transfer_request_details_transfer_request_id_fkey" FOREIGN KEY ("transfer_request_id") REFERENCES "transfer_requests"("transfer_request_id") ON DELETE CASCADE ON UPDATE CASCADE;
