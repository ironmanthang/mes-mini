import api from "./api";
import { roleService } from "./roleServices";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    employeeId: number;
    username: string;
    fullName: string;
    email: string;
    status: string;
    roles: { roleId: number; roleName: string }[];
  };
}

export interface UserProfile {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);

      const user = response.data.user;

      // Lấy tất cả permissions của tất cả roles user đang giữ
      const permCodeSet = new Set<string>();
      for (const role of user.roles) {
        try {
          const perms = await roleService.getRolePermissions(role.roleId);
          perms.forEach(p => permCodeSet.add(p.permCode));
        } catch (err) {
          console.warn(`Không thể lấy permissions cho roleId=${role.roleId}`, err);
        }
      }

      // Lưu user kèm permissions vào localStorage
      const enrichedUser = {
        ...user,
        permissions: [...permCodeSet],
      };
      localStorage.setItem("user", JSON.stringify(enrichedUser));

      // Lưu danh sách roleName (dùng cho hasAnyRole ở những nơi còn dùng)
      const roleNames = user.roles.map(r => r.roleName);
      localStorage.setItem("userRole", JSON.stringify(roleNames));
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (data: UserProfile) => {
    const response = await api.put("/auth/profile", data);
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const updatedUser = { ...currentUser, ...data };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
    return response.data;
  },

  changePassword: async (data: PasswordChange) => {
    const response = await api.put("/auth/change-password", data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
  },
};