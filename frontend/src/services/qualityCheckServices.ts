import api from "./api";

export type QualityCheckResult = 'PASSED' | 'FAILED';

export interface InspectionResultInput {
    inspectionPointId: number;
    passed: boolean;
    measuredValue?: number;
    notes?: string;
}

export interface CreateCheckData {
    serialNumber: string; 
    checkDate?: string;   
    notes?: string;       
    inspectionResults: InspectionResultInput[];
}

export interface QualityCheckDetail {
    qualityCheckId: number;
    productInstanceId: number;
    employeeId: number;
    checklistId: number;
    result: QualityCheckResult;
    checkDate: string;
    notes: string | null;
    employee: { 
        fullName: string; 
    };
    productInstance: { 
        serialNumber: string; 
        status: string; 
    };
    checklist: { 
        checklistName: string; 
    };
    inspectionResults: {
        passed: boolean;
        measuredValue: number | null;
        notes: string | null;
        inspectionPoint: { 
            pointName: string; 
            pointType: string; 
        };
    }[];
}

export const QualityCheckServices = {
    createCheck: async (data: CreateCheckData) => {
        const response = await api.post<QualityCheckDetail & { instanceStatus: string }>('/quality', data);
        return response.data;
    },

    getChecksByProduct: async (productId: number) => {
        const response = await api.get<QualityCheckDetail[]>(`/quality/product/${productId}`);
        return response.data;
    },

    getChecksByWorkOrder: async (workOrderId: number) => {
        const response = await api.get<QualityCheckDetail[]>(`/quality/work-order/${workOrderId}`);
        return response.data;
    }
};