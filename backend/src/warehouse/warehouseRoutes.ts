import { Router } from 'express';
import materialRequestRoutes from './material-request/materialRequestRoutes.js';
import inventoryRoutes from './inventory/inventoryRoutes.js';
import stocktakeRoutes from './stocktaking/stocktakeRoutes.js';

const router = Router();

router.use('/material-requests', materialRequestRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/stocktaking', stocktakeRoutes);

export default router;

