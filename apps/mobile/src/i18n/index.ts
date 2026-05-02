import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import uz from './locales/uz.json';
import ru from './locales/ru.json';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'uz';
const defaultLang = deviceLocale.startsWith('ru') ? 'ru' : 'uz';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
    },
    lng: defaultLang,
    fallbackLng: 'uz',
    interpolation: { escapeValue: false },
  });

export default i18n;
