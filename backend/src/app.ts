import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import swaggerDocs from './config/swaggerConfig.js';
import authRoutes from './core/auth/authRoutes.js';
import employeeRoutes from './core/employees/employeeRoutes.js';
import roleRoutes from './core/roles/roleRoutes.js';
import supplierRoutes from './master-data/suppliers/supplierRoutes.js';
import componentRoutes from './master-data/components/componentRoutes.js';
import agentRoutes from './master-data/agents/agentRoutes.js';
import productRoutes from './master-data/products/productRoutes.js';
import warehouseMasterRoutes from './master-data/warehouses/warehouseRoutes.js';
import purchaseOrderRoutes from './procurement/purchaseOrders/purchaseOrderRoutes.js';
import salesOrderRoutes from './sales/salesOrders/salesOrderRoutes.js';
import salesDashboardRoutes from './sales/dashboard/salesDashboardRoutes.js';
import productionRoutes from './production/productionRoutes.js';
import warehouseOpsRoutes from './warehouse-ops/warehouseRoutes.js';
import notificationRoutes from './notifications/notificationRoutes.js';
import qualityRoutes from './production/quality/qualityRoutes.js';
import productionRequestRoutes from './production/productionRequests/productionRequestRoutes.js';

const app: Express = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',           // Vite dev
        'https://mes-mini.pages.dev',      // Cloudflare Pages production
        /\.pages\.dev$/,                   // Cloudflare preview deploys
        'null',                            // Allow local file:/// execution
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/ // Allow local network (Phones/Tablets)
    ],
    credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseMasterRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/production-requests', productionRequestRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/warehouse-ops', warehouseOpsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/quality', qualityRoutes);


const swaggerUiOptions = {
    customCss: '.swagger-ui .response .response-col_links { display: none !important; }',
    swaggerOptions: {
        tryItOutEnabled: true,
        docExpansion: 'none',
        displayRequestDuration: true,
    }
};


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions));



const STARTUP_TIME = new Date().toISOString();

app.get('/version', (req, res) => {
    res.json({
        service: 'mes-mini-backend',
        version: '1.0.0',
        deployedAt: STARTUP_TIME,
        machine: require('os').hostname()
    });
});

export default app;
