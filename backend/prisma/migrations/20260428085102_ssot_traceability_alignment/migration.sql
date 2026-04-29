/*
  Warnings:

  - The values [NEEDS_REWORK] on the enum `QualityCheckResult` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[work_order_id]` on the table `material_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QualityCheckResult_new" AS ENUM ('PASSED', 'FAILED');
ALTER TABLE "quality_checks" ALTER COLUMN "result" TYPE "QualityCheckResult_new" USING ("result"::text::"QualityCheckResult_new");
ALTER TYPE "QualityCheckResult" RENAME TO "QualityCheckResult_old";
ALTER TYPE "QualityCheckResult_new" RENAME TO "QualityCheckResult";
DROP TYPE "public"."QualityCheckResult_old";
COMMIT;

-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN     "component_lot_id" INTEGER;

-- AlterTable
ALTER TABLE "product_instances" ADD COLUMN     "received_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "shelf_life_days" INTEGER,
ADD COLUMN     "warranty_period_days" INTEGER;

-- AlterTable
ALTER TABLE "work_order_fulfillments" ADD COLUMN     "fulfilled_quantity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "transfer_request_lots" (
    "id" SERIAL NOT NULL,
    "transfer_detail_id" INTEGER NOT NULL,
    "component_lot_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "transfer_request_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_request_instances" (
    "id" SERIAL NOT NULL,
    "transfer_detail_id" INTEGER NOT NULL,
    "product_instance_id" INTEGER NOT NULL,

    CONSTRAINT "transfer_request_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_request_lots_transfer_detail_id_component_lot_id_key" ON "transfer_request_lots"("transfer_detail_id", "component_lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_request_instances_transfer_detail_id_product_insta_key" ON "transfer_request_instances"("transfer_detail_id", "product_instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "material_requests_work_order_id_key" ON "material_requests"("work_order_id");

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_component_lot_id_fkey" FOREIGN KEY ("component_lot_id") REFERENCES "component_lots"("component_lot_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_lots" ADD CONSTRAINT "transfer_request_lots_transfer_detail_id_fkey" FOREIGN KEY ("transfer_detail_id") REFERENCES "transfer_request_details"("transfer_detail_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_lots" ADD CONSTRAINT "transfer_request_lots_component_lot_id_fkey" FOREIGN KEY ("component_lot_id") REFERENCES "component_lots"("component_lot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_instances" ADD CONSTRAINT "transfer_request_instances_transfer_detail_id_fkey" FOREIGN KEY ("transfer_detail_id") REFERENCES "transfer_request_details"("transfer_detail_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_instances" ADD CONSTRAINT "transfer_request_instances_product_instance_id_fkey" FOREIGN KEY ("product_instance_id") REFERENCES "product_instances"("product_instance_id") ON DELETE RESTRICT ON UPDATE CASCADE;
