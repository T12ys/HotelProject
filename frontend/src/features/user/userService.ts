import { api } from "../../api/axios.tsx";
import type {
    UpdateProfileRequest,
    ChangePasswordRequest,
    UserResponse,
    AdminUserResponse,
    UpdateUserRoleRequest,
    UserPagedRequest,
} from "./userTypes.ts";
import type { PagedResult } from "../roomType/roomTypeTypes.ts";

export const getProfile = async (): Promise<UserResponse> => {
    const response = await api.get<UserResponse>("/user/profile");
    return response.data;
};

export const updateProfile = async (data: UpdateProfileRequest): Promise<UserResponse> => {
    const response = await api.put<UserResponse>("/user/profile", data);
    return response.data;
};

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    await api.post("/user/change-password", data);
};

export const getAllUsers = async (params: UserPagedRequest): Promise<PagedResult<AdminUserResponse>> => {
    const response = await api.get<PagedResult<AdminUserResponse>>("/user/all", { params });
    return response.data;
};

export const updateUserRole = async (userId: string, data: UpdateUserRoleRequest): Promise<AdminUserResponse> => {
    const response = await api.put<AdminUserResponse>(`/user/${userId}/role`, data);
    return response.data;
};