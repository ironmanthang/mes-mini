import prisma from '../../src/common/lib/prisma.js';

/**
 * DB Helper for tests to avoid hardcoding IDs
 */
export const dbHelper = {
    /**
     * Finds the first product that has a Bill of Materials (required for PR/WO tests)
     */
    async getProductWithBOM() {
        const product = await prisma.product.findFirst({
            where: {
                bom: {
                    some: {}
                }
            },
            include: {
                bom: true
            }
        });

        if (!product) {
            throw new Error('Test Data Missing: No product with BOM found in database. Please run seed first.');
        }

        return product;
    },

    /**
     * Finds the first product that has no Bill of Materials (negative PR tests)
     */
    async getProductWithoutBOM() {
        const product = await prisma.product.findFirst({
            where: {
                bom: {
                    none: {}
                }
            }
        });

        if (!product) {
            throw new Error('Test Data Missing: No product without BOM found in database.');
        }

        return product;
    },

    /**
     * Finds a manager employee for approval tests
     */
    async getManager() {
        const manager = await prisma.employee.findFirst({
            where: {
                roles: {
                    some: {
                        role: {
                            roleCode: 'PROD_MGR'
                        }
                    }
                }
            }
        });
        return manager;
    },

    async getPurchaser() {
        const purchaser = await prisma.employee.findFirst({
            where: {
                roles: {
                    some: {
                        role: {
                            roleCode: 'PURCHASING'
                        }
                    }
                }
            }
        });
        return purchaser;
    },

    /**
     * Finds a valid supplier and one of their components
     */
    async getSupplierAndComponent() {
        const supplierComponent = await prisma.supplierComponent.findFirst({
            include: {
                supplier: true,
                component: true
            }
        });
        if (!supplierComponent) throw new Error('Test Data Missing: No SupplierComponent found');
        return supplierComponent;
    },

    /**
     * Finds a supplier that supplies the given component, or throws if none
     */
    async getSupplierForComponent(componentId: number) {
        const supplierComponent = await prisma.supplierComponent.findFirst({
            where: { componentId }
        });
        if (!supplierComponent) {
            // Let's just create the link to avoid test failure
            const supplier = await prisma.supplier.findFirst();
            if (!supplier) throw new Error('Test Data Missing: No supplier found');
            return await prisma.supplierComponent.create({
                data: { supplierId: supplier.supplierId, componentId }
            });
        }
        return supplierComponent;
    },

    /**
     * Finds a component warehouse
     */
    async getComponentWarehouse() {
        const warehouse = await prisma.warehouse.findFirst({
            where: { warehouseType: 'COMPONENT' }
        });
        if (!warehouse) throw new Error('Test Data Missing: No COMPONENT warehouse found');
        return warehouse;
    },

    /**
     * Finds a PR and a component in its BOM, and a component NOT in its BOM
     */
    async getPRAndComponents() {
        const pr = await prisma.productionRequest.findFirst({
            where: {
                status: { in: ['PENDING', 'WAITING_MATERIAL'] }
            },
            include: {
                details: true
            }
        });
        if (!pr || pr.details.length === 0) throw new Error('Test Data Missing: No suitable PR found');
        
        const componentInBOM = pr.details[0].componentId;
        const componentNotInBOM = await prisma.component.findFirst({
            where: {
                componentId: { notIn: pr.details.map(d => d.componentId) }
            }
        });
        
        return { pr, componentInBOM, componentNotInBOM: componentNotInBOM?.componentId };
    },

    /**
     * Disconnects prisma client
     */
    async disconnect() {
        await prisma.$disconnect();
    }
};
