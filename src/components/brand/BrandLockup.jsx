"use client";

/**
 * BrandMark — фирменный знак Digital Emlak Hub
 * Архитектурный силуэт + золотой узел (hub). Quiet luxury.
 */

export function BrandMark({
  size = 36,
  className = "",
  title = "Digital Emlak Hub",
}) {
  const id = `eh-mark-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
    >
      <defs>
        <linearGradient id={`${id}-plate`} x1="6" y1="2" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1c1f27" />
          <stop offset="0.55" stopColor="#12141a" />
          <stop offset="1" stopColor="#0a0b0e" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="14" y1="10" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d4b896" />
          <stop offset="1" stopColor="#b8956c" />
        </linearGradient>
        <linearGradient id={`${id}-stone`} x1="12" y1="8" x2="28" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7f3ec" />
          <stop offset="1" stopColor="#e8dfd2" />
        </linearGradient>
      </defs>

      {/* Plate */}
      <rect width="40" height="40" rx="11" fill={`url(#${id}-plate)`} />

      {/* Soft inner rim */}
      <rect
        x="1.25"
        y="1.25"
        width="37.5"
        height="37.5"
        rx="9.75"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="0.75"
      />

      {/* Gold keyline */}
      <rect
        x="2.5"
        y="2.5"
        width="35"
        height="35"
        rx="8.5"
        stroke={`url(#${id}-gold)`}
        strokeOpacity="0.45"
        strokeWidth="0.9"
      />

      {/* Facade columns */}
      <path
        d="M12 29.5V15.2c0-.55.45-1 1-1h2.2c.55 0 1 .45 1 1V29.5"
        fill={`url(#${id}-stone)`}
        fillOpacity="0.92"
      />
      <path
        d="M17.8 29.5V11.5c0-.55.45-1 1-1h2.4c.55 0 1 .45 1 1V29.5"
        fill={`url(#${id}-stone)`}
      />
      <path
        d="M23.8 29.5V17.2c0-.55.45-1 1-1H27c.55 0 1 .45 1 1V29.5"
        fill={`url(#${id}-stone)`}
        fillOpacity="0.55"
      />

      {/* Pediment / roof line */}
      <path
        d="M11.5 14.2 L20 8.6 L28.5 14.2"
        stroke={`url(#${id}-gold)`}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Hub node */}
      <circle cx="20" cy="20.5" r="2.35" fill={`url(#${id}-gold)`} />
      <circle cx="20" cy="20.5" r="4.2" stroke={`url(#${id}-gold)`} strokeOpacity="0.35" strokeWidth="0.8" />

      {/* Base plinth */}
      <rect x="10.5" y="29.5" width="19" height="1.6" rx="0.8" fill={`url(#${id}-gold)`} fillOpacity="0.7" />
    </svg>
  );
}

/**
 * BrandLockup — знак + словесный знак
 */
export default function BrandLockup({
  size = 36,
  showWordmark = true,
  stacked = false,
  tone = "light",
  className = "",
  wordmarkClassName = "",
}) {
  const textMain = tone === "dark" ? "text-white" : "text-slate-900";
  const textSub = tone === "dark" ? "text-white/40" : "text-slate-500";

  return (
    <div className={["flex min-w-0 items-center gap-2.5 sm:gap-3", className].join(" ")}>
      <span className="relative shrink-0 transition-transform duration-500 group-hover:scale-[1.04]">
        <BrandMark size={size} />
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-[14px] opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: "radial-gradient(circle, rgba(184,149,108,0.35), transparent 70%)",
          }}
        />
      </span>

      {showWordmark ? (
        stacked ? (
          <div className={["min-w-0 leading-none", wordmarkClassName].join(" ")}>
            <div
              className={[
                "font-mono text-[8px] font-medium uppercase tracking-[0.22em] sm:text-[9px]",
                textSub,
              ].join(" ")}
            >
              Digital
            </div>
            <div
              className={[
                "mt-1 font-serif text-[15px] font-medium tracking-[-0.02em] sm:text-[16px]",
                textMain,
              ].join(" ")}
            >
              Emlak Hub
            </div>
          </div>
        ) : (
          <span
            className={[
              "font-serif block truncate text-[15px] font-semibold leading-none tracking-tight sm:text-[17px]",
              textMain,
              wordmarkClassName,
            ].join(" ")}
          >
            Digital Emlak Hub
          </span>
        )
      ) : null}
    </div>
  );
}
