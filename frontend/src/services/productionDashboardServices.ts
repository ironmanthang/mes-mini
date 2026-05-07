import api from "./api";

export interface PendingProductionRequest {
    code: string;
    productName: string;
    quantity: number;
    priority: string;
    status: string;
}

export interface CostPerUnit {
    amount: number;
    productName: string;
}

export interface ProductionDashboardResponse {
    pendingRequests: {
        count: number;
        requests: PendingProductionRequest[];
    };
    activeWorkOrders: number | null;
    qcPassRate: number | null;
    costPerUnit: CostPerUnit | null;
}

export const ProductionDashboardServices = {
    getMetrics: async () => {
        const response = await api.get<ProductionDashboardResponse>('/production/dashboard');
        return response.data;
    }
};