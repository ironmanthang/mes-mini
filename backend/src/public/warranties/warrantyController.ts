import { Request, Response } from 'express';
import prisma from '../../common/lib/prisma.js';
import { ProductInstanceStatus } from '../../generated/prisma/index.js';

export const lookupWarranty = async (req: Request, res: Response): Promise<void> => {
    try {
        const serialNumber = req.params.serialNumber as string;
        
        const instance = await prisma.productInstance.findUnique({
            where: { serialNumber },
            include: {
                product: { select: { productName: true, code: true, warrantyPeriodDays: true } },
                warranty: true
            }
        });

        if (!instance) {
            res.status(404).json({ message: 'Product instance not found.' });
            return;
        }

        res.status(200).json({
            product: instance.product,
            serialNumber: instance.serialNumber,
            warranty: instance.warranty ? {
                activationDate: instance.warranty.activationDate,
                expiryDate: instance.warranty.expiryDate,
                isActive: new Date() < new Date(instance.warranty.expiryDate)
            } : null
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const activateWarranty = async (req: Request, res: Response): Promise<void> => {
    try {
        const { serialNumber, customerName, email, phoneNumber } = req.body;

        if (!serialNumber || !customerName || !email) {
            res.status(400).json({ message: 'serialNumber, customerName, and email are required.' });
            return;
        }

        await prisma.$transaction(async (tx) => {
            const instance = await tx.productInstance.findUnique({
                where: { serialNumber },
                include: { product: true, warranty: true }
            });

            if (!instance) {
                throw new Error('Product instance not found.');
            }

            if (instance.status !== ProductInstanceStatus.SHIPPED) {
                throw new Error('Product must be shipped before warranty can be activated.');
            }

            if (instance.warranty) {
                throw new Error('Warranty is already activated for this product.');
            }

            if (!instance.product.warrantyPeriodDays) {
                throw new Error('This product does not have a configured warranty period.');
            }

            // Find or Create Customer
            let customer = await tx.customer.findUnique({
                where: { email }
            });

            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        customerName,
                        email,
                        phoneNumber
                    }
                });
            }

            // Calculate Expiry Date
            const activationDate = new Date();
            const expiryDate = new Date(activationDate);
            expiryDate.setDate(expiryDate.getDate() + instance.product.warrantyPeriodDays);

            const warranty = await tx.warranty.create({
                data: {
                    productInstanceId: instance.productInstanceId,
                    customerId: customer.customerId,
                    activationDate,
                    expiryDate
                }
            });

            res.status(201).json(warranty);
        });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
