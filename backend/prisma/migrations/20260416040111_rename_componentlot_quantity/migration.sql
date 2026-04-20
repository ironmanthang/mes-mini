/*
  Warnings:

  - You are about to drop the column `quantity` on the `component_lots` table. All the data in the column will be lost.
  - Added the required column `current_quantity` to the `component_lots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initial_quantity` to the `component_lots` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "component_lots" DROP COLUMN "quantity",
ADD COLUMN     "current_quantity" INTEGER NOT NULL,
ADD COLUMN     "initial_quantity" INTEGER NOT NULL;
