import { registerLocale } from "react-datepicker";
import { ru } from "date-fns/locale/ru";
import { enUS } from "date-fns/locale/en-US";
import { az } from "date-fns/locale/az";

registerLocale("ru", ru);
registerLocale("en", enUS);
registerLocale("az", az);

export const DATE_FORMAT: Record<string, string> = {
    ru: "dd.MM.yyyy",
    en: "MM/dd/yyyy",
    az: "dd.MM.yyyy",
};

export const DATE_PLACEHOLDER: Record<string, string> = {
    ru: "дд.мм.гггг",
    en: "mm/dd/yyyy",
    az: "gg.aa.iiii",
};