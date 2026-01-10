import api from "./api";

// --- 1. Định nghĩa Types (Interfaces) dựa trên Swagger ---

export interface Role {
  roleId: number;
  roleName: string;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export interface Employee {
  employeeId: number;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  hireDate: string; 
  terminationDate?: string | null;
  status: EmployeeStatus;
  roles: Role[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeRequest {
  fullName: string;
  username: string;
  password?: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  roleIds: number[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateEmployeeRequest {
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  hireDate?: string;
  terminationDate?: string | null;
  roleIds?: number[];
  status?: EmployeeStatus;
}


export const employeeService = {
  getAllEmployees: async (search?: string) => {
    const params = search ? { search } : {};
    const response = await api.get<Employee[]>("/employees", { params });
    return response.data;
  },

  getEmployeeById: async (id: number) => {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: CreateEmployeeRequest) => {
    const response = await api.post<Employee>("/employees", data);
    return response.data;
  },

  updateEmployee: async (id: number, data: UpdateEmployeeRequest) => {
    const response = await api.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  updateEmployeeStatus: async (id: number, status: EmployeeStatus) => {
    const response = await api.patch<Employee>(`/employees/${id}/status`, { status });
    return response.data;
  },

  deleteEmployee: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/employees/${id}`);
    return response.data;
  },
};