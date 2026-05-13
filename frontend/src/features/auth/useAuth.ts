import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { setUser, logout as logoutAction } from "../../store/authSlice";
import { login, register, logout } from "./authService.ts";

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const user = useSelector((state: RootState) => state.auth.user);

    const handleLogin = async (email: string, password: string) => {
        const result = await login({ email, password });

        dispatch(setUser(result));
    };

    const handleRegister = async (email: string, displayName: string, password: string, phoneNumber?: string) => {
        const result = await register({ email, displayName, password, phoneNumber });
        dispatch(setUser(result));
    };

    const handleLogout = async () => {
        await logout();
        dispatch(logoutAction());
    };

    return { user, handleLogin, handleRegister, handleLogout };
};