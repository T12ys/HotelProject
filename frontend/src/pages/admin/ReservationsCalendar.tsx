import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useReservations, useUpdateReservation, useCancelReservation } from "../../features/reservation/useReservation";
import type { ReservationResponseDto, ReservationStatus, UpdateReservationDto } from "../../features/reservation/reservationTypes";
import { useRooms } from "../../features/room/useRoom";
import { useRoomTypes } from "../../features/roomType/useRoomTypes";
import { usePriceCalculation } from "../../features/priceRule/usePriceRule";
import {getErrorMessage} from "../../api/errorHandler.ts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT, DATE_PLACEHOLDER } from "../../utils/datePickerConfig";
// ─── helpers ──────────────────────────────────────────────────────────────────

function addDays(date: Date, n: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}
function parseLocalDate(iso: string): Date {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
}
function toISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function daysBetween(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
function formatDateShort(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const STATUS_META: Record<ReservationStatus, { bg: string; text: string; border: string }> = {
    Confirmed: { bg: "bg-green-200",  text: "text-green-900", border: "border-green-300"  },
    Pending:   { bg: "bg-amber-200",  text: "text-amber-900", border: "border-amber-300"  },
    Cancelled: { bg: "bg-red-100",    text: "text-red-700",   border: "border-red-200"    },
    Completed: { bg: "bg-stone-200",  text: "text-stone-700", border: "border-stone-300"  },
};

const COL_W      = 36;
const ROW_H      = 44;
const HDR_H      = 28;
const LABEL_W    = 220;
const DAY_HDR_H  = 56;

// ─── Price breakdown ──────────────────────────────────────────────────────────

function PriceBreakdown({ res, startDate, endDate }: {
    res: ReservationResponseDto; startDate: string; endDate: string;
}) {
    const { t } = useTranslation();
    const nights = daysBetween(parseLocalDate(startDate), parseLocalDate(endDate));
    const { data: priceData, isLoading } = usePriceCalculation(
        res.roomTypeId && nights > 0 ? { roomTypeId: res.roomTypeId, startDate, endDate } : null
    );
    const itemsTotal = res.items.reduce((s, i) => s + i.total, 0);

    return (
        <div className="flex flex-col gap-3">
            {isLoading ? (
                <div className="flex flex-col gap-1.5">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-5 bg-stone-100 animate-pulse rounded" />)}
                </div>
            ) : priceData?.dailyBreakdown.length ? (
                <div className="bg-stone-50 rounded-xl overflow-hidden border border-stone-100">
                    <div className="grid grid-cols-3 px-3 py-1.5 bg-stone-100 text-xs text-stone-500 font-medium">
                        <span>{t("reservationsCalendar.editModal.priceDate")}</span>
                        <span className="text-right">{t("reservationsCalendar.editModal.priceBase")}</span>
                        <span className="text-right">{t("reservationsCalendar.editModal.priceTotal")}</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                        {priceData.dailyBreakdown.map((day, i) => (
                            <div key={i} className="grid grid-cols-3 px-3 py-1.5 text-xs border-t border-stone-100">
                                <span className="text-stone-500">
                                    {new Date(day.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                    {day.appliedRules.length > 0 && (
                                        <span className="ml-1 text-amber-600"
                                              title={day.appliedRules.map(r => `${r.ruleName}: ${r.priceDelta > 0 ? "+" : ""}${Math.round(r.priceDelta)}₼`).join(", ")}>
                                            ✦
                                        </span>
                                    )}
                                </span>
                                <span className="text-right text-stone-400">{Math.round(day.basePrice)}₼</span>
                                <span className={`text-right font-medium ${day.finalPrice < day.basePrice ? "text-green-600" : day.finalPrice > day.basePrice ? "text-red-500" : "text-stone-700"}`}>
                                    {Math.round(day.finalPrice)}₼
                                </span>
                            </div>
                        ))}
                    </div>
                    {priceData.finalTotalPrice !== priceData.baseTotalPrice && (
                        <div className="px-3 py-1.5 border-t border-stone-200 flex justify-between text-xs">
                            <span className="text-stone-400 line-through">{Math.round(priceData.baseTotalPrice)}₼</span>
                            <span className="text-green-600 font-medium">
                                {t("reservationsCalendar.editModal.savings", { amount: Math.round(priceData.baseTotalPrice - priceData.finalTotalPrice) })}
                            </span>
                        </div>
                    )}
                    <p className="px-3 py-1 text-xs text-stone-400">{t("reservationsCalendar.editModal.priceRuleHint")}</p>
                </div>
            ) : (
                <p className="text-xs text-stone-400">{t("reservationsCalendar.editModal.priceUnavailable")}</p>
            )}

            {res.items.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{t("reservationsCalendar.editModal.additionalServices")}</p>
                    <div className="bg-stone-50 rounded-xl border border-stone-100 overflow-hidden">
                        {res.items.map((item) => (
                            <div key={item.id} className="flex justify-between px-3 py-1.5 text-xs border-b border-stone-100 last:border-0">
                                <span className="text-stone-600">{item.name} ×{item.quantity}</span>
                                <span className="text-stone-700 font-medium">{Math.round(item.total)}₼</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between text-sm font-medium border-t border-stone-200 pt-2">
                <span className="text-stone-600">
                    {t("reservationsCalendar.editModal.total")}
                    {itemsTotal > 0 && priceData && (
                        <span className="font-normal text-stone-400 text-xs ml-1">
                            {t("reservationsCalendar.editModal.totalBreakdown", {
                                accommodation: Math.round(priceData.finalTotalPrice),
                                services: itemsTotal,
                            })}
                        </span>
                    )}
                </span>
                <span className="text-amber-700 font-bold">{Math.round(res.totalPrice)}₼</span>
            </div>
        </div>
    );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

type Tab = "edit" | "price";

function EditModal({ res, onClose }: { res: ReservationResponseDto; onClose: () => void }) {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const { mutate: update, isPending: isUpdating } = useUpdateReservation();
    const { mutate: cancel, isPending: isCancelling } = useCancelReservation();


    const [tab,           setTab]           = useState<Tab>("edit");
    const [startDate,     setStartDate]     = useState<Date | null>(parseLocalDate(res.startDate.slice(0, 10)));
    const [endDate,       setEndDate]       = useState<Date | null>(parseLocalDate(res.endDate.slice(0, 10)));
    const [status,        setStatus]        = useState<ReservationStatus>(res.status);
    const [notes,         setNotes]         = useState(res.notes ?? "");
    const [error,         setError]         = useState("");
    const [confirmCancel, setConfirmCancel] = useState(false);

    const isPending = isUpdating || isCancelling;

    const handleCheckInChange = (date: Date | null) => {
        setStartDate(date);
        if (date && endDate && date >= endDate) {
            setEndDate(addDays(date, 1));
        }
    };

    const handleSave = () => {
        setError("");
        const start = startDate ? toISO(startDate) : "";
        const end   = endDate   ? toISO(endDate)   : "";
        if (!start || !end || start >= end) { setError(t("reservationsCalendar.editModal.dateError")); return; }
        const dto: UpdateReservationDto = {};
        if (start  !== res.startDate.slice(0, 10)) dto.startDate = start;
        if (end    !== res.endDate.slice(0, 10))   dto.endDate   = end;
        if (status !== res.status)                 dto.status    = status;
        if (notes  !== (res.notes ?? ""))          dto.notes     = notes;
        if (Object.keys(dto).length === 0) { onClose(); return; }
        update({ id: res.id, dto }, {
            onSuccess: onClose,
            onError: (err: unknown) => setError(getErrorMessage(err)),
        });
    };

    const meta = STATUS_META[res.status];

    // Build status label map from translations
    const statusLabels: Record<ReservationStatus, string> = {
        Confirmed: t("status.Confirmed"),
        Pending:   t("status.Pending"),
        Cancelled: t("status.Cancelled"),
        Completed: t("status.Completed"),
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3 p-5 pb-3">
                    <div>
                        <h2 className="font-georgia font-bold text-stone-800 text-lg">{t("reservationsCalendar.editModal.title")}</h2>
                        <p className="text-stone-500 text-sm mt-0.5">
                            {res.roomTypeName} · {res.roomNumber} · {formatDateShort(res.startDate)} — {formatDateShort(res.endDate)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.bg} ${meta.text} ${meta.border}`}>
                            {statusLabels[res.status]}
                        </span>
                        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg leading-none">✕</button>
                    </div>
                </div>

                <div className="mx-5 bg-stone-50 rounded-xl p-3 flex flex-col gap-1 text-sm mb-3">
                    {([
                        { label: t("reservationsCalendar.editModal.guest"),  value: res.customerName  },
                        { label: t("reservationsCalendar.editModal.email"),  value: res.customerEmail },
                        { label: t("reservationsCalendar.editModal.phone"),  value: res.customerPhone },
                    ] as const).map(({ label, value }) => (
                        <div key={label} className="flex justify-between gap-2">
                            <span className="text-stone-400 shrink-0">{label}</span>
                            <span className="text-stone-700 text-right truncate">{value}</span>
                        </div>
                    ))}
                </div>

                <div className="flex border-b border-stone-200 px-5">
                    {([
                        { id: "edit"  as Tab, label: t("reservationsCalendar.editModal.tabs.edit")  },
                        { id: "price" as Tab, label: t("reservationsCalendar.editModal.tabs.price") },
                    ]).map(({ id, label }) => (
                        <button key={id} onClick={() => setTab(id)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === id ? "border-amber-600 text-amber-700" : "border-transparent text-stone-500 hover:text-stone-700"}`}>
                            {label}
                        </button>
                    ))}
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {tab === "edit" ? (
                        <>
                            <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-stone-500">{t("reservationsCalendar.editModal.checkInDate")}</label>
                                            <DatePicker
                                                selected={startDate}
                                                onChange={handleCheckInChange}
                                                selectsStart
                                                startDate={startDate}
                                                endDate={endDate}
                                                locale={lang}
                                                dateFormat={DATE_FORMAT[lang]}
                                                placeholderText={DATE_PLACEHOLDER[lang]}
                                                className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-stone-500">{t("reservationsCalendar.editModal.checkOutDate")}</label>
                                        <DatePicker
                                            selected={endDate}
                                            onChange={(date: Date | null) => setEndDate(date)}
                                            selectsEnd
                                            startDate={startDate}
                                            endDate={endDate}
                                            minDate={startDate ?? undefined}
                                            locale={lang}
                                            dateFormat={DATE_FORMAT[lang]}
                                            placeholderText={DATE_PLACEHOLDER[lang]}
                                            className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white w-full"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-stone-500">{t("reservationsCalendar.editModal.status")}</label>
                                    <select value={status} onChange={(e) => setStatus(e.target.value as ReservationStatus)}
                                            className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white">
                                        {(Object.keys(STATUS_META) as ReservationStatus[]).filter(s => s !== "Confirmed").map(s => (
                                            <option key={s} value={s}>{statusLabels[s]}</option>
                                        ))}
                                    </select>
                                    {res.status === "Confirmed" && (
                                        <p className="text-xs text-stone-400">{t("reservationsCalendar.editModal.statusNote")}</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-stone-500">{t("reservationsCalendar.editModal.notes")}</label>
                                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                                              className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white resize-none" />
                                </div>
                            </div>
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
                            <div className="flex flex-col gap-2">
                                <button onClick={handleSave} disabled={isPending}
                                        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
                                    {isUpdating ? t("reservationsCalendar.editModal.saving") : t("reservationsCalendar.editModal.save")}
                                </button>
                                {res.status !== "Cancelled" && (
                                    confirmCancel ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => cancel(res.id, { onSuccess: onClose })} disabled={isPending}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
                                                {isCancelling ? t("reservationsCalendar.editModal.cancelling") : t("reservationsCalendar.editModal.cancelConfirm")}
                                            </button>
                                            <button onClick={() => setConfirmCancel(false)} disabled={isPending}
                                                    className="flex-1 border border-stone-300 text-stone-600 rounded-xl py-2.5 text-sm transition-colors">
                                                {t("reservationsCalendar.editModal.back")}
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmCancel(true)} disabled={isPending}
                                                className="w-full border border-red-200 hover:bg-red-50 text-red-600 disabled:opacity-40 rounded-xl py-2.5 text-sm transition-colors">
                                            {t("reservationsCalendar.editModal.cancel")}
                                        </button>
                                    )
                                )}
                            </div>
                        </>
                    ) : (
                        <PriceBreakdown
                            res={res}
                            startDate={startDate ? toISO(startDate) : res.startDate.slice(0, 10)}
                            endDate={endDate   ? toISO(endDate)   : res.endDate.slice(0, 10)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Reservation bar ──────────────────────────────────────────────────────────

function ResBar({ res, startOffset, spanDays, onEdit }: {
    res: ReservationResponseDto; startOffset: number; spanDays: number;
    onEdit: (res: ReservationResponseDto) => void;
}) {
    const meta  = STATUS_META[res.status] ?? STATUS_META.Confirmed;
    const left  = startOffset * COL_W;
    const width = Math.max(spanDays * COL_W - 2, 4);
    const top   = (ROW_H - 28) / 2;

    return (
        <div className={`absolute cursor-pointer select-none ${res.status === "Cancelled" ? "opacity-40" : ""}`}
             style={{ left, top, width, height: 28, zIndex: 1 }}
             onClick={() => onEdit(res)}
             title={`${res.customerName} · ${res.startDate.slice(0,10)} — ${res.endDate.slice(0,10)}`}
        >
            <div className={`h-full rounded-md border flex items-center overflow-hidden hover:brightness-95 transition-all ${meta.bg} ${meta.border}`}>
                <span className={`text-xs font-medium px-2 truncate leading-none ${meta.text}`}>{res.customerName}</span>
            </div>
        </div>
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoomRow   { roomId: number; roomNumber: string; roomTypeId: number; roomTypeName: string; }
interface RoomGroup { typeId: number; typeName: string; rooms: RoomRow[]; }

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReservationsCalendar() {
    const { t } = useTranslation();

    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);

    const [viewStart,  setViewStart]  = useState(() => new Date(todayLocal.getFullYear(), todayLocal.getMonth(), 1));
    const [editingRes, setEditingRes] = useState<ReservationResponseDto | null>(null);
    const [collapsed,  setCollapsed]  = useState<Set<number>>(new Set());

    const daysInMonth = new Date(viewStart.getFullYear(), viewStart.getMonth() + 1, 0).getDate();
    const viewEnd     = addDays(viewStart, daysInMonth);
    const days        = Array.from({ length: daysInMonth }, (_, i) => addDays(viewStart, i));
    const totalWidth  = daysInMonth * COL_W;

    const { data: resData,   isLoading: resLoading   } = useReservations({ from: toISO(viewStart), to: toISO(viewEnd), pageSize: 500, page: 1 });
    const { data: roomsData, isLoading: roomsLoading } = useRooms({ page: 1, pageSize: 200 });
    const { data: rtData,    isLoading: rtLoading    } = useRoomTypes({ page: 1, pageSize: 100 });

    const isLoading = resLoading || roomsLoading || rtLoading;
    const allRes    = resData?.items ?? [];

    const rtNameMap = new Map<number, string>();
    for (const rt of rtData?.items ?? []) rtNameMap.set(rt.id, rt.name);

    const roomMap = new Map<number, RoomRow>();
    for (const room of roomsData?.items ?? []) {
        roomMap.set(room.id, { roomId: room.id, roomNumber: room.number, roomTypeId: room.roomTypeId, roomTypeName: rtNameMap.get(room.roomTypeId) ?? "—" });
    }
    for (const r of allRes) {
        if (!roomMap.has(r.roomId)) roomMap.set(r.roomId, { roomId: r.roomId, roomNumber: r.roomNumber, roomTypeId: r.roomTypeId, roomTypeName: r.roomTypeName });
    }

    const groupMap = new Map<number, RoomGroup>();
    for (const room of [...roomMap.values()].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }))) {
        if (!groupMap.has(room.roomTypeId)) groupMap.set(room.roomTypeId, { typeId: room.roomTypeId, typeName: room.roomTypeName, rooms: [] });
        groupMap.get(room.roomTypeId)!.rooms.push(room);
    }
    const groups: RoomGroup[] = [...groupMap.values()].sort((a, b) => a.typeName.localeCompare(b.typeName));

    const resByRoom = new Map<number, ReservationResponseDto[]>();
    for (const r of allRes) {
        if (!resByRoom.has(r.roomId)) resByRoom.set(r.roomId, []);
        resByRoom.get(r.roomId)!.push(r);
    }

    const toggleCollapse = (typeId: number) =>
        setCollapsed(prev => {
            const n = new Set(prev);
            if (n.has(typeId)) n.delete(typeId);
            else n.add(typeId);
            return n;
        });
    const collapseAll  = () => setCollapsed(new Set(groups.map(g => g.typeId)));
    const expandAll    = () => setCollapsed(new Set());
    const allCollapsed = groups.length > 0 && collapsed.size === groups.length;

    const todayOffset = daysBetween(viewStart, todayLocal);

    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!bodyRef.current || todayOffset < 0) return;
        bodyRef.current.scrollLeft = Math.max(0, todayOffset * COL_W - 80);
    }, [viewStart, todayOffset]);

    const visibleRoomsCount = groups.reduce((n, g) => n + (collapsed.has(g.typeId) ? 0 : g.rooms.length), 0);

    const rowGridStyle = {
        backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${COL_W - 1}px, #e7e5e0 ${COL_W - 1}px, #e7e5e0 ${COL_W}px)`,
        backgroundSize: `${COL_W}px 100%`,
    };

    // Translated months/days arrays
    const monthsArr = Array.from({ length: 12 }, (_, i) => t(`reservationsCalendar.months.${i}`));
    const daysShort = Array.from({ length: 7 }, (_, i) => t(`reservationsCalendar.days.short.${i}`));
    const daysFull  = Array.from({ length: 7 }, (_, i) => t(`reservationsCalendar.days.full.${i}`));

    const statusLabels: Record<ReservationStatus, string> = {
        Confirmed: t("status.Confirmed"),
        Pending:   t("status.Pending"),
        Cancelled: t("status.Cancelled"),
        Completed: t("status.Completed"),
    };

    const prevMonth = () => setViewStart(new Date(viewStart.getFullYear(), viewStart.getMonth() - 1, 1));
    const nextMonth = () => setViewStart(new Date(viewStart.getFullYear(), viewStart.getMonth() + 1, 1));
    const goToday   = () => setViewStart(new Date(todayLocal.getFullYear(), todayLocal.getMonth(), 1));

    return (
        <div className="flex flex-col gap-4">

            {/* Page header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-georgia font-bold text-stone-800 text-xl">{t("reservationsCalendar.title")}</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {t("reservationsCalendar.subtitle", {
                            month: monthsArr[viewStart.getMonth()],
                            year: viewStart.getFullYear(),
                            typeCount: groups.length,
                            typeWord: t("reservationsCalendar.typeWord", { count: groups.length }),
                            roomCount: visibleRoomsCount,
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-3 mr-2">
                        {(Object.entries(STATUS_META) as [ReservationStatus, typeof STATUS_META[ReservationStatus]][]).map(([key, m]) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <span className={`w-3 h-3 rounded-sm border ${m.bg} ${m.border}`} />
                                <span className="text-xs text-stone-500">{statusLabels[key]}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={allCollapsed ? expandAll : collapseAll}
                            className="border border-stone-300 bg-white hover:border-stone-400 text-stone-600 text-sm rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={allCollapsed ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                        </svg>
                        {allCollapsed ? t("reservationsCalendar.expandAll") : t("reservationsCalendar.collapseAll")}
                    </button>
                    <button onClick={goToday} className="border border-stone-300 bg-white hover:border-stone-400 text-stone-600 text-sm rounded-lg px-3 py-1.5 transition-colors">
                        {t("reservationsCalendar.today")}
                    </button>
                    <button onClick={prevMonth} className="border border-stone-300 bg-white hover:border-stone-400 rounded-lg p-1.5 text-stone-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={nextMonth} className="border border-stone-300 bg-white hover:border-stone-400 rounded-lg p-1.5 text-stone-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col gap-2">{[...Array(6)].map((_, i) => <div key={i} className="h-11 rounded-xl bg-stone-100 animate-pulse" />)}</div>
            ) : (
                <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
                     style={{ maxHeight: "calc(100vh - 220px)", display: "flex", flexDirection: "column" }}>

                    <div ref={bodyRef}
                         className="flex-1 overflow-auto"
                         style={{ scrollbarWidth: "thin" }}>
                        <div style={{ width: LABEL_W + totalWidth, minWidth: LABEL_W + totalWidth }}>

                            {/* Day header */}
                            <div className="flex border-b border-stone-200 bg-stone-50"
                                 style={{ position: "sticky", top: 0, zIndex: 20, height: DAY_HDR_H }}>
                                <div className="shrink-0 border-r border-stone-200 bg-stone-50 flex items-center px-3"
                                     style={{ position: "sticky", left: 0, zIndex: 21, width: LABEL_W }}>
                                    <span className="text-xs text-stone-400 font-medium uppercase tracking-wide">{t("reservationsCalendar.labelHeader")}</span>
                                </div>
                                <div className="flex flex-col" style={{ width: totalWidth }}>
                                    <div className="flex" style={{ height: 32 }}>
                                        {days.map((day, i) => {
                                            const isToday   = toISO(day) === toISO(todayLocal);
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                            return (
                                                <div key={i} title={`${daysFull[day.getDay()]}, ${day.toLocaleDateString()}`}
                                                     className={`flex items-center justify-center text-xs border-r border-stone-100 shrink-0 ${isToday ? "bg-amber-100" : isWeekend ? "bg-stone-100/60" : ""}`}
                                                     style={{ width: COL_W, height: 32 }}>
                                                    <span className={`font-medium ${isToday ? "text-amber-700" : isWeekend ? "text-red-500" : "text-stone-600"}`}>{day.getDate()}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex" style={{ height: 24 }}>
                                        {days.map((day, i) => {
                                            const isToday   = toISO(day) === toISO(todayLocal);
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                            return (
                                                <div key={i}
                                                     className={`flex items-center justify-center text-xs border-r border-stone-100 shrink-0 ${isToday ? "bg-amber-100" : isWeekend ? "bg-stone-100/60" : ""}`}
                                                     style={{ width: COL_W, height: 24 }}>
                                                    <span className={isToday ? "text-amber-600" : isWeekend ? "text-red-400" : "text-stone-400"}>{daysShort[day.getDay()]}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {groups.length === 0 ? (
                                <div className="flex items-center justify-center py-16 text-stone-400 text-sm">{t("reservationsCalendar.noRooms")}</div>
                            ) : groups.map((group) => {
                                const isCollapsed = collapsed.has(group.typeId);
                                return (
                                    <div key={group.typeId}>
                                        <div className="flex border-b border-stone-200" style={{ height: HDR_H }}>
                                            <button onClick={() => toggleCollapse(group.typeId)}
                                                    className="flex items-center gap-2 px-3 h-full bg-stone-100 hover:bg-stone-200 border-r border-stone-200 transition-colors shrink-0"
                                                    style={{ width: LABEL_W, position: "sticky", left: 0, zIndex: 10 }}>
                                                <svg className={`w-3 h-3 text-stone-500 shrink-0 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                                                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide truncate">{group.typeName}</span>
                                                <span className="ml-auto text-xs text-stone-400 shrink-0">{group.rooms.length}</span>
                                            </button>
                                            <div className="bg-stone-100" style={{ width: totalWidth }} />
                                        </div>
                                        {!isCollapsed && group.rooms.map((room, idx) => {
                                            const roomRes = resByRoom.get(room.roomId) ?? [];
                                            return (
                                                <div key={room.roomId} className="flex border-b border-stone-100"
                                                     style={{ width: LABEL_W + totalWidth, height: ROW_H }}>

                                                    <div className={`shrink-0 flex items-center px-3 gap-2 border-r border-stone-200 ${idx % 2 === 0 ? "bg-white" : "bg-stone-50/50"}`}
                                                         style={{ width: LABEL_W, position: "sticky", left: 0, zIndex: 10 }}>
                                                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                                            <span className="text-xs font-bold text-amber-700 leading-none">{room.roomNumber}</span>
                                                        </div>
                                                        <p className="text-sm text-stone-700 font-medium truncate">№ {room.roomNumber}</p>
                                                    </div>

                                                    <div className={`relative ${idx % 2 === 0 ? "bg-white" : "bg-stone-50/30"}`}
                                                         style={{ width: totalWidth, height: ROW_H, ...rowGridStyle }}>
                                                        {days.map((day, i) => {
                                                            if (day.getDay() !== 0 && day.getDay() !== 6) return null;
                                                            return <div key={i} className="absolute top-0 bottom-0 bg-stone-100/40 pointer-events-none" style={{ left: i * COL_W, width: COL_W }} />;
                                                        })}
                                                        {todayOffset >= 0 && todayOffset < daysInMonth && (
                                                            <div className="absolute top-0 bottom-0 bg-amber-50/60 pointer-events-none" style={{ left: todayOffset * COL_W, width: COL_W, zIndex: 0 }} />
                                                        )}
                                                        {[...roomRes]
                                                            .sort((a, b) => {
                                                                const order: Record<ReservationStatus, number> = {
                                                                    Cancelled: 0, Completed: 1, Pending: 2, Confirmed: 3,
                                                                };
                                                                return (order[a.status] ?? 0) - (order[b.status] ?? 0);
                                                            })
                                                            .map((res) => {
                                                                const rs = parseLocalDate(res.startDate);
                                                                const re = parseLocalDate(res.endDate);
                                                                const cs = rs < viewStart ? viewStart : rs;
                                                                const ce = re > viewEnd   ? viewEnd   : re;
                                                                if (cs >= ce) return null;
                                                                const startOffset = daysBetween(viewStart, cs);
                                                                const span        = daysBetween(cs, ce);
                                                                if (span <= 0) return null;
                                                                return <ResBar key={res.id} res={res} startOffset={startOffset} spanDays={span} onEdit={setEditingRes} />;
                                                            })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {editingRes && <EditModal key={editingRes.id} res={editingRes} onClose={() => setEditingRes(null)} />}
        </div>
    );
}
