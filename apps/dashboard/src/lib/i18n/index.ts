import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uz from "./locales/uz.json";
import ru from "./locales/ru.json";

const savedLang = localStorage.getItem("tf_lang") ?? "uz";

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: savedLang,
  fallbackLng: "uz",
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: "uz" | "ru") {
  i18n.changeLanguage(lang);
  localStorage.setItem("tf_lang", lang);
}

export default i18n;
