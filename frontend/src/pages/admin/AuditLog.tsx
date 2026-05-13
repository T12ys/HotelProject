import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAuditLogs, getAuditActionTypes } from "../../features/auditLog/auditLogService.ts";
import { getAllUsers } from "../../features/user/userService.ts";
import type { AuditLogEntry, AuditLogFilterRequest } from "../../features/auditLog/auditLogTypes.ts";
import type { AdminUserResponse } from "../../features/user/userTypes.ts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT, DATE_PLACEHOLDER } from "../../utils/datePickerConfig";

const PAGE_SIZE = 30;

const ACTION_COLORS: Record<string, string> = {
    Create:             "bg-emerald-50 text-emerald-700 border-emerald-200",
    Update:             "bg-blue-50 text-blue-700 border-blue-200",
    UpdateProfile:      "bg-blue-50 text-blue-700 border-blue-200",
    Delete:             "bg-red-50 text-red-700 border-red-200",
    DeletePhoto:        "bg-red-50 text-red-700 border-red-200",
    Cancel:             "bg-orange-50 text-orange-700 border-orange-200",
    ChangePassword:     "bg-purple-50 text-purple-700 border-purple-200",
    UpdateRole:         "bg-amber-50 text-amber-700 border-amber-200",
    AddPhotos:          "bg-teal-50 text-teal-700 border-teal-200",
    ChangeAvailability: "bg-sky-50 text-sky-700 border-sky-200",
    PaymentConfirmed:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    PaymentFailed:      "bg-red-50 text-red-700 border-red-200",
    HoldExpired:        "bg-orange-50 text-orange-700 border-orange-200",
    AutoCompleted:      "bg-stone-100 text-stone-600 border-stone-200",
};

const ROLE_STYLES: Record<string, string> = {
    Admin:     "bg-amber-100 text-amber-700",
    Moderator: "bg-blue-100 text-blue-700",
    Customer:  "bg-stone-100 text-stone-600",
};

// ─── Multi-Select ─────────────────────────────────────────────────────────────

interface MultiSelectProps<T extends string> {
    label: string;
    options: { value: T; label: string }[];
    selected: T[];
    onChange: (values: T[]) => void;
    placeholder?: string;
}

function MultiSelect<T extends string>({ label, options, selected, onChange, placeholder }: MultiSelectProps<T>) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const defaultPlaceholder = placeholder ?? t("auditLog.all");

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggle = (val: T) => {
        if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
        else onChange([...selected, val]);
    };

    const allSelected  = selected.length === 0;
    const displayText  = allSelected
        ? defaultPlaceholder
        : selected.length === 1
            ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
            : `${selected.length} ${t("auditLog.all").toLowerCase()}`;

    return (
        <div ref={ref} className="relative">
            <p className="text-xs text-stone-500 mb-1 font-medium">{label}</p>
            <button onClick={() => setOpen((v) => !v)}
                    className="flex items-center justify-between gap-2 w-full px-3 py-2 border border-stone-200 rounded-lg bg-white text-sm text-stone-700 hover:border-stone-300 transition-colors min-w-[140px]">
                <span className={allSelected ? "text-stone-400" : "text-stone-700"}>{displayText}</span>
                <svg className={`w-4 h-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-stone-200 rounded-xl shadow-lg z-30 min-w-full max-h-60 overflow-y-auto">
                    <button onClick={() => onChange([])}
                            className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-stone-50 flex items-center gap-2 ${allSelected ? "text-orange-600 bg-orange-50" : "text-stone-500"}`}>
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${allSelected ? "border-orange-500 bg-orange-500" : "border-stone-300"}`}>
                            {allSelected && (
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                                </svg>
                            )}
                        </span>
                        {t("auditLog.all")}
                    </button>
                    <div className="h-px bg-stone-100 mx-2" />
                    {options.map((opt) => {
                        const isChecked = selected.includes(opt.value);
                        return (
                            <button key={opt.value} onClick={() => toggle(opt.value)}
                                    className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-stone-50 flex items-center gap-2 text-stone-700">
                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isChecked ? "border-orange-500 bg-orange-500" : "border-stone-300"}`}>
                                    {isChecked && (
                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                                            <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                                        </svg>
                                    )}
                                </span>
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── JSON Viewer ──────────────────────────────────────────────────────────────

function JsonViewer({ raw, label }: { raw: string | null | undefined; label: string }) {
    const [open, setOpen] = useState(false);
    if (!raw) return <span className="text-stone-300">—</span>;

    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { parsed = raw; }

    return (
        <div>
            <button onClick={() => setOpen((v) => !v)}
                    className="text-xs text-stone-400 underline underline-offset-2 hover:text-stone-600 transition-colors">
                {open ? label.split("/")[1] : label.split("/")[0]}
            </button>
            {open && (
                <pre className="mt-1.5 text-xs bg-stone-50 border border-stone-100 rounded-lg p-2.5 max-w-xs overflow-x-auto text-stone-600 leading-relaxed">
                    {typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2)}
                </pre>
            )}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AuditLog() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;

    const [logs,           setLogs]           = useState<AuditLogEntry[]>([]);
    const [totalCount,     setTotalCount]     = useState(0);
    const [page,           setPage]           = useState(1);
    const [hasNextPage,    setHasNextPage]    = useState(true);
    const [isLoading,      setIsLoading]      = useState(false);
    const [isFetchingNext, setIsFetchingNext] = useState(false);

    const [selectedActions,  setSelectedActions]  = useState<string[]>([]);
    const [selectedRoles,    setSelectedRoles]    = useState<string[]>([]);
    const [selectedUsers,    setSelectedUsers]    = useState<string[]>([]);
    const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
    const [dateFrom,         setDateFrom]         = useState<Date | null>(null);
    const [dateTo,           setDateTo]           = useState<Date | null>(null);

    const [actionTypes, setActionTypes] = useState<string[]>([]);
    const [allUsers,    setAllUsers]    = useState<AdminUserResponse[]>([]);

    const [detail, setDetail] = useState<AuditLogEntry | null>(null);

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getAuditActionTypes().then(setActionTypes).catch(() => {});
        getAllUsers({ page: 1, pageSize: 200 })
            .then((r) => setAllUsers(r.items as AdminUserResponse[]))
            .catch(() => {});
    }, []);

    const buildParams = useCallback(
        (p: number): AuditLogFilterRequest => ({
            page: p,
            pageSize: PAGE_SIZE,
            actionTypes:  selectedActions.length > 0  ? selectedActions  : undefined,
            actorRole:    selectedRoles.length === 1   ? selectedRoles[0] : undefined,
            actorUserIds: selectedUsers.length > 0    ? selectedUsers    : undefined,
            entityType:   selectedEntities.length === 1 ? selectedEntities[0] : undefined,
            from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
            to:   dateTo   ? (() => { const d = new Date(dateTo); d.setHours(23,59,59,999); return d.toISOString(); })() : undefined,
        }),
        [selectedActions, selectedRoles, selectedUsers, selectedEntities, dateFrom, dateTo]
    );

    useEffect(() => {
        setLogs([]);
        setPage(1);
        setHasNextPage(true);
        setIsLoading(true);
        getAuditLogs(buildParams(1))
            .then((r) => {
                setLogs(r.items);
                setTotalCount(r.totalCount);
                setHasNextPage(r.items.length < r.totalCount);
            })
            .finally(() => setIsLoading(false));
    }, [buildParams]);

    const fetchNextPage = useCallback(async () => {
        if (isFetchingNext || !hasNextPage) return;
        setIsFetchingNext(true);
        const nextPage = page + 1;
        try {
            const r = await getAuditLogs(buildParams(nextPage));
            setLogs((prev) => {
                const ids = new Set(prev.map((l) => l.id));
                return [...prev, ...r.items.filter((l) => !ids.has(l.id))];
            });
            setPage(nextPage);
            setHasNextPage(nextPage * PAGE_SIZE < r.totalCount);
        } finally {
            setIsFetchingNext(false);
        }
    }, [isFetchingNext, hasNextPage, page, buildParams]);

    useEffect(() => {
        const el = observerTarget.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) void fetchNextPage(); },
            { threshold: 0.1 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [fetchNextPage]);

    const resetFilters = () => {
        setSelectedActions([]);
        setSelectedRoles([]);
        setSelectedUsers([]);
        setSelectedEntities([]);
        setDateFrom(null);
        setDateTo(null);
    };

    const hasFilters =
        selectedActions.length > 0 || selectedRoles.length > 0 ||
        selectedUsers.length > 0   || selectedEntities.length > 0 ||
        dateFrom || dateTo;

    const actionOptions = actionTypes.map((a) => ({
        value: a,
        label: t(`auditLog.actions.${a}`, { defaultValue: a }),
    }));

    const roleOptions = (["Admin", "Moderator", "Customer"] as const).map((r) => ({
        value: r,
        label: t(`users.roles.${r}`),
    }));

    const userOptions = allUsers.map((u) => ({
        value: u.userId,
        label: `${u.displayName} (${u.email})`,
    }));

    const entityOptions = (["Reservation","Room","RoomType","PriceRule","Tag","User"] as const).map((v) => ({
        value: v,
        label: t(`auditLog.entities.${v}`),
    }));

    return (
        <div className="h-full flex flex-col gap-4 p-6">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-stone-800">{t("auditLog.title")}</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {t("auditLog.subtitle", { count: totalCount.toLocaleString() })}
                    </p>
                </div>
                {hasFilters && (
                    <button onClick={resetFilters}
                            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg px-3 py-1.5 hover:border-stone-300 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {t("auditLog.resetFilters")}
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="shrink-0 bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <MultiSelect label={t("auditLog.actionType")} options={actionOptions} selected={selectedActions} onChange={setSelectedActions} />
                    <MultiSelect label={t("auditLog.role")}       options={roleOptions}   selected={selectedRoles}   onChange={setSelectedRoles} />
                    <MultiSelect label={t("auditLog.user")}       options={userOptions}   selected={selectedUsers}   onChange={setSelectedUsers}   placeholder={t("auditLog.allUsers")} />
                    <MultiSelect label={t("auditLog.entity")}     options={entityOptions} selected={selectedEntities} onChange={setSelectedEntities} />
                    <div className="relative z-50">
                        <p className="text-xs text-stone-500 mb-1 font-medium">{t("auditLog.dateFrom")}</p>
                        <DatePicker
                            selected={dateFrom}
                            onChange={(date: Date | null) => setDateFrom(date)}
                            selectsStart
                            startDate={dateFrom}
                            endDate={dateTo}
                            locale={lang}
                            dateFormat={DATE_FORMAT[lang]}
                            placeholderText={DATE_PLACEHOLDER[lang]}
                            className="px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-700 hover:border-stone-300 focus:outline-none focus:border-orange-400 transition-colors"
                        />
                    </div>
                    <div className="relative z-50">
                        <p className="text-xs text-stone-500 mb-1 font-medium">{t("auditLog.dateTo")}</p>
                        <DatePicker
                            selected={dateTo}
                            onChange={(date: Date | null) => setDateTo(date)}
                            selectsEnd
                            startDate={dateFrom}
                            endDate={dateTo}
                            minDate={dateFrom ?? undefined}
                            locale={lang}
                            dateFormat={DATE_FORMAT[lang]}
                            placeholderText={DATE_PLACEHOLDER[lang]}
                            className="px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-700 hover:border-stone-300 focus:outline-none focus:border-orange-400 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-stone-200 bg-white">
                <div className="sticky top-0 z-10 bg-stone-50 border-b border-stone-200 grid grid-cols-[1fr_1fr_1fr_120px_1fr_80px] gap-x-4 px-4 py-2.5">
                    {[
                        t("auditLog.columns.action"),
                        t("auditLog.columns.user"),
                        t("auditLog.columns.entity"),
                        t("auditLog.columns.time"),
                        t("auditLog.columns.changes"),
                        t("auditLog.columns.ip"),
                    ].map((col) => (
                        <span key={col} className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{col}</span>
                    ))}
                </div>

                {isLoading && (
                    <div className="p-4 space-y-2">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-14 rounded-lg bg-stone-100 animate-pulse" />
                        ))}
                    </div>
                )}

                {!isLoading && logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium">{t("auditLog.notFound")}</p>
                        {hasFilters && <p className="text-xs mt-1">{t("auditLog.tryFilters")}</p>}
                    </div>
                )}

                {!isLoading && logs.map((log) => (
                    <LogRow key={log.id} log={log} onClick={() => setDetail(log)} />
                ))}

                <div ref={observerTarget} className="py-3 text-center">
                    {isFetchingNext && <span className="text-xs text-stone-400">{t("auditLog.loading")}</span>}
                    {!hasNextPage && logs.length > 0 && <span className="text-xs text-stone-300">{t("auditLog.allLoaded")}</span>}
                </div>
            </div>

            {detail && <DetailModal log={detail} onClose={() => setDetail(null)} />}
        </div>
    );
}

// ─── Log Row ──────────────────────────────────────────────────────────────────

function LogRow({ log, onClick }: { log: AuditLogEntry; onClick: () => void }) {
    const { t } = useTranslation();

    const actionColor = ACTION_COLORS[log.actionType] ?? "bg-stone-100 text-stone-600 border-stone-200";
    const actionLabel = t(`auditLog.actions.${log.actionType}`, { defaultValue: log.actionType });
    const entityLabel = t(`auditLog.entities.${log.entityType}`, { defaultValue: log.entityType });
    const roleStyle   = log.actorRole ? (ROLE_STYLES[log.actorRole] ?? "bg-stone-100 text-stone-600") : "";

    const ts      = new Date(log.timestamp);
    const dateStr = ts.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "2-digit" });
    const timeStr = ts.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const hasChanges = log.oldValue || log.newValue;

    return (
        <div className="grid grid-cols-[1fr_1fr_1fr_120px_1fr_80px] gap-x-4 px-4 py-3 border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer group items-start"
             onClick={onClick}>
            <div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${actionColor}`}>
                    {actionLabel}
                </span>
            </div>

            <div className="flex items-start gap-2 min-w-0">
                {log.actorName ? (
                    <>
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-amber-600">{log.actorName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-stone-700 truncate">{log.actorName}</p>
                            {log.actorRole && (
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleStyle}`}>
                                    {t(`users.roles.${log.actorRole}`, { defaultValue: log.actorRole })}
                                </span>
                            )}
                        </div>
                    </>
                ) : (
                    <span className="text-xs text-stone-400 italic">{t("auditLog.system")}</span>
                )}
            </div>

            <div>
                <p className="text-xs font-medium text-stone-700">{entityLabel}</p>
                <p className="text-xs text-stone-400 font-mono truncate">{log.entityId}</p>
            </div>

            <div>
                <p className="text-xs font-medium text-stone-600">{dateStr}</p>
                <p className="text-xs text-stone-400">{timeStr}</p>
            </div>

            <div className="text-xs text-stone-400 min-w-0" onClick={(e) => e.stopPropagation()}>
                {hasChanges ? (
                    <div className="flex flex-col gap-0.5">
                        <JsonViewer raw={log.oldValue} label={`${t("auditLog.show")}/${t("auditLog.hide")}`} />
                        <JsonViewer raw={log.newValue} label={`${t("auditLog.show")}/${t("auditLog.hide")}`} />
                    </div>
                ) : <span>—</span>}
            </div>

            <div>
                <p className="text-xs text-stone-400 font-mono">{log.ip ?? "—"}</p>
            </div>
        </div>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ log, onClose }: { log: AuditLogEntry; onClose: () => void }) {
    const { t } = useTranslation();

    const actionLabel = t(`auditLog.actions.${log.actionType}`, { defaultValue: log.actionType });
    const entityLabel = t(`auditLog.entities.${log.entityType}`, { defaultValue: log.entityType });
    const actionColor = ACTION_COLORS[log.actionType] ?? "bg-stone-100 text-stone-600 border-stone-200";
    const roleStyle   = log.actorRole ? (ROLE_STYLES[log.actorRole] ?? "bg-stone-100 text-stone-600") : "";

    const ts = new Date(log.timestamp);

    const formatJson = (raw: string | null | undefined) => {
        if (!raw) return null;
        try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-stone-200"
                 onClick={(e) => e.stopPropagation()}>

                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium border ${actionColor}`}>
                            {actionLabel}
                        </span>
                        <span className="text-stone-400">·</span>
                        <span className="text-sm font-medium text-stone-700">{entityLabel}</span>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-lg hover:bg-stone-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: t("auditLog.detailId"),       value: `#${log.id}`,           mono: true },
                            { label: t("auditLog.detailTime"),     value: ts.toLocaleString() },
                            { label: t("auditLog.detailEntityId"), value: log.entityId,            mono: true },
                            { label: t("auditLog.detailIp"),       value: log.ip ?? "—",           mono: true },
                        ].map(({ label, value, mono }) => (
                            <div key={label} className="bg-stone-50 rounded-xl p-3.5">
                                <p className="text-xs text-stone-400 mb-1">{label}</p>
                                <p className={`text-sm font-medium text-stone-700 ${mono ? "font-mono text-xs" : ""} break-all`}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {log.actorName && (
                        <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-3.5">
                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-amber-600">{log.actorName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-stone-800">{log.actorName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {log.actorRole && (
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${roleStyle}`}>
                                            {t(`users.roles.${log.actorRole}`, { defaultValue: log.actorRole })}
                                        </span>
                                    )}
                                    {log.actorUserId && (
                                        <span className="text-xs font-mono text-stone-400">{log.actorUserId}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {(log.oldValue || log.newValue) && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                {t("auditLog.detailChanges")}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {log.oldValue && (
                                    <div>
                                        <p className="text-xs text-stone-400 mb-1.5 font-medium">{t("auditLog.was")}</p>
                                        <pre className="text-xs bg-red-50 border border-red-100 rounded-xl p-3 overflow-x-auto text-red-700 leading-relaxed max-h-48">
                                            {formatJson(log.oldValue)}
                                        </pre>
                                    </div>
                                )}
                                {log.newValue && (
                                    <div>
                                        <p className="text-xs text-stone-400 mb-1.5 font-medium">{t("auditLog.became")}</p>
                                        <pre className="text-xs bg-emerald-50 border border-emerald-100 rounded-xl p-3 overflow-x-auto text-emerald-700 leading-relaxed max-h-48">
                                            {formatJson(log.newValue)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}