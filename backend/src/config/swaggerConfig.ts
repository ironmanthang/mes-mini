import swaggerJsDoc from 'swagger-jsdoc';
import 'dotenv/config';

const swaggerOptions: swaggerJsDoc.Options = {
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
            { name: 'Auth', description: 'Authentication & Profile' },
            { name: 'Employees', description: 'User Management' },
            { name: 'Roles', description: 'RBAC Management' },
            { name: 'Agents', description: 'Customer/Distributor Management' },
            { name: 'Products', description: 'Finished Goods Catalog' },
            { name: 'Suppliers', description: 'Module A: Supply Chain' },
            { name: 'Components', description: 'Master Data: Raw Materials' },
            { name: 'Purchase Orders', description: 'Module A: Procurement' },
            { name: 'Sales Orders', description: 'Customer Orders from Agents' },
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
    apis: [
        './src/core/**/*Routes.ts',
        './src/master-data/**/*Routes.ts',
        './src/procurement/**/*Routes.ts',
        './src/sales/**/*Routes.ts',
        './dist/core/**/*Routes.js',
        './dist/master-data/**/*Routes.js',
        './dist/procurement/**/*Routes.js',
        './dist/sales/**/*Routes.js'
    ],
};

export default swaggerJsDoc(swaggerOptions);
