import prisma from '../../common/lib/prisma.js';

interface CategoryCreateData {
    categoryName: string;
    description?: string;
}

interface CategoryUpdateData {
    categoryName?: string;
    description?: string;
}

class ProductCategoryService {
    async getAllCategories() {
        return prisma.productCategory.findMany({
            orderBy: { categoryName: 'asc' }
        });
    }

    async getCategoryById(id: number | string) {
        const categoryId = typeof id === 'string' ? parseInt(id) : id;
        const category = await prisma.productCategory.findUnique({ where: { categoryId } });
        if (!category) throw new Error('Product category not found');
        return category;
    }

    async createCategory(data: CategoryCreateData) {
        const existing = await prisma.productCategory.findFirst({
            where: { categoryName: { equals: data.categoryName, mode: 'insensitive' } }
        });
        if (existing) throw new Error(`Category "${data.categoryName}" already exists.`);

        return prisma.productCategory.create({ data });
    }

    async updateCategory(id: number | string, data: CategoryUpdateData) {
        const categoryId = typeof id === 'string' ? parseInt(id) : id;
        const category = await prisma.productCategory.findUnique({ where: { categoryId } });
        if (!category) throw new Error('Product category not found');

        if (data.categoryName && data.categoryName !== category.categoryName) {
            const existing = await prisma.productCategory.findFirst({
                where: { categoryName: { equals: data.categoryName, mode: 'insensitive' } }
            });
            if (existing) throw new Error(`Category "${data.categoryName}" already exists.`);
        }

        return prisma.productCategory.update({ where: { categoryId }, data });
    }

    async deleteCategory(id: number | string) {
        const categoryId = typeof id === 'string' ? parseInt(id) : id;
        const category = await prisma.productCategory.findUnique({ where: { categoryId } });
        if (!category) throw new Error('Product category not found');

        const inUse = await prisma.product.findFirst({ where: { categoryId } });
        if (inUse) throw new Error('Cannot delete: This category is currently assigned to one or more products.');

        return prisma.productCategory.delete({ where: { categoryId } });
    }
}

export default new ProductCategoryService();
