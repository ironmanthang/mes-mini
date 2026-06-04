import api from "./api";

export interface PurchaseOrderDetail {
  purchaseOrderId: number;
  orderDate: string;
  employeeId: number;
  suplierId: number;
  createdAt: string;
  updatedAt: string;
  deliveryTerms: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  shippingCost: string;
  tax: string;
  code: string;
  totalAmount: string;
  discount: string;
  approvedAt: string;
  approverId: number;
  status: "ORDERED" | "RECEIVING" | "DRAFT" | "PENDING_APPROVAL" | "CANCELLED" | "COMPLETED";
  supplier: {
    supplierId: number;
    supplierName: string;
    phoneNumber: string;
    email: string;
    address: string;
    createdAt: string;
    updatedAt: string;
    code: string;
  }
  employee: {
    fullName: string;
  }
  approver: {
    fullName: string;
  }
  details: {
    purchaseOrderDetailId: number;
    componentId: number;
    unitPrice: string;
    poDetailId: number;
    quantityOrdered: number;
    quantityReceived: number;
    productRequestId: number | null;
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
  } [];
}

export interface PurchaseOrder {
  purchaseOrderId: number;
  orderDate: string;
  expectedDeliveryDate: string;
  priority: string;
  code: string;
  totalAmount: string;
  status: "ORDERED" | "RECEIVING" | "DRAFT" | "PENDING" | "COMPLETED" | "CANCELLED";

  supplier: {
    supplierName: string;
    code: string;
  };
  
  employee: {
    fullName: string;
  };

  _count: {
    details: number;
  }
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

export interface PurchaseOrderResponse {
  data: PurchaseOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}


export const purchaseOrderService = {
  getAllPOs: async () => {
    const response = await api.get<PurchaseOrderResponse>("/purchase-orders");
    return response.data;
  },

  getPOById: async (id: number) => {
    const response = await api.get<PurchaseOrderDetail>(`/purchase-orders/${id}`);
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