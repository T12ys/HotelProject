import { useTranslation } from "react-i18next";

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-stone-800 text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <h3 className="font-bold text-amber-400 mb-2">GrandHotel </h3>
                        <p className="text-sm text-stone-400">{t("footer.tagline")}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">{t("footer.contacts")}</h4>
                        <p className="text-sm text-stone-400">+994 12 345 67 89</p>
                        <p className="text-sm text-stone-400">info@grandhotel.az</p>
                        <p className="text-sm text-stone-400">{t("footer.address")}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">{t("footer.info")}</h4>
                        <p className="text-sm text-stone-400">{t("footer.privacy")}</p>
                        <p className="text-sm text-stone-400">{t("footer.rules")}</p>
                    </div>
                </div>
                <div className="border-t border-stone-700 mt-6 pt-4 text-center text-xs text-stone-500">
                    {t("footer.copyright", { year: new Date().getFullYear() })}
                </div>
            </div>
        </footer>
    );
}