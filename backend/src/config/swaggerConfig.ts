import swaggerJsDoc from 'swagger-jsdoc';
import 'dotenv/config';

export const swaggerOptions: swaggerJsDoc.Options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Mini-MES API',
            version: '1.0.0',
            description: 'API documentation for the Mini-MES backend',
        },
        servers: [
            { url: process.env.API_URL || '/', description: 'Default Server' },
            { url: `http://localhost:${process.env.HOST_PORT || 5000}`, description: 'Localhost' }
        ],
        tags: [
            { name: 'Auth', description: 'Login & Profile Management' },
            { name: 'Employees', description: 'Staff & System Accounts' },
            { name: 'Roles', description: 'Permissions & Access Control' },
            { name: 'Products', description: 'Finished Goods (The devices you sell)' },
            { name: 'Components', description: 'Raw Materials (Resistors, PCBs, etc.)' },
            { name: 'Suppliers', description: 'Vendor Management' },
            { name: 'Agents', description: 'B2B Distributors & Customers' },
            { name: 'Purchase Orders', description: 'Procurement: Buying Materials' },
            { name: 'Sales Orders', description: 'Sales: Selling Products' },
            { name: 'Warehouses', description: 'Master data for Warehouses' },
            // { name: 'Production Lines', description: 'Manufacturing line management' },
            { name: 'Production Requests', description: 'Managing requests to produce items' },
            // { name: 'Quality', description: 'Quality Control (QC) operations' },
            // { name: 'Work Orders', description: 'Managing production execution (The Factory Floor)' },
            { name: 'Inventory', description: 'Stock Management and Reporting' },
            // { name: 'Material Requests', description: 'Requesting materials for production' },
            // { name: 'Stocktaking', description: 'Inventory counting and reconciliation' },
            // { name: 'Notifications', description: 'System alerts and messages' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Path to route files for swagger-jsdoc to scan
    // To HIDE an API from Swagger, simply comment out its two lines (the .ts and the .js)
    apis: [
        // --- CORE: Auth & Identity ---
        './src/core/auth/authRoutes.ts',
        './dist/core/auth/authRoutes.js',
        './src/core/employees/employeeRoutes.ts',
        './dist/core/employees/employeeRoutes.js',
        './src/core/roles/roleRoutes.ts',
        './dist/core/roles/roleRoutes.js',

        // --- MASTER DATA ---
        './src/master-data/agents/agentRoutes.ts',
        './dist/master-data/agents/agentRoutes.js',
        './src/master-data/components/componentRoutes.ts',
        './dist/master-data/components/componentRoutes.js',
        './src/master-data/products/productRoutes.ts',
        './dist/master-data/products/productRoutes.js',
        './src/master-data/suppliers/supplierRoutes.ts',
        './dist/master-data/suppliers/supplierRoutes.js',
        './src/master-data/warehouses/warehouseRoutes.ts',
        './dist/master-data/warehouses/warehouseRoutes.js',

        // --- DASHBOARDS ---
        './src/warehouse-ops/dashboard/warehouseDashboardRoutes.ts',
        './dist/warehouse-ops/dashboard/warehouseDashboardRoutes.js',
        './src/sales/dashboard/salesDashboardRoutes.ts',
        './dist/sales/dashboard/salesDashboardRoutes.js',
        './src/production/dashboard/productionDashboardRoutes.ts',
        './dist/production/dashboard/productionDashboardRoutes.js',

        // --- NOTIFICATIONS ---
        // './src/notifications/notificationRoutes.ts',
        // './dist/notifications/notificationRoutes.js',

        // --- PROCUREMENT ---
        './src/procurement/purchaseOrders/purchaseOrderRoutes.ts',
        './dist/procurement/purchaseOrders/purchaseOrderRoutes.js',

        // --- SALES ---
        './src/sales/salesOrders/salesOrderRoutes.ts',
        './dist/sales/salesOrders/salesOrderRoutes.js',

        // --- PRODUCTION ---
        // './src/production/productionLines/productionLineRoutes.ts',
        // './dist/production/productionLines/productionLineRoutes.js',
        './src/production/productionRequests/productionRequestRoutes.ts',
        './dist/production/productionRequests/productionRequestRoutes.js',
        './src/production/productionRoutes.ts',
        './dist/production/productionRoutes.js',
        // './src/production/quality/qualityRoutes.ts',
        // './dist/production/quality/qualityRoutes.js',
        // './src/production/workOrders/workOrderRoutes.ts',
        // './dist/production/workOrders/workOrderRoutes.js',

        // --- WAREHOUSE OPS ---
        './src/warehouse-ops/inventory/inventoryRoutes.ts',
        './dist/warehouse-ops/inventory/inventoryRoutes.js',
        // './src/warehouse-ops/material-request/materialRequestRoutes.ts',
        // './dist/warehouse-ops/material-request/materialRequestRoutes.js',
        // './src/warehouse-ops/stocktaking/stocktakeRoutes.ts',
        // './dist/warehouse-ops/stocktaking/stocktakeRoutes.js',
        './src/warehouse-ops/warehouseRoutes.ts',
        './dist/warehouse-ops/warehouseRoutes.js',
    ],
};

export default swaggerJsDoc(swaggerOptions);
