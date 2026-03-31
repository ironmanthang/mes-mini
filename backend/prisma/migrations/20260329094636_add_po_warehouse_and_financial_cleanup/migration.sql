/*
  Warnings:

  - You are about to drop the column `discount` on the `purchase_orders` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `purchase_orders` table. All the data in the column will be lost.
  - Added the required column `warehouse_id` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "purchase_orders" DROP COLUMN "discount",
DROP COLUMN "tax",
ADD COLUMN     "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "warehouse_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;
