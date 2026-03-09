import api from "./api";

export interface PurchaseOrderDetail {
  purchaseOrderId: number;
  componentId: number;
  unitPrice: string;
  poDetailId: number;
  quantityOrdered: number;
  quantityReceived: number;
  productionRequestId: number | null;
  component: {
    componentId: number;
    componentName: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    code: string;
    minStockLevel: number;
    standardCost: string;
    unit: string;
  }
}

export interface PurchaseOrder {
  purchaseOrderId: number;
  orderDate: string;
  employeeId: number;
  supplierId: number;
  createdAt: string;
  updatedAt: string;
  deliveryTerms: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  priority: string;
  shippingCost: string;
  tax: string;
  code: string;
  totalAmount: string;
  discount: string;
  approvedAt: string | null;
  approverId: number | null;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'RECEIVED';

  supplier: {
    supplierId: number;
    supplierName: string;
    phoneNumber: string;
    email: string;
    address: string;
    code: string;
    createdAt: string;
    updatedAt: string;
  };
  
  employee: {
    fullName: string;
  };
  
  details: PurchaseOrderDetail[];
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
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'CANCELLED';
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