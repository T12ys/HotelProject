import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useReservationById } from "../features/reservation/useReservation";
import { formatDateLong } from "../utils/dateUtils";

export default function BookingSuccess() {
    const { reservationId } = useParams<{ reservationId: string }>();
    const { data: reservation, isLoading } = useReservationById(reservationId ?? null);
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="max-w-lg mx-auto py-12 flex flex-col gap-4">
                <div className="h-64 bg-stone-100 animate-pulse rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto py-12 flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <div className="flex flex-col gap-2">
                <h1 className="font-georgia font-bold text-stone-800 text-2xl">{t("success.title")}</h1>
                <p className="text-stone-500 text-sm">{t("success.subtitle")}</p>
            </div>

            {reservation && (
                <div className="w-full bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-3 text-left">
                    <h2 className="font-georgia font-semibold text-stone-700 text-base text-center mb-1">
                        {t("success.detailsTitle")}
                    </h2>
                    <div className="flex flex-col gap-2 text-sm">
                        {[
                            { label: t("success.reservationId"), value: reservation.id.slice(0, 8).toUpperCase(), mono: true },
                            { label: t("success.room"),          value: reservation.roomNumber, bold: true },
                            { label: t("success.guest"),         value: reservation.customerName },
                            { label: t("success.arrival"),       value: formatDateLong(reservation.startDate) },
                            { label: t("success.departure"),     value: formatDateLong(reservation.endDate) },
                        ].map(({ label, value, mono, bold }) => (
                            <div key={label} className="flex justify-between">
                                <span className="text-stone-500">{label}</span>
                                <span className={`text-stone-700 ${mono ? "font-mono text-xs font-medium" : ""} ${bold ? "font-medium" : ""}`}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {reservation.items.length > 0 && (
                        <div className="border-t border-stone-100 pt-2 flex flex-col gap-1.5">
                            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">{t("success.additionalServices")}</p>
                            {reservation.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-stone-500">{item.name} ×{item.quantity}</span>
                                    <span className="text-stone-600">{Math.round(item.total)}₼</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-stone-100 pt-2 flex justify-between">
                        <span className="text-stone-600 font-medium">{t("success.paid")}</span>
                        <span className="text-amber-700 font-bold">{Math.round(reservation.totalPrice)}₼</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 w-full">
                <Link to="/rooms" className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 text-sm font-medium text-center transition-colors">
                    {t("success.browseRooms")}
                </Link>
                <Link to="/" className="w-full border border-stone-300 hover:border-stone-400 text-stone-600 rounded-xl py-2.5 text-sm text-center transition-colors">
                    {t("success.home")}
                </Link>
            </div>
        </div>
    );
}