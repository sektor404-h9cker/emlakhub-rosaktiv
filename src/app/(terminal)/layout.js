"use client";

/**
 * =============================================================================
 * (terminal) LAYOUT — PrivateRoute + system lock + paywall + shell
 * =============================================================================
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import PrivateRoute from "@/components/auth/PrivateRoute";
import TerminalShell from "@/components/terminal/TerminalShell";
import NotificationsModal from "@/components/terminal/NotificationsModal";
import GuidedTour from "@/components/terminal/GuidedTour";
import PaywallModal from "@/components/terminal/PaywallModal";
import MaintenanceScreen from "@/components/terminal/MaintenanceScreen";
import SubscriptionBanner from "@/components/terminal/SubscriptionBanner";
import { TerminalPanelProvider } from "@/context/TerminalPanelContext";
import { useAuth } from "@/context/AuthContext";
import { useSystem } from "@/context/SystemContext";

function TerminalBody({ children, isAdminPath }) {
  const { isAdmin } = useAuth();
  const { isLocked, hydrated } = useSystem();
  const [notesOpen, setNotesOpen] = useState(false);

  if (hydrated && isLocked && !(isAdmin && isAdminPath)) {
    return <MaintenanceScreen />;
  }

  return (
    <TerminalPanelProvider>
      <TerminalShell
        mode={isAdminPath ? "admin" : "investor"}
        onOpenNotifications={() => setNotesOpen(true)}
      >
        {!isAdminPath ? <SubscriptionBanner /> : null}
        {children}
      </TerminalShell>
      <NotificationsModal open={notesOpen} onClose={() => setNotesOpen(false)} />
      <GuidedTour enabled={!isAdminPath} />
      <PaywallModal />
    </TerminalPanelProvider>
  );
}

export default function TerminalLayout({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <PrivateRoute requireAdmin={isAdmin} adminPath={pathname}>
      <TerminalBody isAdminPath={isAdmin}>{children}</TerminalBody>
    </PrivateRoute>
  );
}
