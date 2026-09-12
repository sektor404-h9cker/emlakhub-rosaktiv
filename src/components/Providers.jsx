"use client";

/**
 * =============================================================================
 * Providers — Auth + Locale для лендинга и терминала
 * =============================================================================
 */

import { AuthProvider } from "@/context/AuthContext";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <LocaleProvider defaultLocale="az">{children}</LocaleProvider>
    </AuthProvider>
  );
}
