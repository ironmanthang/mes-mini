import api from "./api";

export interface PendingSalesOrder {
    salesOrderId: number;
    code: string;
    agentName: string;
    productName: string;
    quantity: number;
    quantityShipped: number;
    status: string;
}

export interface SalesDashboardResponse {
    pendingCount: number;
    orders: PendingSalesOrder[];
}

export const SalesDashboardServices = {
    getMetrics: async () => {
        const response = await api.get<SalesDashboardResponse>('/sales/dashboard');
        return response.data;
    }
};