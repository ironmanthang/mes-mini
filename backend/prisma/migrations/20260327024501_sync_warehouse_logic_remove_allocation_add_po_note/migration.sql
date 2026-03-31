/*
  Warnings:

  - The values [RESERVED] on the enum `ProductInstanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `quantity_needed` on the `bill_of_materials` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `Integer`.
  - You are about to drop the column `allocated_quantity` on the `component_stocks` table. All the data in the column will be lost.
  - Added the required column `warehouse_type` to the `warehouses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('COMPONENT', 'SALES', 'ERROR');

-- AlterEnum
BEGIN;
CREATE TYPE "ProductInstanceStatus_new" AS ENUM ('WIP', 'IN_STOCK', 'SHIPPED', 'RETURNED', 'DEFECTIVE', 'SCRAPPED');
ALTER TABLE "public"."product_instances" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "product_instances" ALTER COLUMN "status" TYPE "ProductInstanceStatus_new" USING ("status"::text::"ProductInstanceStatus_new");
ALTER TYPE "ProductInstanceStatus" RENAME TO "ProductInstanceStatus_old";
ALTER TYPE "ProductInstanceStatus_new" RENAME TO "ProductInstanceStatus";
DROP TYPE "public"."ProductInstanceStatus_old";
ALTER TABLE "product_instances" ALTER COLUMN "status" SET DEFAULT 'WIP';
COMMIT;

-- AlterTable
ALTER TABLE "bill_of_materials" ALTER COLUMN "quantity_needed" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "component_stocks" DROP COLUMN "allocated_quantity";

-- AlterTable
ALTER TABLE "product_instances" ADD COLUMN     "warehouse_id" INTEGER;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "min_stock_level" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "warehouse_type" "WarehouseType" NOT NULL;

-- CreateTable
CREATE TABLE "production_request_details" (
    "pr_detail_id" SERIAL NOT NULL,
    "production_request_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "quantity_per_unit" INTEGER NOT NULL,
    "total_required" INTEGER NOT NULL,

    CONSTRAINT "production_request_details_pkey" PRIMARY KEY ("pr_detail_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_request_details_production_request_id_component__key" ON "production_request_details"("production_request_id", "component_id");

-- AddForeignKey
ALTER TABLE "production_request_details" ADD CONSTRAINT "production_request_details_production_request_id_fkey" FOREIGN KEY ("production_request_id") REFERENCES "production_requests"("production_request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_request_details" ADD CONSTRAINT "production_request_details_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_instances" ADD CONSTRAINT "product_instances_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;
