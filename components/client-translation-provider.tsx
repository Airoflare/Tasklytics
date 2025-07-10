"use client";

import { LanguageProvider } from "@/lib/language-context";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";

interface ClientTranslationProviderProps {
  initialTranslations: Record<string, any>;
  children: ReactNode;
}

export function ClientTranslationProvider({ initialTranslations, children }: ClientTranslationProviderProps) {
  const [allTranslations, setAllTranslations] = useState<Record<string, any>>(initialTranslations || {});

  useEffect(() => {
    if (initialTranslations && Object.keys(initialTranslations).length > 0) {
      setAllTranslations(initialTranslations);
    }
  }, [initialTranslations]);

  return (
    <LanguageProvider allTranslations={allTranslations}>
      {children}
    </LanguageProvider>
  );
}