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
        './src/core/**/*Routes.ts',
        './src/master-data/**/*Routes.ts',
        './src/procurement/**/*Routes.ts',
        './src/sales/**/*Routes.ts',
        './src/production/**/*Routes.ts',
        './dist/core/**/*Routes.js',
        './dist/master-data/**/*Routes.js',
        './dist/procurement/**/*Routes.js',
        './dist/sales/**/*Routes.js',
        './dist/production/**/*Routes.js'
    ],
};

export default swaggerJsDoc(swaggerOptions);
