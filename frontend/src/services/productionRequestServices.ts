import api from "./api";

export type PRPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type PRStatus = 'WAITING_MATERIAL' | 'APPROVED' | 'IN_PROGRESS' | 'FULFILLED' | 'CANCELLED';

export interface ProductionRequest {
    productionRequestId: number;
    requestDate: string;
    quantity: number;
    employeeId: number;
    productId: number;
    createdAt: string;
    updatedAt: string;
    code: string;
    soDetailId: number | null;
    priority: PRPriority;
    status: PRStatus;
    dueDate: string | null;
    note: string | null;
    
    product: {
        productId: number;
        productName: string;
        categoryId: number | null;
        createdAt: string;
        updatedAt: string;
        code: string;
        unit: string;
    };
    salesOrderDetail: {
        salesOrder: {
            code: string;
        }
    } | null;
    employee: {
        fullName: string;
    }
}

export interface PaginatedProductionRequests {
    data: ProductionRequest[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateProductionRequest {
    productId: number;
    quantity: number;
    priority?: PRPriority;
    dueDate?: string;
    soDetailId?: number;
    note: string;
}

export interface DraftPurchaseOrderResponse {
    productionRequestId: number;
    productionRequestCode: string;
    productId: number;
    productName: string;
    components: {
        componentId: number;
        componentCode: string;
        componentName: string;
        unit: string;
        shortageQty: number;
        requiredQty: number;
        availableQty: number;
    }[];
}

export interface ProductionRequestById extends ProductionRequest {
    workOrderFulfillments: {
        workOrder: any;
    }[];
    purchaseOrderDetails: {
        component: {
            componentId: number;
            componentName: string;
            code: string;
            unit: string;
        };
        purchaseOrder: {
            code: string;
            status: string;
        };
    }[];
    details: {
        component: {
            code: string;
            componentName: string;
            unit: string;
        };
        quantityPerUnit: number;
        totalRequired: number;
    }[];
}

export const ProductionRequestServices = {
    getAllProductionRequests: async (query?: { page?: number; limit?: number; status?: string }) => {
        const response = await api.get<PaginatedProductionRequests>("/production-requests", { params: query });
        return response.data;
    },

    getProductionRequestById: async (id: number) => {
        const response = await api.get<ProductionRequestById>(`/production-requests/${id}`);
        return response.data;
    },

    createNewProductionRequest: async (data: CreateProductionRequest) => {
        const response = await api.post<{ mrpResult: any } & ProductionRequest>("/production-requests", data);
        return response.data;
    },

    getDraftPurchaseOrder: async (id: number) => {
        const response = await api.get<DraftPurchaseOrderResponse>(`/production-requests/${id}/draft-purchase-order`);
        return response.data;
    },

    recheckFeasibility: async (id: number) => {
        const response = await api.put<{ transitioned: boolean, mrpResult: any } & ProductionRequest>(`/production-requests/${id}/recheck`);
        return response.data;
    },

    cancelProductionRequest: async (id: number, reason: string) => {
        const response = await api.put<ProductionRequest>(`/production-requests/${id}/cancel`, { reason });
        return response.data;
    },

    convertToWorkOrder: async (requestIds: number[], productionLineId: number) => {
        const response = await api.post("/production-requests/convert-to-work-order", {
            requestIds,
            productionLineId
        });
        return response.data;
    }
};