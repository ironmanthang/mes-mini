-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "target_error_warehouse_id" INTEGER,
ADD COLUMN     "target_sales_warehouse_id" INTEGER;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_target_sales_warehouse_id_fkey" FOREIGN KEY ("target_sales_warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_target_error_warehouse_id_fkey" FOREIGN KEY ("target_error_warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;
