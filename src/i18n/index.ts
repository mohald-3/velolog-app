import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import sv from './sv.json';

const deviceLocale = Localization.getLocales()[0]?.languageCode;

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sv: { translation: sv },
  },
  lng: deviceLocale === 'sv' ? 'sv' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18next;
