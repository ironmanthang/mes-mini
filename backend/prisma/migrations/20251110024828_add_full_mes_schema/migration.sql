/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "employees" (
    "employee_id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "employee_roles" (
    "employee_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "employee_roles_pkey" PRIMARY KEY ("employee_id","role_id")
);

-- CreateTable
CREATE TABLE "agents" (
    "agent_id" SERIAL NOT NULL,
    "agent_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("agent_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "supplier_id" SERIAL NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" SERIAL NOT NULL,
    "customer_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "email" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "category_id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" SERIAL NOT NULL,
    "product_name" TEXT NOT NULL,
    "category_id" INTEGER,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "components" (
    "component_id" SERIAL NOT NULL,
    "component_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "components_pkey" PRIMARY KEY ("component_id")
);

-- CreateTable
CREATE TABLE "product_composition" (
    "product_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "quantity_needed" INTEGER NOT NULL,

    CONSTRAINT "product_composition_pkey" PRIMARY KEY ("product_id","component_id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "purchase_order_id" SERIAL NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("purchase_order_id")
);

-- CreateTable
CREATE TABLE "purchase_order_details" (
    "purchase_order_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "purchase_order_details_pkey" PRIMARY KEY ("purchase_order_id","component_id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "sales_order_id" SERIAL NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("sales_order_id")
);

-- CreateTable
CREATE TABLE "sales_order_details" (
    "sales_order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sale_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "sales_order_details_pkey" PRIMARY KEY ("sales_order_id","product_id")
);

-- CreateTable
CREATE TABLE "production_requests" (
    "production_request_id" SERIAL NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "production_requests_pkey" PRIMARY KEY ("production_request_id")
);

-- CreateTable
CREATE TABLE "production_lines" (
    "production_line_id" SERIAL NOT NULL,
    "line_name" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "production_lines_pkey" PRIMARY KEY ("production_line_id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "work_order_id" SERIAL NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "employee_id" INTEGER NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("work_order_id")
);

-- CreateTable
CREATE TABLE "work_order_fulfillments" (
    "work_order_id" INTEGER NOT NULL,
    "production_request_id" INTEGER NOT NULL,

    CONSTRAINT "work_order_fulfillments_pkey" PRIMARY KEY ("work_order_id","production_request_id")
);

-- CreateTable
CREATE TABLE "production_batches" (
    "production_batch_id" SERIAL NOT NULL,
    "batch_code" TEXT NOT NULL,
    "production_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "work_order_id" INTEGER NOT NULL,
    "production_line_id" INTEGER NOT NULL,

    CONSTRAINT "production_batches_pkey" PRIMARY KEY ("production_batch_id")
);

-- CreateTable
CREATE TABLE "product_instances" (
    "product_instance_id" SERIAL NOT NULL,
    "serial_number" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "unit_production_cost" DECIMAL(10,2),
    "product_id" INTEGER NOT NULL,
    "production_batch_id" INTEGER NOT NULL,

    CONSTRAINT "product_instances_pkey" PRIMARY KEY ("product_instance_id")
);

-- CreateTable
CREATE TABLE "warranties" (
    "warranty_id" SERIAL NOT NULL,
    "activation_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "product_instance_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,

    CONSTRAINT "warranties_pkey" PRIMARY KEY ("warranty_id")
);

-- CreateTable
CREATE TABLE "quality_checklists" (
    "checklist_id" SERIAL NOT NULL,
    "checklist_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "quality_checklists_pkey" PRIMARY KEY ("checklist_id")
);

-- CreateTable
CREATE TABLE "quality_checks" (
    "quality_check_id" SERIAL NOT NULL,
    "check_date" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "employee_id" INTEGER NOT NULL,
    "product_instance_id" INTEGER NOT NULL,
    "checklist_id" INTEGER NOT NULL,

    CONSTRAINT "quality_checks_pkey" PRIMARY KEY ("quality_check_id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "warehouse_id" SERIAL NOT NULL,
    "warehouse_name" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("warehouse_id")
);

-- CreateTable
CREATE TABLE "component_stock" (
    "warehouse_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "component_stock_pkey" PRIMARY KEY ("warehouse_id","component_id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "transaction_id" SERIAL NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "employee_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "component_id" INTEGER,
    "product_instance_id" INTEGER,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "cost_categories" (
    "cost_category_id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "cost_categories_pkey" PRIMARY KEY ("cost_category_id")
);

-- CreateTable
CREATE TABLE "production_costs" (
    "production_cost_id" SERIAL NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "work_order_id" INTEGER NOT NULL,
    "cost_category_id" INTEGER NOT NULL,

    CONSTRAINT "production_costs_pkey" PRIMARY KEY ("production_cost_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_username_key" ON "employees"("username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "agents_phone_number_key" ON "agents"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_phone_number_key" ON "suppliers"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_email_key" ON "suppliers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_number_key" ON "customers"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "production_batches_batch_code_key" ON "production_batches"("batch_code");

-- CreateIndex
CREATE UNIQUE INDEX "product_instances_serial_number_key" ON "product_instances"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "warranties_product_instance_id_key" ON "warranties"("product_instance_id");

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_composition" ADD CONSTRAINT "product_composition_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_composition" ADD CONSTRAINT "product_composition_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_details" ADD CONSTRAINT "purchase_order_details_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_details" ADD CONSTRAINT "purchase_order_details_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("agent_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_details" ADD CONSTRAINT "sales_order_details_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("sales_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_details" ADD CONSTRAINT "sales_order_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_requests" ADD CONSTRAINT "production_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_requests" ADD CONSTRAINT "production_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_fulfillments" ADD CONSTRAINT "work_order_fulfillments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_fulfillments" ADD CONSTRAINT "work_order_fulfillments_production_request_id_fkey" FOREIGN KEY ("production_request_id") REFERENCES "production_requests"("production_request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_production_line_id_fkey" FOREIGN KEY ("production_line_id") REFERENCES "production_lines"("production_line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_instances" ADD CONSTRAINT "product_instances_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_instances" ADD CONSTRAINT "product_instances_production_batch_id_fkey" FOREIGN KEY ("production_batch_id") REFERENCES "production_batches"("production_batch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_product_instance_id_fkey" FOREIGN KEY ("product_instance_id") REFERENCES "product_instances"("product_instance_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_product_instance_id_fkey" FOREIGN KEY ("product_instance_id") REFERENCES "product_instances"("product_instance_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "quality_checklists"("checklist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_stock" ADD CONSTRAINT "component_stock_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_stock" ADD CONSTRAINT "component_stock_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("component_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_product_instance_id_fkey" FOREIGN KEY ("product_instance_id") REFERENCES "product_instances"("product_instance_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_costs" ADD CONSTRAINT "production_costs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_costs" ADD CONSTRAINT "production_costs_cost_category_id_fkey" FOREIGN KEY ("cost_category_id") REFERENCES "cost_categories"("cost_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
