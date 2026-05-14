import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/common/lib/prisma.js';
import { getAuthToken } from '../helpers/auth.helper.js';
import { dbHelper } from '../helpers/db.helper.js';

interface QcFixture {
    serialNumber: string;
    inspectionPointIds: number[];
    productInstanceId: number;
}

const uniqueCode = (prefix: string): string =>
    `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

describe('Quality Control Module Tests', () => {
    let qcToken: string;
    let adminEmployeeId: number;

    beforeAll(async () => {
        qcToken = await getAuthToken('admin');
        const admin = await prisma.employee.findFirst({
            where: { username: 'admin' },
            select: { employeeId: true }
        });
        if (!admin) {
            throw new Error('Test Data Missing: admin employee not found.');
        }
        adminEmployeeId = admin.employeeId;
    });

    afterAll(async () => {
        await dbHelper.disconnect();
    });

    const createPendingQcFixture = async (): Promise<QcFixture> => {
        const product = await prisma.product.findFirst({
            where: {
                checklistId: { not: null }
            },
            include: {
                checklist: {
                    include: {
                        inspectionPoints: { orderBy: { sortOrder: 'asc' } }
                    }
                }
            }
        });

        if (!product) {
            throw new Error('Test Data Missing: no product with checklist found.');
        }
        if (!product.checklist || product.checklist.inspectionPoints.length === 0) {
            throw new Error('Test Data Missing: product checklist has no inspection points.');
        }

        const wo = await prisma.workOrder.create({
            data: {
                code: uniqueCode('WO-QC'),
                productId: product.productId,
                quantity: 1,
                employeeId: adminEmployeeId,
                status: 'COMPLETED',
                laborCost: 100,
                overheadCost: 50
            }
        });

        const batch = await prisma.productionBatch.create({
            data: {
                batchCode: uniqueCode('BATCH-QC'),
                productionDate: new Date(),
                workOrderId: wo.workOrderId
            }
        });

        const serialNumber = uniqueCode('SN-QC');
        const instance = await prisma.productInstance.create({
            data: {
                serialNumber,
                productId: product.productId,
                productionBatchId: batch.productionBatchId,
                status: 'PENDING_QC'
            }
        });

        return {
            serialNumber,
            inspectionPointIds: product.checklist.inspectionPoints.map((p) => p.inspectionPointId),
            productInstanceId: instance.productInstanceId
        };
    };

    describe('TC-QC-01: Full Pass Across All Inspection Points (Happy Path)', () => {
        it('Should return 201 with PASSED result and update instance status to PASSED_QC', async () => {
            const fixture = await createPendingQcFixture();

            const inspectionResults = fixture.inspectionPointIds.map((id, index) => ({
                inspectionPointId: id,
                passed: true,
                ...(index === fixture.inspectionPointIds.length - 1 ? { measuredValue: 4.0 } : {})
            }));

            const res = await request(app)
                .post('/api/quality')
                .set('Authorization', qcToken)
                .send({
                    serialNumber: fixture.serialNumber,
                    inspectionResults
                });

            expect(res.status).toBe(201);
            expect(res.body.result).toBe('PASSED');
            expect(res.body.instanceStatus).toBe('PASSED_QC');
            expect(Array.isArray(res.body.inspectionResults)).toBe(true);
            expect(res.body.inspectionResults.length).toBe(fixture.inspectionPointIds.length);

            const updatedInstance = await prisma.productInstance.findUnique({
                where: { productInstanceId: fixture.productInstanceId },
                select: { status: true }
            });
            expect(updatedInstance?.status).toBe('PASSED_QC');
        });
    });

    describe('TC-QC-02: One Fail = Total Fail Rule (Happy Path)', () => {
        it('Should return FAILED result and set instance status to FAILED_QC when one point fails', async () => {
            const fixture = await createPendingQcFixture();

            const inspectionResults = fixture.inspectionPointIds.map((id, index) => ({
                inspectionPointId: id,
                passed: index !== 0
            }));

            const res = await request(app)
                .post('/api/quality')
                .set('Authorization', qcToken)
                .send({
                    serialNumber: fixture.serialNumber,
                    inspectionResults
                });

            expect(res.status).toBe(201);
            expect(res.body.result).toBe('FAILED');
            expect(res.body.instanceStatus).toBe('FAILED_QC');

            const updatedInstance = await prisma.productInstance.findUnique({
                where: { productInstanceId: fixture.productInstanceId },
                select: { status: true }
            });
            expect(updatedInstance?.status).toBe('FAILED_QC');
        });
    });

    describe('TC-QC-03: Missing Required Inspection Points (Negative)', () => {
        it('Should return 400 and keep instance status PENDING_QC when inspection results are incomplete', async () => {
            const fixture = await createPendingQcFixture();

            const res = await request(app)
                .post('/api/quality')
                .set('Authorization', qcToken)
                .send({
                    serialNumber: fixture.serialNumber,
                    inspectionResults: [
                        {
                            inspectionPointId: fixture.inspectionPointIds[0],
                            passed: true
                        }
                    ]
                });

            expect(res.status).toBe(400);
            expect((res.body.message || '').toLowerCase()).toContain('missing inspection results');

            const instanceAfter = await prisma.productInstance.findUnique({
                where: { productInstanceId: fixture.productInstanceId },
                select: { status: true }
            });
            expect(instanceAfter?.status).toBe('PENDING_QC');

            const qcCount = await prisma.qualityCheck.count({
                where: { productInstanceId: fixture.productInstanceId }
            });
            expect(qcCount).toBe(0);
        });
    });
});
