import { apiRequest } from "./client";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  token: string;
  user: {
    id: number | string;
    fullName?: string;
    name?: string;
    email: string;
    role: string;
  };
  message?: string;
};

export type ProfileResponse = {
  success: boolean;
  message?: string;
  user: {
    id: number | string;
    fullName?: string;
    name?: string;
    email: string;
    role: string;
    isActive?: boolean | number;
    createdAt?: string;
  };
};

export type ProfileUpdatePayload = {
  fullName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

export const authApi = {
  login(credentials: LoginCredentials) {
    return apiRequest<LoginResponse>({
      url: "/auth/login",
      method: "POST",
      data: credentials,
      skipAuth: true
    });
  },
  getProfile() {
    return apiRequest<ProfileResponse>({
      url: "/auth/profile",
      method: "GET"
    });
  },
  updateProfile(payload: ProfileUpdatePayload) {
    return apiRequest<ProfileResponse>({
      url: "/auth/profile",
      method: "PUT",
      data: payload
    });
  }
};
