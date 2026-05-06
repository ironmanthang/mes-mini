import { Request, Response } from 'express';
import QualityChecklistService from './qualityChecklistService.js';
import { AppError } from '../../common/utils/AppError.js';

export const getAllChecklists = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await QualityChecklistService.getAllChecklists();
        res.status(200).json(data);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const getChecklistById = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await QualityChecklistService.getChecklistById(req.params.id as string);
        res.status(200).json(data);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const createChecklist = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await QualityChecklistService.createChecklist(req.body);
        res.status(201).json(data);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const updateChecklist = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await QualityChecklistService.updateChecklist(req.params.id as string, req.body);
        res.status(200).json(data);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const deleteChecklist = async (req: Request, res: Response): Promise<void> => {
    try {
        await QualityChecklistService.deleteChecklist(req.params.id as string);
        res.status(200).json({ message: 'Checklist deleted successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const addInspectionPoint = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await QualityChecklistService.addInspectionPoint(req.params.id as string, req.body);
        res.status(201).json(data);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const updateInspectionPoint = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await QualityChecklistService.updateInspectionPoint(req.params.pointId as string, req.body);
        res.status(200).json(data);
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

export const deleteInspectionPoint = async (req: Request, res: Response): Promise<void> => {
    try {
        await QualityChecklistService.deleteInspectionPoint(req.params.pointId as string);
        res.status(200).json({ message: 'Inspection point deleted successfully' });
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};
