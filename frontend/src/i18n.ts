import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru/translation.json";
import en from "./locales/en/translation.json";
import az from "./locales/az/translation.json";

const savedLang = localStorage.getItem("lang") ?? "ru";

i18n
    .use(initReactI18next)
    .init({
        resources: {
            ru: { translation: ru },
            en: { translation: en },
            az: { translation: az },
        },
        lng: savedLang,
        fallbackLng: "ru",
        interpolation: { escapeValue: false },
    });

i18n.on("languageChanged", (lng) => {
    localStorage.setItem("lang", lng);
});

export default i18n;