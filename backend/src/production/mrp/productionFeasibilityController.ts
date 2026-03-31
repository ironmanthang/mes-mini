import { Request, Response } from 'express';
import prisma from '../../common/lib/prisma.js';
import mrpService from './mrpService.js';

/**
 * GET /api/products/:id/production-context
 * Provides the "Why" for a Production Request: Current Stock, Min Level, and Sales Demand.
 */
export const getProductProductionContext = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params.id as string, 10);
        if (isNaN(productId)) {
            res.status(400).json({ message: 'Invalid product ID' });
            return;
        }

        const product = await prisma.product.findUnique({
            where: { productId },
            select: {
                productId: true,
                productName: true,
                minStockLevel: true,
                unit: true
            }
        });

        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }

        // 1. Current Stock (QC-passed items in Sales Warehouses)
        const currentStock = await prisma.productInstance.count({
            where: {
                productId,
                status: 'IN_STOCK',
                warehouse: {
                    warehouseType: 'SALES'
                }
            }
        });

        // 2. Pending Sales Demand (Unshipped quantities in Approved/In-Progress Sales Orders)
        const salesOrderDetails = await prisma.salesOrderDetail.findMany({
            where: {
                productId,
                salesOrder: {
                    status: { in: ['APPROVED', 'IN_PROGRESS'] }
                }
            },
            select: {
                quantity: true,
                quantityShipped: true
            }
        });

        const pendingSalesDemand = salesOrderDetails.reduce(
            (sum, item) => sum + (item.quantity - item.quantityShipped),
            0
        );

        // 3. Suggested Quantity calculation: Max(0, (Min + Demand) - Stock)
        const totalRequired = product.minStockLevel + pendingSalesDemand;
        const suggestedQuantity = Math.max(0, totalRequired - currentStock);

        res.status(200).json({
            productId: product.productId,
            productName: product.productName,
            unit: product.unit,
            minStockLevel: product.minStockLevel,
            currentStock,
            pendingSalesDemand,
            suggestedQuantity
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

/**
 * POST /api/products/:id/production-feasibility
 * Provides the "How" for a Production Request: BOM requirements vs Component Stock.
 * Body: { quantity: number }
 */
export const checkProductionFeasibility = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params.id as string, 10);
        const { quantity } = req.body;

        if (isNaN(productId) || !quantity || quantity <= 0) {
            res.status(400).json({ message: 'Invalid product ID or quantity' });
            return;
        }

        const requirements = await mrpService.calculateRequirements(productId, quantity);

        res.status(200).json({
            productId,
            plannedQuantity: quantity,
            components: requirements
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
