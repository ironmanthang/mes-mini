import { Router } from 'express';
import productionRequestRoutes from './productionRequests/productionRequestRoutes.js';
import workOrderRoutes from './workOrders/workOrderRoutes.js';
import productionLineRoutes from './productionLines/productionLineRoutes.js';
import productionDashboardRoutes from './dashboard/productionDashboardRoutes.js';

const router = Router();

// router.use('/production-requests', productionRequestRoutes); // MOVED TO ROOT
router.use('/work-orders', workOrderRoutes);
router.use('/lines', productionLineRoutes);
router.use('/dashboard', productionDashboardRoutes);

export default router;

