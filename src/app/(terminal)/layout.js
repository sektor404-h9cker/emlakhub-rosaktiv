"use client";

/**
 * =============================================================================
 * (terminal) LAYOUT — PrivateRoute + shell + уведомления
 * =============================================================================
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import PrivateRoute from "@/components/auth/PrivateRoute";
import TerminalShell from "@/components/terminal/TerminalShell";
import NotificationsModal from "@/components/terminal/NotificationsModal";

export default function TerminalLayout({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <PrivateRoute requireAdmin={isAdmin}>
      <TerminalShell
        mode={isAdmin ? "admin" : "investor"}
        onOpenNotifications={() => setNotesOpen(true)}
      >
        {children}
      </TerminalShell>
      <NotificationsModal open={notesOpen} onClose={() => setNotesOpen(false)} />
    </PrivateRoute>
  );
}
