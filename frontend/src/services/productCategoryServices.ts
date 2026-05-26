import api from "./api";

export interface ProductCategory {
    categoryId: number;
    categoryName: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export const ProductCategoryServices = {
    getAllCategories: async (): Promise<ProductCategory[]> => {
        const response = await api.get<ProductCategory[]>('/master-data/product-categories');
        const data = response.data;
        return Array.isArray(data) ? data : (data as any).data || [];
    },

    createCategory: async (payload: { categoryName: string; description?: string }): Promise<ProductCategory> => {
        const response = await api.post<ProductCategory>('/master-data/product-categories', payload);
        return response.data;
    },

    updateCategory: async (id: number, payload: { categoryName?: string; description?: string }): Promise<ProductCategory> => {
        const response = await api.put<ProductCategory>(`/master-data/product-categories/${id}`, payload);
        return response.data;
    },

    deleteCategory: async (id: number): Promise<void> => {
        await api.delete(`/master-data/product-categories/${id}`);
    }
};

