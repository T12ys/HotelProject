import { api } from "../../api/axios.tsx";
import type { LoginRequest, AuthResponse, RegisterRequest } from "./authTypes.ts";

export const login = async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
};

export const register = async (data: RegisterRequest) => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
};

export const refresh = async () => {
    const response = await api.post<AuthResponse>("/auth/refresh");
    return response.data;
};


export const logout = async () => {
    await api.post("/auth/logout");
};