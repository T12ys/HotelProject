import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth.ts";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

interface Props {
    allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
    const { user } = useAuth();
    const isLoading = useSelector((state: RootState) => state.auth.isLoading);

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    if (!user) {
        return <Navigate to="/404" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role))  {
        return <Navigate to="/404" replace />;
    }

    return <Outlet />;
}

