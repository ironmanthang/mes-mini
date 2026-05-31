import prisma from '../../common/lib/prisma.js';
import { ProductInstanceStatus } from '../../generated/prisma/index.js';
import { getPaginationParams, createPaginatedResponse, PaginationQuery, PaginatedResponse } from '../../common/utils/pagination.js';

interface ProductInstanceQuery {
    status?: ProductInstanceStatus;
    productId?: number;
    warehouseId?: number;
    productionRequestId?: number;
    workOrderId?: number;
    serialNumber?: string;
    search?: string;
}

interface ProductInstanceDetail {
    productInstanceId: number;
    serialNumber: string;
    unitProductionCost: any;
    productId: number;
    productionBatchId: number;
    createdAt: Date;
    updatedAt: Date;
    status: ProductInstanceStatus;
    salesOrderId: number | null;
    warehouseId: number | null;
    receivedAt: Date | null;
    product: {
        productId: number;
        productName: string;
        code: string;
        unit: string;
        category: { categoryId: number; categoryName: string } | null;
        bom?: {
            productId: number;
            componentId: number;
            quantityNeeded: number;
            component: {
                componentId: number;
                componentName: string;
                code: string;
                description: string | null;
                unit: string;
            };
        }[];
    };
    productionBatch: {
        productionBatchId: number;
        batchCode: string;
        productionDate: Date;
        expiryDate: Date | null;
        workOrderId: number;
        workOrder: {
            workOrderId: number;
            code: string;
            status: string;
            createDate: Date;
            targetDate: Date | null;
            employee: { employeeId: number; fullName: string } | null;
            productionLine: { productionLineId: number; lineName: string; location: string | null } | null;
            targetSalesWarehouse: { warehouseId: number; warehouseName: string; code: string } | null;
            targetErrorWarehouse: { warehouseId: number; warehouseName: string; code: string } | null;
        };
        productionLine: { productionLineId: number; lineName: string; location: string | null } | null;
    };
    salesOrder: {
        salesOrderId: number;
        code: string;
        orderDate: Date;
        status: string;
        agent: { agentId: number; agentName: string } | null;
    } | null;
    warehouse: {
        warehouseId: number;
        warehouseName: string;
        warehouseType: string;
        code: string;
    } | null;
    qualityChecks: {
        qualityCheckId: number;
        checkDate: Date;
        result: string;
        checklist: { checklistId: number; checklistName: string };
        employee: { employeeId: number; fullName: string };
    }[];
    warranty: {
        warrantyId: number;
        activationDate: Date;
        expiryDate: Date;
        customer: { customerId: number; customerName: string; email: string | null } | null;
    } | null;
}

interface ProductInstanceListItem {
    productInstanceId: number;
    serialNumber: string;
    status: ProductInstanceStatus;
    createdAt: Date;
    product: {
        productId: number;
        productName: string;
        code: string;
    };
    warehouse: {
        warehouseName: string;
        code: string;
    } | null;
    productionBatch: {
        batchCode: string;
    };
}

class ProductInstanceService {

    async getAllProductInstances(query: ProductInstanceQuery & PaginationQuery): Promise<PaginatedResponse<ProductInstanceListItem>> {
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.productId) {
            where.productId = Number(query.productId);
        }
        const parsedWarehouseId = query.warehouseId ? Number(query.warehouseId) : undefined;

        if (parsedWarehouseId) {
            where.warehouseId = parsedWarehouseId;
        }

        const parsedPRId = query.productionRequestId ? Number(query.productionRequestId) : undefined;
        const parsedWOId = query.workOrderId ? Number(query.workOrderId) : undefined;

        if (parsedPRId || parsedWOId) {
            where.productionBatch = {};
            if (parsedWOId) {
                where.productionBatch.workOrderId = parsedWOId;
            }
            if (parsedPRId) {
                where.productionBatch.workOrder = {
                    workOrderFulfillments: {
                        some: {
                            productionRequestId: parsedPRId
                        }
                    }
                };
            }
        }

        if (query.serialNumber) {
            where.serialNumber = { contains: query.serialNumber, mode: 'insensitive' };
        }
        if (query.search) {
            where.OR = [
                { serialNumber: { contains: query.search, mode: 'insensitive' } },
                { product: { productName: { contains: query.search, mode: 'insensitive' } } },
                { product: { code: { contains: query.search, mode: 'insensitive' } } }
            ];
        }

        const [data, total] = await Promise.all([
            prisma.productInstance.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    productInstanceId: true,
                    serialNumber: true,
                    status: true,
                    createdAt: true,
                    product: {
                        select: {
                            productId: true,
                            productName: true,
                            code: true,
                            checklistId: true
                        }
                    },
                    warehouse: {
                        select: {
                            warehouseName: true,
                            code: true
                        }
                    },
                    productionBatch: {
                        select: {
                            batchCode: true
                        }
                    }
                }
            }),
            prisma.productInstance.count({ where })
        ]);

        return createPaginatedResponse(data as unknown as ProductInstanceListItem[], total, page, limit);
    }

    async getProductInstanceById(id: string | number): Promise<ProductInstanceDetail> {
        let instance = null;

        // Try querying by productInstanceId first if the parameter is a valid number representation
        const isNumeric = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
        if (isNumeric) {
            const instanceId = typeof id === 'string' ? parseInt(id, 10) : id;
            instance = await prisma.productInstance.findUnique({
                where: { productInstanceId: instanceId },
                include: {
                    product: { 
                        include: { 
                            category: true,
                            bom: {
                                include: {
                                    component: true
                                }
                            }
                        } 
                    },
                    productionBatch: {
                        include: {
                            workOrder: {
                                include: {
                                    employee: { select: { employeeId: true, fullName: true } },
                                    productionLine: { select: { productionLineId: true, lineName: true, location: true } },
                                    targetSalesWarehouse: { select: { warehouseId: true, warehouseName: true, code: true } },
                                    targetErrorWarehouse: { select: { warehouseId: true, warehouseName: true, code: true } }
                                }
                            },
                            productionLine: { select: { productionLineId: true, lineName: true, location: true } }
                        }
                    },
                    salesOrder: {
                        include: {
                            agent: { select: { agentId: true, agentName: true } }
                        }
                    },
                    warehouse: { select: { warehouseId: true, warehouseName: true, warehouseType: true, code: true } },
                    qualityChecks: {
                        include: {
                            checklist: { select: { checklistId: true, checklistName: true } },
                            employee: { select: { employeeId: true, fullName: true } }
                        }
                    },
                    warranty: {
                        include: {
                            customer: { select: { customerId: true, customerName: true, email: true } }
                        }
                    }
                }
            });
        }

        // If not found by primary key ID (or parameter is a serial number string), query by serialNumber
        if (!instance && typeof id === 'string') {
            instance = await prisma.productInstance.findUnique({
                where: { serialNumber: id },
                include: {
                    product: { 
                        include: { 
                            category: true,
                            bom: {
                                include: {
                                    component: true
                                }
                            }
                        } 
                    },
                    productionBatch: {
                        include: {
                            workOrder: {
                                include: {
                                    employee: { select: { employeeId: true, fullName: true } },
                                    productionLine: { select: { productionLineId: true, lineName: true, location: true } },
                                    targetSalesWarehouse: { select: { warehouseId: true, warehouseName: true, code: true } },
                                    targetErrorWarehouse: { select: { warehouseId: true, warehouseName: true, code: true } }
                                }
                            },
                            productionLine: { select: { productionLineId: true, lineName: true, location: true } }
                        }
                    },
                    salesOrder: {
                        include: {
                            agent: { select: { agentId: true, agentName: true } }
                        }
                    },
                    warehouse: { select: { warehouseId: true, warehouseName: true, warehouseType: true, code: true } },
                    qualityChecks: {
                        include: {
                            checklist: { select: { checklistId: true, checklistName: true } },
                            employee: { select: { employeeId: true, fullName: true } }
                        }
                    },
                    warranty: {
                        include: {
                            customer: { select: { customerId: true, customerName: true, email: true } }
                        }
                    }
                }
            });
        }

        if (!instance) throw new Error('Product Instance not found');
        return instance as unknown as ProductInstanceDetail;
    }
}

export default new ProductInstanceService();
