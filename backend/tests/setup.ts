import prisma from '../src/common/lib/prisma';
import app from '../src/app';

// Global Setup
beforeAll(async () => {
    // Check DB connection
    try {
        await prisma.$connect();
        // console.log('Test DB Connected');
    } catch (e) {
        console.error('Test DB Connection Failed', e);
        process.exit(1);
    }
});

// Global Teardown
afterAll(async () => {
    await prisma.$disconnect();
});

export { app };
