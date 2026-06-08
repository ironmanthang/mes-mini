import api from "./api";

export type TYPE = 'COMPONENT' | 'SALES' | 'ERROR';

export interface Warehouse {
    warehouseId: number;
    warehouseName: string;
    location: string;
    warehouseType: TYPE;
    createdAt: string;
    updatedAt: string;
    code: string;
}

export interface WarehouseComponentDetail {
    warehouseId: number;
    warehouseName: string;
    warehouseType: "COMPONENT";
    location: string;
    summary: {
        totalComponents: number;
        totalLots: number;
        totalQuantity: number;
    };
    data: {
        componentId: number;
        componentCode: string;
        componentName: string;
        unit: string;
        totalCurrentQuantity: number;
        minStockLevel: number;
        status: string;
        lotCount: number;
        lots: {
            componentLotId: number;
            lotCode: string;
            initialQuantity: number;
            currentQuantity: number;
            receivedAt: string;
            poCode: string;
        } [];
    } [];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }
}

export interface WarehouseSalesDetail {
    warehouseId: number;
    warehouseName: string;
    warehouseType: "SALES";
    location: string;
    summary: {
        totalProducts: number;
        totalInstances: number;
    };
    data: {
        productId: number;
        productCode: string;
        productName: string;
        unit: string;
        inStockCount: number;
        minStockLevel: number;
        status: string;
        oldestReceivedAt: string;
        newestReceivedAt: string;
        batches: {
            batchCode: string;
            productionDate: string;
            expiryDate: string | null;
            instanceCount: number;
            workOrderCode: string;
        } [];
    } [];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }
}

export interface WarehouseErrorDetail {
    warehouseId: number;
    warehouseName: string;
    warehouseType: "ERROR";
    location: string;
    summary: {
        totalProducts: number;
        totalDefectiveInstances: number;
    };
    data: [];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const WarehouseServices = {
    getAllWarehouse: async (params?: { type?: TYPE; search?: string }) => {
        const response = await api.get<Warehouse>(`/warehouses`, { params });
        return response.data;
    },

    createWarehouse: async (data: { warehouseName: string; location?: string; warehouseType: string }) => {
        const response = await api.post<Warehouse>(`/warehouses`, data);
        return response.data;
    },

    updateWarehouse: async (id: number, data: { warehouseName: string; location?: string }) => {
        const response = await api.put<Warehouse>(`/warehouses/${id}`, data);
        return response.data;
    },

    deleteWarehouse: async (id: number) => {
        const response = await api.delete(`/warehouses/${id}`);
        return response.data;
    },

    getWarehouseDetail: async <T = WarehouseComponentDetail>(id: number, params?: { search?: string; page?: number; limit?: number }) => {
        const response = await api.get<T>(`/warehouses/${id}/stock`, { params });
        return response.data;
    },
}