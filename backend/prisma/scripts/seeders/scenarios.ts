import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../../../src/common/lib/prisma.js';
import { PERM } from '../../../src/common/constants/permissions.js';
import { EmployeeStatus, PurchaseOrderStatus, SalesOrderStatus, ProductionRequestStatus, Priority, WarehouseType, InventoryTransactionType, ProductInstanceStatus, MaterialRequestStatus, InspectionType } from '../../../src/generated/prisma/index.js';

const DEFAULT_PASSWORD = '123456';

import { injectComponentStock } from "./helpers.js";

export async function seedProductionScenarios(): Promise<void> {
    console.log('...Seeding Production Scenarios (Traffic Light Logic)');

    // 1. Create Product: Gaming PC
    const product = await prisma.product.upsert({
        where: { code: 'PROD-GAMING-PC' },
        update: {},
        create: {
            code: 'PROD-GAMING-PC',
            productName: 'Gaming PC Ultra',
            unit: 'pcs',
            minStockLevel: 10
        }
    });

    // 2. Create Components with Specific Stock Levels
    // Scenario: Need 20 PCs.
    // BOM: 1 CPU, 2 RAM, 1 PSU.
    // Total Need: 20 CPU, 40 RAM, 20 PSU.

    const components = [
        // RED: 0 Stock (Shortage)
        { code: 'COM-CPU-ULTRA', name: 'CPU i9 Ultra', unit: 'pcs', cost: 10000000, stock: 0 },
        // YELLOW: 30 Stock (Partial - Need 40)
        { code: 'COM-RAM-32GB', name: 'RAM 32GB DDR5', unit: 'pcs', cost: 2000000, stock: 30 },
        // GREEN: 100 Stock (Sufficient - Need 20)
        { code: 'COM-PSU-850W', name: 'PSU 850W Gold', unit: 'pcs', cost: 3000000, stock: 100 }
    ];

    for (const c of components) {
        await prisma.component.upsert({
            where: { code: c.code },
            update: { minStockLevel: c.stock }, // Reset stock level ensures consistent testing
            create: {
                code: c.code,
                componentName: c.name,
                unit: c.unit,
                standardCost: c.cost,
                minStockLevel: c.stock
            }
        });

        // Ensure Warehouse Stock matches "minStockLevel" for this scenario
        const warehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' } });
        const comp = await prisma.component.findUnique({ where: { code: c.code } });

        if (warehouse && comp && c.stock > 0) {
            await injectComponentStock(comp.componentId, warehouse.warehouseId, c.stock, `LOT-SCENARIO-${c.code}`);
        }
    }

    // 3. Link BOM
    const cpu = await prisma.component.findUnique({ where: { code: 'COM-CPU-ULTRA' } });
    const ram = await prisma.component.findUnique({ where: { code: 'COM-RAM-32GB' } });
    const psu = await prisma.component.findUnique({ where: { code: 'COM-PSU-850W' } });

    // Helper to link BOM
    const linkBom = async (c: any, qty: number) => {
        if (!c) return;
        await prisma.billOfMaterial.upsert({
            where: { productId_componentId: { productId: product.productId, componentId: c.componentId } },
            update: { quantityNeeded: qty },
            create: { productId: product.productId, componentId: c.componentId, quantityNeeded: qty }
        });
    };

    await linkBom(cpu, 1);
    await linkBom(ram, 2); // Need 2 per PC
    await linkBom(psu, 1);

    // 4. Create Sales Order
    const admin = await prisma.employee.findFirst();
    const agent = await prisma.agent.findFirst();

    if (admin && agent) {
        // Create Sales Order for 20 Units
        // This triggers the logic:
        // - CPU: Need 20, Have 0 -> RED
        // - RAM: Need 40, Have 30 -> YELLOW
        // - PSU: Need 20, Have 100 -> GREEN

        const soCode = 'SO-SCENARIO-TRAFFIC-LIGHT';
        const so = await prisma.salesOrder.upsert({
            where: { code: soCode },
            update: {}, // Don't wipe if exists, just ensure it's there
            create: {
                code: soCode,
                status: 'APPROVED', // Ready for Production Request
                orderDate: new Date(),
                employeeId: admin.employeeId,
                agentId: agent.agentId,
                totalAmount: 500000000
            }
        });

        // Add Detail for Gaming PC
        await prisma.salesOrderDetail.upsert({
            where: { salesOrderId_productId: { salesOrderId: so.salesOrderId, productId: product.productId } },
            update: {},
            create: {
                salesOrderId: so.salesOrderId,
                productId: product.productId,
                quantity: 20,
                salePrice: 25000000
            }
        });

        console.log(`   ✓ SCENARIO 3 (RED/YELLOW) Created: Check SO "${soCode}" (Gaming PCs -> Shortage)`);
    }

    // ---------------------------------------------------------
    // SCENARIO 1: GREEN (Ship from Stock - Laptops)
    // ---------------------------------------------------------
    const laptopProduct = await prisma.product.findUnique({ where: { code: 'PROD-LAPTOP-X1' } });
    if (laptopProduct && admin && agent) {
        const greenSoCode = 'SO-SCENARIO-GREEN-STOCK';
        const greenSo = await prisma.salesOrder.upsert({
            where: { code: greenSoCode },
            update: {},
            create: {
                code: greenSoCode,
                status: 'APPROVED',
                orderDate: new Date(),
                employeeId: admin.employeeId,
                agentId: agent.agentId,
                totalAmount: 150000000
            }
        });

        await prisma.salesOrderDetail.upsert({
            where: { salesOrderId_productId: { salesOrderId: greenSo.salesOrderId, productId: laptopProduct.productId } },
            update: {},
            create: {
                salesOrderId: greenSo.salesOrderId,
                productId: laptopProduct.productId,
                quantity: 10, // We seeded 50 instances earlier, so requesting 10 is pure GREEN.
                salePrice: 15000000
            }
        });
        console.log(`   ✓ SCENARIO 1 (GREEN) Created: Check SO "${greenSoCode}" (Laptops -> Ready to ship)`);
    }

    // ---------------------------------------------------------
    // SCENARIO 2: YELLOW (No Finished Goods, but have Raw Materials)
    // ---------------------------------------------------------
    const smartwatch = await prisma.product.upsert({
        where: { code: 'PROD-SMARTWATCH' },
        update: {},
        create: { code: 'PROD-SMARTWATCH', productName: 'Smartwatch V1', unit: 'pcs', minStockLevel: 30 }
    });

    const screen = await prisma.component.upsert({
        where: { code: 'COM-SCREEN-OLED' },
        update: {},
        create: { code: 'COM-SCREEN-OLED', componentName: 'OLED Screen 2inch', unit: 'pcs', standardCost: 200000, minStockLevel: 100 }
    });
    const battery = await prisma.component.upsert({
        where: { code: 'COM-BATTERY-500' },
        update: {},
        create: { code: 'COM-BATTERY-500', componentName: 'Battery 500mAh', unit: 'pcs', standardCost: 50000, minStockLevel: 100 }
    });

    // Put components in warehouse
    const mainWh = await prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' } });
    if (mainWh) {
        await injectComponentStock(screen.componentId, mainWh.warehouseId, 100, 'LOT-INIT-SCREEN');
        await injectComponentStock(battery.componentId, mainWh.warehouseId, 100, 'LOT-INIT-BATTERY');
    }

    // Link BOM for Smartwatch
    await prisma.billOfMaterial.upsert({
        where: { productId_componentId: { productId: smartwatch.productId, componentId: screen.componentId } },
        update: { quantityNeeded: 1 }, create: { productId: smartwatch.productId, componentId: screen.componentId, quantityNeeded: 1 }
    });
    await prisma.billOfMaterial.upsert({
        where: { productId_componentId: { productId: smartwatch.productId, componentId: battery.componentId } },
        update: { quantityNeeded: 1 }, create: { productId: smartwatch.productId, componentId: battery.componentId, quantityNeeded: 1 }
    });

    // Create SO for Smartwatch
    if (admin && agent) {
        const yellowSoCode = 'SO-SCENARIO-YELLOW-PROD';
        const yellowSo = await prisma.salesOrder.upsert({
            where: { code: yellowSoCode },
            update: {},
            create: { code: yellowSoCode, status: 'APPROVED', orderDate: new Date(), employeeId: admin.employeeId, agentId: agent.agentId, totalAmount: 100000000 }
        });

        await prisma.salesOrderDetail.upsert({
            where: { salesOrderId_productId: { salesOrderId: yellowSo.salesOrderId, productId: smartwatch.productId } },
            update: {},
            create: { salesOrderId: yellowSo.salesOrderId, productId: smartwatch.productId, quantity: 20, salePrice: 5000000 } // Need 20. Have 0 FG, but have 100 raw materials -> YELLOW
        });
        console.log(`   ✓ SCENARIO 2 (YELLOW) Created: Check SO "${yellowSoCode}" (Smartwatches -> Can Produce instantly)`);
    }
}

export async function seedQcTestingScenario(): Promise<void> {
    console.log('...Seeding QC Testing Scenario (PENDING_QC)');

    const admin = await prisma.employee.findFirst({ where: { username: 'admin' } });
    const product = await prisma.product.findUnique({ where: { code: 'PROD-LAPTOP-X1' } });
    const line = await prisma.productionLine.findFirst();
    const fgWarehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-FG' } });
    const defectWarehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-DEFECT' } });

    if (!admin || !product || !fgWarehouse || !defectWarehouse) {
        console.warn('   ⚠️ Missing prerequisites for QC testing scenario');
        return;
    }

    // 1. Create a dummy PR for traceability
    const pr = await prisma.productionRequest.upsert({
        where: { code: 'PR-QC-TEST' },
        update: {},
        create: {
            code: 'PR-QC-TEST',
            productId: product.productId,
            quantity: 5,
            status: ProductionRequestStatus.APPROVED,
            priority: Priority.HIGH,
            employeeId: admin.employeeId,
            note: 'PR for testing QC and Induction'
        }
    });

    // 2. Create a COMPLETED Work Order
    const woCode = 'WO-QC-TEST';
    const wo = await prisma.workOrder.upsert({
        where: { code: woCode },
        update: {},
        create: {
            code: woCode,
            quantity: 5,
            employeeId: admin.employeeId,
            productId: product.productId,
            productionLineId: line?.productionLineId,
            status: 'COMPLETED',
            targetSalesWarehouseId: fgWarehouse.warehouseId,
            targetErrorWarehouseId: defectWarehouse.warehouseId,
            laborCost: 5000,
            overheadCost: 2000
        }
    });

    // 3. Link WO to PR
    await prisma.workOrderFulfillment.upsert({
        where: { workOrderId_productionRequestId: { workOrderId: wo.workOrderId, productionRequestId: pr.productionRequestId } },
        update: {},
        create: { workOrderId: wo.workOrderId, productionRequestId: pr.productionRequestId, quantity: 5 }
    });

    // 4. Create Production Batch
    const batchCode = 'BATCH-QC-TEST';
    let batch = await prisma.productionBatch.findFirst({ where: { batchCode } });
    if (!batch) {
        batch = await prisma.productionBatch.create({
            data: { batchCode, productionDate: new Date(), workOrderId: wo.workOrderId }
        });
    }

    // 5. Create PENDING_QC Instances (NO warehouse assigned yet)
    const instancesData = [];
    for (let i = 1; i <= 5; i++) {
        instancesData.push({
            productId: product.productId,
            serialNumber: `SN-QC-TEST-${i.toString().padStart(4, '0')}`,
            status: ProductInstanceStatus.PENDING_QC,
            productionBatchId: batch.productionBatchId,
            warehouseId: null // Crucial: PENDING_QC items are not yet in a warehouse
        });
    }

    await prisma.productInstance.createMany({
        data: instancesData,
        skipDuplicates: true
    });

    console.log('   ✓ QC Testing instances created (SN-QC-TEST-0001 to 0005)');
}

