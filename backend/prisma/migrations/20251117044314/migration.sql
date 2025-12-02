/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone_number]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hire_date` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone_number` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "hire_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "phone_number" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_phone_number_key" ON "employees"("phone_number");
