import api from "./api";

export interface InspectionPoint {
    inspectionPointId: number;
    checklistId: number;
    pointName: string;
    description: string | null;
    sortOrder: number;
}

export interface QualityChecklist {
    checklistId: number;
    checklistName: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    inspectionPoints: InspectionPoint[];
}

export interface PointDataInput {
    pointName: string;
    description?: string;
    sortOrder?: number;
}

export interface ChecklistCreateData {
    checklistName: string;
    description?: string;
    points?: PointDataInput[];
}

export interface ChecklistUpdateData {
    checklistName?: string;
    description?: string;
}

export const QualityChecklistServices = {
    getAllChecklists: async () => {
        const response = await api.get<QualityChecklist[]>('/master-data/quality-checklists');
        return response.data;
    },

    getChecklistById: async (id: number | string) => {
        const response = await api.get<QualityChecklist>(`/master-data/quality-checklists/${id}`);
        return response.data;
    },

    createChecklist: async (data: ChecklistCreateData) => {
        const response = await api.post<QualityChecklist>('/master-data/quality-checklists', data);
        return response.data;
    },

    updateChecklist: async (id: number | string, data: ChecklistUpdateData) => {
        const response = await api.put<QualityChecklist>(`/master-data/quality-checklists/${id}`, data);
        return response.data;
    },

    deleteChecklist: async (id: number | string) => {
        const response = await api.delete<{ message: string }>(`/master-data/quality-checklists/${id}`);
        return response.data;
    },

    addInspectionPoint: async (checklistId: number | string, data: PointDataInput) => {
        const response = await api.post<InspectionPoint>(`/master-data/quality-checklists/${checklistId}/points`, data);
        return response.data;
    },

    updateInspectionPoint: async (pointId: number | string, data: Partial<PointDataInput>) => {
        const response = await api.put<InspectionPoint>(`/master-data/quality-checklists/points/${pointId}`, data);
        return response.data;
    },

    deleteInspectionPoint: async (pointId: number | string) => {
        const response = await api.delete<{ message: string }>(`/master-data/quality-checklists/points/${pointId}`);
        return response.data;
    }
};