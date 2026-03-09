import api from "./api";

export interface ComponentStock {
    componentId: number;
    code: string;
    componentName: string;
    unit: string;
    totalPhysicalQuantity: number;
    totalAllocatedQuantity: number;
    availableQuantity: number;
    minStockLevel: number;
    status: string;
    warehouseStocks: {
        warehouseId: number;
        warehouseName: string;
        quantity: number;
        allocatedQuantity: number;
    } [];
}

export const InventoryServices = {
    getInventoryReport: async () => {
        const response = await api.get<ComponentStock[]>("warehouse/inventory/status");
        return response.data;
    },


}