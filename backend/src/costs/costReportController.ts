import { Request, Response } from 'express';

import CostReportService from './costReportService.js';
import { parsePositiveIntQuery, parseReportDateRange } from '../common/utils/reporting.js';

const handleReportError = (res: Response, error: unknown): void => {
    const message = (error as Error).message;
    const isValidationError = /must|startDate|endDate/.test(message);
    res.status(isValidationError ? 400 : 500).json({ message });
};

export const getMaterialCosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const report = await CostReportService.getMaterialCosts({
            ...parseReportDateRange(req.query),
            componentId: parsePositiveIntQuery(req.query.componentId, 'componentId'),
            supplierId: parsePositiveIntQuery(req.query.supplierId, 'supplierId')
        });
        res.status(200).json(report);
    } catch (error) {
        handleReportError(res, error);
    }
};

export const getProductCosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const report = await CostReportService.getProductCosts({
            ...parseReportDateRange(req.query),
            productId: parsePositiveIntQuery(req.query.productId, 'productId')
        });
        res.status(200).json(report);
    } catch (error) {
        handleReportError(res, error);
    }
};
