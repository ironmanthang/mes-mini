import { Request, Response } from 'express';

import ProductionReportService from './productionReportService.js';
import { parsePositiveIntQuery, parseReportDateRange } from '../../common/utils/reporting.js';

const handleReportError = (res: Response, error: unknown): void => {
    const message = (error as Error).message;
    const isValidationError = /must|startDate|endDate/.test(message);
    res.status(isValidationError ? 400 : 500).json({ message });
};

export const getLinePerformance = async (req: Request, res: Response): Promise<void> => {
    try {
        const report = await ProductionReportService.getLinePerformance({
            ...parseReportDateRange(req.query),
            productionLineId: parsePositiveIntQuery(req.query.productionLineId, 'productionLineId'),
            productId: parsePositiveIntQuery(req.query.productId, 'productId')
        });
        res.status(200).json(report);
    } catch (error) {
        handleReportError(res, error);
    }
};
