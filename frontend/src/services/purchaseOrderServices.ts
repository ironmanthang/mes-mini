import api from "./api";

export interface PurchaseOrderDetail {
  poDetailId: number;
  purchaseOrderId: number;
  componentId: number;
  componentName?: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  code: number,
}

export interface PurchaseOrder {
  purchaseOrderId: number;
  code: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'RECEIVED';
  priority?: string;
  
  totalAmount: number; 
  tax: number;
  discount: number;
  shippingCost: number;
  
  expectedDeliveryDate?: string;
  orderDate: string;
  
  supplierId: number;
  supplier?: {
    supplierId: number;
    supplierName: string;
    code: string;
    email?: string;
    phone?: string;
  };
  
  employeeId: number;
  employee?: {
    employeeId: number;
    fullName: string;
  };
  
  details: PurchaseOrderDetail[];
  
  paymentTerms?: string;
  deliveryTerms?: string;
  note?: string;
}

export interface CreatePORequest {
  code: string;
  supplierId: number;
  expectedDeliveryDate?: string;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  note?: string;
  details: {
    componentId: number;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdatePORequest {
  expectedDeliveryDate?: string;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  note?: string;
  status?: 'DRAFT' | 'PENDING' | 'CANCELLED';
}


export const purchaseOrderService = {
  getAllPOs: async () => {
    const response = await api.get<PurchaseOrder[]>("/purchase-orders");
    return response.data;
  },

  getPOById: async (id: number) => {
    const response = await api.get<PurchaseOrder>(`/purchase-orders/${id}`);
    return response.data;
  },

  createPO: async (data: CreatePORequest) => {
    const response = await api.post<PurchaseOrder>("/purchase-orders", data);
    return response.data;
  },

  updatePO: async (id: number, data: UpdatePORequest) => {
    const response = await api.put<PurchaseOrder>(`/purchase-orders/${id}`, data);
    return response.data;
  },

  approvePO: async (id: number) => {
    const response = await api.put<PurchaseOrder>(`/purchase-orders/${id}/approve`);
    return response.data;
  }
};