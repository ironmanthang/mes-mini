import api from "./api";

export type Priority = "High" | "Medium" | "Low"; 

export interface SalesOrder {
    salesOrderId: number;
    code: string;
    status: string;
    totalAmount: number;
    agent: {
        agentName: string;
    }
    employee: {
        fullName: string;
    }
}

export interface CreateSalesOrder {
    code: string;
    agentId: number;
    expectedShipDate: string;
    discount: number;
    tax: number;
    shippingCost: number;
    paymentTerms: string;
    deliveryTerms: string;
    note: string;
    priority: Priority;
    details: {
        productId: number;
        quantity: number;
        salePrice: number;
    };
}

export interface UpdateSalesOrder {
    expectedShipDate: string;
    discount: number;
    tax: number;
    shippingCost: number;
    note: string;
    priority: Priority;
    paymentTerms: string;
    deliveryTerms: string;
    status: string;
}

export const salesOrderServices = {
    getAllSalesOrders: async () => {
        const response = await api.get<SalesOrder[]>("/sales-orders");
        return response.data;
    },

    createNewSalesOrder: async (data: CreateSalesOrder) => {
        const request = await api.post<SalesOrder>("/sales-orders", data);
        return request.data;
    },

    getSalesOrderById: async (id: number) => {
        const response = await api.get<SalesOrder>(`/sales-orders/${id}`);
        return response.data;
    },

    updateSalesOrderById: async (id: number, data: UpdateSalesOrder) => {
        const request = await api.put<SalesOrder>(`/sales-orders/${id}`, data);
        return request.data;
    },

    approveSalesOrder: async (id: number) => {
        const request = await api.put<{message: string}>(`/sales-orders/${id}/approve`);
        return request.data;
    },

    submitSalesOrder: async (id: number) => {
        const request = await api.put<{message: string}>(`/sales-orders/${id}/submit`);
        return request.data;
    },

    rejectSalesOrder: async (id: number) => {
        const request = await api.put<{message: string}>(`/sales-orders/${id}/reject`);
        return request.data;
    }
}