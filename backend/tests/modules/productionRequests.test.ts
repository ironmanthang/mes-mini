import request from 'supertest';
import app from '../../src/app.js';
import { getAuthToken } from '../helpers/auth.helper.js';
import { dbHelper } from '../helpers/db.helper.js';
import prisma from '../../src/common/lib/prisma.js';

describe('Production Request Module Tests', () => {
    let managerToken: string;
    let validProductId: number;
    let productWithoutBomId: number;
    let createdNoBomProductId: number | null = null;

    beforeAll(async () => {
        // Retrieve authentication tokens before running tests
        // Using roles defined in docs/testing/production_requests_testcases.md
        managerToken = await getAuthToken('manager');

        // Dynamically get a valid product ID
        const product = await dbHelper.getProductWithBOM();
        validProductId = product.productId;

        const productWithoutBom = await prisma.product.findFirst({
            where: {
                bom: {
                    none: {}
                }
            },
            select: {
                productId: true
            }
        });

        if (productWithoutBom) {
            productWithoutBomId = productWithoutBom.productId;
            return;
        }

        const uniqueSuffix = Date.now();
        const createdNoBomProduct = await prisma.product.create({
            data: {
                productName: `TEST_NO_BOM_${uniqueSuffix}`,
                code: `TEST_NO_BOM_${uniqueSuffix}`,
                unit: 'pcs'
            },
            select: {
                productId: true
            }
        });

        productWithoutBomId = createdNoBomProduct.productId;
        createdNoBomProductId = createdNoBomProduct.productId;
    });

    afterAll(async () => {
        if (createdNoBomProductId) {
            await prisma.product.delete({
                where: {
                    productId: createdNoBomProductId
                }
            });
        }
        await dbHelper.disconnect();
    });

    describe('TC-PR-01: Create new Production Request successfully (Black-box / Happy Path)', () => {
        it('Should return 201 and status PENDING/WAITING_MATERIAL when asDraft=false', async () => {
            const response = await request(app)
                .post('/api/production-requests')
                .set('Authorization', managerToken)
                .send({
                    productId: validProductId,
                    quantity: 100,
                    asDraft: false
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('productionRequestId');
            
            // Because asDraft=false, it will be automatically submitted
            const status = response.body.status;
            expect(['PENDING', 'WAITING_MATERIAL']).toContain(status);
        });
    });

    describe('TC-PR-02: Reject Production Request with quantity = 0 (Black-box / Boundary (Negative))', () => {
        it('Should return 400 Bad Request when quantity is 0', async () => {
            const response = await request(app)
                .post('/api/production-requests')
                .set('Authorization', managerToken)
                .send({
                    productId: validProductId,
                    quantity: 0,
                    asDraft: true
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('"quantity" must be greater than or equal to 1');
        });
    });

    describe('TC-PR-03: Reject Production Request with product missing BOM (Black-box / Negative)', () => {
        it('Should return 400 Bad Request when product has no BOM', async () => {
            const response = await request(app)
                .post('/api/production-requests')
                .set('Authorization', managerToken)
                .send({
                    productId: productWithoutBomId,
                    quantity: 10,
                    asDraft: true
                });

            expect(response.status).toBe(400);
            const errorMessage = response.body.message || response.body.error || '';
            expect(errorMessage).toBe('Cannot create Production Request: Product has no Bill of Materials (BOM).');
        });
    });
});
