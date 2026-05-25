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
    targetDate: string | null;
    employeeId: number;
    productionLineId: number | null;
    targetSalesWarehouseId: number | null;
    targetErrorWarehouseId: number | null;
    note: string | null;
    createDate: string;
    createdAt: string;
    updatedAt: string;

    product: {
        productId: number;
        productName: string;
        categoryId: number | null;
        minStockLevel: number | null;
        code: string;
        unit: string;
        warrantyPeriodDays: number | null;
        shelfLifeDays: number | null;
        createdAt: string;
        updatedAt: string;
    };
    
    employee: {
        fullName: string;
    };
    
    productionLine: {
        lineName: string;
        location: string;
    } | null;
    
    materialRequest: {
        status: string;
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
        workOrderId: number;
        productionRequestId: number;
        quantity: number;
        fulfilledQuantity: number;
        productionRequest: {
            productionRequestId: number;
            quantity: number;
            employeeId: number;
            productId: number;
            createdAt: string;
            updatedAt: string;
            priority: string;
            code: string;
            soDetailId: number | null;
            status: string;
            dueDate: string | null;
            note: string | null;
            approverId: number | null;
            approvedAt: string | null;
        };
    }[];
    
    productionBatches: {
        productionBatchId: number;
        batchCode: string;
        productionDate: string;
        expiryDate: string | null;
        workOrderId: number;
        productionLineId: number | null;
        createdAt: string;
        updatedAt: string;
        productInstances: {
            productInstanceId: number;
            serialNumber: string;
            unitProductionCost: string; 
            productId: number;
            productionBatchId: number;
            createdAt: string;
            updatedAt: string;
            status: string;
            salesOrderId: number | null;
            warehouseId: number | null;
            receivedAt: string | null;
        }[];
    }[];
    
    materialRequest: {
        requestId: number;
        code: string;
        requestDate: string;
        status: string;
        note: string | null;
        workOrderId: number;
        completedById: number | null;
        completedAt: string | null;
        details: {
            detailId: number;
            requestId: number;
            componentId: number;
            quantity: number;
        }[];
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

// ─────────────────────────────────────────────
// INTERFACES (Requests / Payloads)
// ─────────────────────────────────────────────
export interface CreateWorkOrderRequest {
    productionRequestId: number;
    productId: number;
    quantity: number;
    productionLineId?: number; // Cập nhật thêm thuộc tính này từ Backend
}

export interface CreateBulkWorkOrderRequest {
    productionRequestIds: number[];
    quantities?: Record<number, number>; // Map của RequestId -> Quantity (để chia tách lệnh)
    productionLineId?: number;
}

export interface UpdateWorkOrderRequest {
    productionLineId?: number;
    targetSalesWarehouseId?: number;
    targetErrorWarehouseId?: number;
    note?: string;
}

export interface CompleteWorkOrderRequest {
    quantityProduced: number;
    batchCode: string;
    expiryDate: string | Date;
    warehouseId: number;
    laborCost: number;
    overheadCost: number;
}

export const WorkOrderServices = {
    getAllWorkOrders: async (query?: { page?: number; limit?: number; status?: string; missingMR?: boolean }) => {
        const response = await api.get<PaginatedWorkOrders>("/work-orders", { params: query });
        return response.data;
    },

    createWorkOrder: async (data: CreateWorkOrderRequest) => {
        const response = await api.post("/work-orders", data);
        return response.data;
    },

    createBulkWorkOrder: async (data: CreateBulkWorkOrderRequest) => {
        const response = await api.post("/work-orders/bulk", data);
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