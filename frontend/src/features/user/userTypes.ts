export interface UpdateProfileRequest {
    email?: string;
    displayName?: string;
    phoneNumber?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface UserResponse {
    userId: string;
    email: string;
    displayName: string;
    phoneNumber?: string;
    role: string;
    createdAt: string;
}

export interface AdminUserResponse {
    userId: string;
    email: string;
    displayName: string;
    phoneNumber?: string;
    role: "Customer" | "Moderator" | "Admin";
    createdAt: string;
}

export interface UpdateUserRoleRequest {
    role: "Customer" | "Moderator" | "Admin";
}

export interface UserPagedRequest {
    page: number;
    pageSize: number;
    search?: string;
    sortBy?: string;
}