"use client"

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileOnlyPage } from "./mobile-only-page";

interface AppContentWrapperProps {
  children: React.ReactNode;
}

export function AppContentWrapper({ children }: AppContentWrapperProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileOnlyPage />;
  }

  return <>{children}</>;
}