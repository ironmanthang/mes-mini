-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "termination_date" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");
