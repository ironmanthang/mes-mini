/*
  Warnings:

  - A unique constraint covering the columns `[product_instance_id]` on the table `quality_checks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('BINARY', 'MEASUREMENT', 'SELECTION');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "checklist_id" INTEGER;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "labor_cost" DECIMAL(12,2),
ADD COLUMN     "overhead_cost" DECIMAL(12,2),
ADD COLUMN     "total_material_cost" DECIMAL(12,2),
ADD COLUMN     "total_production_cost" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "inspection_points" (
    "inspection_point_id" SERIAL NOT NULL,
    "checklist_id" INTEGER NOT NULL,
    "point_name" TEXT NOT NULL,
    "description" TEXT,
    "point_type" "InspectionType" NOT NULL DEFAULT 'BINARY',
    "min_value" DECIMAL(10,4),
    "max_value" DECIMAL(10,4),
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_points_pkey" PRIMARY KEY ("inspection_point_id")
);

-- CreateTable
CREATE TABLE "inspection_results" (
    "inspection_result_id" SERIAL NOT NULL,
    "quality_check_id" INTEGER NOT NULL,
    "inspection_point_id" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "measured_value" DECIMAL(10,4),
    "notes" TEXT,

    CONSTRAINT "inspection_results_pkey" PRIMARY KEY ("inspection_result_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inspection_results_quality_check_id_inspection_point_id_key" ON "inspection_results"("quality_check_id", "inspection_point_id");

-- CreateIndex
CREATE UNIQUE INDEX "quality_checks_product_instance_id_key" ON "quality_checks"("product_instance_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "quality_checklists"("checklist_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_points" ADD CONSTRAINT "inspection_points_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "quality_checklists"("checklist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_quality_check_id_fkey" FOREIGN KEY ("quality_check_id") REFERENCES "quality_checks"("quality_check_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_inspection_point_id_fkey" FOREIGN KEY ("inspection_point_id") REFERENCES "inspection_points"("inspection_point_id") ON DELETE RESTRICT ON UPDATE CASCADE;
