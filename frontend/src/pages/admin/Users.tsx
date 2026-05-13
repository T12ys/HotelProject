import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "../../store";
import { getAllUsers, updateUserRole } from "../../features/user/userService.ts";
import type { AdminUserResponse } from "../../features/user/userTypes.ts";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../api/errorHandler";

const ROLES = ["Customer", "Moderator", "Admin"] as const;
type Role = typeof ROLES[number];

const ROLE_STYLES: Record<Role, string> = {
    Customer:  "bg-stone-100 text-stone-600",
    Moderator: "bg-blue-100 text-blue-700",
    Admin:     "bg-amber-100 text-amber-700",
};

function CustomRoleSelect({ value, disabled, onChange }: {
    value: Role;
    disabled: boolean;
    onChange: (role: Role) => void;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const options = ROLES.filter(r => r !== "Admin");

    return (
        <div ref={ref} className="relative">
            <button
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${ROLE_STYLES[value]}`}
            >
                {t(`users.roles.${value}`)}
                {!disabled && (
                    <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[120px]">
                    {options.map((r) => (
                        <button
                            key={r}
                            onClick={() => { onChange(r); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-stone-50 ${
                                r === value ? ROLE_STYLES[r] : "text-stone-600"
                            }`}
                        >
                            {t(`users.roles.${r}`)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const PAGE_SIZE = 20;

export default function Users() {
    const { t } = useTranslation();
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const isAdmin = currentUser?.role === "Admin";

    const [users, setUsers] = useState<AdminUserResponse[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingNext, setIsFetchingNext] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setUsers([]);
        setPage(1);
        setHasNextPage(true);
        setIsLoading(true);
        getAllUsers({ page: 1, pageSize: PAGE_SIZE, search })
            .then((result) => {
                setUsers(result.items as AdminUserResponse[]);
                setTotalCount(result.totalCount);
                setHasNextPage(result.items.length < result.totalCount);
            })
            .finally(() => setIsLoading(false));
    }, [search]);

    const fetchNextPage = useCallback(async () => {
        if (isFetchingNext || !hasNextPage) return;
        setIsFetchingNext(true);
        const nextPage = page + 1;
        try {
            const result = await getAllUsers({ page: nextPage, pageSize: PAGE_SIZE, search });
            setUsers((prev) => {
                const existingIds = new Set(prev.map((u) => u.userId));
                return [...prev, ...(result.items as AdminUserResponse[]).filter((u) => !existingIds.has(u.userId))];
            });
            setPage(nextPage);
            setHasNextPage(nextPage * PAGE_SIZE < result.totalCount);
        } finally {
            setIsFetchingNext(false);
        }
    }, [isFetchingNext, hasNextPage, page, search]);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNext) void fetchNextPage();
        },
        [fetchNextPage, hasNextPage, isFetchingNext]
    );

    useEffect(() => {
        const element = observerTarget.current;
        if (!element) return;
        const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
        observer.observe(element);
        return () => observer.disconnect();
    }, [handleObserver]);

    const handleRoleChange = async (userId: string, role: Role) => {
        setUpdatingId(userId);
        try {
            const updated = await updateUserRole(userId, { role });
            setUsers((prev) => prev.map((u) => u.userId === userId ? { ...u, role: updated.role } : u));
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="h-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-stone-800">{t("users.title")}</h1>
                    <p className="text-stone-500 text-sm mt-0.5">{t("users.subtitle", { count: totalCount })}</p>
                </div>
            </div>

            <div className="shrink-0">
                <input
                    type="text"
                    placeholder={t("users.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-400 text-sm"
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-2">
                    {isLoading && [...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-stone-100 animate-pulse" />
                    ))}

                    {!isLoading && users.length === 0 && (
                        <div className="text-center py-12 text-stone-400 text-sm">{t("users.notFound")}</div>
                    )}

                    {users.map((user) => (
                        <div key={user.userId} className="flex items-center gap-4 bg-white border border-stone-200 rounded-xl px-4 py-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-amber-600">
                                    {user.displayName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-800 truncate">{user.displayName}</p>
                                <p className="text-xs text-stone-400 truncate">{user.email}</p>
                            </div>
                            <p className="text-xs text-stone-400 shrink-0 hidden sm:block">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                            {isAdmin ? (
                                <div className="relative shrink-0">
                                    <CustomRoleSelect
                                        value={user.role as Role}
                                        disabled={
                                            updatingId === user.userId ||
                                            user.userId === currentUser?.userId ||
                                            user.role === "Admin"
                                        }
                                        onChange={(role) => handleRoleChange(user.userId, role)}
                                    />
                                </div>
                            ) : (
                                <span className={`text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 ${ROLE_STYLES[user.role as Role]}`}>
                                    {t(`users.roles.${user.role}`)}
                                </span>
                            )}
                            {updatingId === user.userId && (
                                <span className="text-xs text-stone-400 shrink-0">{t("users.saving")}</span>
                            )}
                        </div>
                    ))}

                    <div ref={observerTarget} className="py-4 text-center">
                        {isFetchingNext && <div className="text-stone-400 text-sm">{t("users.loading")}</div>}
                        {!hasNextPage && users.length > 0 && <div className="text-stone-400 text-sm">{t("users.allLoaded")}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}