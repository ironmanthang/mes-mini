/*
  Warnings:

  - The values [PARTIALLY_FULFILLED] on the enum `ProductionRequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `request_date` on the `production_requests` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PR_UNBLOCKED';

-- AlterEnum
BEGIN;
CREATE TYPE "ProductionRequestStatus_new" AS ENUM ('DRAFT', 'PENDING', 'WAITING_MATERIAL', 'APPROVED', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED');
ALTER TABLE "production_requests" ALTER COLUMN "status" TYPE "ProductionRequestStatus_new" USING ("status"::text::"ProductionRequestStatus_new");
ALTER TYPE "ProductionRequestStatus" RENAME TO "ProductionRequestStatus_old";
ALTER TYPE "ProductionRequestStatus_new" RENAME TO "ProductionRequestStatus";
DROP TYPE "public"."ProductionRequestStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "production_requests" DROP COLUMN "request_date",
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approver_id" INTEGER;

-- AddForeignKey
ALTER TABLE "production_requests" ADD CONSTRAINT "production_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;
