import { Request, Response } from 'express';
import AuthService from './authService.js';

export const login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    try {
        const { token, user } = await AuthService.login(username, password);

        res.status(200).json({
            message: 'Login: successful',
            token,
            user
        });
    } catch (error) {
        const err = error as Error;
        if (err.message === 'Username and password are required') {
            res.status(400).json({ message: err.message });
            return;
        }
        if (err.message === 'Invalid credentials' || err.message.includes('Account is inactive')) {
            res.status(401).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    const {
        employeeId, fullName, username, email,
        phoneNumber, address, dateOfBirth,
        hireDate, status, roles
    } = req.user!;

    res.status(200).json({
        employeeId,
        fullName,
        username,
        email,
        phoneNumber,
        address,
        dateOfBirth,
        hireDate,
        status,
        roles
    });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedUser = await AuthService.updateProfile(req.user!.employeeId, req.body);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    try {
        await AuthService.changePassword(req.user!.employeeId, currentPassword, newPassword);
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
