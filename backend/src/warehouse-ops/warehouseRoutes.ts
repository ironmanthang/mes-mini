import { Router } from 'express';
import materialRequestRoutes from './material-request/materialRequestRoutes.js';
import inventoryRoutes from './inventory/inventoryRoutes.js';

import warehouseDashboardRoutes from './dashboard/warehouseDashboardRoutes.js';
import transferRequestRoutes from './transferRequest/transferRequestRoutes.js';

const router = Router();

router.use('/material-requests', materialRequestRoutes);
router.use('/inventory', inventoryRoutes);

router.use('/dashboard', warehouseDashboardRoutes);
router.use('/transfer-requests', transferRequestRoutes);

export default router;

