/*
  Warnings:

  - The values [PENDING,REJECTED] on the enum `ProductionRequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `sales_order_id` on the `production_requests` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProductionRequestStatus_new" AS ENUM ('APPROVED', 'WAITING_MATERIAL', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');
ALTER TABLE "public"."production_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "production_requests" ALTER COLUMN "status" TYPE "ProductionRequestStatus_new" USING ("status"::text::"ProductionRequestStatus_new");
ALTER TYPE "ProductionRequestStatus" RENAME TO "ProductionRequestStatus_old";
ALTER TYPE "ProductionRequestStatus_new" RENAME TO "ProductionRequestStatus";
DROP TYPE "public"."ProductionRequestStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "production_requests" DROP CONSTRAINT "production_requests_sales_order_id_fkey";

-- AlterTable
ALTER TABLE "production_requests" DROP COLUMN "sales_order_id",
ADD COLUMN     "so_detail_id" INTEGER,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "purchase_order_details" ADD COLUMN     "production_request_id" INTEGER;

-- AddForeignKey
ALTER TABLE "purchase_order_details" ADD CONSTRAINT "purchase_order_details_production_request_id_fkey" FOREIGN KEY ("production_request_id") REFERENCES "production_requests"("production_request_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_requests" ADD CONSTRAINT "production_requests_so_detail_id_fkey" FOREIGN KEY ("so_detail_id") REFERENCES "sales_order_details"("so_detail_id") ON DELETE SET NULL ON UPDATE CASCADE;
