import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponse } from "../features/auth/authTypes.ts";

interface AuthState {
    user: AuthResponse | null;
    isLoading: boolean;
}

const initialState: AuthState = {
    user: null,
    isLoading: true,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<AuthResponse | null>) {
            state.user = action.payload;
            state.isLoading = false;
        },
        // Обновляем только email и displayName, не трогая токен
        updateUserProfile(state, action: PayloadAction<{ email: string; displayName: string; phoneNumber?: string }>) {
            if (state.user) {
                state.user.email = action.payload.email;
                state.user.displayName = action.payload.displayName;
                state.user.phoneNumber = action.payload.phoneNumber;  // ← добавить
            }
        },
        logout(state) {
            state.user = null;
            state.isLoading = false;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        }
    },
});

export const { setUser, updateUserProfile, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;