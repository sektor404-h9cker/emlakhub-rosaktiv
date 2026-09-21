"use client";

import { AuthProvider } from "@/context/AuthContext";
import { SystemProvider } from "@/context/SystemContext";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <SystemProvider>
        <LocaleProvider defaultLocale="az">{children}</LocaleProvider>
      </SystemProvider>
    </AuthProvider>
  );
}
