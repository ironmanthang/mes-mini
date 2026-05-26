import { Request, Response } from 'express';
import ProductCategoryService from './productCategoryService.js';

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await ProductCategoryService.getAllCategories();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await ProductCategoryService.getCategoryById(req.params.id as string);
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await ProductCategoryService.createCategory(req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await ProductCategoryService.updateCategory(req.params.id as string, req.body);
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        await ProductCategoryService.deleteCategory(req.params.id as string);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
