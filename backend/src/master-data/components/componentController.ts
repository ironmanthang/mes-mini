import { Request, Response } from 'express';
import ComponentService from './componentService.js';

export const getAllComponents = async (req: Request, res: Response): Promise<void> => {
    try {
        const components = await ComponentService.getAllComponents(req.query as any);
        res.status(200).json(components);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getComponentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const component = await ComponentService.getComponentById(req.params.id as string);
        res.status(200).json(component);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const createComponent = async (req: Request, res: Response): Promise<void> => {
    try {
        const component = await ComponentService.createComponent(req.body);
        res.status(201).json(component);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateComponent = async (req: Request, res: Response): Promise<void> => {
    try {
        const component = await ComponentService.updateComponent(req.params.id as string, req.body);
        res.status(200).json(component);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteComponent = async (req: Request, res: Response): Promise<void> => {
    try {
        await ComponentService.deleteComponent(req.params.id as string);
        res.status(200).json({ message: 'Component deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getComponentSuppliers = async (req: Request, res: Response): Promise<void> => {
    try {
        const suppliers = await ComponentService.getComponentSuppliers(req.params.id as string);
        res.status(200).json(suppliers);
    } catch (error) {
        const err = error as Error;
        if (err.message === 'Component not found') {
            res.status(404).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: err.message });
    }
};

export const getComponentBarcode = async (req: Request, res: Response): Promise<void> => {
    try {
        const barcode = await ComponentService.getComponentBarcode(req.params.id as string);
        res.status(200).json(barcode);
    } catch (error) {
        const err = error as Error;
        if (err.message === 'Component not found') {
            res.status(404).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: err.message });
    }
};
