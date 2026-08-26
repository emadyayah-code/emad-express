import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager, Platform } from "react-native";
import { ar } from "@/locales/ar";
import { en } from "@/locales/en";
import { zh } from "@/locales/zh";
import { fr } from "@/locales/fr";
import { tr } from "@/locales/tr";

export type Lang = "ar" | "en" | "zh" | "fr" | "tr";

type Translations = typeof ar;

interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "ar",
  setLanguage: () => {},
  t: ar,
  isRTL: true,
});

const translations: Record<Lang, Translations> = { ar, en, zh: zh as any, fr: fr as any, tr: tr as any };

const RTL_LANGS: Lang[] = ["ar"];

export const LANGUAGES: { code: Lang; name: string; nativeName: string; flag: string }[] = [
  { code: "ar", name: "Arabic",  nativeName: "العربية", flag: "🇸🇦" },
  { code: "en", name: "English", nativeName: "English",  flag: "🇺🇸" },
  { code: "zh", name: "Chinese", nativeName: "中文",     flag: "🇨🇳" },
  { code: "fr", name: "French",  nativeName: "Français", flag: "🇫🇷" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe",   flag: "🇹🇷" },
];

function applyRTL(lang: Lang) {
  if (Platform.OS === "web") return;
  const shouldBeRTL = RTL_LANGS.includes(lang);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    AsyncStorage.getItem("app_language").then((stored) => {
      const valid: Lang[] = ["ar", "en", "zh", "fr", "tr"];
      const lang = (stored && valid.includes(stored as Lang) ? stored : "ar") as Lang;
      setLangState(lang);
      applyRTL(lang);
    });
  }, []);

  function setLanguage(lang: Lang) {
    setLangState(lang);
    AsyncStorage.setItem("app_language", lang);
    applyRTL(lang);
  }

  const isRTL = RTL_LANGS.includes(language);
  const t = translations[language] ?? ar;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
