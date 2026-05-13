import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCancelMyReservation } from "../../features/reservation/useReservation.ts";
import { usePriceCalculation } from "../../features/priceRule/usePriceRule.ts";
import type { ReservationResponseDto, ReservationStatus } from "../../features/reservation/reservationTypes.ts";
import {getErrorMessage} from "../../api/errorHandler.ts";

const STATUS_META: Record<ReservationStatus, { bg: string; text: string; border: string }> = {
    Confirmed: { bg: "bg-green-100",  text: "text-green-700", border: "border-green-200"  },
    Pending:   { bg: "bg-amber-100",  text: "text-amber-700", border: "border-amber-200"  },
    Cancelled: { bg: "bg-red-100",    text: "text-red-600",   border: "border-red-200"    },
    Completed: { bg: "bg-stone-100",  text: "text-stone-600", border: "border-stone-200"  },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// ─── USER PRICE BREAKDOWN ────────────────────────────────────────────────────

function UserPriceBreakdown({ res }: { res: ReservationResponseDto }) {
    const { t } = useTranslation();

    const startDate = res.startDate.slice(0, 10);
    const endDate = res.endDate.slice(0, 10);
    const nights = Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
    );

    const { data: priceData, isLoading } = usePriceCalculation(
        res.roomTypeId && nights > 0 ? { roomTypeId: res.roomTypeId, startDate, endDate } : null
    );

    const itemsTotal = res.items.reduce((s, i) => s + i.total, 0);

    return (
        <div className="flex flex-col gap-3">
            {isLoading ? (
                [...Array(3)].map((_, i) => (
                    <div key={i} className="h-5 bg-stone-100 animate-pulse rounded" />
                ))
            ) : priceData?.dailyBreakdown.length ? (
                <div className="bg-stone-50 rounded-xl overflow-hidden border border-stone-100">
                    <div className="grid grid-cols-2 px-3 py-1.5 bg-stone-100 text-xs text-stone-500 font-medium">
                        <span>{t("reservationModal.dailyBreakdown")}</span>
                        <span className="text-right">{t("reservationModal.price")}</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {priceData.dailyBreakdown.map((day, i) => (
                            <div key={i} className="grid grid-cols-2 px-3 py-1.5 text-xs border-t border-stone-100">
                                <span className="text-stone-500">
                                    {new Date(day.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                    {day.appliedRules.length > 0 && (
                                        <span className="ml-1 text-amber-500">●</span>
                                    )}
                                </span>
                                <span className={`text-right font-medium ${
                                    day.finalPrice < day.basePrice ? "text-green-600" : "text-stone-700"
                                }`}>
                                    {Math.round(day.finalPrice)} ₼
                                </span>
                            </div>
                        ))}
                    </div>
                    {priceData.finalTotalPrice !== priceData.baseTotalPrice && (
                        <div className="px-3 py-1.5 border-t border-stone-200 flex justify-between text-xs">
                            <span className="text-green-600 font-medium">{t("reservationModal.discount")}</span>
                            <span className="text-green-600 font-medium">
                                −{Math.round(priceData.baseTotalPrice - priceData.finalTotalPrice)} ₼
                            </span>
                        </div>
                    )}
                    {priceData.dailyBreakdown.some(d => d.appliedRules.length > 0) && (
                        <p className="px-3 py-1 text-xs text-stone-400">{t("reservationModal.specialPrice")}</p>
                    )}
                </div>
            ) : (
                <p className="text-xs text-stone-400">{t("reservationModal.priceUnavailable")}</p>
            )}

            {res.items.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{t("reservationModal.additionalServices")}</p>
                    <div className="bg-stone-50 rounded-xl border border-stone-100 overflow-hidden">
                        {res.items.map((item) => (
                            <div key={item.id} className="flex justify-between px-3 py-1.5 text-xs border-b border-stone-100 last:border-0">
                                <span className="text-stone-600">{item.name} ×{item.quantity}</span>
                                <span className="text-stone-700 font-medium">{Math.round(item.total)} ₼</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between text-sm font-medium border-t border-stone-200 pt-2">
                <span className="text-stone-600">
                    {t("reservationModal.total")}
                    {itemsTotal > 0 && priceData && (
                        <span className="font-normal text-stone-400 text-xs ml-1">
                            ({Math.round(priceData.finalTotalPrice)} ₼ + {itemsTotal} ₼ {t("reservationModal.additionalServices").toLowerCase()})
                        </span>
                    )}
                </span>
                <span className="text-amber-700 font-bold">{Math.round(res.totalPrice)} ₼</span>
            </div>
        </div>
    );
}

// ─── RESERVATION MODAL ───────────────────────────────────────────────────────

type ModalTab = "info" | "price";

interface Props {
    res: ReservationResponseDto;
    onClose: () => void;
}

export default function ReservationModal({ res, onClose }: Props) {
    const { t } = useTranslation();
    const { mutate: cancel, isPending } = useCancelMyReservation();
    const [modalTab, setModalTab] = useState<ModalTab>("info");
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelError, setCancelError] = useState("");

    const meta = STATUS_META[res.status];
    const daysUntilCheckIn = Math.floor((new Date(res.startDate).getTime() - Date.now()) / 86_400_000);
    const canCancel = res.status !== "Cancelled" && res.status !== "Completed" && daysUntilCheckIn >= 7;

    const statusLabels: Record<ReservationStatus, string> = {
        Confirmed: t("status.Confirmed"),
        Pending:   t("status.Pending"),
        Cancelled: t("status.Cancelled"),
        Completed: t("status.Completed"),
    };

    const handleCancel = () => {
        setCancelError("");
        cancel(res.id, {
            onSuccess: onClose,
            onError: (e: unknown) => setCancelError(getErrorMessage(e))
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-5 pb-3">
                    <div>
                        <h2 className="font-georgia font-bold text-stone-800 text-lg">{t("reservationModal.title")}</h2>
                        <p className="text-stone-500 text-sm mt-0.5">
                            {res.roomTypeName} · {res.roomNumber} · {formatDate(res.startDate)} — {formatDate(res.endDate)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.bg} ${meta.text} ${meta.border}`}>
                            {statusLabels[res.status]}
                        </span>
                        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg leading-none">✕</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-200 px-5">
                    {([
                        { id: "info"  as ModalTab, label: t("reservationModal.tabs.details") },
                        { id: "price" as ModalTab, label: t("reservationModal.tabs.price")   },
                    ]).map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setModalTab(id)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                modalTab === id
                                    ? "border-amber-600 text-amber-700"
                                    : "border-transparent text-stone-500 hover:text-stone-700"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {modalTab === "info" ? (
                        <>
                            <div className="bg-stone-50 rounded-xl p-3 flex flex-col gap-1.5 text-sm">
                                {[
                                    { label: t("reservationModal.checkIn"),  value: formatDate(res.startDate)               },
                                    { label: t("reservationModal.checkOut"), value: formatDate(res.endDate)                  },
                                    { label: t("reservationModal.nights"),   value: String(res.nightsCount)                  },
                                    { label: t("reservationModal.room"),     value: `№ ${res.roomNumber} · ${res.roomTypeName}` },
                                    { label: t("reservationModal.phone"),    value: res.customerPhone                        },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between gap-2">
                                        <span className="text-stone-400 shrink-0">{label}</span>
                                        <span className="text-stone-700 text-right">{value}</span>
                                    </div>
                                ))}
                            </div>

                            {res.notes && (
                                <div className="text-xs text-stone-400 bg-stone-50 rounded-xl px-3 py-2">
                                    {res.notes}
                                </div>
                            )}

                            {cancelError && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                                    {cancelError}
                                </p>
                            )}

                            {canCancel && (
                                confirmCancel ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancel}
                                            disabled={isPending}
                                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
                                        >
                                            {isPending ? t("reservationModal.cancelling") : t("reservationModal.cancelConfirm")}
                                        </button>
                                        <button
                                            onClick={() => setConfirmCancel(false)}
                                            disabled={isPending}
                                            className="flex-1 border border-stone-300 text-stone-600 rounded-xl py-2.5 text-sm transition-colors"
                                        >
                                            {t("reservationModal.cancelBack")}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmCancel(true)}
                                        className="w-full border border-red-200 hover:bg-red-50 text-red-600 rounded-xl py-2.5 text-sm transition-colors"
                                    >
                                        {t("reservationModal.cancelButton")}
                                    </button>
                                )
                            )}

                            {!canCancel && res.status !== "Cancelled" && res.status !== "Completed" && (
                                <p className="text-xs text-stone-400 text-center bg-stone-50 rounded-xl px-3 py-2">
                                    {t("reservationModal.cancelNotice")}
                                </p>
                            )}

                            {daysUntilCheckIn >= 7 && daysUntilCheckIn < 14 && canCancel && (
                                <p className="text-xs text-stone-400 text-center">
                                    {t("reservationModal.daysUntilCheckIn", { count: daysUntilCheckIn })}
                                </p>
                            )}
                        </>
                    ) : (
                        <UserPriceBreakdown res={res} />
                    )}
                </div>
            </div>
        </div>
    );
}
