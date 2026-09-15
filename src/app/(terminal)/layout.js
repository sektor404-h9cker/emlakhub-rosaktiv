"use client";

/**
 * =============================================================================
 * (terminal) LAYOUT — PrivateRoute + panel state + shell + гид + уведомления
 * =============================================================================
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import PrivateRoute from "@/components/auth/PrivateRoute";
import TerminalShell from "@/components/terminal/TerminalShell";
import NotificationsModal from "@/components/terminal/NotificationsModal";
import GuidedTour from "@/components/terminal/GuidedTour";
import { TerminalPanelProvider } from "@/context/TerminalPanelContext";

export default function TerminalLayout({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <PrivateRoute requireAdmin={isAdmin}>
      <TerminalPanelProvider>
        <TerminalShell
          mode={isAdmin ? "admin" : "investor"}
          onOpenNotifications={() => setNotesOpen(true)}
        >
          {children}
        </TerminalShell>
        <NotificationsModal open={notesOpen} onClose={() => setNotesOpen(false)} />
        <GuidedTour enabled={!isAdmin} />
      </TerminalPanelProvider>
    </PrivateRoute>
  );
}
