import api from "./api";

export interface SalesOrder {
    salesOrderId: number;
    code: string;
    status: string;
    totalAmount: number;
    agent: {
        agentName: string;
    };
    employee: {
        fullName: string;
    };
}

export interface CreateSalesOrder {
    agentId: number;
    orderDate: string;
    expectedShipDate: string;
    discount: number;
    tax: number;
    agentShippingPrice: number;
    paymentTerms: string;
    deliveryTerms: string;
    note: string;
    status: string;
    priority: string;
    details: {
        productId: number;
        quantity: number;
        salePrice: number;
    } [];
}

export interface UpdateSalesOrder {
    expectedShipDate: string;
    discount: number;
    tax: number;
    agentShippingPrice: number;
    note: string;
    priority: string;
    paymentTerms: string;
    deliveryTerms: string;
    details: {
        productId: number;
        quantity: number;
        salePrice: number;
    } [];
}

export interface SalesOrderDetail {
    salesOrderId: number;
    orderDate: string;
    employeeId: number;
    agentId: number;
    createdAt: string;
    updatedAt: string;
    approvedAt: string | null;
    approverId: number | null;
    code: string;
    deliveryTerms: string | null;
    discount: string;
    expectedShipDate: string | null;
    note: string | null;
    paymentTerms: string | null;
    priority: string;
    agentShippingPrice: string;
    tax: string;
    totalAmount: string;
    courierShippingCost: string;
    status: string;
    agent: {
        agentName: string;
        code: string;
        phoneNumber: string;
        address: string;
    };
    employee: {
        fullName: string;
    };
    approver: { fullName: string } | null;
    details: {
        salesOrderId: number;
        productId: number;
        quantity: number;
        salePrice: string;
        quantityShipped: number;
        soDetailId: number;
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

export interface ShipOrderRequest {
    shipmentItems: { 
        productId: number; 
        serialNumbers: string[] 
    }[];
    courierShippingCost?: number;
}

export const SalesOrdersServices = {
    getAllSalesOrders: async () => {
        const response = await api.get<SalesOrder[]>("/sales-orders");
        return response.data;
    },

    createNewSalesOrder: async (data: CreateSalesOrder) => {
        const response = await api.post<SalesOrder>("/sales-orders", data);
        return response.data;
    },

    getSalesOrderDetail: async (id: number) => {
        const response = await api.get<SalesOrderDetail>(`/sales-orders/${id}`);
        return response.data;
    },

    updateSalesOrder: async (id: number, data: UpdateSalesOrder) => {
        const response = await api.put<SalesOrder>(`/sales-orders/${id}`, data);
        return response.data;
    },

    deleteSalesOrder: async (id: number) => {
        const response = await api.delete<{ message: string }>(`/sales-orders/${id}`);
        return response.data;
    },

    submitSalesOrder: async (id: number) => {
        const response = await api.put<SalesOrder>(`/sales-orders/${id}/submit`);
        return response.data;
    },

    approveSalesOrder: async (id: number) => {
        const response = await api.put<any>(`/sales-orders/${id}/approve`);
        return response.data;
    },

    rejectSalesOrder: async (id: number, reason: string) => {
        const response = await api.put<SalesOrder>(`/sales-orders/${id}/reject`, { reason });
        return response.data;
    },

    startProcessing: async (id: number) => {
        const response = await api.put<SalesOrder>(`/sales-orders/${id}/start-processing`);
        return response.data;
    },

    shipOrder: async (id: number, data: ShipOrderRequest) => {
        const response = await api.post<SalesOrder>(`/sales-orders/${id}/ship`, data);
        return response.data;
    },

    cancelSalesOrder: async (id: number, reason: string) => {
        const response = await api.put<SalesOrder>(`/sales-orders/${id}/cancel`, { reason });
        return response.data;
    }
}