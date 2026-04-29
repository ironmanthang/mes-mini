import prisma from '../../common/lib/prisma.js';
import {
    TransferRequestStatus,
    TransferEntityType,
    InventoryTransactionType,
    WarehouseType,
    ProductInstanceStatus
} from '../../generated/prisma/index.js';

interface TransferDetailInput {
    entityId: number;
    quantity: number;
}

interface CreateTransferData {
    sourceWarehouseId: number;
    targetWarehouseId: number;
    entityType: TransferEntityType;
    note?: string;
    details: TransferDetailInput[];
}

interface ScannedLot {
    lotCode: string;
    quantity: number;
}

interface ScannedInstance {
    serialNumber: string;
}

interface ScannedItem {
    detailId: number;
    lots?: ScannedLot[];
    instances?: ScannedInstance[];
}

interface CompleteTransferData {
    scannedItems: ScannedItem[];
}

class TransferRequestService {

    private generateCode(): string {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `TR-${yyyy}${mm}${dd}-${random}`;
    }

    async createTransferRequest(data: CreateTransferData, _userId: number) {
        const { sourceWarehouseId, targetWarehouseId, entityType, note, details } = data;

        if (sourceWarehouseId === targetWarehouseId) {
            throw new Error('Source and target warehouse cannot be the same.');
        }

        if (!details || details.length === 0) {
            throw new Error('At least one detail line is required.');
        }

        // Validate warehouses exist and are compatible
        const [sourceWH, targetWH] = await Promise.all([
            prisma.warehouse.findUnique({ where: { warehouseId: sourceWarehouseId } }),
            prisma.warehouse.findUnique({ where: { warehouseId: targetWarehouseId } })
        ]);

        if (!sourceWH) throw new Error(`Source warehouse ID ${sourceWarehouseId} not found.`);
        if (!targetWH) throw new Error(`Target warehouse ID ${targetWarehouseId} not found.`);

        // Warehouse type compatibility
        if (entityType === TransferEntityType.COMPONENT) {
            if (sourceWH.warehouseType !== WarehouseType.COMPONENT) {
                throw new Error(`Source warehouse must be COMPONENT type for component transfers. Got: ${sourceWH.warehouseType}`);
            }
            if (targetWH.warehouseType !== WarehouseType.COMPONENT) {
                throw new Error(`Target warehouse must be COMPONENT type for component transfers. Got: ${targetWH.warehouseType}`);
            }
        } else {
            if (sourceWH.warehouseType !== WarehouseType.SALES) {
                throw new Error(`Source warehouse must be SALES type for product transfers. Got: ${sourceWH.warehouseType}`);
            }
            if (targetWH.warehouseType !== WarehouseType.SALES) {
                throw new Error(`Target warehouse must be SALES type for product transfers. Got: ${targetWH.warehouseType}`);
            }
        }

        // Validate entity IDs exist
        for (const detail of details) {
            if (detail.quantity <= 0) throw new Error(`Quantity must be greater than 0 for entity ID ${detail.entityId}.`);

            if (entityType === TransferEntityType.COMPONENT) {
                const component = await prisma.component.findUnique({ where: { componentId: detail.entityId } });
                if (!component) throw new Error(`Component ID ${detail.entityId} not found.`);
            } else {
                const product = await prisma.product.findUnique({ where: { productId: detail.entityId } });
                if (!product) throw new Error(`Product ID ${detail.entityId} not found.`);
            }
        }

        let code = this.generateCode();
        let retries = 3;

        while (retries > 0) {
            try {
                return await prisma.transferRequest.create({
                    data: {
                        code,
                        sourceWarehouseId,
                        targetWarehouseId,
                        entityType,
                        note,
                        status: TransferRequestStatus.PENDING,
                        details: {
                            create: details.map(d => ({
                                entityId: d.entityId,
                                quantity: d.quantity
                            }))
                        }
                    },
                    include: {
                        details: true,
                        sourceWarehouse: { select: { warehouseName: true, code: true } },
                        targetWarehouse: { select: { warehouseName: true, code: true } }
                    }
                });
            } catch (error: any) {
                if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
                    code = this.generateCode();
                    retries--;
                } else {
                    throw error;
                }
            }
        }
        throw new Error('Failed to generate unique Transfer Request code after multiple retries.');
    }

    async completeTransferRequest(id: number, data: CompleteTransferData, userId: number) {
        return prisma.$transaction(async (tx) => {
            const tr = await tx.transferRequest.findUnique({
                where: { transferRequestId: id },
                include: {
                    details: {
                        include: {
                            transferLots: true,
                            transferInstances: true
                        }
                    }
                }
            });

            if (!tr) throw new Error('Transfer Request not found.');
            if (tr.status !== TransferRequestStatus.PENDING) {
                throw new Error(`Cannot complete. Transfer Request status is ${tr.status}.`);
            }

            const { scannedItems } = data;
            if (!scannedItems || scannedItems.length === 0) {
                throw new Error('Scanned items are required to complete a transfer.');
            }

            // Build a lookup for quick detail access
            const detailMap = new Map(tr.details.map(d => [d.detailId, d]));

            // Validate all scanned detail IDs belong to this transfer
            for (const item of scannedItems) {
                if (!detailMap.has(item.detailId)) {
                    throw new Error(`Detail ID ${item.detailId} does not belong to this Transfer Request.`);
                }
            }

            // Ensure every detail line has a scanned item
            for (const detail of tr.details) {
                const scanned = scannedItems.find(s => s.detailId === detail.detailId);
                if (!scanned) {
                    throw new Error(`Missing scanned items for detail ID ${detail.detailId} (entity ID ${detail.entityId}).`);
                }
            }

            if (tr.entityType === TransferEntityType.COMPONENT) {
                await this.processComponentTransfer(tx, tr, scannedItems, userId);
            } else {
                await this.processProductTransfer(tx, tr, scannedItems, userId);
            }

            // Mark as COMPLETED
            const completed = await tx.transferRequest.update({
                where: { transferRequestId: id },
                data: { status: TransferRequestStatus.COMPLETED },
                include: {
                    details: {
                        include: {
                            transferLots: { include: { componentLot: true } },
                            transferInstances: { include: { productInstance: true } }
                        }
                    },
                    sourceWarehouse: { select: { warehouseName: true, code: true } },
                    targetWarehouse: { select: { warehouseName: true, code: true } }
                }
            });

            return completed;
        });
    }

    private async processComponentTransfer(
        tx: any,
        tr: any,
        scannedItems: ScannedItem[],
        userId: number
    ) {
        for (const item of scannedItems) {
            const detail = tr.details.find((d: any) => d.detailId === item.detailId);
            if (!item.lots || item.lots.length === 0) {
                throw new Error(`Component transfers require scanned lots for detail ID ${item.detailId}.`);
            }

            // Validate total scanned quantity matches expected
            const totalScanned = item.lots.reduce((sum, l) => sum + l.quantity, 0);
            if (totalScanned !== detail.quantity) {
                throw new Error(
                    `Scanned lot quantities (${totalScanned}) do not match expected quantity (${detail.quantity}) ` +
                    `for detail ID ${item.detailId}.`
                );
            }

            for (const lot of item.lots) {
                if (lot.quantity <= 0) throw new Error(`Lot ${lot.lotCode} must have a positive quantity.`);

                const dbLot = await tx.componentLot.findUnique({ where: { lotCode: lot.lotCode } });
                if (!dbLot) throw new Error(`Lot ${lot.lotCode} not found.`);
                if (dbLot.warehouseId !== tr.sourceWarehouseId) {
                    throw new Error(`Lot ${lot.lotCode} is not in the source warehouse (expected WH ID ${tr.sourceWarehouseId}).`);
                }
                if (dbLot.componentId !== detail.entityId) {
                    throw new Error(`Lot ${lot.lotCode} does not contain component ID ${detail.entityId}.`);
                }
                if (dbLot.currentQuantity < lot.quantity) {
                    throw new Error(`Lot ${lot.lotCode} has insufficient quantity. Needed: ${lot.quantity}, Available: ${dbLot.currentQuantity}`);
                }

                // Move lot to target warehouse
                await tx.componentLot.update({
                    where: { lotCode: lot.lotCode },
                    data: { warehouseId: tr.targetWarehouseId }
                });

                // Create bridging record
                await tx.transferRequestLot.create({
                    data: {
                        transferDetailId: item.detailId,
                        componentLotId: dbLot.componentLotId,
                        quantity: lot.quantity
                    }
                });

                // Decrement source ComponentStock
                const decremented = await tx.componentStock.updateMany({
                    where: {
                        warehouseId: tr.sourceWarehouseId,
                        componentId: detail.entityId,
                        quantity: { gte: lot.quantity }
                    },
                    data: { quantity: { decrement: lot.quantity } }
                });
                if (decremented.count === 0) {
                    throw new Error(`Concurrent stock update detected for Component ID ${detail.entityId} in source warehouse.`);
                }

                // Increment target ComponentStock (upsert)
                await tx.componentStock.upsert({
                    where: {
                        warehouseId_componentId: {
                            warehouseId: tr.targetWarehouseId,
                            componentId: detail.entityId
                        }
                    },
                    create: {
                        warehouseId: tr.targetWarehouseId,
                        componentId: detail.entityId,
                        quantity: lot.quantity
                    },
                    update: {
                        quantity: { increment: lot.quantity }
                    }
                });

                // Create InventoryTransaction
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: InventoryTransactionType.TRANSFER,
                        quantity: lot.quantity,
                        componentId: detail.entityId,
                        componentLotId: dbLot.componentLotId,
                        warehouseId: tr.targetWarehouseId,
                        employeeId: userId,
                        note: `Transfer ${tr.code}: Lot ${lot.lotCode} moved from WH ${tr.sourceWarehouseId} to WH ${tr.targetWarehouseId}`
                    }
                });
            }
        }
    }

    private async processProductTransfer(
        tx: any,
        tr: any,
        scannedItems: ScannedItem[],
        userId: number
    ) {
        for (const item of scannedItems) {
            const detail = tr.details.find((d: any) => d.detailId === item.detailId);
            if (!item.instances || item.instances.length === 0) {
                throw new Error(`Product transfers require scanned serial numbers for detail ID ${item.detailId}.`);
            }

            if (item.instances.length !== detail.quantity) {
                throw new Error(
                    `Scanned instance count (${item.instances.length}) does not match expected quantity (${detail.quantity}) ` +
                    `for detail ID ${item.detailId}.`
                );
            }

            for (const inst of item.instances) {
                const dbInstance = await tx.productInstance.findUnique({
                    where: { serialNumber: inst.serialNumber }
                });

                if (!dbInstance) throw new Error(`Product instance with serial number ${inst.serialNumber} not found.`);
                if (dbInstance.productId !== detail.entityId) {
                    throw new Error(`Instance ${inst.serialNumber} does not match product ID ${detail.entityId}.`);
                }
                if (dbInstance.warehouseId !== tr.sourceWarehouseId) {
                    throw new Error(`Instance ${inst.serialNumber} is not in the source warehouse (expected WH ID ${tr.sourceWarehouseId}).`);
                }
                if (dbInstance.status !== ProductInstanceStatus.IN_STOCK_SALES) {
                    throw new Error(`Instance ${inst.serialNumber} is not in IN_STOCK_SALES status (current: ${dbInstance.status}). Only IN_STOCK_SALES products can be transferred.`);
                }

                // Move instance to target warehouse
                await tx.productInstance.update({
                    where: { serialNumber: inst.serialNumber },
                    data: { warehouseId: tr.targetWarehouseId }
                });

                // Create bridging record
                await tx.transferRequestInstance.create({
                    data: {
                        transferDetailId: item.detailId,
                        productInstanceId: dbInstance.productInstanceId
                    }
                });

                // Create InventoryTransaction
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: InventoryTransactionType.TRANSFER,
                        quantity: 1,
                        productInstanceId: dbInstance.productInstanceId,
                        warehouseId: tr.targetWarehouseId,
                        employeeId: userId,
                        note: `Transfer ${tr.code}: SN ${inst.serialNumber} moved from WH ${tr.sourceWarehouseId} to WH ${tr.targetWarehouseId}`
                    }
                });
            }
        }
    }

    async getAll(query: { page?: number; limit?: number; status?: string } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.status) {
            const status = String(query.status).toUpperCase();
            if (!Object.values(TransferRequestStatus).includes(status as TransferRequestStatus)) {
                throw new Error(`Invalid Transfer Request status: ${query.status}`);
            }
            where.status = status as TransferRequestStatus;
        }

        const [data, total] = await Promise.all([
            prisma.transferRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { requestDate: 'desc' },
                include: {
                    sourceWarehouse: { select: { warehouseName: true, code: true } },
                    targetWarehouse: { select: { warehouseName: true, code: true } },
                    _count: { select: { details: true } }
                }
            }),
            prisma.transferRequest.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    async getById(id: number) {
        const tr = await prisma.transferRequest.findUnique({
            where: { transferRequestId: id },
            include: {
                sourceWarehouse: { select: { warehouseName: true, code: true, warehouseType: true } },
                targetWarehouse: { select: { warehouseName: true, code: true, warehouseType: true } },
                details: {
                    include: {
                        transferLots: {
                            include: {
                                componentLot: {
                                    select: { lotCode: true, componentId: true, currentQuantity: true }
                                }
                            }
                        },
                        transferInstances: {
                            include: {
                                productInstance: {
                                    select: { serialNumber: true, productId: true, status: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!tr) throw new Error('Transfer Request not found.');
        return tr;
    }
}

export default new TransferRequestService();
