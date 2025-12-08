/*
  Warnings:

  - The values [RECEIPT,SHIPMENT,CONSUMPTION] on the enum `InventoryTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [DECOMMISSIONED] on the enum `ProductInstanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ON_HOLD] on the enum `ProductionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `quantity_needed` on the `product_composition` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,4)`.
  - The primary key for the `purchase_order_details` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `quantity` on the `purchase_order_details` table. All the data in the column will be lost.
  - You are about to drop the `component_stock` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `components` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `production_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[purchase_order_id,component_id]` on the table `purchase_order_details` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `purchase_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `warehouses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `work_orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `components` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `components` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `production_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity_ordered` to the `purchase_order_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `suppliers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `warehouses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `work_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `work_orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterEnum
BEGIN;
CREATE TYPE "InventoryTransactionType_new" AS ENUM ('IMPORT_PO', 'EXPORT_PRODUCTION', 'IMPORT_PRODUCTION', 'EXPORT_SALES', 'TRANSFER', 'ADJUSTMENT', 'RETURN');
ALTER TABLE "inventory_transactions" ALTER COLUMN "transaction_type" TYPE "InventoryTransactionType_new" USING ("transaction_type"::text::"InventoryTransactionType_new");
ALTER TYPE "InventoryTransactionType" RENAME TO "InventoryTransactionType_old";
ALTER TYPE "InventoryTransactionType_new" RENAME TO "InventoryTransactionType";
DROP TYPE "public"."InventoryTransactionType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'APPROVED';
ALTER TYPE "OrderStatus" ADD VALUE 'PARTIALLY_RECEIVED';

-- AlterEnum
BEGIN;
CREATE TYPE "ProductInstanceStatus_new" AS ENUM ('IN_STOCK', 'SOLD', 'IN_REPAIR', 'SCRAPPED', 'RETURNED');
ALTER TABLE "public"."product_instances" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "product_instances" ALTER COLUMN "status" TYPE "ProductInstanceStatus_new" USING ("status"::text::"ProductInstanceStatus_new");
ALTER TYPE "ProductInstanceStatus" RENAME TO "ProductInstanceStatus_old";
ALTER TYPE "ProductInstanceStatus_new" RENAME TO "ProductInstanceStatus";
DROP TYPE "public"."ProductInstanceStatus_old";
ALTER TABLE "product_instances" ALTER COLUMN "status" SET DEFAULT 'IN_STOCK';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProductionStatus_new" AS ENUM ('DRAFT', 'REQUESTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED');
ALTER TABLE "public"."production_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."work_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "production_requests" ALTER COLUMN "status" TYPE "ProductionStatus_new" USING ("status"::text::"ProductionStatus_new");
ALTER TABLE "work_orders" ALTER COLUMN "status" TYPE "ProductionStatus_new" USING ("status"::text::"ProductionStatus_new");
ALTER TYPE "ProductionStatus" RENAME TO "ProductionStatus_old";
ALTER TYPE "ProductionStatus_new" RENAME TO "ProductionStatus";
DROP TYPE "public"."ProductionStatus_old";
ALTER TABLE "production_requests" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';
ALTER TABLE "work_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "component_stock" DROP CONSTRAINT "component_stock_component_id_fkey";

-- DropForeignKey
ALTER TABLE "component_stock" DROP CONSTRAINT "component_stock_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "production_batches" DROP CONSTRAINT "production_batches_production_line_id_fkey";

-- AlterTable
ALTER TABLE "components" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "min_stock_level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "standard_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unit" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN     "material_req_id" INTEGER;

-- AlterTable
ALTER TABLE "product_composition" ALTER COLUMN "quantity_needed" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "production_batches" ALTER COLUMN "production_line_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "production_requests" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "purchase_order_details" DROP CONSTRAINT "purchase_order_details_pkey",
DROP COLUMN "quantity",
ADD COLUMN     "po_detail_id" SERIAL NOT NULL,
ADD COLUMN     "quantity_ordered" INTEGER NOT NULL,
ADD COLUMN     "quantity_received" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "purchase_order_details_pkey" PRIMARY KEY ("po_detail_id");

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- DropTable
DROP TABLE "component_stock";

-- CreateTable
CREATE TABLE "material_export_requests" (
    "material_req_id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "work_order_id" INTEGER NOT NULL,
    "requester_id" INTEGER NOT NULL,
    "approver_id" INTEGER,

    CONSTRAINT "material_export_requests_pkey" PRIMARY KEY ("material_req_id")
);

-- CreateTable
CREATE TABLE "material_request_details" (
    "detailId" SERIAL NOT NULL,
    "material_req_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "material_request_details_pkey" PRIMARY KEY ("detailId")
);

-- CreateTable
CREATE TABLE "component_stocks" (
    "warehouse_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_stocks_pkey" PRIMARY KEY ("warehouse_id","component_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_export_requests_code_key" ON "material_export_requests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "components_code_key" ON "components"("code");

-- CreateIndex
CREATE UNIQUE INDEX "production_requests_code_key" ON "production_requests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_details_purchase_order_id_component_id_key" ON "purchase_order_details"("purchase_order_id", "component_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_code_key" ON "purchase_orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_code_key" ON "work_orders"("code");

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_production_line_id_fkey" FOREIGN KEY ("production_line_id") REFERENCES "production_lines"("production_line_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_export_requests" ADD CONSTRAINT "material_export_requests_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_export_requests" ADD CONSTRAINT "material_export_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_export_requests" ADD CONSTRAINT "material_export_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request_details" ADD CONSTRAINT "material_request_details_material_req_id_fkey" FOREIGN KEY ("material_req_id") REFERENCES "material_export_requests"("material_req_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request_details" ADD CONSTRAINT "material_request_details_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_stocks" ADD CONSTRAINT "component_stocks_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_stocks" ADD CONSTRAINT "component_stocks_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_material_req_id_fkey" FOREIGN KEY ("material_req_id") REFERENCES "material_export_requests"("material_req_id") ON DELETE SET NULL ON UPDATE CASCADE;
