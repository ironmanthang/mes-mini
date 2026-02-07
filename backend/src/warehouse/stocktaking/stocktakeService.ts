import prisma from '../../common/lib/prisma.js';
import type { Stocktake, StocktakeItem } from '../../generated/prisma/index.js';

interface CreateSessionData {
    warehouseId: number;
    description?: string;
}

interface UpdateCountData {
    componentId: number;
    actualQuantity: number;
    notes?: string;
}

class StocktakeService {

    // Start a new stocktake session
    async createSession(data: CreateSessionData, userId: number): Promise<Stocktake> {
        // 1. Check if active session exists
        const active = await prisma.stocktake.findFirst({
            where: {
                warehouseId: data.warehouseId,
                status: 'IN_PROGRESS'
            }
        });
        if (active) throw new Error('An active stocktake session already exists for this warehouse.');

        // 2. Generate Code
        const year = new Date().getFullYear();
        const count = await prisma.stocktake.count();
        const code = `ST-${year}-${(count + 1).toString().padStart(3, '0')}`;

        // 3. Create Session with Initial Snapshot
        // We get all components currently stocked in this warehouse
        const currentStocks = await prisma.componentStock.findMany({
            where: { warehouseId: data.warehouseId }
        });

        return prisma.stocktake.create({
            data: {
                code,
                warehouseId: data.warehouseId,
                description: data.description,
                status: 'IN_PROGRESS',
                startedAt: new Date(),
                createdBy: userId,
                items: {
                    create: currentStocks.map(s => ({
                        componentId: s.componentId,
                        systemQuantity: s.quantity,
                        actualQuantity: null // To be counted
                    }))
                }
            }
        });
    }

    async getSessionById(id: number) {
        const session = await prisma.stocktake.findUnique({
            where: { stocktakeId: id },
            include: {
                warehouse: { select: { warehouseName: true } },
                creator: { select: { fullName: true } },
                items: {
                    include: { component: { select: { code: true, componentName: true, unit: true } } },
                    orderBy: { component: { code: 'asc' } }
                }
            }
        });
        if (!session) throw new Error('Stocktake session not found');
        return session;
    }

    async updateCount(stocktakeId: number, items: UpdateCountData[]) {
        const session = await prisma.stocktake.findUnique({ where: { stocktakeId } });
        if (!session) throw new Error('Session not found');
        if (session.status !== 'IN_PROGRESS') throw new Error('Session is not IN_PROGRESS');

        // Loop update (Performance note: For large datasets, use raw SQL or createMany with conflict)
        // For Mini-MES, loop is fine.
        for (const item of items) {
            // Find existing item or create if it wasn't in stock initially (Unexpected Item)
            const existing = await prisma.stocktakeItem.findUnique({
                where: {
                    stocktakeId_componentId: {
                        stocktakeId,
                        componentId: item.componentId
                    }
                }
            });

            if (existing) {
                await prisma.stocktakeItem.update({
                    where: { stocktakeItemId: existing.stocktakeItemId },
                    data: {
                        actualQuantity: item.actualQuantity,
                        notes: item.notes
                    }
                });
            } else {
                // Determine system qty (should be 0 if not found initially)
                const currentStock = await prisma.componentStock.findUnique({
                    where: {
                        warehouseId_componentId: {
                            warehouseId: session.warehouseId,
                            componentId: item.componentId
                        }
                    }
                });

                await prisma.stocktakeItem.create({
                    data: {
                        stocktakeId,
                        componentId: item.componentId,
                        systemQuantity: currentStock ? currentStock.quantity : 0,
                        actualQuantity: item.actualQuantity,
                        notes: item.notes || 'Unexpected item found'
                    }
                });
            }
        }

        return this.getSessionById(stocktakeId);
    }

    async finalizeSession(id: number) {
        const session = await prisma.stocktake.findUnique({
            where: { stocktakeId: id },
            include: { items: true }
        });
        if (!session) throw new Error('Session not found');
        if (session.status !== 'IN_PROGRESS') throw new Error('Session is not IN_PROGRESS');

        // 1. Check for uncounted items
        const uncounted = session.items.filter(i => i.actualQuantity === null);
        if (uncounted.length > 0) {
            // Warn or auto-set to system qty? For now, we error.
            // Or better: Assume 0? No, that's dangerous.
            // Let's allow partials but requires explicit "0" for missing.
            // We'll throw error to force user to confirm all items.
            throw new Error(`There are ${uncounted.length} uncounted items. Please check all items.`);
        }

        // 2. Mark Completed
        return prisma.stocktake.update({
            where: { stocktakeId: id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        });

        // Note: We do NOT auto-adjust inventory here.
        // That is usually a separate "Approval" step (e.g., creating Inventory Adjustments).
        // For scope of this task, we stop at "Variance Report".
    }

    async getVarianceReport(id: number) {
        const session = await this.getSessionById(id);

        // Filter items with variance
        const varianceItems = session.items
            .map(item => ({
                ...item,
                variance: (item.actualQuantity || 0) - item.systemQuantity
            }))
            .filter(item => item.variance !== 0);

        return {
            ...session,
            items: varianceItems // Only return deviations
        };
    }
}

export default new StocktakeService();
