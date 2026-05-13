import { Outlet } from "react-router-dom";
import Sidebar from "../ui/Sidebar.tsx";

const AdminLayout = () => {
    return (
        <div className="flex h-screen">
            <Sidebar />

            <main className="flex-1 bg-gray-100 p-8 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;