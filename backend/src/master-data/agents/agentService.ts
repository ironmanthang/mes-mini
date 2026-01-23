import prisma from '../../common/lib/prisma.js';
import type { Agent } from '../../generated/prisma/index.js';
import { getPaginationParams, createPaginatedResponse, PaginationQuery, PaginatedResponse } from '../../common/utils/pagination.js';

interface AgentCreateData {
    code: string;
    agentName: string;
    phoneNumber?: string;
    email?: string;
    address: string;
}

class AgentService {

    async getAllAgents(query: PaginationQuery): Promise<PaginatedResponse<Agent>> {
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.search) {
            where.OR = [
                { agentName: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } }
            ];
        }

        const [data, total] = await Promise.all([
            prisma.agent.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.agent.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    async getAgentById(id: string | number): Promise<Agent> {
        const agentId = typeof id === 'string' ? parseInt(id) : id;
        const agent = await prisma.agent.findUnique({ where: { agentId } });
        if (!agent) throw new Error('Agent not found');
        return agent;
    }

    async createAgent(data: AgentCreateData): Promise<Agent> {
        const existing = await prisma.agent.findUnique({ where: { code: data.code } });
        if (existing) throw new Error(`Agent code "${data.code}" already exists.`);

        return prisma.agent.create({ data: data as any });
    }

    async updateAgent(id: string | number, data: Partial<AgentCreateData>): Promise<Agent> {
        const agentId = typeof id === 'string' ? parseInt(id) : id;
        const agent = await prisma.agent.findUnique({ where: { agentId } });
        if (!agent) throw new Error('Agent not found');

        if (data.code && data.code !== agent.code) {
            const exists = await prisma.agent.findUnique({ where: { code: data.code } });
            if (exists) throw new Error(`Agent code "${data.code}" already exists.`);
        }

        return prisma.agent.update({
            where: { agentId },
            data: data as any
        });
    }

    async deleteAgent(id: string | number): Promise<Agent> {
        const agentId = typeof id === 'string' ? parseInt(id) : id;

        const hasSO = await prisma.salesOrder.findFirst({ where: { agentId } });
        if (hasSO) throw new Error('Cannot delete: This agent has Sales Orders.');

        return prisma.agent.delete({ where: { agentId } });
    }
}

export default new AgentService();
