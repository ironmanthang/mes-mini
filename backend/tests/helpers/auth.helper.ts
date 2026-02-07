import request from 'supertest';

import app from '../../src/app'; // Fixed import path

export const getAuthToken = async (role: 'sales' | 'manager' | 'admin' | 'worker'): Promise<string> => {
    let credentials = { username: '', password: '123456' };

    switch (role) {
        case 'sales':
            credentials.username = 'sales';
            break;
        case 'manager':
            credentials.username = 'manager';
            break;
        case 'admin':
            credentials.username = 'admin';
            break;
        case 'worker':
            credentials.username = 'worker';
            break;
    }

    const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);

    if (res.status !== 200) {
        throw new Error(`Failed to login as ${role}: ${res.body.message}`);
    }

    return `Bearer ${res.body.token}`;
};
