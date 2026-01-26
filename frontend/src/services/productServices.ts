import api from "./api";

export interface Product {
    productId: number;
    categoryId: number;
    code: string;
    createdAt: string;
    productName: string;
    unit: string;
    updatedAt: string;
}

export interface CreateNewProduct {
    code: string;
    productName: string;
    unit: string;
}

export interface UpdateProduct {
    code: string;
    productName: string;
    unit: string;
    categoryId: number;
}

export const productServices = {
    getAllProducts: async () => {
        const response = await api.get<Product[]>("/products");
        return response.data;
    },

    getProductById: async (id: number) => {
        const response = await api.get<Product>(`/products/${id}`);
        return response.data;
    },

    createNewProduct: async (data: CreateNewProduct) => {
        const request = await api.put<Product>("/products", data);
        return request.data;
    },

    updateProductById: async (id: number, data: UpdateProduct) => {
        const request = await api.put<Product>(`/products/${id}`, data);
        return request.data;
    },

    deleteProductById: async (id: number) => {
        const request = await api.delete<{message: string}>(`/products/${id}`);
        return request.data;
    },
}