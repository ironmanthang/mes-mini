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
  };
}

export interface PurchaseOrder {
  purchaseOrderId: number;
  code: string;
  orderDate: string;
  expectedDeliveryDate: string;
  employeeId: number;
  supplierId: number;
  warehouseId: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVING' | 'COMPLETED' | 'CANCELLED';
  priority: string;
  shippingCost: string;
  taxRate: string;
  totalAmount: string;
  paymentTerms: string;
  deliveryTerms: string;
  note: string | null;
  approvedAt: string | null;
  approverId: number | null;
  createdAt: string;
  updatedAt: string;

  supplier?: {
    supplierId: number;
    supplierName: string;
    phoneNumber: string;
    email: string;
    address: string;
    code: string;
    createdAt: string;
    updatedAt: string;
  };
  
  employee?: {
    fullName: string;
  };

  approver?: {
    fullName: string;
  };
  
  details?: PurchaseOrderDetail[];
  
  _count?: {
    details: number;
  };
}

export interface ComponentLot {
  lotCode: string;
  componentId: number;
  poDetailId: number;
  warehouseId: number;
  quantity: number;
  component: { componentName: string; code: string };
  warehouse: { warehouseName: string; code: string };
}


export interface CreatePORequest {
  status?: 'DRAFT' | 'PENDING';
  supplierId: number;
  warehouseId: number;
  orderDate?: string;
  expectedDeliveryDate?: string;
  taxRate: number;
  shippingCost: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  priority?: string;
  note?: string;
  details: {
    componentId: number;
    quantity: number;
    unitPrice: number;
    productionRequestId?: number;
  }[];
}

export interface UpdatePORequest {
  expectedDeliveryDate?: string;
  warehouseId?: number;
  taxRate?: number;
  shippingCost?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  priority?: string;
  note?: string;
  details?: {
    componentId: number;
    quantity: number;
    unitPrice: number;
    productionRequestId?: number;
  }[];
}

export interface ReceiveGoodsRequest {
  items: {
    componentId: number;
    quantity: number;
    warehouseId: number;
  }[];
}

export const purchaseOrderService = {
  getAllPOs: async (params?: { page?: number; limit?: number; search?: string; status?: string; priority?: string }) => {
    const response = await api.get("/purchase-orders", { params });
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

  deletePO: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/purchase-orders/${id}`);
    return response.data;
  },

  submitPO: async (id: number) => {
    const response = await api.post<PurchaseOrder>(`/purchase-orders/${id}/submit`);
    return response.data;
  },

  approvePO: async (id: number) => {
    const response = await api.post<PurchaseOrder>(`/purchase-orders/${id}/approve`);
    return response.data;
  },

  sendToSupplier: async (id: number, data?: { note?: string }) => {
    const response = await api.post<PurchaseOrder>(`/purchase-orders/${id}/send-to-supplier`, data || {});
    return response.data;
  },

  cancelPO: async (id: number, data?: { note?: string }) => {
    const response = await api.post<PurchaseOrder>(`/purchase-orders/${id}/cancel`, data || {});
    return response.data;
  },

  receiveGoods: async (id: number, data: ReceiveGoodsRequest) => {
    const response = await api.post<{ po: PurchaseOrder; generatedLots: any[] }>(`/purchase-orders/${id}/receive`, data);
    return response.data;
  },

  getLotsByPO: async (id: number) => {
    const response = await api.get<ComponentLot[]>(`/purchase-orders/${id}/lots`);
    return response.data;
  }
};