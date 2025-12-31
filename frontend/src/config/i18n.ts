import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector'
import { resources } from '../languages'

i18n
	.use(I18nextBrowserLanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		supportedLngs: Array.from(Object.keys(resources)),
		fallbackLng: 'en',
		detection: {
			order: ['localStorage', 'navigator'],
			caches: ['localStorage'],
			lookupLocalStorage: 'i18nextLng',
		},
		interpolation: {
			escapeValue: false,
		},
		react: {
			useSuspense: false,
		},
	})

export default i18n
