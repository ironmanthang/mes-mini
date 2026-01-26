import api from "./api";

export interface Agents {
    agentId: number;
    code: string;
    agentName: string;
    phoneNumber: string;
    email: string;
    address: string;
}

export const agentsServices = {
    getAllAgents: async () => {
        const response = await api.get<Agents[]>("/agents");
        return response.data;
    },

    getAgentById: async (id: number) => {
        const response = await api.get<Agents>(`/agents/${id}`);
        return response.data;
    },

    createNewAgent: async (data: Agents) => {
        const request = await api.post<Agents>("/agents", data);
        return request.data;
    },

    updateAgent: async (id: number, data: Agents) => {
        const request = await api.put<Agents>(`/agents/${id}`, data);
        return request.data;
    },

    deleteAgent: async (id: number) => {
        const request = await api.delete<{message: string}>(`/agents/${id}`);
        return request.data;
    }
}