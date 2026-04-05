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

    
}