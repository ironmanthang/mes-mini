import { Request, Response } from 'express';
import AgentService from './agentService.js';

export const getAllAgents = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await AgentService.getAllAgents(req.query as any);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getAgentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const agent = await AgentService.getAgentById(req.params.id as string);
        res.status(200).json(agent);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const createAgent = async (req: Request, res: Response): Promise<void> => {
    try {
        const agent = await AgentService.createAgent(req.body);
        res.status(201).json(agent);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateAgent = async (req: Request, res: Response): Promise<void> => {
    try {
        const agent = await AgentService.updateAgent(req.params.id as string, req.body);
        res.status(200).json(agent);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteAgent = async (req: Request, res: Response): Promise<void> => {
    try {
        await AgentService.deleteAgent(req.params.id as string);
        res.status(200).json({ message: 'Agent deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
