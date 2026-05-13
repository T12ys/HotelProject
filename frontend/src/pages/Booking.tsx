import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRoomType } from "../features/roomType/useRoomTypes";
import { usePriceCalculation } from "../features/priceRule/usePriceRule";
import { useCreateReservation } from "../features/reservation/useReservation";
import { useAuth } from "../features/auth/useAuth";
import {
    pluralNights,
    getTodayAndTomorrow,
    nightsBetween,
    nextDay,
    toISO,
    fromISO
} from "../utils/dateUtils";
import type { ReservationItemDto } from "../features/reservation/reservationTypes";
import { getErrorMessage } from "../api/errorHandler.ts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {DATE_FORMAT, DATE_PLACEHOLDER} from '../utils/datePickerConfig';

import * as React from "react";



interface PresetService {
    id: string;
    price: number;
}

const PRESET_SERVICES: PresetService[] = [
    { id: "breakfast", price: 25 },
    { id: "transfer",  price: 60 },
    { id: "parking",   price: 15 },
    { id: "minibar",   price: 30 },
];

const ICONS: Record<string, React.ReactElement> = {
    breakfast: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-600">
            <path d="M18 8h1a4 4 0 010 8h-1" />
            <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
    ),
    transfer: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-600">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    ),
    parking: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-600">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 17V7h4a3 3 0 010 6H9" />
        </svg>
    ),
    minibar: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-600">
            <path d="M8 22V12L4 3h16l-4 9v10" />
            <line x1="8" y1="22" x2="16" y2="22" />
            <line x1="4" y1="9" x2="20" y2="9" />
        </svg>
    ),
};

function ServiceCard({
                         service, quantity, onAdd, onRemove,
                     }: {
    service: PresetService;
    quantity: number;
    onAdd: () => void;
    onRemove: () => void;
}) {
    const { t } = useTranslation();
    return (
        <div className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${quantity > 0 ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"}`}>
            <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0">{ICONS[service.id]}</span>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-700 truncate">{t(`services.${service.id}.name`)}</p>
                    <p className="text-xs text-stone-400 truncate">{t(`services.${service.id}.description`)}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-amber-700">{service.price}₼</span>
                {quantity === 0 ? (
                    <button onClick={onAdd} className="w-7 h-7 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center text-lg leading-none transition-colors">
                        +
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <button onClick={onRemove} className="w-7 h-7 rounded-full border border-stone-300 hover:bg-stone-100 text-stone-600 flex items-center justify-center text-lg leading-none transition-colors">
                            −
                        </button>
                        <span className="text-sm font-semibold text-stone-700 w-4 text-center">{quantity}</span>
                        <button onClick={onAdd} className="w-7 h-7 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center text-lg leading-none transition-colors">
                            +
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Booking() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const roomTypeId = Number(searchParams.get("roomTypeId"));
    const { today, tomorrow } = getTodayAndTomorrow();

    const [checkIn,  setCheckIn]  = useState<Date | null>(fromISO(searchParams.get("checkIn")  || today));
    const [checkOut, setCheckOut] = useState<Date | null>(fromISO(searchParams.get("checkOut") || tomorrow));

    const { user } = useAuth();
    const [name,   setName]   = useState(user?.displayName ?? "");
    const [email,  setEmail]  = useState(user?.email       ?? "");
    const [phone,  setPhone]  = useState(user?.phoneNumber ?? "");
    const [guests, setGuests] = useState("1");
    const [notes,  setNotes]  = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [serviceQty, setServiceQty] = useState<Record<string, number>>({});

    const { data: roomType, isLoading: roomLoading } = useRoomType(roomTypeId);

    const checkInISO  = toISO(checkIn);
    const checkOutISO = toISO(checkOut);
    const nights = nightsBetween(checkInISO, checkOutISO);

    const { data: priceData, isLoading: priceLoading } = usePriceCalculation(
        roomTypeId && checkInISO && checkOutISO && nights > 0
            ? { roomTypeId, startDate: checkInISO, endDate: checkOutISO }
            : null
    );

    const { mutate: createReservation, isPending } = useCreateReservation();

    const selectedItems: ReservationItemDto[] = PRESET_SERVICES
        .filter((s) => (serviceQty[s.id] ?? 0) > 0)
        .map((s) => ({
            name:     t(`services.${s.id}.name`),
            price:    s.price,
            quantity: serviceQty[s.id],
        }));

    const itemsTotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const grandTotal = priceData ? Math.round(priceData.finalTotalPrice) + itemsTotal : null;

    const handleCheckInChange = (date: Date | null) => {
        setCheckIn(date);
        if (date && checkOut && date >= checkOut) {
            setCheckOut(fromISO(nextDay(toISO(date))));
        }
    };

    const addService    = (id: string) => setServiceQty((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    const removeService = (id: string) => setServiceQty((prev) => {
        const next = { ...prev };
        if ((next[id] ?? 0) > 1) next[id]--;
        else delete next[id];
        return next;
    });

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = t("validation.nameRequired");
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t("validation.emailInvalid");
        if (!phone.trim() || phone.replace(/\D/g, "").length < 7) e.phone = t("validation.phoneInvalid");
        if (!checkIn)  e.checkIn  = t("booking.checkInDate");
        if (!checkOut) e.checkOut = t("booking.checkOutDate");
        if (nights <= 0) e.checkOut = t("booking.checkOutDate");
        if (Number(guests) < 1) e.guests = t("booking.guestsCount");
        if (roomType && Number(guests) > roomType.capacity) e.guests = t("booking.guestsMax", { count: roomType.capacity });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        createReservation(
            {
                roomTypeId,
                customerName:  name.trim(),
                customerEmail: email.trim(),
                customerPhone: phone.trim(),
                startDate:     checkInISO,
                endDate:       checkOutISO,
                guestCount:    Number(guests),
                notes:         notes.trim() || undefined,
                items:         selectedItems.length > 0 ? selectedItems : undefined,
            },
            {
                onSuccess: (res) => {
                    localStorage.setItem("pendingReservationId", res.id);
                    navigate(`/booking/${res.id}`);
                },
                onError: (err: unknown) => {
                    setErrors({ submit: getErrorMessage(err) });
                },
            }
        );
    };

    const lang        = i18n.language;
    const fmt         = DATE_FORMAT[lang] ?? "dd.MM.yyyy";
    const placeholder = DATE_PLACEHOLDER[lang] ?? "dd.MM.yyyy";
    const pickerClass = (hasError: boolean) =>
        `border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white w-full ${hasError ? "border-red-400" : "border-stone-300"}`;

    if (!roomTypeId) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <p className="font-georgia text-stone-600 text-lg">{t("booking.notSelected")}</p>
                <Link to="/rooms" className="mt-4 text-sm text-amber-600 hover:underline">
                    {t("booking.backToList")}
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-6 flex flex-col gap-6">
            <Link to={`/rooms/${roomTypeId}`} className="flex items-center gap-2 text-sm text-stone-500 hover:text-amber-600 transition-colors w-fit">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t("booking.backToRoom")}
            </Link>

            <h1 className="font-georgia font-bold text-stone-800 text-2xl">{t("booking.title")}</h1>

            <div className="flex gap-6 items-start">
                <div className="flex-1 flex flex-col gap-5">

                    {/* Dates */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-4">
                        <h2 className="font-georgia font-semibold text-stone-700 text-base">{t("booking.dates")}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-stone-500">{t("booking.checkInDate")}</label>
                                <DatePicker
                                    selected={checkIn}
                                    onChange={handleCheckInChange}
                                    selectsStart
                                    startDate={checkIn}
                                    endDate={checkOut}
                                    minDate={new Date()}
                                    locale={lang}
                                    dateFormat={fmt}
                                    placeholderText={placeholder}
                                    className={pickerClass(!!errors.checkIn)}
                                />
                                {errors.checkIn && <p className="text-xs text-red-500">{errors.checkIn}</p>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-stone-500">{t("booking.checkOutDate")}</label>
                                <DatePicker
                                    selected={checkOut}
                                    onChange={(date: Date | null) => setCheckOut(date)}
                                    selectsEnd
                                    startDate={checkIn}
                                    endDate={checkOut}
                                    minDate={checkIn ?? new Date()}
                                    locale={lang}
                                    dateFormat={fmt}
                                    placeholderText={placeholder}
                                    className={pickerClass(!!errors.checkOut)}
                                />
                                {errors.checkOut && <p className="text-xs text-red-500">{errors.checkOut}</p>}
                            </div>
                        </div>
                        {nights > 0 && (
                            <p className="text-sm text-stone-500">
                                {t("booking.duration")}:{" "}
                                <span className="text-stone-700 font-medium">{pluralNights(nights)}</span>
                            </p>
                        )}
                    </div>

                    {/* Guests */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-3">
                        <h2 className="font-georgia font-semibold text-stone-700 text-base">{t("booking.guestsSection")}</h2>
                        <div className="flex flex-col gap-1 max-w-xs">
                            <label className="text-xs text-stone-500">
                                {t("booking.guestsCount")}{roomType ? ` (${t("booking.guestsMax", { count: roomType.capacity })})` : ""}
                            </label>
                            <input
                                type="number" min={1} max={roomType?.capacity ?? 99} value={guests}
                                onChange={(e) => setGuests(e.target.value)}
                                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white ${errors.guests ? "border-red-400" : "border-stone-300"}`}
                            />
                            {errors.guests && <p className="text-xs text-red-500">{errors.guests}</p>}
                        </div>
                    </div>

                    {/* Services */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-3">
                        <div>
                            <h2 className="font-georgia font-semibold text-stone-700 text-base">{t("booking.services")}</h2>
                            <p className="text-xs text-stone-400 mt-0.5">{t("booking.servicesSubtitle")}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            {PRESET_SERVICES.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    quantity={serviceQty[service.id] ?? 0}
                                    onAdd={() => addService(service.id)}
                                    onRemove={() => removeService(service.id)}
                                />
                            ))}
                        </div>
                        {itemsTotal > 0 && (
                            <p className="text-xs text-stone-500 text-right">
                                {t("booking.servicesTotal", { amount: itemsTotal })}
                            </p>
                        )}
                    </div>

                    {/* Contacts */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-4">
                        <h2 className="font-georgia font-semibold text-stone-700 text-base">{t("booking.contacts")}</h2>
                        {([
                            { key: "name",  label: t("nav.profile"),    type: "text",  value: name,  setter: setName,  placeholder: t("booking.namePlaceholder") },
                            { key: "email", label: "E-mail",            type: "email", value: email, setter: setEmail, placeholder: t("booking.emailPlaceholder") },
                            { key: "phone", label: t("profile.phone"),  type: "tel",   value: phone, setter: setPhone, placeholder: t("booking.phonePlaceholder") },
                        ] as const).map(({ key, label, type, value, setter, placeholder }) => (
                            <div key={key} className="flex flex-col gap-1">
                                <label className="text-xs text-stone-500">{label}</label>
                                <input
                                    type={type} value={value}
                                    onChange={(e) => setter(e.target.value)}
                                    placeholder={placeholder}
                                    className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white ${errors[key] ? "border-red-400" : "border-stone-300"}`}
                                />
                                {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
                            </div>
                        ))}
                        {user && (
                            <p className="text-xs text-stone-400 flex items-center gap-1">
                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t("booking.prefilled")}
                            </p>
                        )}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-stone-500">{t("booking.notes")}</label>
                            <textarea
                                value={notes} onChange={(e) => setNotes(e.target.value)}
                                placeholder={t("booking.notesPlaceholder")} rows={3}
                                className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white resize-none"
                            />
                        </div>
                    </div>

                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                            {errors.submit}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="w-64 shrink-0 flex flex-col gap-4 sticky top-4">
                    <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-3">
                        <h2 className="font-georgia font-semibold text-stone-700 text-base">{t("booking.summary")}</h2>

                        {roomLoading ? (
                            <div className="h-5 w-32 bg-stone-100 animate-pulse rounded" />
                        ) : roomType ? (
                            <p className="text-stone-700 font-medium text-sm">{roomType.name}</p>
                        ) : null}

                        {nights > 0 && <p className="text-stone-500 text-sm">{pluralNights(nights)}</p>}

                        <div className="border-t border-stone-100 pt-3 flex flex-col gap-1.5">
                            {priceLoading ? (
                                <div className="h-7 w-24 bg-stone-100 animate-pulse rounded" />
                            ) : priceData && nights > 0 ? (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-500">{t("booking.accommodation")}</span>
                                        <span className="text-stone-700">{Math.round(priceData.finalTotalPrice)}₼</span>
                                    </div>
                                    {itemsTotal > 0 && selectedItems.map((item) => (
                                        <div key={item.name} className="flex justify-between text-sm">
                                            <span className="text-stone-500 truncate">{item.name} ×{item.quantity}</span>
                                            <span className="text-stone-700 shrink-0">{item.price * item.quantity}₼</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-bold text-base pt-1 border-t border-stone-100 mt-1">
                                        <span className="text-stone-700">{t("booking.total")}</span>
                                        <span className="text-amber-700">{grandTotal}₼</span>
                                    </div>
                                </>
                            ) : nights > 0 ? (
                                <p className="text-stone-400 text-sm">{t("booking.priceUnavailable")}</p>
                            ) : (
                                <p className="text-stone-400 text-sm">{t("booking.chooseDates")}</p>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isPending || nights <= 0}
                            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 font-medium text-sm transition-colors"
                        >
                            {isPending ? t("booking.creating") : t("booking.submitButton")}
                        </button>

                        <p className="text-xs text-stone-400 text-center leading-relaxed">
                            {t("booking.holdNotice")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}