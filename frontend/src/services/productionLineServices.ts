import api from "./api";

export interface ProductionLine {
    productionLineId: number;
    lineName: string;
    location: string;
    createAt: string;
    updatedAt: string;
    _count: {
        workOrders: number;
        productionBatches: number;
    }
}

export interface CreateProductionLine {
    lineName: string;
    location: string;
}

export interface ProductionLineById {
    productionLineId: number;
    lineName: string;
    location: string;
    createAt: string;
    updatedAt: string;
    workOrders: [];
    _count: {
        workOrders: number;
        productionBatches: number;
    }
}

export const ProductionLineServices = {
    getAllProductionLines: async () => {
        const response = await api.get<ProductionLine[]>("/production/lines");
        return response.data;
    },

    createNewProductionLine: async (data: CreateProductionLine) => {
        const response = await api.post<ProductionLine>("/production/lines", data);
        return response.data;
    },

    getProductionLineById: async (id: number) => {
        const response = await api.get<ProductionLineById>(`production/lines/${id}`);
        return response.data;
    },

    updateProductionLine: async (id: number, data: CreateProductionLine) => {
        const response = await api.put<ProductionLineById>(`production/lines/${id}`, data);
        return response.data;
    },

    deleteProductionLine: async (id: number) => {
        const response = await api.delete<{ message: string }>(`production/lines/${id}`);
        return response.data;
    },

}