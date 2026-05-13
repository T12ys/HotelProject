export interface LoginRequest {
    email: string;
    password: string;
}


export interface RegisterRequest {
    email: string;
    displayName: string;
    password: string;
    phoneNumber?: string;
}

export interface AuthResponse {
    accessToken: string;
    accessTokenExpiresAt: string;
    userId: string;
    email: string;
    displayName: string;
    phoneNumber?: string;
    role: string;
}