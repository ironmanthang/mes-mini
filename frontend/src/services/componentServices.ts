import api from "./api";

export interface Component {
  componentId: number;
  code: string;
  componentName: string;
  description?: string;
  unit: string;
  minStockLevel: number;
  standardCost: number;
  currentStock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierComponent {
  componentId: number;
  name: string;
  suggestedPrice: number;
  code?: string;
  unit?: string;
  currentStock?: number;
}

export interface ComponentSupplier {
  supplierId: number;
  supplierName: string;
  code: string;
  phone?: string;
  email?: string;
}

export interface CreateComponentRequest {
  code: string;
  componentName: string;
  unit: string;
  minStockLevel?: number;
  standardCost?: number;
  description?: string;
}

export interface UpdateComponentRequest {
  componentName?: string;
  unit?: string;
  minStockLevel?: number;
  standardCost?: number;
  description?: string;
}


export const componentService = {
  getAllComponents: async (search?: string) => {
    const params = search ? { search } : {};
    const response = await api.get<Component[]>("/components", { params });
    return response.data;
  },

  getComponentById: async (id: number) => {
    const response = await api.get<Component>(`/components/${id}`);
    return response.data;
  },

  createComponent: async (data: CreateComponentRequest) => {
    const response = await api.post<Component>("/components", data);
    return response.data;
  },

  updateComponent: async (id: number, data: UpdateComponentRequest) => {
    const response = await api.put<Component>(`/components/${id}`, data);
    return response.data;
  },

  deleteComponent: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/components/${id}`);
    return response.data;
  },

  getComponentSuppliers: async (id: number) => {
    const response = await api.get<ComponentSupplier[]>(`/components/${id}/suppliers`);
    return response.data;
  }
};