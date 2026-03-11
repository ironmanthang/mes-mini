import api from "./api";

export interface Agent {
    agentId: number;
    agentName: string;
    phoneNumber: string;
    email: string;
    address: string;
    createdAt: string;
    updatedAt: string;
    code: string;
}

export interface CreateNewAgent {
    code: string;
    agentName: string;
    phoneNumber: string;
    email: string;
    address: string;
}

export const AgentServices = {
    getAllAgents: async () => {
        const response = await api.get<Agent[]>("/agents");
        return response.data;
    },

    createNewAgent: async (data: CreateNewAgent) => {
        const response = await api.post<Agent>("/agents", data);
        return response.data;
    },

    getAgentById: async (id: number) => {
        const response = await api.get<Agent>(`/agents/${id}`);
        return response.data;
    },

    updateAgent: async (id: number, data: CreateNewAgent) => {
        const response = await api.put<Agent>(`/agents/${id}`, data);
        return response.data;
    },

    deleteAgent: async (id: number) => {
        const response = await api.delete<{ message: string }>(`/agents/${id}`);
        return response.data;
    },
}