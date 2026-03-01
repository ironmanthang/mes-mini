/*
  Warnings:

  - You are about to drop the `product_composition` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_composition" DROP CONSTRAINT "product_composition_component_id_fkey";

-- DropForeignKey
ALTER TABLE "product_composition" DROP CONSTRAINT "product_composition_product_id_fkey";

-- AlterTable
ALTER TABLE "production_requests" ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "note" TEXT,
ADD COLUMN     "start_date" TIMESTAMP(3);

-- DropTable
DROP TABLE "product_composition";

-- CreateTable
CREATE TABLE "bill_of_materials" (
    "product_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "quantity_needed" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "bill_of_materials_pkey" PRIMARY KEY ("product_id","component_id")
);

-- AddForeignKey
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE CASCADE ON UPDATE CASCADE;
