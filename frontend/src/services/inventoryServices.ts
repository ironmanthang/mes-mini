import api from "./api";

export type ItemType = 'COMPONENT' | 'PRODUCT';

export interface WarehouseStock {
    warehouseId: number;
    warehouseName: string;
    quantity: number;
}

export interface InventoryStatusItem {
    componentId: number;
    code: string;
    componentName: string;
    unit: string;
    availableQuantity: number;
    minStockLevel: number;
    status: 'LOW_STOCK' | 'OK';
    warehouseStocks: WarehouseStock[];
}

export interface PaginatedInventoryStatus {
    data: InventoryStatusItem[];
    total: number;
    page: number;
    limit: number;
}

export interface LowStockItem {
    id: number;
    type: ItemType;
    code: string;
    name: string;
    currentStock: number;
    minStock: number;
    gap: number;
}

export interface DetailedStockStatus {
    id: number;
    type: ItemType;
    name: string;
    code: string;
    minStockLevel: number;
    totalInStock?: number; 
    availableQuantity?: number; 
    breakdown: WarehouseStock[];
}


export const InventoryServices = {
    getConsolidatedInventory: async (params?: { search?: string; warehouseId?: number; page?: number; limit?: number }) => {
        const response = await api.get<PaginatedInventoryStatus>(`/warehouse-ops/inventory/status`, { params });
        return response.data;
    },

    getUnifiedLowStock: async (params?: { warehouseId?: number }) => {
        const response = await api.get<LowStockItem[]>(`/warehouse-ops/inventory/low-stock-details`, { params });
        return response.data;
    },

    getDetailedItemStockStatus: async (params: { id: number; type: ItemType; warehouseId?: number }) => {
        const response = await api.get<DetailedStockStatus>(`/warehouse-ops/inventory/stock-status`, { params });
        return response.data;
    }
};