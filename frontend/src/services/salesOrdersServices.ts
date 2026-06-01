import api from "./api";

export interface SalesOrderListItem {
    salesOrderId: number;
    code: string;
    orderDate: string;
    expectedShipDate: string | null;
    status: string;
    totalAmount: string | number;
    priority: string;
    agent: {
        agentName: string;
    };
    employee: {
        fullName: string;
    };
    details: {
        soDetailId: number;
        productId: number;
        quantity: number;
        quantityShipped: number;
        salePrice: string | number;
        product: {
            code: string;
            productName: string;
            unit: string;
        };
        productionRequests: { 
            productionRequestId: number; 
            code: string; 
            status: string; 
            quantity: number; 
        }[];
        availableStock: number;
        shortage: number;
    }[];
    hasShortage: boolean;
}

export interface PaginatedSalesOrders {
    data: SalesOrderListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface SalesOrderDetail {
    salesOrderId: number;
    code: string;
    orderDate: string;
    expectedShipDate: string | null;
    status: string;
    discount: string | number;
    agentShippingPrice: string | number;
    tax: string | number;
    totalAmount: string | number;
    courierShippingCost: string | number | null;
    paymentTerms: string | null;
    deliveryTerms: string | null;
    note: string | null;
    priority: string;
    employeeId: number;
    agentId: number;
    approvedAt: string | null;
    approverId: number | null;
    createdAt: string;
    updatedAt: string;

    agent: {
        agentName: string;
        code: string;
        phoneNumber: string;
        address: string;
    };
    employee: {
        fullName: string;
    };
    approver: { 
        fullName: string 
    } | null;
    details: {
        soDetailId: number;
        salesOrderId: number;
        productId: number;
        quantity: number;
        quantityShipped: number;
        salePrice: string | number;
        product: {
            code: string;
            productName: string;
            unit: string;
        };
        productionRequests: any[];
        availableStock: number;
        shortage: number;
    }[];
    hasShortage: boolean;
}


export interface CreateSalesOrder {
    agentId: number;
    orderDate?: string;
    expectedShipDate?: string;
    discount: number;
    tax: number;
    agentShippingPrice: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    note?: string;
    status?: string;
    priority?: string;
    details: {
        productId: number;
        quantity: number;
        salePrice: number;
    }[];
}

export interface UpdateSalesOrder {
    expectedShipDate?: string;
    discount?: number;
    tax?: number;
    agentShippingPrice?: number;
    note?: string;
    priority?: string;
    paymentTerms?: string;
    deliveryTerms?: string;
    details?: {
        productId: number;
        quantity: number;
        salePrice: number;
    }[];
}

export interface ShipOrderRequest {
    warehouseId: number;
    shipments: { 
        productId: number; 
        serialNumbers: string[] 
    }[];
    courierShippingCost?: number;
}

export interface ComponentFeasibility {
    componentId: number;
    componentName: string;
    requiredQty: number;
    availableQty: number;
    shortageQty: number;
    status: 'YELLOW' | 'RED';
}

export interface LineItemFeasibility {
    soDetailId: number;
    productId: number;
    productName: string;
    orderedQty: number;
    finishedGoodsAvailable: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
    existingPrId?: number;
    existingPrStatus?: string;
    components?: ComponentFeasibility[];
}

export interface FeasibilityResult {
    salesOrderId: number;
    salesOrderCode: string;
    overallStatus: 'GREEN' | 'YELLOW' | 'RED' | 'MIXED';
    lineItems: LineItemFeasibility[];
}

export interface PickListItem {
    productId: number;
    productName: string;
    productCode: string;
    serialNumber: string;
    warehouseId: number;
    warehouseName?: string;
    location?: string;
    receivedAt: string;
}


export const SalesOrdersServices = {
    getAllSalesOrders: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get<PaginatedSalesOrders>("/sales-orders", { params });
        return response.data;
    },

    createNewSalesOrder: async (data: CreateSalesOrder) => {
        const response = await api.post<SalesOrderDetail>("/sales-orders", data);
        return response.data;
    },

    getSalesOrderDetail: async (id: number) => {
        const response = await api.get<SalesOrderDetail>(`/sales-orders/${id}`);
        return response.data;
    },

    updateSalesOrder: async (id: number, data: UpdateSalesOrder) => {
        const response = await api.put<SalesOrderDetail>(`/sales-orders/${id}`, data);
        return response.data;
    },

    deleteSalesOrder: async (id: number) => {
        const response = await api.delete<{ message: string }>(`/sales-orders/${id}`);
        return response.data;
    },

    submitSalesOrder: async (id: number) => {
        const response = await api.put<{ message: string; result: SalesOrderDetail }>(`/sales-orders/${id}/submit`);
        return response.data.result;
    },

    approveSalesOrder: async (id: number) => {
        const response = await api.put<{ message: string; result: SalesOrderDetail & { reservedCount: number; shortage: number } }>(`/sales-orders/${id}/approve`);
        return response.data.result;
    },

    rejectSalesOrder: async (id: number, reason: string) => {
        const response = await api.put<{ message: string; result: SalesOrderDetail }>(`/sales-orders/${id}/reject`, { reason });
        return response.data.result;
    },

    startProcessing: async (id: number) => {
        const response = await api.put<{ message: string; result: SalesOrderDetail }>(`/sales-orders/${id}/process`);
        return response.data.result;
    },

    shipOrder: async (id: number, data: ShipOrderRequest) => {
        const response = await api.post<{ message: string; result: SalesOrderDetail }>(`/sales-orders/${id}/ship`, data);
        return response.data.result;
    },

    cancelSalesOrder: async (id: number, reason: string) => {
        const response = await api.put<{ message: string; result: SalesOrderDetail }>(`/sales-orders/${id}/cancel`, { reason });
        return response.data.result;
    },

    checkFeasibility: async (id: number) => {
        const response = await api.get<FeasibilityResult>(`/sales-orders/${id}/feasibility`);
        return response.data;
    },

    getPickList: async (id: number) => {
        const response = await api.get<PickListItem[]>(`/sales-orders/${id}/pick-list`);
        return response.data;
    },
};