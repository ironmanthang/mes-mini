import { Router } from 'express';
import productionRequestRoutes from './productionRequests/productionRequestRoutes.js';
import workOrderRoutes from './workOrders/workOrderRoutes.js';
import productionLineRoutes from './productionLines/productionLineRoutes.js';

const router = Router();

router.use('/production-requests', productionRequestRoutes);
router.use('/work-orders', workOrderRoutes);
router.use('/lines', productionLineRoutes);

export default router;

