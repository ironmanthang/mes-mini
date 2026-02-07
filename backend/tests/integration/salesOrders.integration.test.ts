
import request from 'supertest';
import app from '../../src/app'; // Fixed import path
import { getAuthToken } from '../helpers/auth.helper';
import prisma from '../../src/common/lib/prisma';

describe('Sales Order Integration Flow', () => {
    let salesToken: string;
    let managerToken: string;
    let adminToken: string;
    let createdSOId: number;

    // Use existing seeded agent & product IDs
    const AGENT_ID = 1; // From seed (Authorized Dealer Alpha)
    const PRODUCT_ID = 1; // From seed (Laptop X1 Pro)

    beforeAll(async () => {
        try {
            // 1. Get Tokens
            console.log('Fetching Sales Token...');
            salesToken = await getAuthToken('sales');
            console.log('Fetching Manager Token...');
            managerToken = await getAuthToken('manager');
            console.log('Fetching Admin Token...');
            adminToken = await getAuthToken('admin');
        } catch (error) {
            console.error('FATAL ERROR IN BEFOREALL:', error);
            throw error;
        }
    });

    afterAll(async () => {
        // Cleanup the specific order we created
        if (createdSOId) {
            // We might need to force delete if it has relations, 
            await prisma.salesOrder.delete({ where: { salesOrderId: createdSOId } }).catch(() => { });
        }
    });

    // ============================================================================
    // UC-01: Create Draft (Happy Path)
    // ============================================================================
    it('should create a new Draft Sales Order (Sales Staff)', async () => {
        const payload = {
            agentId: AGENT_ID,
            expectedShipDate: "2026-03-01T00:00:00.000Z",
            discount: 0,
            tax: 10,
            agentShippingPrice: 50,
            note: "Integration Test Order",
            details: [
                {
                    productId: PRODUCT_ID,
                    quantity: 5,
                    salePrice: 1000
                }
            ]
        };

        const res = await request(app)
            .post('/api/sales-orders')
            .set('Authorization', salesToken)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.code).toMatch(/^D-/); // Should start with D-
        expect(res.body.status).toBe('DRAFT');
        expect(res.body.details).toHaveLength(1);

        createdSOId = res.body.salesOrderId;
        console.log(`Created Draft ID: ${createdSOId}`);
    });

    // ============================================================================
    // UC-03: Edit Draft (Negative Test - Privilege Violation)
    // ============================================================================
    it('should BLOCK Admin from editing Sales Staff draft (400 Privilege Violation)', async () => {
        const updatePayload = {
            note: "Admin trying to hack"
        };

        const res = await request(app)
            .put(`/api/sales-orders/${createdSOId}`)
            .set('Authorization', adminToken) // Login as Admin (Different User)
            .send(updatePayload);

        // Expect 400 because service logic says: "Privilege Violation: You can only edit your own orders."
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Privilege Violation/i);
    });

    // ============================================================================
    // UC-05: Submit (Sales Staff)
    // ============================================================================
    it('should allow Sales Staff to Submit for Approval', async () => {
        const res = await request(app)
            .put(`/api/sales-orders/${createdSOId}/submit`)
            .set('Authorization', salesToken);

        expect(res.status).toBe(200);
        expect(res.body.result.status).toBe('PENDING_APPROVAL');
        // Expect code to change from D- to SO-
        expect(res.body.result.code).toMatch(/^SO-/);
    });

    // ============================================================================
    // UC-05: Approve (Manager)
    // ============================================================================
    it('should allow Manager to Approve the order', async () => {
        const res = await request(app)
            .put(`/api/sales-orders/${createdSOId}/approve`)
            .set('Authorization', managerToken);

        expect(res.status).toBe(200);
        expect(res.body.result.status).toBe('APPROVED');
        expect(res.body.result).toHaveProperty('reservedCount');
    });

    // ============================================================================
    // Cleanup Check (Negative Test - Edit Approved)
    // ============================================================================
    it('should BLOCK editing after Approval (State Lock)', async () => {
        const res = await request(app)
            .put(`/api/sales-orders/${createdSOId}`)
            .set('Authorization', salesToken) // Creator tries to edit
            .send({ note: "Editing approved order" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/State Lock/i);
    });

});
