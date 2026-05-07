import api from "./api";


export interface LowStockProduct {
    productId: number;
    productName: string;
    inStockCount: number;
    minStockLevel: number;
}

export interface Alert {
    severity: 'LOW_STOCK' | 'SHORTAGE' | 'RECEIVED';
    message: string;
    time: string;
}

export interface WarehouseDashboardResponse {
    finishedGoods: {
        lowStockProducts: LowStockProduct[];
        lowStockCount: number;
        totalGap: number;
    };
    components: {
        lowStockCount: number;
        totalTracked: number;
        totalGap: number;
    };
    alerts: Alert[];
}

export const WarehouseDashboardServices = {
    getMetrics: async (warehouseId?: number) => {
        const response = await api.get<WarehouseDashboardResponse>('/warehouse/dashboard', {
            params: { warehouseId }
        });
        return response.data;
    }
};