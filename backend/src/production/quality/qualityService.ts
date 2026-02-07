import prisma from '../../common/lib/prisma.js';

// TODO: QualityCheck schema uses productInstanceId + checklistId, not productId + workOrderId
// This service needs to be refactored to match schema when Quality feature is implemented.

class QualityCheckService {

    async createCheck(data: any, userId: number): Promise<any> {
        throw new Error('QualityCheckService.createCheck is not yet implemented. Schema mismatch needs resolution.');
    }

    async getChecksByProduct(productId: number) {
        throw new Error('QualityCheckService.getChecksByProduct is not yet implemented. Schema mismatch needs resolution.');
    }

    async getChecksByWorkOrder(workOrderId: number) {
        throw new Error('QualityCheckService.getChecksByWorkOrder is not yet implemented. Schema mismatch needs resolution.');
    }
}

export default new QualityCheckService();
