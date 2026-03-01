import prisma from '../../common/lib/prisma.js';

export interface MaterialRequirement {
    componentId: number;
    componentCode: string;
    componentName: string;
    quantityPerUnit: number; // Decimal in DB, number here
    totalRequired: number;
    availableStock: number;
    missingQuantity: number;
    unit: string;
}

export interface MrpResult {
    productionRequestId?: number;
    productId: number;
    productName: string;
    quantityToProduce: number;
    canProduce: boolean;
    requirements: MaterialRequirement[];
}

class MrpService {

    /**
     * Calculate material needs for a specific product and quantity
     * This is the "Brain" of the planning phase.
     */
    async calculateRequirements(productId: number, quantityToProduce: number, requestId?: number): Promise<MrpResult> {
        // 1. Fetch Product & BOM
        const product = await prisma.product.findUnique({
            where: { productId },
            include: {
                bom: {
                    include: { component: true }
                }
            }
        });

        if (!product) throw new Error("Product not found");

        if (!product.bom || product.bom.length === 0) {
            return {
                productionRequestId: requestId,
                productId,
                productName: product.productName,
                quantityToProduce,
                canProduce: false, // No BOM = Cannot produce
                requirements: []
            };
        }

        // 2. Fetch Current Stock Levels for all components in BOM
        const componentIds = product.bom.map(b => b.componentId);

        // Group stock by component (sum across all warehouses)
        const stockCounts = await prisma.componentStock.groupBy({
            by: ['componentId'],
            where: {
                componentId: { in: componentIds }
            },
            _sum: {
                quantity: true,
                allocatedQuantity: true
            }
        });

        // Map stock for easy lookup (subtract allocated to avoid double-counting)
        const stockMap = new Map<number, number>();
        stockCounts.forEach(s => {
            const total = s._sum.quantity || 0;
            const allocated = s._sum.allocatedQuantity || 0;
            stockMap.set(s.componentId, total - allocated);
        });

        // 3. Calculate Logic
        const requirements: MaterialRequirement[] = [];
        let canProduce = true;

        for (const item of product.bom) {
            const qtyPerUnit = Number(item.quantityNeeded);
            const totalRequired = qtyPerUnit * quantityToProduce;
            const available = stockMap.get(item.componentId) || 0;
            const missing = Math.max(0, totalRequired - available);

            if (missing > 0) canProduce = false;

            requirements.push({
                componentId: item.componentId,
                componentCode: item.component.code,
                componentName: item.component.componentName,
                unit: item.component.unit,
                quantityPerUnit: qtyPerUnit,
                totalRequired,
                availableStock: available,
                missingQuantity: missing
            });
        }

        return {
            productionRequestId: requestId,
            productId,
            productName: product.productName,
            quantityToProduce,
            canProduce,
            requirements
        };
    }

    /**
     * Run MRP for an existing Production Request
     */
    async calculateForRequest(productionRequestId: number): Promise<MrpResult> {
        const request = await prisma.productionRequest.findUnique({
            where: { productionRequestId }
        });

        if (!request) throw new Error("Production Request not found");

        return this.calculateRequirements(request.productId, request.quantity, request.productionRequestId);
    }
}

export default new MrpService();
