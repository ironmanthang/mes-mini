import prisma from '../../common/lib/prisma.js';
import { InspectionType } from '../../generated/prisma/index.js';

interface PointData {
    pointName: string;
    description?: string;
    pointType: InspectionType;
    minValue?: number;
    maxValue?: number;
    unit?: string;
    sortOrder?: number;
}

interface ChecklistCreateData {
    checklistName: string;
    description?: string;
    points?: PointData[];
}

interface ChecklistUpdateData {
    checklistName?: string;
    description?: string;
}

class QualityChecklistService {
    async getAllChecklists() {
        return prisma.qualityChecklist.findMany({
            include: { inspectionPoints: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getChecklistById(id: number | string) {
        const checklistId = typeof id === 'string' ? parseInt(id) : id;
        const checklist = await prisma.qualityChecklist.findUnique({
            where: { checklistId },
            include: { inspectionPoints: { orderBy: { sortOrder: 'asc' } } }
        });
        if (!checklist) throw new Error('Checklist not found');
        return checklist;
    }

    async createChecklist(data: ChecklistCreateData) {
        return prisma.qualityChecklist.create({
            data: {
                checklistName: data.checklistName,
                description: data.description,
                inspectionPoints: {
                    create: data.points?.map(p => ({
                        pointName: p.pointName,
                        description: p.description,
                        pointType: p.pointType,
                        minValue: p.minValue,
                        maxValue: p.maxValue,
                        unit: p.unit,
                        sortOrder: p.sortOrder || 0
                    })) || []
                }
            },
            include: { inspectionPoints: true }
        });
    }

    async updateChecklist(id: number | string, data: ChecklistUpdateData) {
        const checklistId = typeof id === 'string' ? parseInt(id) : id;
        
        const checklist = await prisma.qualityChecklist.findUnique({ where: { checklistId } });
        if (!checklist) throw new Error('Checklist not found');

        return prisma.qualityChecklist.update({
            where: { checklistId },
            data,
            include: { inspectionPoints: true }
        });
    }

    async deleteChecklist(id: number | string) {
        const checklistId = typeof id === 'string' ? parseInt(id) : id;

        // Ensure not in use by products
        const inProduct = await prisma.product.findFirst({ where: { checklistId } });
        if (inProduct) throw new Error('Cannot delete: This checklist is currently assigned to one or more products.');

        // Ensure not used in past quality checks
        const hasChecks = await prisma.qualityCheck.findFirst({ where: { checklistId } });
        if (hasChecks) throw new Error('Cannot delete: This checklist has existing quality check records. You should leave it as is to preserve history.');

        return prisma.qualityChecklist.delete({ where: { checklistId } });
    }

    async addInspectionPoint(checklistId: number | string, data: PointData) {
        const cId = typeof checklistId === 'string' ? parseInt(checklistId) : checklistId;
        const checklist = await prisma.qualityChecklist.findUnique({ where: { checklistId: cId } });
        if (!checklist) throw new Error('Checklist not found');

        return prisma.inspectionPoint.create({
            data: {
                checklistId: cId,
                ...data
            }
        });
    }

    async updateInspectionPoint(pointId: number | string, data: Partial<PointData>) {
        const pId = typeof pointId === 'string' ? parseInt(pointId) : pointId;
        const point = await prisma.inspectionPoint.findUnique({ where: { inspectionPointId: pId } });
        if (!point) throw new Error('Inspection point not found');

        return prisma.inspectionPoint.update({
            where: { inspectionPointId: pId },
            data
        });
    }

    async deleteInspectionPoint(pointId: number | string) {
        const pId = typeof pointId === 'string' ? parseInt(pointId) : pointId;
        
        // Ensure no existing results use this point
        const hasResults = await prisma.inspectionResult.findFirst({ where: { inspectionPointId: pId } });
        if (hasResults) throw new Error('Cannot delete: This inspection point has existing inspection results.');

        return prisma.inspectionPoint.delete({ where: { inspectionPointId: pId } });
    }
}

export default new QualityChecklistService();
