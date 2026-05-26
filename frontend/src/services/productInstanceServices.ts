import api from "./api";

export type ProductInstanceStatus = 
    | 'PENDING_QC' 
    | 'IN_STOCK_SALES' 
    | 'IN_STOCK_ERROR'
    | 'SHIPPED' 
    | 'DEFECTIVE' 
    | 'WARRANTY' 
    | string;

export interface ProductInstanceQuery {
    status?: ProductInstanceStatus;
    productId?: number;
    warehouseId?: number;
    serialNumber?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface ProductInstanceListItem {
    productInstanceId: number;
    serialNumber: string;
    status: ProductInstanceStatus;
    createdAt: string;
    product: {
        productId: number;
        productName: string;
        code: string;
        checklistId?: number | null;
    };
    warehouse: {
        warehouseName: string;
        code: string;
    } | null;
    productionBatch: {
        batchCode: string;
    };
}

export interface PaginatedProductInstances {
    data: ProductInstanceListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface ProductInstanceDetail {
    productInstanceId: number;
    serialNumber: string;
    unitProductionCost: string | number;
    productId: number;
    productionBatchId: number;
    createdAt: string;
    updatedAt: string;
    status: ProductInstanceStatus;
    salesOrderId: number | null;
    warehouseId: number | null;
    receivedAt: string | null;
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
        productionDate: string;
        expiryDate: string | null;
        workOrderId: number;
        workOrder: {
            workOrderId: number;
            code: string;
            status: string;
            createDate: string;
            targetDate: string | null;
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
        orderDate: string;
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
        checkDate: string;
        result: string;
        checklist: { checklistId: number; checklistName: string };
        employee: { employeeId: number; fullName: string };
    }[];
    warranty: {
        warrantyId: number;
        activationDate: string;
        expiryDate: string;
        customer: { customerId: number; customerName: string; email: string | null } | null;
    } | null;
}

export const ProductInstanceServices = {
    getAllProductInstances: async (query?: ProductInstanceQuery) => {
        const response = await api.get<PaginatedProductInstances>('/product-instances', { 
            params: query 
        });
        return response.data;
    },

    getProductInstanceById: async (id: number | string) => {
        const response = await api.get<ProductInstanceDetail>(`/product-instances/${id}`);
        return response.data;
    },

    inductProducts: async (serialNumbers: string[]) => {
        const response = await api.post<{ inducted: any[]; totalInducted: number }>('/warehouse-ops/product-induction', {
            serialNumbers
        });
        return response.data;
    }
};