import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Sidebar = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const linkClasses = ({ isActive }: { isActive: boolean }) =>
        `block px-4 py-3 rounded-lg font-medium transition-all duration-200
     ${
            isActive
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:shadow-sm"
        }`;

    return (
        <aside className="w-[240px] bg-gradient-to-b from-stone-50 to-stone-100 flex flex-col justify-between p-5 border-r border-stone-200 shadow-sm">
            <div>
                <div className="bg-gradient-to-r from-stone-800 to-stone-900 text-center py-4 px-4 rounded-xl mb-8 shadow-lg">
                    <h2 className="font-bold text-white text-lg tracking-wide">
                        Grand<span className="text-orange-500">Hotel</span>
                    </h2>
                    <p className="text-stone-300 text-xs mt-1 font-medium">{t("admin.panel")}</p>
                </div>

                <nav className="flex flex-col gap-2.5">
                    <NavLink to="/admin/users" className={linkClasses}>
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>{t("admin.users")}</span>
                        </div>
                    </NavLink>

                    <NavLink to="/admin/audit-log" className={linkClasses}>
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{t("admin.auditLog")}</span>
                        </div>
                    </NavLink>

                    <NavLink to="/admin/rooms" className={linkClasses}>
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>{t("admin.rooms")}</span>
                        </div>
                    </NavLink>

                    <NavLink to="/admin/price-calendar" className={linkClasses}>
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{t("admin.priceCalendar")}</span>
                        </div>
                    </NavLink>

                    <NavLink to="/admin/reservations" className={linkClasses}>
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>{t("admin.reservations")}</span>
                        </div>
                    </NavLink>
                </nav>
            </div>

            <button
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 text-stone-800 font-semibold py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-amber-200"
            >
                {t("admin.return")}
            </button>
        </aside>
    );
};

export default Sidebar;