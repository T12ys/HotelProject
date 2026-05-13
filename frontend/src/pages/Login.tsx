import { useState } from "react";
import { useAuth } from "../features/auth/useAuth.ts";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/errorHandler.ts";

// ─── Validation helpers ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{6,14}$/;

interface LoginErrors {
    email?: string;
    password?: string;
}

interface RegisterErrors {
    email?: string;
    displayName?: string;
    password?: string;
    phoneNumber?: string;
}

type FormErrors = LoginErrors & RegisterErrors;

const validateLogin = (email: string, password: string, t: (k: string) => string): LoginErrors => {
    const errors: LoginErrors = {};
    if (!email.trim())               errors.email    = t("validation.emailRequired");
    else if (!EMAIL_RE.test(email))  errors.email    = t("validation.emailInvalid");
    if (!password)                   errors.password = t("validation.passwordRequired");
    return errors;
};

const validateRegister = (
    email: string,
    displayName: string,
    password: string,
    phoneNumber: string,
    t: (k: string) => string,
): RegisterErrors => {
    const errors: RegisterErrors = {};

    if (!email.trim())              errors.email = t("validation.emailRequired");
    else if (!EMAIL_RE.test(email)) errors.email = t("validation.emailInvalid");

    if (!displayName.trim())              errors.displayName = t("validation.nameRequired");
    else if (displayName.length > 100)    errors.displayName = t("validation.nameMaxLength");

    if (!password) {
        errors.password = t("validation.passwordRequired");
    } else if (password.length < 8) {
        errors.password = t("validation.passwordMinLength");
    } else if (!/[A-Z]/.test(password)) {
        errors.password = t("validation.passwordUppercase");
    } else if (!/[a-z]/.test(password)) {
        errors.password = t("validation.passwordLowercase");
    } else if (!/[0-9]/.test(password)) {
        errors.password = t("validation.passwordDigit");
    } else if (!/[^a-zA-Z0-9]/.test(password)) {
        errors.password = t("validation.passwordSpecial");
    }

    if (phoneNumber && !PHONE_RE.test(phoneNumber)) {
        errors.phoneNumber = t("validation.phoneInvalid");
    }

    return errors;
};

const hasErrors = (errors: FormErrors) => Object.keys(errors).length > 0;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Login() {
    const { handleLogin, handleRegister } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [email,       setEmail]       = useState("");
    const [password,    setPassword]    = useState("");
    const [displayName, setDisplayName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isRegister,  setIsRegister]  = useState(false);

    // server-level error (toast-like message at the bottom of the form)
    const [serverError, setServerError] = useState("");
    // per-field validation errors
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    // whether the user has tried to submit (show errors eagerly after first attempt)
    const [submitted, setSubmitted] = useState(false);

    const revalidate = (
        overrides: Partial<{ email: string; password: string; displayName: string; phoneNumber: string }> = {}
    ) => {
        if (!submitted) return;
        const e  = overrides.email       ?? email;
        const p  = overrides.password    ?? password;
        const d  = overrides.displayName ?? displayName;
        const ph = overrides.phoneNumber ?? phoneNumber;
        const errors = isRegister
            ? validateRegister(e, d, p, ph, t)
            : validateLogin(e, p, t);
        setFieldErrors(errors);
    };

    const onSubmit = async () => {
        setSubmitted(true);
        setServerError("");

        const errors = isRegister
            ? validateRegister(email, displayName, password, phoneNumber, t)
            : validateLogin(email, password, t);

        setFieldErrors(errors);
        if (hasErrors(errors)) return;

        try {
            if (isRegister) {
                await handleRegister(email, displayName, password, phoneNumber || undefined);
            } else {
                await handleLogin(email, password);
            }
            navigate("/");
        } catch (err) {
            setServerError(getErrorMessage(err));
        }
    };

    const switchMode = () => {
        setIsRegister((v) => !v);
        setFieldErrors({});
        setServerError("");
        setSubmitted(false);
    };

    const inputClass = (field: keyof FormErrors) =>
        `border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition ${
            fieldErrors[field]
                ? "border-red-400 focus:border-red-500 bg-red-50"
                : "border-stone-300 focus:border-amber-500"
        }`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center px-4 relative">
            <button
                onClick={() => navigate("/")}
                className="absolute top-6 left-6 border border-white/40 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-white/10 transition"
            >
                {t("auth.toHome")}
            </button>

            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col gap-5">
                <div className="text-center">
                    <span className="font-georgia text-3xl font-bold text-stone-800">
                        Grand<span className="text-amber-600">Hotel</span>
                    </span>
                    <p className="text-stone-400 text-sm mt-1">
                        {isRegister ? t("auth.registerSubtitle") : t("auth.loginSubtitle")}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Email */}
                    <div className="flex flex-col gap-1">
                        <input
                            placeholder={t("auth.email")}
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); revalidate({ email: e.target.value }); }}
                            className={inputClass("email")}
                        />
                        {fieldErrors.email && (
                            <span className="text-xs text-red-500 px-1">{fieldErrors.email}</span>
                        )}
                    </div>

                    {/* Display name (register only) */}
                    {isRegister && (
                        <div className="flex flex-col gap-1">
                            <input
                                placeholder={t("auth.name")}
                                value={displayName}
                                onChange={(e) => { setDisplayName(e.target.value); revalidate({ displayName: e.target.value }); }}
                                className={inputClass("displayName")}
                            />
                            {fieldErrors.displayName && (
                                <span className="text-xs text-red-500 px-1">{fieldErrors.displayName}</span>
                            )}
                        </div>
                    )}

                    {/* Phone (register only) */}
                    {isRegister && (
                        <div className="flex flex-col gap-1">
                            <input
                                placeholder={t("auth.phone")}
                                value={phoneNumber}
                                onChange={(e) => { setPhoneNumber(e.target.value); revalidate({ phoneNumber: e.target.value }); }}
                                className={inputClass("phoneNumber")}
                            />
                            {fieldErrors.phoneNumber && (
                                <span className="text-xs text-red-500 px-1">{fieldErrors.phoneNumber}</span>
                            )}
                        </div>
                    )}

                    {/* Password */}
                    <div className="flex flex-col gap-1">
                        <input
                            type="password"
                            placeholder={t("auth.password")}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); revalidate({ password: e.target.value }); }}
                            className={inputClass("password")}
                        />
                        {fieldErrors.password && (
                            <span className="text-xs text-red-500 px-1">{fieldErrors.password}</span>
                        )}
                    </div>
                </div>

                {/* Server error */}
                {serverError && (
                    <p className="text-sm text-center text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                        {serverError}
                    </p>
                )}

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => void onSubmit()}
                        className="btn bg-amber-600 text-white rounded-xl py-2.5 text-sm font-medium"
                    >
                        {isRegister ? t("auth.register") : t("auth.login")}
                    </button>
                    <button
                        onClick={switchMode}
                        className="btn border border-stone-300 text-stone-600 rounded-xl py-2.5 text-sm"
                    >
                        {isRegister ? t("auth.hasAccount") : t("auth.noAccount")}
                    </button>
                </div>
            </div>
        </div>
    );
}