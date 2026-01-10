import api from "./api";

export interface Role {
  roleId: number;
  roleName: string;
}

export interface CreateRoleRequest {
  roleName: string;
}

export interface UpdateRoleRequest {
  roleName: string;
}


export const roleService = {
  getAllRoles: async () => {
    const response = await api.get<Role[]>("/roles");
    return response.data;
  },

  createRole: async (data: CreateRoleRequest) => {
    const response = await api.post<Role>("/roles", data);
    return response.data;
  },

  updateRole: async (id: number, data: UpdateRoleRequest) => {
    const response = await api.put<Role>(`/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/roles/${id}`);
    return response.data;
  },
};