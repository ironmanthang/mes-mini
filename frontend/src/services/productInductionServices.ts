import api from "./api";

export type ProductInstanceStatus = 
    | 'PASSED_QC' 
    | 'FAILED_QC'
    | 'IN_STOCK_SALES' 
    | 'IN_STOCK_ERROR'
    | string;

export interface VerifyScanResponse {
    productInstanceId: number;
    serialNumber: string;
    status: ProductInstanceStatus;
    productId: number;
    productName: string;
    targetSalesWarehouseId: number | null;
    targetErrorWarehouseId: number | null;
}

export interface InductionResult {
    serialNumber: string;
    status: ProductInstanceStatus;
    warehouseId: number;
}

export interface InductProductsResponse {
    inducted: InductionResult[];
    totalInducted: number;
}

export interface InductProductsRequest {
    serialNumbers: string[];
}

export const ProductInductionServices = {
    inductProducts: async (serialNumbers: string[]) => {
        const payload: InductProductsRequest = { serialNumbers };
        const response = await api.post<InductProductsResponse>('/warehouse-ops/product-induction', payload);
        return response.data;
    }
};