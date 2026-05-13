import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "../store";
import { useUser } from "../features/user/useUser.ts";
import { useAuth } from "../features/auth/useAuth.ts";
import { useMyReservations } from "../features/reservation/useReservation.ts";
import type { UserResponse } from "../features/user/userTypes.ts";
import type { ReservationResponseDto, ReservationStatus } from "../features/reservation/reservationTypes.ts";
import ReservationModal from "../components/ui/ReservationModal.tsx";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<ReservationStatus, { bg: string; text: string; border: string; labelKey: string }> = {
    Confirmed: { bg: "bg-green-100",  text: "text-green-700", border: "border-green-200",  labelKey: "status.Confirmed" },
    Pending:   { bg: "bg-amber-100",  text: "text-amber-700", border: "border-amber-200",  labelKey: "status.Pending"   },
    Cancelled: { bg: "bg-red-100",    text: "text-red-600",   border: "border-red-200",    labelKey: "status.Cancelled" },
    Completed: { bg: "bg-stone-100",  text: "text-stone-600", border: "border-stone-200",  labelKey: "status.Completed" },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{6,14}$/;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileErrors {
    email?: string;
    displayName?: string;
    phoneNumber?: string;
}

interface PasswordErrors {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const validateProfile = (
    email: string,
    displayName: string,
    phoneNumber: string,
    t: (k: string) => string
): ProfileErrors => {
    const errors: ProfileErrors = {};

    if (email && !EMAIL_RE.test(email))
        errors.email = t("validation.emailInvalid");

    if (displayName && displayName.length > 100)
        errors.displayName = t("validation.nameMaxLength");

    if (phoneNumber && !PHONE_RE.test(phoneNumber))
        errors.phoneNumber = t("validation.phoneInvalid");

    return errors;
};

const validatePassword = (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    t: (k: string) => string
): PasswordErrors => {
    const errors: PasswordErrors = {};

    if (!currentPassword)
        errors.currentPassword = t("validation.passwordRequired");

    if (!newPassword) {
        errors.newPassword = t("validation.passwordRequired");
    } else if (newPassword.length < 8) {
        errors.newPassword = t("validation.passwordMinLength");
    } else if (!/[A-Z]/.test(newPassword)) {
        errors.newPassword = t("validation.passwordUppercase");
    } else if (!/[a-z]/.test(newPassword)) {
        errors.newPassword = t("validation.passwordLowercase");
    } else if (!/[0-9]/.test(newPassword)) {
        errors.newPassword = t("validation.passwordDigit");
    } else if (!/[^a-zA-Z0-9]/.test(newPassword)) {
        errors.newPassword = t("validation.passwordSpecial");
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword)
        errors.confirmPassword = t("profile.passwordMismatch");

    return errors;
};

const hasErrors = (errors: object) => Object.keys(errors).length > 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

type Tab = "profile" | "password" | "reservations";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const authUser = useSelector((state: RootState) => state.auth.user);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { loading, error, success, clearMessages, fetchProfile, handleUpdateProfile, handleChangePassword } = useUser();
    const { handleLogout } = useAuth();

    const [profile,     setProfile]     = useState<UserResponse | null>(null);
    const [tab,         setTab]         = useState<Tab>("profile");
    const [selectedRes, setSelectedRes] = useState<ReservationResponseDto | null>(null);


    const [email,       setEmail]       = useState("");
    const [displayName, setDisplayName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");


    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword,     setNewPassword]     = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");


    const [profileErrors,  setProfileErrors]  = useState<ProfileErrors>({});
    const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});


    const [profileSubmitted,  setProfileSubmitted]  = useState(false);
    const [passwordSubmitted, setPasswordSubmitted] = useState(false);

    const { data: reservationsData, isLoading: resLoading } = useMyReservations(1, 50);
    const reservations = reservationsData?.items ?? [];
    const isLoading = useSelector((state: RootState) => state.auth.isLoading);

    useEffect(() => {
        if (isLoading) return;
        if (!authUser) { navigate("/auth/login"); return; }
        fetchProfile().then((data) => {
            if (!data) return;
            setProfile(data);
            setEmail(data.email);
            setDisplayName(data.displayName);
            setPhoneNumber(data.phoneNumber ?? "");
        });
    }, [isLoading, authUser, fetchProfile, navigate]);

    const onTabChange = (newTab: Tab) => {
        setTab(newTab);
        clearMessages();
        setProfileErrors({});
        setPasswordErrors({});
        setProfileSubmitted(false);
        setPasswordSubmitted(false);
    };

    const revalidateProfile = (
        overrides: Partial<{ email: string; displayName: string; phoneNumber: string }> = {}
    ) => {
        if (!profileSubmitted) return;
        setProfileErrors(validateProfile(
            overrides.email       ?? email,
            overrides.displayName ?? displayName,
            overrides.phoneNumber ?? phoneNumber,
            t
        ));
    };

    const revalidatePassword = (
        overrides: Partial<{ currentPassword: string; newPassword: string; confirmPassword: string }> = {}
    ) => {
        if (!passwordSubmitted) return;
        setPasswordErrors(validatePassword(
            overrides.currentPassword ?? currentPassword,
            overrides.newPassword     ?? newPassword,
            overrides.confirmPassword ?? confirmPassword,
            t
        ));
    };

    const onSubmitProfile = async () => {
        setProfileSubmitted(true);
        const errors = validateProfile(email, displayName, phoneNumber, t);
        setProfileErrors(errors);
        if (hasErrors(errors)) return;

        const result = await handleUpdateProfile({ email, displayName, phoneNumber });
        if (result) setProfile(result);
    };

    const onSubmitPassword = async () => {
        setPasswordSubmitted(true);
        const errors = validatePassword(currentPassword, newPassword, confirmPassword, t);
        setPasswordErrors(errors);
        if (hasErrors(errors)) return;

        const ok = await handleChangePassword({ currentPassword, newPassword });
        if (ok) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordSubmitted(false);
            setPasswordErrors({});
        }
    };

    const onLogout = async () => {
        await handleLogout();
        navigate("/auth/login");
    };

    const inputClass = (hasError: boolean) =>
        `w-full border rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none transition-colors ${
            hasError
                ? "border-red-400 focus:border-red-500 bg-red-50"
                : "border-stone-300 focus:border-amber-500"
        }`;

    if (!profile) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <span className="text-stone-400 text-sm">{t("profile.loading")}</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col">
            <header className="bg-white shadow-sm border-b border-stone-100">
                <div className="container mx-auto px-4 flex items-center justify-between py-3">
                    <Link to="/" className="font-georgia text-2xl font-bold tracking-tight text-stone-800">
                        Grand<span className="text-amber-600">Hotel</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex items-start justify-center py-12 px-4">
                <div className="w-full max-w-md">

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl font-bold text-amber-600">
                                {profile.displayName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-stone-800">{profile.displayName}</h1>
                        <p className="text-sm text-stone-400 mt-0.5">
                            {profile.role} · {t("profile.memberSince", {
                            date: new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
                        })}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                        <div className="flex border-b border-stone-100">
                            {([
                                { id: "profile"      as Tab, label: t("profile.title") },
                                { id: "password"     as Tab, label: t("profile.password") },
                                { id: "reservations" as Tab, label: t("profile.reservations") },
                            ]).map(({ id, label }) => (
                                <button key={id} onClick={() => onTabChange(id)}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                            tab === id
                                                ? "text-amber-600 border-b-2 border-amber-600 bg-amber-50/50"
                                                : "text-stone-500 hover:text-stone-700"
                                        }`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {/* Server-level success or error message */}
                            {(error || success) && tab !== "reservations" && (
                                <div className={`mb-5 p-3 rounded-xl text-sm border ${
                                    success
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                }`}>
                                    {success ?? error}
                                </div>
                            )}

                            {/* Profile tab */}
                            {tab === "profile" && (
                                <div className="flex flex-col gap-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
                                            {t("profile.name")}
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => { setDisplayName(e.target.value); revalidateProfile({ displayName: e.target.value }); }}
                                            className={inputClass(!!profileErrors.displayName)}
                                        />
                                        {profileErrors.displayName && (
                                            <span className="text-xs text-red-500 px-1 mt-1 block">{profileErrors.displayName}</span>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
                                            {t("profile.email")}
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); revalidateProfile({ email: e.target.value }); }}
                                            className={inputClass(!!profileErrors.email)}
                                        />
                                        {profileErrors.email && (
                                            <span className="text-xs text-red-500 px-1 mt-1 block">{profileErrors.email}</span>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
                                            {t("profile.phone")}
                                        </label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => { setPhoneNumber(e.target.value); revalidateProfile({ phoneNumber: e.target.value }); }}
                                            placeholder={t("profile.phonePlaceholder")}
                                            className={inputClass(!!profileErrors.phoneNumber)}
                                        />
                                        {profileErrors.phoneNumber && (
                                            <span className="text-xs text-red-500 px-1 mt-1 block">{profileErrors.phoneNumber}</span>
                                        )}
                                    </div>

                                    <button onClick={onSubmitProfile} disabled={loading}
                                            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-1">
                                        {loading ? t("profile.saving") : t("profile.saveChanges")}
                                    </button>
                                </div>
                            )}

                            {/* Password tab */}
                            {tab === "password" && (
                                <div className="flex flex-col gap-4">
                                    {/* Current password */}
                                    <div>
                                        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
                                            {t("profile.currentPassword")}
                                        </label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => { setCurrentPassword(e.target.value); revalidatePassword({ currentPassword: e.target.value }); }}
                                            className={inputClass(!!passwordErrors.currentPassword)}
                                        />
                                        {passwordErrors.currentPassword && (
                                            <span className="text-xs text-red-500 px-1 mt-1 block">{passwordErrors.currentPassword}</span>
                                        )}
                                    </div>

                                    {/* New password */}
                                    <div>
                                        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
                                            {t("profile.newPassword")}
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => { setNewPassword(e.target.value); revalidatePassword({ newPassword: e.target.value }); }}
                                            className={inputClass(!!passwordErrors.newPassword)}
                                        />
                                        {passwordErrors.newPassword && (
                                            <span className="text-xs text-red-500 px-1 mt-1 block">{passwordErrors.newPassword}</span>
                                        )}
                                    </div>

                                    {/* Confirm password */}
                                    <div>
                                        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
                                            {t("profile.confirmPassword")}
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); revalidatePassword({ confirmPassword: e.target.value }); }}
                                            className={inputClass(!!passwordErrors.confirmPassword)}
                                        />
                                        {passwordErrors.confirmPassword && (
                                            <span className="text-xs text-red-500 px-1 mt-1 block">{passwordErrors.confirmPassword}</span>
                                        )}
                                    </div>

                                    <button onClick={onSubmitPassword} disabled={loading}
                                            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-1">
                                        {loading ? t("profile.changingPassword") : t("profile.changePassword")}
                                    </button>
                                </div>
                            )}

                            {/* Reservations tab */}
                            {tab === "reservations" && (
                                <div className="flex flex-col gap-3">
                                    {resLoading && [...Array(3)].map((_, i) => (
                                        <div key={i} className="h-20 rounded-xl bg-stone-100 animate-pulse" />
                                    ))}

                                    {!resLoading && reservations.length === 0 && (
                                        <div className="text-center py-8 text-stone-400 text-sm">
                                            {t("profile.noReservations")}
                                        </div>
                                    )}

                                    {reservations.map((res) => {
                                        const meta = STATUS_META[res.status];
                                        return (
                                            <button key={res.id} onClick={() => setSelectedRes(res)}
                                                    className="w-full text-left bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 rounded-xl px-4 py-3 transition-colors">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="text-sm font-medium text-stone-800">
                                                        {res.roomTypeName} · №{res.roomNumber}
                                                    </p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${meta.bg} ${meta.text} ${meta.border}`}>
                                                        {t(meta.labelKey)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-stone-400">
                                                        {formatDate(res.startDate)} — {formatDate(res.endDate)} · {t("profile.nights", { count: res.nightsCount })}
                                                    </p>
                                                    <p className="text-xs font-medium text-amber-700">{res.totalPrice} ₼</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <Link to="/"
                              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center text-stone-500 hover:text-amber-600 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 transition-colors">
                            {t("nav.toSite")}
                        </Link>
                        <button onClick={onLogout}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 border border-stone-200 hover:border-red-200 transition-colors">
                            {t("nav.logout")}
                        </button>
                    </div>
                </div>
            </main>

            {selectedRes && (
                <ReservationModal key={selectedRes.id} res={selectedRes} onClose={() => setSelectedRes(null)} />
            )}
        </div>
    );
}