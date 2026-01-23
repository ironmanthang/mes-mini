/*
  Warnings:

  - The values [CLOSED] on the enum `ProductionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `sales_order_details` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[sales_order_id,product_id]` on the table `sales_order_details` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `sales_orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `sales_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProductionStatus_new" AS ENUM ('DRAFT', 'REQUESTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
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

-- AlterTable
ALTER TABLE "sales_order_details" DROP CONSTRAINT "sales_order_details_pkey",
ADD COLUMN     "quantity_shipped" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "so_detail_id" SERIAL NOT NULL,
ADD CONSTRAINT "sales_order_details_pkey" PRIMARY KEY ("so_detail_id");

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approver_id" INTEGER,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "delivery_terms" TEXT,
ADD COLUMN     "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "expected_ship_date" TIMESTAMP(3),
ADD COLUMN     "note" TEXT,
ADD COLUMN     "payment_terms" TEXT,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "shipping_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_details_sales_order_id_product_id_key" ON "sales_order_details"("sales_order_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_code_key" ON "sales_orders"("code");

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;
