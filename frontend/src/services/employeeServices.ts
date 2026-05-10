import api from "./api";

// Cập nhật thêm roleCode dựa trên FormattedEmployee của backend
export interface Role {
  roleId: number;
  roleCode: string;
  roleName: string;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export interface Employee {
  employeeId: number;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  address: string | null;
  dateOfBirth: string | null;
  hireDate: string; 
  terminationDate?: string | null;
  status: EmployeeStatus;
  roles: Role[];
  sessionVersion?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Định dạng dữ liệu trả về cho danh sách có phân trang từ getPaginationParams backend
export interface PaginatedEmployeeResponse {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
}

// Bỏ username và password (backend tự sinh). 
// Đổi address thành province, ward, street theo đúng EmployeeCreateData
export interface CreateEmployeeRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  province: string;
  ward: string;
  street: string;
  dateOfBirth?: string;
  hireDate: string;
  roleIds: number[];
  status?: EmployeeStatus;
}

// Bỏ email và username (backend xóa bỏ trong logic update).
// Đổi address thành cụm province, ward, street.
export interface UpdateEmployeeRequest {
  fullName?: string;
  phoneNumber?: string;
  province?: string;
  ward?: string;
  street?: string;
  dateOfBirth?: string;
  hireDate?: string;
  terminationDate?: string | null;
  roleIds?: number[];
  status?: EmployeeStatus;
}


export const employeeService = {
  // Cập nhật kiểu trả về cho dạng phân trang
  getAllEmployees: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get<PaginatedEmployeeResponse>("/employees", { params });
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

  // Backend hỗ trợ forceLogout (hủy token), thêm vào nếu UI có gọi
  forceLogout: async (id: number) => {
    const response = await api.post<{ message: string }>(`/employees/${id}/force-logout`);
    return response.data;
  }

};