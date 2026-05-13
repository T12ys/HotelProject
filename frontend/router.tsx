import { createBrowserRouter } from "react-router-dom"
import Layout from "./src/components/layout/Layout.tsx";
import AdminLayout from "./src/components/layout/AdminLayout.tsx";
import Home from "./src/pages/Home.tsx";
import Rooms from "./src/pages/Rooms.tsx";
import RoomDetails from "./src/pages/RoomDetails.tsx";
import Booking from "./src/pages/Booking.tsx";
import PaymentPage from "./src/pages/PaymentPage.tsx";
import BookingSuccess from "./src/pages/BookingSuccess.tsx";
import Login from "./src/pages/Login.tsx";
import RoomsAdmin from "./src/pages/admin/RoomsAdmin.tsx";
import PriceCalendar from "./src/pages/admin/PriceCalendar.tsx";
import ReservationsCalendar from "./src/pages/admin/ReservationsCalendar.tsx";
import Users from "./src/pages/admin/Users.tsx";
import ProtectedRoute from "./src/routes/ProtectedRoute.tsx";
import NotFound from "./src/pages/NotFound.tsx";
import ProfilePage from "./src/pages/ProfilePage.tsx";
import AuditLog from "./src/pages/admin/AuditLog.tsx";

export const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "/rooms",
                element: <Rooms />
            },
            {
                path: "/rooms/:id",
                element: <RoomDetails />
            },
            // Форма бронирования (новое)
            {
                path: "/booking/new",
                element: <Booking />
            },
            // Страница оплаты (hold)
            {
                path: "/booking/:reservationId",
                element: <PaymentPage />
            },
            // Успешная оплата
            {
                path: "/booking/success/:reservationId",
                element: <BookingSuccess />
            },

        ]
    },
    {
        path: "/auth/login",
        element: <Login />
    },
    {
        path: "/profile",
        element: <ProfilePage />
    },
    {
        path: "/admin",
        element: <ProtectedRoute allowedRoles={["Admin", "Moderator"]} />,
        children: [
            {
                path: "/admin",
                element: <AdminLayout />,
                children: [
                    {
                        path: "rooms",
                        element: <RoomsAdmin />
                    },
                    {
                        path: "price-calendar",
                        element: <PriceCalendar />
                    },
                    {
                        path: "reservations",
                        element: <ReservationsCalendar />
                    },
                    {
                        path: "users",
                        element: <Users />
                    },
                    {
                        path: "audit-log",
                        element: <AuditLog />
                    }
                ]
            }
        ]
    },
    {
        path: "*",
        element: <NotFound />
    }
])
