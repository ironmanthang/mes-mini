import prisma from '../../common/lib/prisma.js';
import type { Product } from '../../generated/prisma/index.js';
import { getPaginationParams, createPaginatedResponse, PaginationQuery, PaginatedResponse } from '../../common/utils/pagination.js';
import { generateBarcode, BarcodeType } from '../../common/utils/barcode.js';

interface ProductCreateData {
    code: string;
    productName: string;
    unit: string;
    categoryId?: number;
}

interface ProductBarcodeData {
    productId: number;
    code: string;
    productName: string;
    barcode: string;
    unit: string;
}

class ProductService {

    async getAllProducts(query: PaginationQuery): Promise<PaginatedResponse<Product>> {
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.search) {
            where.OR = [
                { productName: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } }
            ];
        }

        const [data, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: { category: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    async getProductById(id: string | number): Promise<Product> {
        const productId = typeof id === 'string' ? parseInt(id) : id;
        const product = await prisma.product.findUnique({
            where: { productId },
            include: { category: true }
        });
        if (!product) throw new Error('Product not found');
        return product;
    }

    async createProduct(data: ProductCreateData): Promise<Product> {
        const existing = await prisma.product.findUnique({ where: { code: data.code } });
        if (existing) throw new Error(`Product code "${data.code}" already exists.`);

        return prisma.product.create({
            data: data as any,
            include: { category: true }
        });
    }

    async updateProduct(id: string | number, data: Partial<ProductCreateData>): Promise<Product> {
        const productId = typeof id === 'string' ? parseInt(id) : id;
        const product = await prisma.product.findUnique({ where: { productId } });
        if (!product) throw new Error('Product not found');

        if (data.code && data.code !== product.code) {
            const exists = await prisma.product.findUnique({ where: { code: data.code } });
            if (exists) throw new Error(`Product code "${data.code}" already exists.`);
        }

        return prisma.product.update({
            where: { productId },
            data: data as any,
            include: { category: true }
        });
    }

    async deleteProduct(id: string | number): Promise<Product> {
        const productId = typeof id === 'string' ? parseInt(id) : id;

        const inSO = await prisma.salesOrderDetail.findFirst({ where: { productId } });
        if (inSO) throw new Error('Cannot delete: This product is in Sales Orders.');

        const inWO = await prisma.workOrder.findFirst({ where: { productId } });
        if (inWO) throw new Error('Cannot delete: This product is in Work Orders.');

        const inPR = await prisma.productionRequest.findFirst({ where: { productId } });
        if (inPR) throw new Error('Cannot delete: This product is in Production Requests.');

        return prisma.product.delete({ where: { productId } });
    }

    async getProductBarcode(id: string | number): Promise<ProductBarcodeData> {
        const productId = typeof id === 'string' ? parseInt(id) : id;
        const product = await prisma.product.findUnique({ where: { productId } });
        if (!product) throw new Error('Product not found');

        const barcode = generateBarcode(BarcodeType.PRODUCT, product.code);

        return {
            productId: product.productId,
            code: product.code,
            productName: product.productName,
            barcode,
            unit: product.unit
        };
    }
}

export default new ProductService();

