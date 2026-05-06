import api from "./api";

export type Status = "PENDING" | "ISSUED" | "CANCELLED";

export interface MaterialRequestDetail {
    componentId: number;
    quantity: number;
    component: {
        code: string;
        componentName: string;
        unit: string;
    }
}

export interface MaterialRequest {
    requestId: number;
    code: string;
    requestDate: string;
    status: Status;
    note: string;
    workOrderId: number;
    completedById: null | number;
    completedAt: null | string;
    workOrder: {
        code: string;
        product?: {
            productName: string;
            code: string;
        }
    }
    completedBy: null | { fullName: string };
    _count: {
        details: number;
    };
    details?: MaterialRequestDetail[]; // Dùng khi gọi getById
}

export interface LotInfo {
    lotCode: string;
    currentQuantity: number;
}

export interface ValidationLine {
    componentId: number;
    componentCode: string;
    componentName: string;
    unit: string;
    requiredQuantity: number;
    availableQuantity: number;
    missingQuantity: number;
    isSufficient: boolean;
    availableLots: LotInfo[];
}

export interface ValidateMaterialResponse {
    requestId: number;
    code: string;
    status: Status;
    warehouseId: number;
    canIssue: boolean;
    lines: ValidationLine[];
}

// --- INTERFACES CHO COMPLETE API (XUẤT KHO) ---
export interface LotConsumption {
    componentId: number;
    lotCode: string;
    quantity: number;
}

export interface CompleteMaterialPayload {
    warehouseId: number;
    consumedLots: LotConsumption[];
}

export interface DispatchSlip {
    slipNumber: string;
    status: Status;
    requestDate: string;
    workOrder: string;
    product: string;
    productCode: string;
    requester: string;
    approver: string;
    items: {
        code: string;
        name: string;
        unit: string;
        quantity: number;
    }[];
    totalItems: number;
    generatedAt: string;
}

export const MaterialRequestServices = {
    getAllMaterialRequests: async (params?: { page?: number; limit?: number; status?: Status }) => {
        const response = await api.get<{ data: MaterialRequest[], total: number }>('/warehouse-ops/material-requests', { params });
        return response.data;
    },

    createFromWorkOrder: async (woId: number) => {
    const response = await api.post<{ workOrderId: number }>(`/warehouse-ops/material-requests`, {
        workOrderId: woId 
    });
    return response.data;
},

    getMaterialRequestById: async (id: number) => {
        const response = await api.get<MaterialRequest>(`/warehouse-ops/material-requests/${id}`);
        return response.data;
    },

    validateMaterial: async (id: number, warehouseId: number) => {
        const response = await api.put<ValidateMaterialResponse>(`/warehouse-ops/material-requests/${id}/validate`, { warehouseId });
        return response.data;
    },

    completeMaterialIssue: async (id: number, payload: CompleteMaterialPayload) => {
        const response = await api.put<{ message: string }>(`/warehouse-ops/material-requests/${id}/complete`, payload);
        return response.data;
    },

    getDispatchSlip: async (id: number) => {
        const response = await api.get<DispatchSlip>(`/warehouse-ops/material-requests/${id}/dispatch-slip`);
        return response.data;
    }
};