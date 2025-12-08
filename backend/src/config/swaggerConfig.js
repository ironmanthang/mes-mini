const swaggerJsDoc = require('swagger-jsdoc');
const dotenv = require('dotenv');

dotenv.config();
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini-MES API',
      version: '1.0.0',
      description: 'API documentation for the Mini-MES backend',
    },
    servers: [{ url: `http://localhost:${process.env.HOST_PORT}` }],
    tags: [
      { name: 'Auth', description: 'Authentication & Profile' },
      { name: 'Employees', description: 'User Management' },
      { name: 'Roles', description: 'RBAC Management' },
      { name: 'Suppliers', description: 'Module A: Supply Chain' },
      { name: 'Components', description: 'Master Data: Raw Materials' },
      { name: 'Purchase Orders', description: 'Module A: Procurement' },
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
  // The path is relative to the project root, where swagger-jsdoc is run from
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsDoc(swaggerOptions);