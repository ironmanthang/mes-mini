import { app } from './setup';

describe('Setup Import Check', () => {
    it('should have app defined', () => {
        expect(app).toBeDefined();
    });
});
