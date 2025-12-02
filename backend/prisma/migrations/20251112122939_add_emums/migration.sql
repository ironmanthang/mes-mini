/*
  Warnings:

  - The `status` column on the `product_instances` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `production_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `purchase_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `sales_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `work_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updated_at` to the `agents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `component_stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `components` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `cost_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `transaction_type` on the `inventory_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `product_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `product_instances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `production_batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `production_lines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `production_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `quality_checklists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `quality_checks` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `result` on the `quality_checks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `sales_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `suppliers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `warehouses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `warranties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `work_orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('REQUESTED', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProductInstanceStatus" AS ENUM ('IN_STOCK', 'SOLD', 'IN_REPAIR', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "QualityCheckResult" AS ENUM ('PASSED', 'FAILED', 'NEEDS_REWORK');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('RECEIPT', 'SHIPMENT', 'TRANSFER', 'ADJUSTMENT', 'CONSUMPTION', 'RETURN');

-- DropForeignKey
ALTER TABLE "employee_roles" DROP CONSTRAINT "employee_roles_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_roles" DROP CONSTRAINT "employee_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "product_composition" DROP CONSTRAINT "product_composition_component_id_fkey";

-- DropForeignKey
ALTER TABLE "product_composition" DROP CONSTRAINT "product_composition_product_id_fkey";

-- DropForeignKey
ALTER TABLE "production_costs" DROP CONSTRAINT "production_costs_work_order_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_details" DROP CONSTRAINT "purchase_order_details_purchase_order_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_details" DROP CONSTRAINT "sales_order_details_sales_order_id_fkey";

-- DropForeignKey
ALTER TABLE "work_order_fulfillments" DROP CONSTRAINT "work_order_fulfillments_production_request_id_fkey";

-- DropForeignKey
ALTER TABLE "work_order_fulfillments" DROP CONSTRAINT "work_order_fulfillments_work_order_id_fkey";

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "component_stock" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "components" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "cost_categories" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "inventory_transactions" ALTER COLUMN "transaction_date" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "transaction_type",
ADD COLUMN     "transaction_type" "InventoryTransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "product_categories" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "product_instances" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ProductInstanceStatus" NOT NULL DEFAULT 'IN_STOCK';

-- AlterTable
ALTER TABLE "production_batches" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "production_costs" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "production_lines" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "production_requests" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "request_date" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "ProductionStatus" NOT NULL DEFAULT 'REQUESTED';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "order_date" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "quality_checklists" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "quality_checks" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "check_date" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "result",
ADD COLUMN     "result" "QualityCheckResult" NOT NULL;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "order_date" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "warranties" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "create_date" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "ProductionStatus" NOT NULL DEFAULT 'REQUESTED';

-- CreateIndex
CREATE INDEX "agents_agent_name_idx" ON "agents"("agent_name");

-- CreateIndex
CREATE INDEX "components_component_name_idx" ON "components"("component_name");

-- CreateIndex
CREATE INDEX "customers_customer_name_idx" ON "customers"("customer_name");

-- CreateIndex
CREATE INDEX "inventory_transactions_transaction_type_idx" ON "inventory_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "inventory_transactions_transaction_date_idx" ON "inventory_transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "products_product_name_idx" ON "products"("product_name");

-- CreateIndex
CREATE INDEX "suppliers_supplier_name_idx" ON "suppliers"("supplier_name");

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_composition" ADD CONSTRAINT "product_composition_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_composition" ADD CONSTRAINT "product_composition_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_details" ADD CONSTRAINT "purchase_order_details_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_details" ADD CONSTRAINT "sales_order_details_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("sales_order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_fulfillments" ADD CONSTRAINT "work_order_fulfillments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_fulfillments" ADD CONSTRAINT "work_order_fulfillments_production_request_id_fkey" FOREIGN KEY ("production_request_id") REFERENCES "production_requests"("production_request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_costs" ADD CONSTRAINT "production_costs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE CASCADE ON UPDATE CASCADE;
