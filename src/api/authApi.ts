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

export const authApi = {
  login(credentials: LoginCredentials) {
    return apiRequest<LoginResponse>({
      url: "/auth/login",
      method: "POST",
      data: credentials,
      skipAuth: true
    });
  }
};
