import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../../../src/common/lib/prisma.js';
import { PERM } from '../../../src/common/constants/permissions.js';
import { EmployeeStatus, PurchaseOrderStatus, SalesOrderStatus, ProductionRequestStatus, Priority, WarehouseType, InventoryTransactionType, ProductInstanceStatus, MaterialRequestStatus, InspectionType } from '../../../src/generated/prisma/index.js';

const DEFAULT_PASSWORD = '123456';

import { injectComponentStock } from "./helpers.js";

export async function seedMaterialRequests(): Promise<void> {
    console.log('...Seeding Material Requests (Rule: WOs must have MRs)');
    
    const workOrders = await prisma.workOrder.findMany({
        where: { status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
        include: { product: { include: { bom: true } } }
    });

    const whMain = await prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' } });
    const admin = await prisma.employee.findFirst({ where: { username: 'admin' } });

    for (const wo of workOrders) {
        // Create MR if not exists
        const mrStatus = wo.status === 'COMPLETED' ? MaterialRequestStatus.ISSUED : MaterialRequestStatus.PENDING;
        
        const mr = await prisma.materialRequest.upsert({
            where: { workOrderId: wo.workOrderId },
            update: { status: mrStatus },
            create: {
                code: `MR-${wo.code}`,
                workOrderId: wo.workOrderId,
                status: mrStatus,
                requestDate: new Date(),
                note: `Auto-seeded for ${wo.code}`
            }
        });

        // Create Details
        for (const b of wo.product.bom) {
            const qty = b.quantityNeeded * wo.quantity;
            await prisma.materialRequestDetail.upsert({
                where: { detailId: -1 }, // Dummy check
                update: {},
                create: {
                    requestId: mr.requestId,
                    componentId: b.componentId,
                    quantity: qty
                }
            });

            // If ISSUED, create audit transaction
            if (mrStatus === MaterialRequestStatus.ISSUED && whMain && admin) {
                await prisma.inventoryTransaction.create({
                    data: {
                        transactionDate: new Date(),
                        quantity: qty,
                        note: `Issued for ${wo.code}`,
                        employeeId: admin.employeeId,
                        warehouseId: whMain.warehouseId,
                        componentId: b.componentId,
                        transactionType: InventoryTransactionType.EXPORT_PRODUCTION,
                        materialReqId: mr.requestId
                    }
                });
            }
        }
    }
    console.log(`   ✓ ${workOrders.length} material requests generated`);
}

export async function seedProductInstances(): Promise<void> {
    console.log('...Seeding Product Instances (Mock Inventory)');

    // Find our Laptop
    const laptop = await prisma.product.findFirst({ where: { code: 'PROD-LAPTOP-X1' } });
    if (!laptop) return;

    // We must link instances to a Production Batch (Traceability)
    const admin = await prisma.employee.findFirst();
    const fgWarehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-FG' } });
    const defectWarehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-DEFECT' } });
    const line = await prisma.productionLine.findFirst();

    // Create a dummy PR for genealogy (MTS)
    const pr = await prisma.productionRequest.upsert({
        where: { code: 'PR-OPENING-STOCK-LAPTOP' },
        update: {},
        create: {
            code: 'PR-OPENING-STOCK-LAPTOP',
            productId: laptop.productId,
            quantity: 50,
            status: ProductionRequestStatus.FULFILLED,
            priority: Priority.MEDIUM,
            employeeId: admin?.employeeId || 1,
            note: 'Opening Stock PR'
        }
    });

    // Create Dummy Work Order (Required parent for Batch)
    const workOrder = await prisma.workOrder.upsert({
        where: { code: 'WO-OPENING-STOCK' },
        update: {},
        create: {
            code: 'WO-OPENING-STOCK',
            quantity: 50,
            employeeId: admin?.employeeId || 1,
            productId: laptop.productId,
            status: 'COMPLETED',
            productionLineId: line?.productionLineId,
            targetSalesWarehouseId: fgWarehouse?.warehouseId,
            targetErrorWarehouseId: defectWarehouse?.warehouseId,
            laborCost: 50000,
            overheadCost: 20000
        }
    });

    // Link WO to PR
    await prisma.workOrderFulfillment.upsert({
        where: { workOrderId_productionRequestId: { workOrderId: workOrder.workOrderId, productionRequestId: pr.productionRequestId } },
        update: {},
        create: { workOrderId: workOrder.workOrderId, productionRequestId: pr.productionRequestId, quantity: 50 }
    });

    // Create Dummy Production Batch
    const prodBatch = await prisma.productionBatch.create({
        data: {
            batchCode: 'BATCH-OPENING-' + Date.now(),
            productionDate: new Date(),
            workOrderId: workOrder.workOrderId
        }
    });

    // Create 50 Units in Stock
    console.log('   Creating 50 Laptops in Stock...');
    const instancesData = [];
    for (let i = 1; i <= 50; i++) {
        instancesData.push({
            productId: laptop.productId,
            serialNumber: `SN-${new Date().getFullYear()}-LAPTOP-${i.toString().padStart(4, '0')}`,
            status: ProductInstanceStatus.IN_STOCK_SALES,
            unitProductionCost: 1500000, // Mock cost
            productionBatchId: prodBatch.productionBatchId, // REQUIRED LINK
            warehouseId: fgWarehouse?.warehouseId // FIXED: added warehouse
        });
    }

    await prisma.productInstance.createMany({
        data: instancesData,
        skipDuplicates: true
    });
}

export async function seedDemoAgents(): Promise<void> {
    console.log('...Seeding Demo Agents');
    const agents = [
        { code: 'AGT-002', name: 'Beta Electronics', email: 'beta@electronics.vn', phone: '0912345679', address: 'Ho Chi Minh City, VN' },
        { code: 'AGT-003', name: 'Gamma Distribution', email: 'gamma@dist.vn', phone: '0912345680', address: 'Da Nang, VN' },
        { code: 'AGT-004', name: 'Delta Tech Solutions', email: 'delta@tech.vn', phone: '0912345681', address: 'Hai Phong, VN' },
        { code: 'AGT-005', name: 'Epsilon Trading Co.', email: 'epsilon@trading.vn', phone: '0912345682', address: 'Can Tho, VN' },
        { code: 'AGT-006', name: 'Zeta Systems JSC', email: 'zeta@systems.vn', phone: '0912345683', address: 'Binh Duong, VN' },
    ];
    for (const a of agents) {
        await prisma.agent.upsert({
            where: { code: a.code },
            update: {},
            create: { code: a.code, agentName: a.name, email: a.email, phoneNumber: a.phone, address: a.address }
        });
    }
    console.log(`   ✓ ${agents.length} demo agents created`);
}

export async function seedDemoSuppliers(): Promise<void> {
    console.log('...Seeding Demo Suppliers');
    const suppliers = [
        { code: 'SUP-INTEL', name: 'Intel Vietnam', email: 'b2b@intel.vn', phone: '0904444444', address: 'SHTP, Ho Chi Minh City' },
        { code: 'SUP-FOXCONN', name: 'Foxconn Assembly', email: 'orders@foxconn.vn', phone: '0905555555', address: 'Bac Ninh Industrial Zone' },
        { code: 'SUP-KINGSTON', name: 'Kingston Memory', email: 'sales@kingston.vn', phone: '0906666666', address: 'Binh Duong, VN' },
        { code: 'SUP-CORSAIR', name: 'Corsair Components', email: 'parts@corsair.vn', phone: '0907777777', address: 'Long An, VN' },
    ];
    for (const s of suppliers) {
        await prisma.supplier.upsert({
            where: { code: s.code },
            update: {},
            create: { code: s.code, supplierName: s.name, email: s.email, phoneNumber: s.phone, address: s.address }
        });
    }
    console.log(`   ✓ ${suppliers.length} demo suppliers created`);
}

export async function seedDemoComponents(): Promise<void> {
    console.log('...Seeding Demo Components');
    const components = [
        { code: 'COM-DISPLAY-15', name: 'Display Panel 15.6"', unit: 'pcs', cost: 3500000, stock: 50 },
        { code: 'COM-SSD-512', name: 'SSD 512GB NVMe', unit: 'pcs', cost: 1800000, stock: 80 },
        { code: 'COM-WIFI-AX', name: 'WiFi AX Module', unit: 'pcs', cost: 250000, stock: 200 },
        { code: 'COM-CASE-ALLOY', name: 'Aluminum Case Body', unit: 'pcs', cost: 800000, stock: 100 },
        { code: 'COM-KB-MECH', name: 'Mechanical Keyboard Unit', unit: 'pcs', cost: 650000, stock: 60 },
        { code: 'COM-FAN-120', name: 'Cooling Fan 120mm', unit: 'pcs', cost: 150000, stock: 150 },
    ];
    for (const c of components) {
        await prisma.component.upsert({
            where: { code: c.code },
            update: {},
            create: { code: c.code, componentName: c.name, unit: c.unit, standardCost: c.cost, minStockLevel: c.stock }
        });
    }
    console.log(`   ✓ ${components.length} demo components created`);
}

export async function seedDemoProducts(): Promise<void> {
    console.log('...Seeding Demo Products + BOM');

    // --- Tablet A1 ---
    const elecChecklist = await prisma.qualityChecklist.findFirst({ where: { checklistName: 'Standard Electronics QC' } });
    const tablet = await prisma.product.upsert({
        where: { code: 'PROD-TABLET-A1' },
        update: {},
        create: { code: 'PROD-TABLET-A1', productName: 'Tablet A1', unit: 'pcs', minStockLevel: 15, checklistId: elecChecklist?.checklistId }
    });
    const screenOled = await prisma.component.findUnique({ where: { code: 'COM-SCREEN-OLED' } });
    const battery500 = await prisma.component.findUnique({ where: { code: 'COM-BATTERY-500' } });
    const wifiAx = await prisma.component.findUnique({ where: { code: 'COM-WIFI-AX' } });
    if (screenOled) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: tablet.productId, componentId: screenOled.componentId } }, update: { quantityNeeded: 1 }, create: { productId: tablet.productId, componentId: screenOled.componentId, quantityNeeded: 1 } });
    if (battery500) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: tablet.productId, componentId: battery500.componentId } }, update: { quantityNeeded: 1 }, create: { productId: tablet.productId, componentId: battery500.componentId, quantityNeeded: 1 } });
    if (wifiAx) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: tablet.productId, componentId: wifiAx.componentId } }, update: { quantityNeeded: 1 }, create: { productId: tablet.productId, componentId: wifiAx.componentId, quantityNeeded: 1 } });

    // --- Desktop Z5 ---
    const desktop = await prisma.product.upsert({
        where: { code: 'PROD-DESKTOP-Z5' },
        update: {},
        create: { code: 'PROD-DESKTOP-Z5', productName: 'Desktop Z5 Workstation', unit: 'pcs', minStockLevel: 10, checklistId: elecChecklist?.checklistId }
    });
    const cpuUltra = await prisma.component.findUnique({ where: { code: 'COM-CPU-ULTRA' } });
    const ram32 = await prisma.component.findUnique({ where: { code: 'COM-RAM-32GB' } });
    const ssd512 = await prisma.component.findUnique({ where: { code: 'COM-SSD-512' } });
    const psu850 = await prisma.component.findUnique({ where: { code: 'COM-PSU-850W' } });
    if (cpuUltra) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: desktop.productId, componentId: cpuUltra.componentId } }, update: { quantityNeeded: 1 }, create: { productId: desktop.productId, componentId: cpuUltra.componentId, quantityNeeded: 1 } });
    if (ram32) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: desktop.productId, componentId: ram32.componentId } }, update: { quantityNeeded: 2 }, create: { productId: desktop.productId, componentId: ram32.componentId, quantityNeeded: 2 } });
    if (ssd512) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: desktop.productId, componentId: ssd512.componentId } }, update: { quantityNeeded: 1 }, create: { productId: desktop.productId, componentId: ssd512.componentId, quantityNeeded: 1 } });
    if (psu850) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: desktop.productId, componentId: psu850.componentId } }, update: { quantityNeeded: 1 }, create: { productId: desktop.productId, componentId: psu850.componentId, quantityNeeded: 1 } });

    // --- Monitor M1 ---
    const monitor = await prisma.product.upsert({
        where: { code: 'PROD-MONITOR-M1' },
        update: {},
        create: { code: 'PROD-MONITOR-M1', productName: 'Monitor M1 Pro', unit: 'pcs', minStockLevel: 25, checklistId: elecChecklist?.checklistId }
    });
    const display15 = await prisma.component.findUnique({ where: { code: 'COM-DISPLAY-15' } });
    const caseAlloy = await prisma.component.findUnique({ where: { code: 'COM-CASE-ALLOY' } });
    if (display15) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: monitor.productId, componentId: display15.componentId } }, update: { quantityNeeded: 1 }, create: { productId: monitor.productId, componentId: display15.componentId, quantityNeeded: 1 } });
    if (caseAlloy) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: monitor.productId, componentId: caseAlloy.componentId } }, update: { quantityNeeded: 1 }, create: { productId: monitor.productId, componentId: caseAlloy.componentId, quantityNeeded: 1 } });

    console.log('   ✓ 3 demo products + BOM created');
}

export async function seedDemoSupplierComponents(): Promise<void> {
    console.log('...Seeding Demo Supplier-Component Links');

    const links: { supplierCode: string; componentCode: string }[] = [
        { supplierCode: 'SUP-INTEL', componentCode: 'COM-CPU-ULTRA' },
        { supplierCode: 'SUP-INTEL', componentCode: 'COM-CHIP-X1' },
        { supplierCode: 'SUP-FOXCONN', componentCode: 'COM-SCREW-M5' },
        { supplierCode: 'SUP-FOXCONN', componentCode: 'COM-SCREEN-OLED' },
        { supplierCode: 'SUP-FOXCONN', componentCode: 'COM-DISPLAY-15' },
        { supplierCode: 'SUP-FOXCONN', componentCode: 'COM-CASE-ALLOY' },
        { supplierCode: 'SUP-KINGSTON', componentCode: 'COM-RAM-32GB' },
        { supplierCode: 'SUP-KINGSTON', componentCode: 'COM-BATTERY-500' },
        { supplierCode: 'SUP-KINGSTON', componentCode: 'COM-SSD-512' },
        { supplierCode: 'SUP-CORSAIR', componentCode: 'COM-PSU-850W' },
        { supplierCode: 'SUP-CORSAIR', componentCode: 'COM-FAN-120' },
    ];

    for (const link of links) {
        const supplier = await prisma.supplier.findUnique({ where: { code: link.supplierCode } });
        const component = await prisma.component.findUnique({ where: { code: link.componentCode } });
        if (supplier && component) {
            await prisma.supplierComponent.upsert({
                where: { supplierId_componentId: { supplierId: supplier.supplierId, componentId: component.componentId } },
                update: {},
                create: { supplierId: supplier.supplierId, componentId: component.componentId }
            });
        }
    }
    console.log(`   ✓ ${links.length} supplier-component links created`);
}

export async function seedDemoComponentStock(): Promise<void> {
    console.log('...Seeding Demo Component Stock');
    const warehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' } });
    if (!warehouse) return;

    const stockEntries: { componentCode: string; qty: number }[] = [
        { componentCode: 'COM-DISPLAY-15', qty: 50 },
        { componentCode: 'COM-SSD-512', qty: 80 },
        { componentCode: 'COM-WIFI-AX', qty: 200 },
        { componentCode: 'COM-CASE-ALLOY', qty: 100 },
        { componentCode: 'COM-KB-MECH', qty: 60 },
        { componentCode: 'COM-FAN-120', qty: 150 },
        // Also ensure existing gaming PC components have consistent stock
        { componentCode: 'COM-CHIP-X1', qty: 300 },
        { componentCode: 'COM-SCREW-M5', qty: 5000 },
    ];

    for (const entry of stockEntries) {
        const comp = await prisma.component.findUnique({ where: { code: entry.componentCode } });
        if (comp) {
            await injectComponentStock(comp.componentId, warehouse.warehouseId, entry.qty, `LOT-DEMO-${entry.componentCode}`);
        }
    }
    console.log('   ✓ Demo component stock seeded');
}

export async function seedDemoProductInstances(): Promise<void> {
    console.log('...Seeding Demo Product Instances');

    const admin = await prisma.employee.findFirst();
    if (!admin) return;

    // Helper: create instances for a product via a dummy work order + batch
    async function createInstances(productCode: string, count: number, prefix: string, warehouseId: number) {
        const product = await prisma.product.findUnique({ where: { code: productCode } });
        if (!product) return;

        const defectWarehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-DEFECT' } });
        const line = await prisma.productionLine.findFirst();

        // Create PR for traceability
        const pr = await prisma.productionRequest.upsert({
            where: { code: `PR-DEMO-${prefix}` },
            update: {},
            create: {
                code: `PR-DEMO-${prefix}`,
                productId: product.productId,
                quantity: count,
                status: ProductionRequestStatus.FULFILLED,
                priority: Priority.LOW,
                employeeId: admin!.employeeId,
                note: `Demo Opening Stock for ${productCode}`
            }
        });

        const woCode = `WO-DEMO-${prefix}`;
        const wo = await prisma.workOrder.upsert({
            where: { code: woCode },
            update: {},
            create: { 
                code: woCode, 
                quantity: count, 
                employeeId: admin!.employeeId, 
                productId: product.productId, 
                productionLineId: line?.productionLineId,
                targetSalesWarehouseId: warehouseId,
                targetErrorWarehouseId: defectWarehouse?.warehouseId,
                laborCost: count * 1000,
                overheadCost: count * 500
            }
        });

        // Link WO to PR
        await prisma.workOrderFulfillment.upsert({
            where: { workOrderId_productionRequestId: { workOrderId: wo.workOrderId, productionRequestId: pr.productionRequestId } },
            update: {},
            create: { workOrderId: wo.workOrderId, productionRequestId: pr.productionRequestId, quantity: count }
        });

        const batchCode = `BATCH-DEMO-${prefix}`;
        let batch = await prisma.productionBatch.findFirst({ where: { batchCode } });
        if (!batch) {
            batch = await prisma.productionBatch.create({
                data: { batchCode, productionDate: new Date(), workOrderId: wo.workOrderId }
            });
        }

        const instances = [];
        for (let i = 1; i <= count; i++) {
            instances.push({
                productId: product.productId,
                serialNumber: `SN-DEMO-${prefix}-${i.toString().padStart(4, '0')}`,
                status: ProductInstanceStatus.IN_STOCK_SALES,
                unitProductionCost: 1200000,
                productionBatchId: batch.productionBatchId,
                warehouseId: warehouseId
            });
        }
        await prisma.productInstance.createMany({ data: instances, skipDuplicates: true });
    }

    const salesWarehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-FG' } });
    if (!salesWarehouse) {
        console.warn('   ⚠️ Missing sales warehouse (WH-FG) - instances will have no warehouse');
        return;
    }

    await createInstances('PROD-GAMING-PC', 10, 'GPC', salesWarehouse.warehouseId);
    await createInstances('PROD-SMARTWATCH', 30, 'SW', salesWarehouse.warehouseId);
    await createInstances('PROD-TABLET-A1', 25, 'TAB', salesWarehouse.warehouseId);
    await createInstances('PROD-DESKTOP-Z5', 15, 'DSK', salesWarehouse.warehouseId);
    await createInstances('PROD-MONITOR-M1', 20, 'MON', salesWarehouse.warehouseId);

    console.log('   ✓ Demo product instances created');
}

export async function seedDemoPurchaseOrders(): Promise<void> {
    console.log('...Seeding Demo Purchase Orders');

    const purchaser = await prisma.employee.findFirst({ where: { username: 'purchaser' } });
    const manager = await prisma.employee.findFirst({ where: { username: 'manager' } });
    if (!purchaser || !manager) { console.warn('   ⚠️ Missing purchaser or manager employee'); return; }

    // Helper to find IDs by code
    const sup = async (code: string) => (await prisma.supplier.findUnique({ where: { code } }))!;
    const comp = async (code: string) => (await prisma.component.findUnique({ where: { code } }))!;

    interface POSeed {
        code: string; supplierCode: string; status: PurchaseOrderStatus; priority: Priority;
        approved: boolean; items: { componentCode: string; qty: number; price: number; received: number; linkedPrCode?: string }[];
    }

    const poSeeds: POSeed[] = [
        { code: 'PO-2026-901', supplierCode: 'SUP-HP', status: PurchaseOrderStatus.COMPLETED, priority: Priority.HIGH, approved: true,
            items: [{ componentCode: 'COM-STEEL-5MM', qty: 100, price: 45000, received: 100 }, { componentCode: 'COM-STEEL-10MM', qty: 50, price: 85000, received: 50 }] },
        { code: 'PO-2026-902', supplierCode: 'SUP-SS', status: PurchaseOrderStatus.COMPLETED, priority: Priority.MEDIUM, approved: true,
            items: [{ componentCode: 'COM-CHIP-X1', qty: 200, price: 120000, received: 200 }] },
        { code: 'PO-2026-903', supplierCode: 'SUP-INTEL', status: PurchaseOrderStatus.ORDERED, priority: Priority.HIGH, approved: true,
            items: [{ componentCode: 'COM-CPU-ULTRA', qty: 50, price: 10000000, received: 0, linkedPrCode: 'PR-20260310-0001' }] },
        { code: 'PO-2026-904', supplierCode: 'SUP-KINGSTON', status: PurchaseOrderStatus.RECEIVING, priority: Priority.MEDIUM, approved: true,
            items: [{ componentCode: 'COM-RAM-32GB', qty: 100, price: 2000000, received: 40 }] },
        { code: 'PO-2026-905', supplierCode: 'SUP-CORSAIR', status: PurchaseOrderStatus.PENDING, priority: Priority.LOW, approved: false,
            items: [{ componentCode: 'COM-PSU-850W', qty: 30, price: 3000000, received: 0 }] },
        { code: 'D-PO-260310-906', supplierCode: 'SUP-FOXCONN', status: PurchaseOrderStatus.DRAFT, priority: Priority.MEDIUM, approved: false,
            items: [{ componentCode: 'COM-SCREW-M5', qty: 5000, price: 500, received: 0 }] },
        { code: 'PO-2026-907', supplierCode: 'SUP-INTEL', status: PurchaseOrderStatus.CANCELLED, priority: Priority.LOW, approved: false,
            items: [{ componentCode: 'COM-CPU-ULTRA', qty: 10, price: 10000000, received: 0 }] },
        { code: 'PO-2026-908', supplierCode: 'SUP-KINGSTON', status: PurchaseOrderStatus.ORDERED, priority: Priority.HIGH, approved: true,
            items: [{ componentCode: 'COM-RAM-32GB', qty: 200, price: 2000000, received: 0 }, { componentCode: 'COM-BATTERY-500', qty: 100, price: 50000, received: 0 }] },
        { code: 'D-PO-260310-909', supplierCode: 'SUP-HP', status: PurchaseOrderStatus.DRAFT, priority: Priority.MEDIUM, approved: false,
            items: [{ componentCode: 'COM-STEEL-5MM', qty: 200, price: 45000, received: 0 }] },
        { code: 'PO-2026-910', supplierCode: 'SUP-FOXCONN', status: PurchaseOrderStatus.PENDING, priority: Priority.HIGH, approved: false,
            items: [{ componentCode: 'COM-SCREEN-OLED', qty: 300, price: 200000, received: 0 }] },
        { code: 'PO-2026-911', supplierCode: 'SUP-CORSAIR', status: PurchaseOrderStatus.COMPLETED, priority: Priority.MEDIUM, approved: true,
            items: [{ componentCode: 'COM-PSU-850W', qty: 50, price: 3000000, received: 50 }] },
        { code: 'PO-2026-912', supplierCode: 'SUP-SS', status: PurchaseOrderStatus.ORDERED, priority: Priority.LOW, approved: true,
            items: [{ componentCode: 'COM-CHIP-X1', qty: 500, price: 120000, received: 0 }] },
    ];

    const mainWh = await prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' } });

    for (const po of poSeeds) {
        const supplier = await sup(po.supplierCode);
        if (!supplier) continue;

        // Calculate total
        let subtotal = 0;
        const detailsData = [];
        for (const item of po.items) {
            const component = await comp(item.componentCode);
            if (!component) continue;
            subtotal += item.qty * item.price;
            
            let prId = null;
            if (item.linkedPrCode) {
                const linkedPr = await prisma.productionRequest.findUnique({ where: { code: item.linkedPrCode } });
                prId = linkedPr?.productionRequestId || null;
            }

            detailsData.push({
                componentId: component.componentId,
                quantityOrdered: item.qty,
                unitPrice: item.price,
                quantityReceived: item.received,
                productionRequestId: prId
            });
        }

        const createdPo = await prisma.purchaseOrder.upsert({
            where: { code: po.code },
            update: {},
            create: {
                code: po.code,
                supplierId: supplier.supplierId,
                employeeId: purchaser.employeeId,
                status: po.status,
                priority: po.priority,
                orderDate: new Date(2026, 2, Math.floor(Math.random() * 10) + 1), // March 1-10
                expectedDeliveryDate: new Date(2026, 2, 20),
                totalAmount: subtotal,
                warehouseId: mainWh.warehouseId,
                shippingCost: 0, 
                taxRate: 0,
                approverId: po.approved ? manager.employeeId : null,
                approvedAt: po.approved ? new Date() : null,
                details: { create: detailsData },
            },
            include: { details: true }
        });

        // Seed ComponentLot & Transaction if received > 0
        if (mainWh) {
            for (const detail of createdPo.details) {
                if (detail.quantityReceived > 0) {
                    // We only create stock if this PO doesn't already have one (to prevent duplicates on re-seed without reset)
                    const existingLot = await prisma.componentLot.findFirst({ where: { poDetailId: detail.poDetailId } });
                    if (!existingLot) {
                        try {
                            const transaction = await prisma.inventoryTransaction.create({
                                data: {
                                    transactionDate: createdPo.orderDate,
                                    quantity: detail.quantityReceived,
                                    note: `Initial seed receipt for ${createdPo.code}`,
                                    employeeId: purchaser.employeeId,
                                    warehouseId: mainWh.warehouseId,
                                    componentId: detail.componentId,
                                    transactionType: InventoryTransactionType.IMPORT_PO,
                                    purchaseOrderId: createdPo.purchaseOrderId
                                }
                            });

                            await prisma.componentLot.create({
                                data: {
                                    lotCode: `LOT-260310-${detail.poDetailId.toString().padStart(3, '0')}`,
                                    componentId: detail.componentId,
                                    poDetailId: detail.poDetailId,
                                    warehouseId: mainWh.warehouseId,
                                    initialQuantity: detail.quantityReceived,
                                    currentQuantity: detail.quantityReceived
                                }
                            });
                        } catch (e: any) {
                          console.warn(`Could not seed lot for ${detail.poDetailId}:`, e.message);
                        }
                    }
                }
            }
        }
    }
    console.log(`   ✓ ${poSeeds.length} demo purchase orders created`);
}

export async function seedDemoSalesOrders(): Promise<void> {
    console.log('...Seeding Demo Sales Orders');

    const sales = await prisma.employee.findFirst({ where: { username: 'sales' } });
    const manager = await prisma.employee.findFirst({ where: { username: 'manager' } });
    if (!sales || !manager) { console.warn('   ⚠️ Missing sales or manager employee'); return; }

    const agt = async (code: string) => (await prisma.agent.findUnique({ where: { code } }))!;
    const prod = async (code: string) => (await prisma.product.findUnique({ where: { code } }))!;

    interface SOSeed {
        code: string; agentCode: string; status: SalesOrderStatus; priority: Priority;
        approved: boolean; note?: string;
        items: { productCode: string; qty: number; price: number; shipped: number }[];
    }

    const soSeeds: SOSeed[] = [
        { code: 'SO-2026-901', agentCode: 'AGT-002', status: SalesOrderStatus.APPROVED, priority: Priority.MEDIUM, approved: false,
            items: [{ productCode: 'PROD-LAPTOP-X1', qty: 5, price: 15000000, shipped: 0 }] },
        { code: 'SO-2026-902', agentCode: 'AGT-003', status: SalesOrderStatus.PENDING, priority: Priority.HIGH, approved: false,
            items: [{ productCode: 'PROD-LAPTOP-X1', qty: 10, price: 14500000, shipped: 0 }] },
        { code: 'SO-2026-903', agentCode: 'AGT-004', status: SalesOrderStatus.APPROVED, priority: Priority.HIGH, approved: true,
            items: [{ productCode: 'PROD-LAPTOP-X1', qty: 3, price: 15000000, shipped: 0 }] },
        { code: 'SO-2026-904', agentCode: 'AGT-005', status: SalesOrderStatus.PARTIALLY_SHIPPED, priority: Priority.MEDIUM, approved: true, // FIXED: PARTIALLY_SHIPPED
            items: [{ productCode: 'PROD-LAPTOP-X1', qty: 8, price: 14000000, shipped: 3 }] },
        { code: 'SO-2026-905', agentCode: 'AGT-002', status: SalesOrderStatus.SHIPPED, priority: Priority.LOW, approved: true,
            items: [{ productCode: 'PROD-GAMING-PC', qty: 2, price: 25000000, shipped: 2 }] },
        { code: 'SO-2026-906', agentCode: 'AGT-006', status: SalesOrderStatus.CANCELLED, priority: Priority.MEDIUM, approved: false,
            note: '[CANCELLED 2026-03-05 by User 6]: Customer withdrew the order.',
            items: [{ productCode: 'PROD-SMARTWATCH', qty: 15, price: 5000000, shipped: 0 }] },
        { code: 'SO-2026-907', agentCode: 'AGT-003', status: SalesOrderStatus.DRAFT, priority: Priority.LOW, approved: false,
            items: [{ productCode: 'PROD-TABLET-A1', qty: 20, price: 8000000, shipped: 0 }] },
        { code: 'SO-2026-908', agentCode: 'AGT-004', status: SalesOrderStatus.APPROVED, priority: Priority.HIGH, approved: true,
            items: [{ productCode: 'PROD-DESKTOP-Z5', qty: 5, price: 35000000, shipped: 0 }] },
        { code: 'SO-2026-909', agentCode: 'AGT-005', status: SalesOrderStatus.PENDING, priority: Priority.MEDIUM, approved: false,
            items: [{ productCode: 'PROD-MONITOR-M1', qty: 10, price: 12000000, shipped: 0 }, { productCode: 'PROD-LAPTOP-X1', qty: 2, price: 15000000, shipped: 0 }] },
        { code: 'SO-2026-910', agentCode: 'AGT-006', status: SalesOrderStatus.IN_PROGRESS, priority: Priority.HIGH, approved: true, // NEW: IN_PROGRESS with 0 shipped
            items: [{ productCode: 'PROD-SMARTWATCH', qty: 5, price: 5000000, shipped: 0 }] },
    ];

    for (const so of soSeeds) {
        const agent = await agt(so.agentCode);
        if (!agent) continue;

        // Calculate total
        let subtotal = 0;
        const detailsData = [];
        for (const item of so.items) {
            const product = await prod(item.productCode);
            if (!product) continue;
            subtotal += item.qty * item.price;
            detailsData.push({
                productId: product.productId,
                quantity: item.qty,
                salePrice: item.price,
                quantityShipped: item.shipped,
            });
        }

        const createdSo = await prisma.salesOrder.upsert({
            where: { code: so.code },
            update: {},
            create: {
                code: so.code,
                agentId: agent.agentId,
                employeeId: sales.employeeId,
                status: so.status,
                priority: so.priority,
                orderDate: new Date(2026, 2, Math.floor(Math.random() * 10) + 1),
                expectedShipDate: new Date(2026, 2, 25),
                totalAmount: subtotal,
                discount: 0, agentShippingPrice: 0, tax: 0,
                approverId: so.approved ? manager.employeeId : null,
                approvedAt: so.approved ? new Date() : null,
                note: so.note || null,
                details: { create: detailsData },
            },
            include: { details: true }
        });

        // FIXED: Phantom Shipments - Create actual SHIPPED instances linked to SO
        for (const detail of createdSo.details) {
            if (detail.quantityShipped > 0) {
                // Find some available IN_STOCK_SALES items for this product
                const availableInstances = await prisma.productInstance.findMany({
                    where: { productId: detail.productId, status: ProductInstanceStatus.IN_STOCK_SALES },
                    take: detail.quantityShipped
                });

                if (availableInstances.length > 0) {
                    await prisma.productInstance.updateMany({
                        where: { productInstanceId: { in: availableInstances.map(i => i.productInstanceId) } },
                        data: {
                            status: ProductInstanceStatus.SHIPPED,
                            salesOrderId: createdSo.salesOrderId,
                            warehouseId: null // Left the building
                        }
                    });
                }
            }
        }
    }
    console.log(`   ✓ ${soSeeds.length} demo sales orders created`);
}

export async function seedDemoProductionRequests(): Promise<void> {
    console.log('...Seeding Demo Production Requests');

    const manager = await prisma.employee.findFirst({ where: { username: 'manager' } });
    if (!manager) { console.warn('   ⚠️ Missing manager employee'); return; }

    const prod = async (code: string) => (await prisma.product.findUnique({ where: { code } }))!;

    // Find SO Detail links for MTO requests
    const soTraffic = await prisma.salesOrder.findUnique({ where: { code: 'SO-SCENARIO-TRAFFIC-LIGHT' }, include: { details: true } });
    const soYellow = await prisma.salesOrder.findUnique({ where: { code: 'SO-SCENARIO-YELLOW-PROD' }, include: { details: true } });
    const so908 = await prisma.salesOrder.findUnique({ where: { code: 'SO-2026-908' }, include: { details: true } });

    interface PRSeed {
        code: string; productCode: string; qty: number; status: ProductionRequestStatus;
        priority: Priority; soDetailId: number | null; note?: string;
    }

    const prSeeds: PRSeed[] = [
        { code: 'PR-20260310-0001', productCode: 'PROD-GAMING-PC', qty: 20, status: ProductionRequestStatus.WAITING_MATERIAL, priority: Priority.HIGH,
            soDetailId: soTraffic?.details[0]?.soDetailId || null, note: 'MTO from Traffic Light scenario — CPU shortage' },
        { code: 'PR-20260310-0002', productCode: 'PROD-SMARTWATCH', qty: 20, status: ProductionRequestStatus.APPROVED, priority: Priority.MEDIUM,
            soDetailId: soYellow?.details[0]?.soDetailId || null, note: 'MTO from Yellow scenario — raw materials available' },
        { code: 'PR-20260310-0003', productCode: 'PROD-LAPTOP-X1', qty: 30, status: ProductionRequestStatus.APPROVED, priority: Priority.LOW,
            soDetailId: null, note: 'Manual Request (MTS) — buffer stock for Q2' },
        { code: 'PR-20260310-0004', productCode: 'PROD-TABLET-A1', qty: 15, status: ProductionRequestStatus.WAITING_MATERIAL, priority: Priority.MEDIUM,
            soDetailId: null, note: 'Manual Request (MTS) — WiFi modules needed' },
        { code: 'PR-20260310-0005', productCode: 'PROD-DESKTOP-Z5', qty: 5, status: ProductionRequestStatus.APPROVED, priority: Priority.HIGH,
            soDetailId: so908?.details[0]?.soDetailId || null, note: 'MTO from SO-2026-908' },
        { code: 'PR-20260310-0006', productCode: 'PROD-GAMING-PC', qty: 10, status: ProductionRequestStatus.CANCELLED, priority: Priority.LOW,
            soDetailId: null, note: 'Manual Request (MTS); Cancelled: Forecast revised down' },
        { code: 'PR-20260310-0007', productCode: 'PROD-MONITOR-M1', qty: 25, status: ProductionRequestStatus.IN_PROGRESS, priority: Priority.MEDIUM,
            soDetailId: null, note: 'Manual Request (MTS) — partial WO created' },
        { code: 'PR-20260310-0008', productCode: 'PROD-LAPTOP-X1', qty: 50, status: ProductionRequestStatus.IN_PROGRESS, priority: Priority.HIGH, // FIXED: Downgraded to IN_PROGRESS
            soDetailId: null, note: 'Manual Request (MTS) — fully converted to WO' },
    ];

    for (const pr of prSeeds) {
        const product = await prod(pr.productCode);
        if (!product) continue;

        // Fetch Product BOM
        const bom = await prisma.billOfMaterial.findMany({ where: { productId: product.productId } });
        const detailsData = bom.map((b: any) => ({
            componentId: b.componentId,
            quantityPerUnit: b.quantityNeeded,
            totalRequired: b.quantityNeeded * pr.qty
        }));

        await prisma.productionRequest.upsert({
            where: { code: pr.code },
            update: {},
            create: {
                code: pr.code,
                productId: product.productId,
                quantity: pr.qty,
                status: pr.status,
                priority: pr.priority,
                employeeId: manager.employeeId,
                createdAt: new Date(2026, 2, 10),
                soDetailId: pr.soDetailId,
                note: pr.note,
                details: { create: detailsData },
            }
        });
    }

    // --- Create minimal Work Orders + Fulfillments for PARTIALLY_FULFILLED & FULFILLED PRs ---
    console.log('   ...Creating Work Orders for fulfilled PRs');

    const prPartial = await prisma.productionRequest.findUnique({ where: { code: 'PR-20260310-0007' } });
    const prFull = await prisma.productionRequest.findUnique({ where: { code: 'PR-20260310-0008' } });
    const monitor = await prod('PROD-MONITOR-M1');
    const laptop = await prod('PROD-LAPTOP-X1');
    const line = await prisma.productionLine.findFirst();
    const fgWarehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-FG' } });
    const defectWarehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-DEFECT' } });

    if (prPartial && monitor && line) {
        const wo = await prisma.workOrder.upsert({
            where: { code: 'WO-DEMO-PR007' },
            update: {},
            create: {
                code: 'WO-DEMO-PR007', quantity: 10, employeeId: manager.employeeId,
                productId: monitor.productId, productionLineId: line.productionLineId,
                status: 'IN_PROGRESS',
                targetSalesWarehouseId: fgWarehouse?.warehouseId,
                targetErrorWarehouseId: defectWarehouse?.warehouseId,
                laborCost: 10000,
                overheadCost: 5000
            }
        });
        await prisma.workOrderFulfillment.upsert({
            where: { workOrderId_productionRequestId: { workOrderId: wo.workOrderId, productionRequestId: prPartial.productionRequestId } },
            update: {},
            create: { workOrderId: wo.workOrderId, productionRequestId: prPartial.productionRequestId, quantity: 10 }
        });
    }

    if (prFull && laptop && line) {
        const wo = await prisma.workOrder.upsert({
            where: { code: 'WO-DEMO-PR008' },
            update: {},
            create: {
                code: 'WO-DEMO-PR008', quantity: 50, employeeId: manager.employeeId,
                productId: laptop.productId, productionLineId: line.productionLineId,
                status: 'IN_PROGRESS', // FIXED: Downgraded to IN_PROGRESS
                targetSalesWarehouseId: fgWarehouse?.warehouseId,
                targetErrorWarehouseId: defectWarehouse?.warehouseId,
                laborCost: 50000,
                overheadCost: 25000
            }
        });
        await prisma.workOrderFulfillment.upsert({
            where: { workOrderId_productionRequestId: { workOrderId: wo.workOrderId, productionRequestId: prFull.productionRequestId } },
            update: {},
            create: { workOrderId: wo.workOrderId, productionRequestId: prFull.productionRequestId, quantity: 50 }
        });
    }

    console.log(`   ✓ ${prSeeds.length} demo production requests created`);
}

