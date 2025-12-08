-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ALTER COLUMN "shipping_cost" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "tax" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(15,2);

-- CreateTable
CREATE TABLE "supplier_components" (
    "supplier_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_components_pkey" PRIMARY KEY ("supplier_id","component_id")
);

-- AddForeignKey
ALTER TABLE "supplier_components" ADD CONSTRAINT "supplier_components_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_components" ADD CONSTRAINT "supplier_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE CASCADE ON UPDATE CASCADE;
