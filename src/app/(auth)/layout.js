/**
 * =============================================================================
 * (auth) LAYOUT — OLED фон для /login и /register
 * =============================================================================
 */

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return (
    <div className="eh-terminal relative flex min-h-[100dvh] items-center justify-center bg-[#050505] px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(184,149,108,0.08), transparent 55%), linear-gradient(180deg, #050505 0%, #0a0a0c 100%)",
        }}
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
