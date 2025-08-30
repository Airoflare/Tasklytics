"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

import { settingsService } from "./settings-service"
import englishTranslations from "../language/english.json"
import spanishTranslations from "../language/spanish.json"
import germanTranslations from "../language/german.json"

export type LanguageKey = "en" | "es" | "de"

interface Translations {
  name: string;
  translations: { [key: string]: string };
}

const allTranslations: Record<LanguageKey, Translations> = {
  en: englishTranslations,
  es: spanishTranslations,
  de: germanTranslations,
};

interface LanguageContextType {
  language: LanguageKey;
  setLanguage: (lang: LanguageKey) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageKey>("en"); // Default to English
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialLanguage = async () => {
      let initialLang: LanguageKey = "en"; // Default to English

      const storedLang = await settingsService.getLanguage();
      if (storedLang && allTranslations[storedLang as LanguageKey]) {
        initialLang = storedLang as LanguageKey;
      } else if (typeof window !== "undefined") {
        const browserLang = navigator.language.split('-')[0];
        if (allTranslations[browserLang as LanguageKey]) {
          initialLang = browserLang as LanguageKey;
        }
      }
      
      setLanguageState(initialLang);
      setLoading(false); // Set loading to false after language is loaded
    };
    loadInitialLanguage();
  }, []); // Run only once on mount

  

  const t = (key: string): string => {
    const currentTranslations = allTranslations[language]?.translations;
    return currentTranslations?.[key] || key; // Fallback to key if translation not found
  };

  const setLanguage = async (lang: LanguageKey) => {
    setLanguageState(lang);
    await settingsService.setLanguage(lang);
  };

  if (loading) {
    return null;
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
