import prisma from '../../common/lib/prisma.js';
import InventoryService from '../../warehouse-ops/inventory/inventoryService.js';
import { Prisma } from '../../generated/prisma/index.js';

export interface MaterialRequirement {
    componentId: number;
    componentCode: string;
    componentName: string;
    quantityPerUnit: number; // Int in DB
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
     * ─── PLANNING BRAIN ─────────────────────────────────────────────────────────
     * Calculate material needs from the MASTER BOM (live data).
     * Use this ONLY when there is no existing PR snapshot yet:
     *   - Creating a new Production Request
     *   - Checking feasibility for a Sales Order / Work Order (not yet committed)
     */
    async calculateRequirements(
        productId: number,
        quantityToProduce: number,
        requestId?: number,
        tx?: Prisma.TransactionClient
    ): Promise<MrpResult> {
        const db = tx || prisma;
        // 1. Fetch Product & BOM
        const product = await db.product.findUnique({
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
        const stockMap = await this._buildStockMap(componentIds, tx);

        // 3. Calculate Logic
        const requirements: MaterialRequirement[] = [];
        let canProduce = true;

        for (const item of product.bom) {
            const qtyPerUnit = item.quantityNeeded;
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
     * ─── EXECUTION BRAIN ────────────────────────────────────────────────────────
     * Calculate material status from the FROZEN SNAPSHOT (ProductionRequestDetail).
     * Use this for all operations on an EXISTING Production Request:
     *   - GET /:id/requirements (view MRP for a committed PR)
     *   - Recheck feasibility (WAITING_MATERIAL → APPROVED transition)
     *   - Draft Purchase Order (shortage pre-fill)
     *
     * WHY: If master BOM changes after a PR is created, we must honour the frozen
     * requirements, not the updated BOM. This prevents ghost shortages/surpluses.
     */
    async calculateFromSnapshot(productionRequestId: number, tx?: Prisma.TransactionClient): Promise<MrpResult> {
        const db = tx || prisma;
        const pr = await db.productionRequest.findUnique({
            where: { productionRequestId },
            include: {
                product: true,
                details: {
                    include: { component: true }
                }
            }
        });

        if (!pr) throw new Error("Production Request not found");

        if (!pr.details || pr.details.length === 0) {
            // Fallback: PR was created before snapshotting was implemented.
            // Gracefully degrade to master BOM calculation so old PRs still work.
            return this.calculateRequirements(pr.productId, pr.quantity, pr.productionRequestId, tx);
        }

        const componentIds = pr.details.map(d => d.componentId);
        const stockMap = await this._buildStockMap(componentIds, tx);

        const requirements: MaterialRequirement[] = [];
        let canProduce = true;

        for (const detail of pr.details) {
            const available = stockMap.get(detail.componentId) || 0;
            const missing = Math.max(0, detail.totalRequired - available);

            if (missing > 0) canProduce = false;

            requirements.push({
                componentId: detail.componentId,
                componentCode: detail.component.code,
                componentName: detail.component.componentName,
                unit: detail.component.unit,
                quantityPerUnit: detail.quantityPerUnit,
                totalRequired: detail.totalRequired,
                availableStock: available,
                missingQuantity: missing
            });
        }

        return {
            productionRequestId,
            productId: pr.productId,
            productName: pr.product.productName,
            quantityToProduce: pr.quantity,
            canProduce,
            requirements
        };
    }

    /**
     * Run MRP for an existing Production Request — uses the snapshot when available.
     * This is the endpoint handler target for GET /:id/requirements.
     */
    async calculateForRequest(productionRequestId: number, tx?: Prisma.TransactionClient): Promise<MrpResult> {
        return this.calculateFromSnapshot(productionRequestId, tx);
    }

    // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

    /**
     * Build a Map<componentId, availableStock> across all warehouses.
     */
    private async _buildStockMap(componentIds: number[], tx?: Prisma.TransactionClient): Promise<Map<number, number>> {
        return InventoryService.getBulkComponentStock(componentIds, undefined, tx);
    }
}

export default new MrpService();
