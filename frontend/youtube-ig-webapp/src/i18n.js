// src/i18n.js

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  // Load translation using http -> see /public/locales
  .use(HttpApi)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Init i18next
  .init({
    debug: true, // Set to false in production
    fallbackLng: 'en',
    // --- MODIFIED HERE ---
    supportedLngs: ['en', 'zh-Hant', 'zh'], // Added 'zh'
    nonExplicitSupportedLngs: true, // Allow 'zh' to map to 'zh-Hant'
    // -------------------
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    // Specify where to load translation files from
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'], // Cache the language preference
    },
  });

export default i18n;