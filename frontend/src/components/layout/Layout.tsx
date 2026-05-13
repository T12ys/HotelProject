import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../features/auth/useAuth.ts";
import { useTranslation } from "react-i18next";
import Footer from "./Footer.tsx";
import DatePicker from "react-datepicker";
import { DATE_FORMAT, DATE_PLACEHOLDER } from "../../utils/datePickerConfig";
import "react-datepicker/dist/react-datepicker.css";

const PAGES_WITH_BOOKING = ["/", "/rooms"];

const LANGUAGES = [
    { code: "ru", label: "Русский",    short: "RU" },
    { code: "en", label: "English",    short: "EN" },
    { code: "az", label: "Azərbaycan", short: "AZ" },
];

function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="text-xs border border-stone-300 rounded-xl px-3 py-1 text-stone-600 flex items-center gap-1
                           transition-all duration-300 hover:border-stone-400
                           hover:shadow-md
                           hover:-translate-y-px"
            >
                {current.short}
                <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-[200] overflow-hidden min-w-[130px]">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => { void i18n.changeLanguage(lang.code); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-stone-50 flex items-center justify-between ${
                                lang.code === i18n.language ? "text-amber-600 bg-amber-50" : "text-stone-700"
                            }`}
                        >
                            <span>{lang.label}</span>
                            <span className="text-stone-400">{lang.short}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function BookingBar() {
    const { t, i18n } = useTranslation();
    const [checkIn,  setCheckIn]  = useState<Date | null>(null);
    const [checkOut, setCheckOut] = useState<Date | null>(null);
    const [guests,   setGuests]   = useState(1);
    const navigate = useNavigate();

    const lang  = i18n.language;
    const today = new Date();

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (checkIn)  params.set("checkIn",  checkIn.toISOString().split("T")[0]);
        if (checkOut) params.set("checkOut", checkOut.toISOString().split("T")[0]);
        params.set("guests", String(guests));
        navigate(`/rooms?${params.toString()}`);
    };

    return (
        <div className="sticky top-4 z-40 mx-55 mt-4 rounded-2xl bg-stone-100 border border-stone-300 px-4 py-3">
            <div className="pl-5 container mx-auto flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-stone-500 font-medium">{t("booking.checkIn")}</label>
                    <DatePicker
                        selected={checkIn}
                        onChange={(date: Date | null) => { setCheckIn(date); setCheckOut(null); }}
                        selectsStart
                        startDate={checkIn}
                        endDate={checkOut}
                        minDate={today}
                        locale={lang}
                        dateFormat={DATE_FORMAT[lang]}
                        placeholderText={DATE_PLACEHOLDER[lang]}
                        className="border border-stone-300 bg-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-stone-500 font-medium">{t("booking.checkOut")}</label>
                    <DatePicker
                        selected={checkOut}
                        onChange={(date: Date | null) => setCheckOut(date)}
                        selectsEnd
                        startDate={checkIn}
                        endDate={checkOut}
                        minDate={checkIn ?? today}
                        locale={lang}
                        dateFormat={DATE_FORMAT[lang]}
                        placeholderText={DATE_PLACEHOLDER[lang]}
                        className="border border-stone-300 bg-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-stone-500 font-medium">{t("booking.guests")}</label>
                    <input
                        type="number" min={1} max={10} value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="border border-stone-300 bg-white rounded-lg px-2 py-1.5 text-sm w-20 focus:outline-none focus:border-amber-500"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="bg-amber-600 text-white rounded-lg px-5 py-2 text-sm font-medium
                               transition-all duration-300
                               hover:bg-amber-700
                               hover:shadow-md
                               hover:-translate-y-px"
                >
                    {t("booking.find")}
                </button>
            </div>
        </div>
    );
}

export default function Layout() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const location = useLocation();
    const showBooking = PAGES_WITH_BOOKING.includes(location.pathname);
    const pendingId = localStorage.getItem("pendingReservationId");
    const showPendingBanner = !!pendingId && !location.pathname.startsWith("/booking");

    return (
        <div className="min-h-screen flex flex-col">
            <header className="top-0 z-50 bg-white shadow-sm">
                <div className="container mx-auto px-4 flex items-center justify-between py-3 border-b border-stone-100">
                    <Link to="/" className="text-2xl font-bold tracking-tight text-stone-800">
                        Grand<span className="text-amber-600">Hotel</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        {user ? (
                            <Link to="/profile" className="text-xs text-stone-600 hover:text-amber-600 transition-colors hidden sm:block font-medium">
                                {user.displayName}
                            </Link>
                        ) : (
                            <Link to="/auth/login" className="text-xs bg-amber-600 text-white rounded-xl px-4 py-1.5 transition-all duration-300 hover:bg-amber-700 hover:shadow-md hover:-translate-y-px">
                                {t("nav.login")}
                            </Link>
                        )}
                        {(user?.role === "Admin" || user?.role === "Moderator") && (
                            <Link to="/admin" className="text-xs bg-red-500 text-white rounded-xl px-4 py-1.5 transition-all duration-300 hover:bg-red-600 hover:shadow-md hover:-translate-y-px">
                                {t("nav.admin")}
                            </Link>
                        )}
                    </div>
                </div>
                <nav className="container mx-auto px-4 flex gap-2 py-2">
                    <Link to="/" className="text-sm px-4 py-1.5 rounded-xl bg-amber-100 text-amber-800 font-medium transition-all duration-300 hover:shadow-md hover:-translate-y-px">
                        {t("nav.home")}
                    </Link>
                    <Link to="/rooms" className="text-sm px-4 py-1.5 rounded-xl bg-amber-100 text-amber-800 font-medium transition-all duration-300 hover:shadow-md hover:-translate-y-px">
                        {t("nav.rooms")}
                    </Link>
                </nav>
            </header>

            {showPendingBanner && (
                <div className="mx-10 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-amber-700">{t("booking.pending")}</span>
                    </div>
                    <Link to={`/booking/${pendingId}`} className="text-sm font-medium text-amber-700 hover:text-amber-800 underline shrink-0">
                        {t("booking.goToPayment")}
                    </Link>
                </div>
            )}

            {showBooking && <BookingBar />}

            <main className="flex-1 container mx-auto p-4">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}