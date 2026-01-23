import { Request, Response } from 'express';
import RoleService from './roleService.js';

export const getAllRoles = async (req: Request, res: Response): Promise<void> => {
    try {
        const roles = await RoleService.getAllRoles();
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const role = await RoleService.createRole(req.body);
        res.status(201).json(role);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const role = await RoleService.updateRole(req.params.id as string, req.body);
        res.status(200).json(role);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteRole = async (req: Request, res: Response): Promise<void> => {
    try {
        await RoleService.deleteRole(req.params.id as string);
        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
