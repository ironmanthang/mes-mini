import api from "./api";

export interface Supplier {
  supplierId: number;
  code: string;
  supplierName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierComponent {
  componentId: number;
  name: string;
  suggestedPrice?: number;
  code?: string; 
}

export interface CreateSupplierRequest {
  code: string;
  supplierName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}

export interface UpdateSupplierRequest {
  supplierName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}


export const supplierService = {
  getAllSuppliers: async () => {
    const response = await api.get<Supplier[]>("/suppliers");
    return response.data;
  },

  getSupplierById: async (id: number) => {
    const response = await api.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  createSupplier: async (data: CreateSupplierRequest) => {
    const response = await api.post<Supplier>("/suppliers", data);
    return response.data;
  },

  updateSupplier: async (id: number, data: UpdateSupplierRequest) => {
    const response = await api.put<Supplier>(`/suppliers/${id}`, data);
    return response.data;
  },

  deleteSupplier: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/suppliers/${id}`);
    return response.data;
  },

  getSupplierComponents: async (id: number) => {
    const response = await api.get<SupplierComponent[]>(`/suppliers/${id}/components`);
    return response.data;
  },

  assignComponent: async (supplierId: number, componentId: number) => {
    const response = await api.post(`/suppliers/${supplierId}/components`, { componentId });
    return response.data;
  },

  removeComponent: async (supplierId: number, componentId: number) => {
    const response = await api.delete(`/suppliers/${supplierId}/components/${componentId}`);
    return response.data;
  }
};