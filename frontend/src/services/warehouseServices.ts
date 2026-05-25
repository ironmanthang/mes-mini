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
    }
}