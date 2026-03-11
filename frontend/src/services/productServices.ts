import api from "./api";

export interface Product {
    productId: number;
    productName: string;
    categoryId: number | null;
    createdAt: string;
    updatedAt: string;
    code: string;
    unit: string;
    category: string | null;
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

export interface ProductBarcode {
    productId: number;
    code: string;
    productName: string;
    barcode: string;
    unit: string;
}

export const ProductServices = {
    getAllProducts: async () => {
        const response = await api.get<Product[]>("/products");
        return response.data;
    },

    createNewProduct: async (data: CreateNewProduct) => {
        const response = await api.post<Product>("/products", data);
        return response.data;
    },

    getProductById: async (id: number) => {
        const response = await api.get<Product>(`products/${id}`);
        return response.data;
    },

    updateProduct: async (id: number, data: UpdateProduct) => {
        const response = await api.put<Product>(`products/${id}`, data);
        return response.data;
    },

    deleteProduct: async (id: number) => {
        const response = await api.delete<{ message: string }>(`products/${id}`);
        return response.data;
    },

    getBarcodeById: async (id: number) => {
        const response = await api.get<ProductBarcode>(`products/${id}/barcode`);
        return response.data;
    }
}