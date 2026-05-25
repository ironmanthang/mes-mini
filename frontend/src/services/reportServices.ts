import api from "./api";

export interface LinePerformanceReport {
    filters: {
        startDate: string | null;
        endDate: string | null;
        productionLineId: number | null;
        productId: number | null;
    };
    totals: {
        totalProduced: number;
        qcCompleted: number;
        passedCount: number;
        failedCount: number;
        pendingQcCount: number;
        passRate: number;
        defectRate: number;
    };
    lines: {
        productionLineId: number | null;
        lineName: string;
        location: string | null;
        totalProduced: number;
        qcCompleted: number;
        passedCount: number;
        failedCount: number;
        pendingQcCount: number;
        passRate: number;
        defectRate: number;
        products: {
            productId: number;
            productCode: string;
            productName: string;
            totalProduced: number;
            qcCompleted: number;
            passedCount: number;
            failedCount: number;
            pendingQcCount: number;
            passRate: number;
            defectRate: number;
        }[];
    }[];
}

export interface MaterialCostReport {
    filters: {
        startDate: string | null;
        endDate: string | null;
        componentId: number | null;
        supplierId: number | null;
    };
    totalMaterialCost: number;
    totalQuantityReceived: number;
    dailyBreakdown: {
        date: string;
        totalCost: number;
        quantityReceived: number;
    }[];
    componentBreakdown: {
        componentId: number;
        componentCode: string;
        componentName: string;
        totalCost: number;
        quantityReceived: number;
    }[];
    supplierBreakdown: {
        supplierId: number;
        supplierCode: string;
        supplierName: string;
        totalCost: number;
        quantityReceived: number;
    }[];
}

export interface ProductCostReport {
    filters: {
        startDate: string | null;
        endDate: string | null;
        productId: number | null;
    };
    totalProductionCost: number;
    totalMaterialCost: number;
    totalConversionCost: number;
    totalInstancesCreated: number;
    passedCount: number;
    failedCount: number;
    pendingQcCount: number;
    dailyBreakdown: {
        date: string;
        totalProductionCost: number;
        totalMaterialCost: number;
        totalConversionCost: number;
        totalInstancesCreated: number;
        passedCount: number;
        failedCount: number;
        pendingQcCount: number;
    }[];
    productBreakdown: {
        productId: number;
        productCode: string;
        productName: string;
        totalProductionCost: number;
        totalMaterialCost: number;
        totalConversionCost: number;
        totalInstancesCreated: number;
        passedCount: number;
        failedCount: number;
        pendingQcCount: number;
    }[];
}

export const ReportServices = {
    getLinePerformance: async (params?: { startDate?: string; endDate?: string; productionLineId?: number; productId?: number }) => {
        const response = await api.get<LinePerformanceReport>("/production/reports/line-performance", { params });
        return response.data;
    },

    getMaterialCosts: async (params?: { startDate?: string; endDate?: string; componentId?: number; supplierId?: number }) => {
        const response = await api.get<MaterialCostReport>("/costs/materials", { params });
        return response.data;
    },

    getProductCosts: async (params?: { startDate?: string; endDate?: string; productId?: number }) => {
        const response = await api.get<ProductCostReport>("/costs/products", { params });
        return response.data;
    },
};
