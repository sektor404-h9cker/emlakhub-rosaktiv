"use client";

/**
 * TermHint — компактная (?) подсказка у жаргона (AZ/RU)
 */

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function TermHint({ text, label = "?" }) {
  const id = useId();
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !btnRef.current) return undefined;
    const rect = btnRef.current.getBoundingClientRect();
    const width = 260;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    const top = Math.min(rect.bottom + 8, window.innerHeight - 12);
    setPos({ top, left, width });

    const onDoc = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!text) return null;

  return (
    <span className="relative inline-flex align-middle">
      <span
        ref={btnRef}
        role="button"
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        aria-label={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="ml-1 inline-flex h-[15px] w-[15px] shrink-0 cursor-help items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-[9px] font-semibold leading-none text-[#94a3b8] transition hover:border-[#60a5fa]/50 hover:text-[#93c5fd]"
      >
        ?
      </span>
      {mounted && open
        ? createPortal(
            <span
              id={id}
              role="tooltip"
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: pos.width || 260,
                zIndex: 300,
              }}
              className="pointer-events-none rounded-xl border border-white/12 bg-[#0c1018] px-3 py-2.5 text-[12px] leading-relaxed text-[#cbd5e1] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]"
            >
              {text}
            </span>,
            document.body
          )
        : null}
    </span>
  );
}
