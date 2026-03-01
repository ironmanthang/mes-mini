import prisma from '../../common/lib/prisma.js';
import SalesOrderService from '../../sales/salesOrders/salesOrderService.js';
import MrpService from './mrpService.js';

// ─── Response Types ────────────────────────────────────────────────

interface ComponentFeasibility {
    componentId: number;
    componentName: string;
    requiredQty: number;
    availableQty: number;
    shortageQty: number;
    status: 'YELLOW' | 'RED';
}

interface LineItemFeasibility {
    soDetailId: number;
    productId: number;
    productName: string;
    orderedQty: number;
    finishedGoodsAvailable: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
    existingPrId?: number;
    existingPrStatus?: string;
    components?: ComponentFeasibility[];
}

interface FeasibilityResult {
    salesOrderId: number;
    salesOrderCode: string;
    overallStatus: 'GREEN' | 'YELLOW' | 'RED' | 'MIXED';
    lineItems: LineItemFeasibility[];
}

// ─── Service ───────────────────────────────────────────────────────

class FeasibilityService {

    /**
     * Check feasibility for all line items in a Sales Order.
     * Returns a "Traffic Light" result: GREEN (can ship), YELLOW (can produce),
     * RED (need to purchase components first).
     */
    async checkSalesOrderFeasibility(salesOrderId: number): Promise<FeasibilityResult> {
        // 1. Fetch SO with details
        const so = await prisma.salesOrder.findUnique({
            where: { salesOrderId },
            include: {
                details: {
                    include: {
                        product: true,
                        productionRequests: {
                            where: { status: { notIn: ['CANCELLED'] } },
                            select: { productionRequestId: true, status: true }
                        }
                    }
                }
            }
        });

        if (!so) throw new Error("Sales Order not found");

        if (so.status !== 'APPROVED' && so.status !== 'IN_PROGRESS') {
            throw new Error(`Feasibility check requires APPROVED or IN_PROGRESS status (current: ${so.status})`);
        }

        if (!so.details || so.details.length === 0) {
            throw new Error("Sales Order has no line items");
        }

        // 2. Bulk fetch finished goods stock
        const productIds = so.details.map(d => d.productId);
        const finishedGoodsMap = await SalesOrderService.getBulkAvailableStock(productIds);

        // 3. Process each line item
        const lineItems: LineItemFeasibility[] = [];

        for (const detail of so.details) {
            const available = finishedGoodsMap.get(detail.productId) || 0;

            // Check for existing active PR
            const existingPR = detail.productionRequests[0];

            // GREEN: enough finished goods to ship
            if (available >= detail.quantity) {
                lineItems.push({
                    soDetailId: detail.soDetailId,
                    productId: detail.productId,
                    productName: detail.product.productName,
                    orderedQty: detail.quantity,
                    finishedGoodsAvailable: available,
                    status: 'GREEN',
                    existingPrId: existingPR?.productionRequestId,
                    existingPrStatus: existingPR?.status
                });
                continue;
            }

            // Not GREEN → need production. Run BOM explosion.
            const qtyToProduce = detail.quantity - available;
            const mrpResult = await MrpService.calculateRequirements(detail.productId, qtyToProduce);

            // Map BOM components to feasibility format
            const components: ComponentFeasibility[] = mrpResult.requirements.map(r => ({
                componentId: r.componentId,
                componentName: r.componentName,
                requiredQty: r.totalRequired,
                availableQty: r.availableStock,
                shortageQty: r.missingQuantity,
                status: r.missingQuantity > 0 ? 'RED' as const : 'YELLOW' as const
            }));

            // Line status = worst case of components
            const hasShortage = components.some(c => c.status === 'RED');
            const lineStatus = hasShortage ? 'RED' : 'YELLOW';

            lineItems.push({
                soDetailId: detail.soDetailId,
                productId: detail.productId,
                productName: detail.product.productName,
                orderedQty: detail.quantity,
                finishedGoodsAvailable: available,
                status: lineStatus,
                existingPrId: existingPR?.productionRequestId,
                existingPrStatus: existingPR?.status,
                components
            });
        }

        // 4. Calculate overall status
        const statuses = new Set(lineItems.map(l => l.status));
        let overallStatus: FeasibilityResult['overallStatus'];

        if (statuses.size === 1) {
            overallStatus = statuses.values().next().value as 'GREEN' | 'YELLOW' | 'RED';
        } else {
            overallStatus = 'MIXED';
        }

        return {
            salesOrderId: so.salesOrderId,
            salesOrderCode: so.code,
            overallStatus,
            lineItems
        };
    }
}

export default new FeasibilityService();
