/*
  Warnings:

  - You are about to drop the `sequences` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "target_date" TIMESTAMP(3);

-- DropTable
DROP TABLE "sequences";
