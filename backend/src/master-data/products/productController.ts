import { Request, Response } from 'express';
import ProductService from './productService.js';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await ProductService.getAllProducts(req.query as any);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const product = await ProductService.getProductById(req.params.id as string);
        res.status(200).json(product);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const product = await ProductService.createProduct(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const product = await ProductService.updateProduct(req.params.id as string, req.body);
        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        await ProductService.deleteProduct(req.params.id as string);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getProductBarcode = async (req: Request, res: Response): Promise<void> => {
    try {
        const barcode = await ProductService.getProductBarcode(req.params.id as string);
        res.status(200).json(barcode);
    } catch (error) {
        const err = error as Error;
        if (err.message === 'Product not found') {
            res.status(404).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: err.message });
    }
};
