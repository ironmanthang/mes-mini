import 'dotenv/config';
import prisma from '../../src/common/lib/prisma.js';

import { seedRoles, seedPermissions, seedRolePermissions, seedEmployees, seedWarehouses, seedProductionLines, seedCodeSequences } from './seeders/system.js';
import { seedSuppliers, seedAgents, seedComponents, seedQualityChecklists, seedProducts, seedSupplierComponents } from './seeders/masterData.js';
import { seedMaterialRequests, seedProductInstances, seedDemoAgents, seedDemoSuppliers, seedDemoComponents, seedDemoProducts, seedDemoSupplierComponents, seedDemoComponentStock, seedDemoProductInstances, seedDemoPurchaseOrders, seedDemoSalesOrders, seedDemoProductionRequests } from './seeders/demoData.js';
import { seedProductionScenarios, seedQcTestingScenario } from './seeders/scenarios.js';

// ============================================================================
// 🎛️ CENTRAL CONTROL PANEL
// Toggle these to TRUE/FALSE to control what gets seeded
// ============================================================================
const SEED_CONFIG = {
    MINIMAL: false,  // false = Seed all for full testing
    ROLES: true,
    EMPLOYEES: true,
    SUPPLIERS: true,
    COMPONENTS: true,
    WAREHOUSES: true,
    PRODUCTS: true,
    LINES: true,
    RELATIONS: true,
    INSTANCES: true,
    SCENARIOS: true,
    // --- DEMO ENRICHMENT ---
    AGENTS: true,
    PURCHASE_ORDERS: true,
    SALES_ORDERS: true,
    PRODUCTION_REQUESTS: true,
    MATERIAL_REQUESTS: true, // NEW: Control for material request seeding
    QC_TESTING: true,        // NEW: Control for QC Testing Scenario
};

async function main(): Promise<void> {
    console.log('Starting Seeding Process...');

    // FORCE RUN RELATIONS because they seem missing
    await seedSupplierComponents();

    if (SEED_CONFIG.ROLES) await seedRoles();
    if (SEED_CONFIG.ROLES) await seedPermissions();      // NEW — must run after roles
    if (SEED_CONFIG.ROLES) await seedRolePermissions();  // NEW — must run after permissions
    if (SEED_CONFIG.EMPLOYEES) await seedEmployees(SEED_CONFIG.MINIMAL);

    // Master Data
    if (SEED_CONFIG.SUPPLIERS) await seedSuppliers();
    if (SEED_CONFIG.COMPONENTS) await seedComponents();
    if (SEED_CONFIG.WAREHOUSES) await seedWarehouses();
    if (SEED_CONFIG.PRODUCTS) {
        await seedQualityChecklists();
        await seedProducts();
    }
    if (SEED_CONFIG.LINES) await seedProductionLines();
    if (SEED_CONFIG.RELATIONS) await seedSupplierComponents();
    if (SEED_CONFIG.INSTANCES) await seedProductInstances();
    await seedAgents();
    if (SEED_CONFIG.SCENARIOS) await seedProductionScenarios();

    // --- DEMO ENRICHMENT (depends on all master data above) ---
    if (SEED_CONFIG.AGENTS) await seedDemoAgents();
    if (SEED_CONFIG.SUPPLIERS) await seedDemoSuppliers();
    if (SEED_CONFIG.COMPONENTS) await seedDemoComponents();
    if (SEED_CONFIG.PRODUCTS) await seedDemoProducts();
    if (SEED_CONFIG.RELATIONS) await seedDemoSupplierComponents();
    if (SEED_CONFIG.COMPONENTS) await seedDemoComponentStock();
    if (SEED_CONFIG.INSTANCES) await seedDemoProductInstances();
    if (SEED_CONFIG.SALES_ORDERS) await seedDemoSalesOrders();
    if (SEED_CONFIG.PRODUCTION_REQUESTS) await seedDemoProductionRequests();
    if (SEED_CONFIG.PURCHASE_ORDERS) await seedDemoPurchaseOrders();
    
    // NEW: Seed Material Requests for all WOs
    if (SEED_CONFIG.MATERIAL_REQUESTS) await seedMaterialRequests();

    if (SEED_CONFIG.QC_TESTING) await seedQcTestingScenario();

    await seedCodeSequences();

    console.log('Seeding Completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
