import api from "./api";

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
      localStorage.setItem("user", JSON.stringify(response.data.user));
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
  },
};