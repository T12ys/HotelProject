import { useTranslation } from "react-i18next";

export default function NotFound() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-6xl font-bold text-stone-800">{t("notFound.title")}</h1>
            <p className="text-stone-500 mt-2">{t("notFound.message")}</p>
        </div>
    );
}