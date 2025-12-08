-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN     "purchase_order_id" INTEGER;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approver_id" INTEGER;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id") ON DELETE SET NULL ON UPDATE CASCADE;
