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
import purchaseOrderRoutes from './procurement/purchaseOrders/purchaseOrderRoutes.js';
import salesOrderRoutes from './sales/salesOrders/salesOrderRoutes.js';
import productionRoutes from './production/productionRoutes.js';
import warehouseRoutes from './warehouse/warehouseRoutes.js';
import notificationRoutes from './notifications/notificationRoutes.js';
import dashboardRoutes from './dashboard/dashboardRoutes.js';
import qualityRoutes from './production/quality/qualityRoutes.js';

const app: Express = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',           // Vite dev
        'https://mes-mini.pages.dev',      // Cloudflare Pages production
        /\.pages\.dev$/,                   // Cloudflare preview deploys
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
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quality', qualityRoutes);


const swaggerUiOptions = {
    customCss: '.swagger-ui .response .response-col_links { display: none !important; }',
    swaggerOptions: {
        tryItOutEnabled: true,
        docExpansion: 'list',
        displayRequestDuration: true,
    }
};


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions));

export default app;
