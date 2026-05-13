import axios from "axios";
import { store } from "../store";
import { setUser, logout } from "../store/authSlice";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5207/api",
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const token = store.getState().auth.user?.accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/auth/refresh") )
        {
            originalRequest._retry = true;

            try {
                const response = await api.post("/auth/refresh");
                store.dispatch(setUser(response.data)); // сохраняем в Redux

                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return api(originalRequest);
            } catch {
                store.dispatch(logout());
                window.location.href = "/auth/login";
            }
        }

        return Promise.reject(error);
    }
);