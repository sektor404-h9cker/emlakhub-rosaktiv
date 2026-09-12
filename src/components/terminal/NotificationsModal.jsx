"use client";

/**
 * =============================================================================
 * NotificationsModal — «Bildirişlər» поверх терминала
 * =============================================================================
 */

import { X, Check, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";

const DEMO_NOTES = [
  {
    id: 1,
    tag: "DIQQƏT",
    tagRu: "ВНИМАНИЕ",
    textAz: "Land Rover Range Rover — qiymət yeniləndi",
    textRu: "Land Rover Range Rover — цена обновлена",
  },
  {
    id: 2,
    tag: "LOT",
    tagRu: "ЛОТ",
    textAz: "3-otaqlı Nərimanov — yeni Vision skanı",
    textRu: "3-комн. Нариманов — новый Vision-скан",
  },
  {
    id: 3,
    tag: "AI",
    tagRu: "AI",
    textAz: "Mercedes GLS 580 — fürsət skoru dəyişdi",
    textRu: "Mercedes GLS 580 — скоринг возможности обновлён",
  },
];

export default function NotificationsModal({ open, onClose }) {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh] sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close"
          />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e14] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-[15px] font-semibold text-white">{t.notifications}</h3>
              <div className="flex gap-1">
                <IconBtn>
                  <Check size={14} />
                </IconBtn>
                <IconBtn>
                  <Trash2 size={14} />
                </IconBtn>
                <IconBtn onClick={onClose}>
                  <X size={14} />
                </IconBtn>
              </div>
            </div>
            <div className="max-h-[50vh] space-y-2 overflow-auto p-3">
              {DEMO_NOTES.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3"
                >
                  <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-300">
                    {locale === "az" ? n.tag : n.tagRu}
                  </span>
                  <p className="mt-2 text-[13px] text-[#cbd5e1]">
                    {locale === "az" ? n.textAz : n.textRu}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function IconBtn({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}
