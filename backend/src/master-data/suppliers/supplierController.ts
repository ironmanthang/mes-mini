import { Request, Response } from 'express';
import SupplierService from './supplierService.js';

export const getAllSuppliers = async (req: Request, res: Response): Promise<void> => {
    try {
        const suppliers = await SupplierService.getAllSuppliers(req.query as any);
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getSupplierById = async (req: Request, res: Response): Promise<void> => {
    try {
        const supplier = await SupplierService.getSupplierById(req.params.id as string);
        res.status(200).json(supplier);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
        const supplier = await SupplierService.createSupplier(req.body);
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
        const supplier = await SupplierService.updateSupplier(req.params.id as string, req.body);
        res.status(200).json(supplier);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
        await SupplierService.deleteSupplier(req.params.id as string);
        res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};


export const getSupplierComponents = async (req: Request, res: Response): Promise<void> => {
    try {
        const components = await SupplierService.getSupplierComponents(req.params.id as string);
        res.status(200).json(components);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const assignComponent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { componentId } = req.body;
        await SupplierService.assignComponentToSupplier(req.params.id as string, componentId);
        res.status(200).json({ message: 'Component assigned to supplier successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const removeComponent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { componentId } = req.params;
        await SupplierService.removeComponentFromSupplier(req.params.id as string, componentId as string);
        res.status(200).json({ message: 'Component removed from supplier' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
