/*
  Warnings:

  - You are about to drop the column `max_value` on the `inspection_points` table. All the data in the column will be lost.
  - You are about to drop the column `min_value` on the `inspection_points` table. All the data in the column will be lost.
  - You are about to drop the column `point_type` on the `inspection_points` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `inspection_points` table. All the data in the column will be lost.
  - You are about to drop the column `measured_value` on the `inspection_results` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "inspection_points" DROP COLUMN "max_value",
DROP COLUMN "min_value",
DROP COLUMN "point_type",
DROP COLUMN "unit";

-- AlterTable
ALTER TABLE "inspection_results" DROP COLUMN "measured_value";

-- DropEnum
DROP TYPE "InspectionType";
