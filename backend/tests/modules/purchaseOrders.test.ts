import request from 'supertest';
import app from '../../src/app.js';
import { getAuthToken } from '../helpers/auth.helper.js';
import { dbHelper } from '../helpers/db.helper.js';

describe('Purchase Order - Create Tests', () => {
    let purchaserToken: string;
    let validSupplierId: number;
    let validWarehouseId: number;
    let validComponentId: number;

    // For PR linked tests
    let validPrId: number;
    let componentInBomId: number;
    let componentNotInBomId: number | undefined;

    let supplierForBomComponentId: number;
    let supplierForNonBomComponentId: number | undefined;

    beforeAll(async () => {
        // Admin usually has all roles including PURCHASING
        purchaserToken = await getAuthToken('admin');
        
        const supplierComponent = await dbHelper.getSupplierAndComponent();
        validSupplierId = supplierComponent.supplierId;
        validComponentId = supplierComponent.componentId;
        
        const warehouse = await dbHelper.getComponentWarehouse();
        validWarehouseId = warehouse.warehouseId;
        
        const prData = await dbHelper.getPRAndComponents();
        validPrId = prData.pr.productionRequestId;
        componentInBomId = prData.componentInBOM;
        componentNotInBomId = prData.componentNotInBOM;

        const linkBom = await dbHelper.getSupplierForComponent(componentInBomId);
        supplierForBomComponentId = linkBom.supplierId;

        if (componentNotInBomId) {
            const linkNonBom = await dbHelper.getSupplierForComponent(componentNotInBomId);
            supplierForNonBomComponentId = linkNonBom.supplierId;
        }
    });

    afterAll(async () => {
        await dbHelper.disconnect();
    });

    describe('TC-PO-01: Tạo mới Đơn mua hàng độc lập (MTS)', () => {
        it('Trả về 201 và tạo PO trạng thái PENDING không có liên kết PR', async () => {
            const res = await request(app)
                .post('/api/purchase-orders')
                .set('Authorization', purchaserToken)
                .send({
                    supplierId: validSupplierId,
                    warehouseId: validWarehouseId,
                    status: 'PENDING',
                    details: [
                        {
                            componentId: validComponentId,
                            quantity: 50,
                            unitPrice: 150
                        }
                    ]
                });
            expect(res.status).toBe(201);
            expect(res.body.status).toBe('PENDING');
            expect(res.body.code).toMatch(/^PO-/);
            expect(res.body.details[0].productionRequestId).toBeNull();
        });
    });

    describe('TC-PO-02: Tạo mới Đơn mua hàng liên kết với PR (MTO)', () => {
        it('Trả về 201 và lưu chính xác liên kết PR trong chi tiết PO', async () => {
            const res = await request(app)
                .post('/api/purchase-orders')
                .set('Authorization', purchaserToken)
                .send({
                    supplierId: supplierForBomComponentId,
                    warehouseId: validWarehouseId,
                    status: 'PENDING',
                    details: [
                        {
                            componentId: componentInBomId,
                            quantity: 100,
                            unitPrice: 200,
                            productionRequestId: validPrId
                        }
                    ]
                });
            expect(res.status).toBe(201);
            expect(res.body.status).toBe('PENDING');
            expect(res.body.details[0].productionRequestId).toBe(validPrId);
        });
    });

    describe('TC-PO-03: Chặn tạo PO khi Component không thuộc BOM của PR liên kết', () => {
        it('Trả về 400 nếu componentId không nằm trong danh sách vật tư của PR', async () => {
            if (!componentNotInBomId) {
                console.warn('Bỏ qua test: Không tìm thấy component nào nằm ngoài BOM');
                return;
            }

            const res = await request(app)
                .post('/api/purchase-orders')
                .set('Authorization', purchaserToken)
                .send({
                    supplierId: supplierForNonBomComponentId,
                    warehouseId: validWarehouseId,
                    status: 'PENDING',
                    details: [
                        {
                            componentId: componentNotInBomId,
                            quantity: 100,
                            unitPrice: 200,
                            productionRequestId: validPrId
                        }
                    ]
                });
            
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/not in the BOM/i);
        });
    });
});
