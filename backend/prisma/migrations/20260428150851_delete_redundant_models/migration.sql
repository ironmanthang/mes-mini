/*
  Warnings:

  - You are about to drop the `cost_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `production_costs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stocktake_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stocktaking` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "production_costs" DROP CONSTRAINT "production_costs_cost_category_id_fkey";

-- DropForeignKey
ALTER TABLE "production_costs" DROP CONSTRAINT "production_costs_work_order_id_fkey";

-- DropForeignKey
ALTER TABLE "stocktake_items" DROP CONSTRAINT "stocktake_items_component_id_fkey";

-- DropForeignKey
ALTER TABLE "stocktake_items" DROP CONSTRAINT "stocktake_items_stocktake_id_fkey";

-- DropForeignKey
ALTER TABLE "stocktaking" DROP CONSTRAINT "stocktaking_created_by_fkey";

-- DropForeignKey
ALTER TABLE "stocktaking" DROP CONSTRAINT "stocktaking_warehouse_id_fkey";

-- DropTable
DROP TABLE "cost_categories";

-- DropTable
DROP TABLE "production_costs";

-- DropTable
DROP TABLE "stocktake_items";

-- DropTable
DROP TABLE "stocktaking";
