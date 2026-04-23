import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import * as Localization from "expo-localization"
import { Platform } from "react-native"
import en from "./locales/en"
import ro from "./locales/ro"

const resources = {
    en: { translation: en },
    ro: { translation: ro },
}

const supportedLanguages = Object.keys(resources)
const deviceLanguage = Localization.getLocales()?.[0]?.languageCode ?? "en"

// On web, prefer the user's saved preference over device language
let savedLang: string | null = null
if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    savedLang = localStorage.getItem("app_lang")
}

const lng =
    savedLang && supportedLanguages.includes(savedLang)
        ? savedLang
        : supportedLanguages.includes(deviceLanguage)
          ? deviceLanguage
          : "en"

i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
    compatibilityJSON: "v4",
})

// Persist language changes on web
i18n.on("languageChanged", (lang) => {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
        localStorage.setItem("app_lang", lang)
    }
})

export default i18n
