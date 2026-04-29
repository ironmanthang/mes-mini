import api from "./api";

export type WorkOrderStatus = 'DRAFT' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';


export interface WorkOrderListItem {
    workOrderId: number;
    code: string;
    productId: number;
    quantity: number;
    status: WorkOrderStatus;
    startDate: string | null;
    endDate: string | null;
    employeeId: number;
    productionLineId: number | null;
    targetSalesWarehouseId: number | null;
    targetErrorWarehouseId: number | null;
    note: string | null;
    createDate: string;
    updatedAt: string;

    // Các relation được include trong hàm getAllWO
    product: {
        productId: number;
        productName: string;
        code: string;
        unit: string;
        shelfLifeDays: number | null;
    };
    employee: {
        fullName: string;
    };
    productionLine: {
        lineName: string;
        location: string;
    } | null;
}

export interface PaginatedWorkOrders {
    data: WorkOrderListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface WorkOrderDetail extends WorkOrderListItem {
    workOrderFulfillments: {
        productionRequestId: number;
        quantity: number;
        productionRequest: {
            code: string;
            status: string;
            quantity: number;
            dueDate: string | null;
        }
    }[];
    productionBatches: {
        productionBatchId: number;
        batchCode: string;
        productionDate: string;
        expiryDate: string | null;
        productInstances: any[]; 
    }[];
    materialRequest: {
        requestId: number;
        code: string;
        status: string;
        details: any[];
    } | null;
    targetSalesWarehouse?: {
        warehouseName: string;
        code: string;
    } | null;
    targetErrorWarehouse?: {
        warehouseName: string;
        code: string;
    } | null;
}

export interface UpdateWorkOrderRequest {
    productionLineId?: number;
    targetSalesWarehouseId?: number;
    targetErrorWarehouseId?: number;
    note?: string;
}

export interface CompleteWorkOrderRequest {
    quantityProduced: number;
    customBatchCode?: string;
    expiryDate?: string;
    targetWarehouseId?: number;
}


export const WorkOrderServices = {
    getAllWorkOrders: async (query?: { page?: number; limit?: number; status?: string }) => {
        const response = await api.get<PaginatedWorkOrders>("/work-orders", { params: query });
        return response.data;
    },

    createWorkOrder: async (data: { productionRequestId: number; productId: number; quantity: number }) => {
        const response = await api.post("/work-orders", data);
        return response.data;
    },

    getWorkOrderById: async (id: number) => {
        const response = await api.get<WorkOrderDetail>(`/work-orders/${id}`);
        return response.data;
    },

    updateWorkOrder: async (id: number, data: UpdateWorkOrderRequest) => {
        const response = await api.put<WorkOrderDetail>(`/work-orders/${id}`, data);
        return response.data;
    },

    releaseWorkOrder: async (id: number) => {
        const response = await api.put<WorkOrderDetail>(`/work-orders/${id}/release`);
        return response.data;
    },

    startWorkOrder: async (id: number) => {
        const response = await api.put<{ workOrder: WorkOrderDetail; materialRequest: any }>(`/work-orders/${id}/start`);
        return response.data;
    },

    completeWorkOrder: async (id: number, data: CompleteWorkOrderRequest) => {
        const response = await api.put<WorkOrderDetail>(`/work-orders/${id}/complete`, data);
        return response.data;
    },

    cancelWorkOrder: async (id: number, reason?: string) => {
        const response = await api.put<{ message: string }>(`/work-orders/${id}/cancel`, { reason });
        return response.data;
    }
};