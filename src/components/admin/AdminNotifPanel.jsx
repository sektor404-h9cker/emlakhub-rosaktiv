"use client";

/**
 * AdminNotifPanel - колокольчик уведомлений админки
 */

import Link from "next/link";
import { useSystem } from "@/context/SystemContext";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";

export default function AdminNotifPanel({ open, onClose }) {
  const { t } = useAdminI18n();
  const { adminNotifications, markAdminNotifRead } = useSystem();

  if (!open) return null;

  return (
    <div className="absolute right-0 top-12 z-50 w-[320px] max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 bg-[#0c1018] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
        <span className="text-[13px] font-medium text-white">{t.notifTitle}</span>
        <button
          type="button"
          className="text-[11px] text-[#93c5fd]"
          onClick={() => markAdminNotifRead("all")}
        >
          OK
        </button>
      </div>
      <ul className="max-h-72 overflow-y-auto">
        {(adminNotifications || []).map((n) => (
          <li key={n.id}>
            <Link
              href={n.href || "/admin"}
              onClick={() => {
                markAdminNotifRead(n.id);
                onClose?.();
              }}
              className={[
                "block border-b border-white/[0.05] px-3 py-2.5 hover:bg-white/[0.04]",
                n.read ? "opacity-60" : "",
              ].join(" ")}
            >
              <div className="text-[12px] font-medium text-white">{n.title}</div>
              <div className="text-[11px] text-[#9aa3ad]">{n.body}</div>
            </Link>
          </li>
        ))}
        {!adminNotifications?.length ? (
          <li className="px-3 py-6 text-center text-[12px] text-[#64748b]">
            {t.notifEmpty}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
