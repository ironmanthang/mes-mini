import { Request, Response } from 'express';
import EmployeeService from './employeeService.js';

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const employee = await EmployeeService.createUser(req.body);
        res.status(201).json(employee);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
        const employees = await EmployeeService.getAllEmployees();
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
    try {
        const employee = await EmployeeService.findById(req.params.id as string);
        if (!employee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        res.status(200).json(employee);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const employee = await EmployeeService.updateEmployeeByAdmin(req.params.id as string, req.body, req.user!);
        res.status(200).json(employee);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateEmployeeStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        if (!['ACTIVE', 'INACTIVE', 'TERMINATED'].includes(status)) {
            res.status(400).json({ message: 'Invalid status' });
            return;
        }
        const employee = await EmployeeService.updateStatus(req.params.id as string, status);
        res.status(200).json(employee);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        await EmployeeService.deleteEmployeeHard(req.params.id as string);
        res.status(200).json({ message: 'Employee permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
