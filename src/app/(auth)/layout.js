/**
 * =============================================================================
 * (auth) LAYOUT — OLED + мягкое переливание для /login и /register
 * =============================================================================
 */

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return (
    <div className="eh-terminal eh-auth relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-6 py-12">
      <div className="eh-auth-fx" aria-hidden>
        <div className="eh-auth-aurora" />
        <div className="eh-auth-sheen" />
        <div className="eh-auth-sheen-secondary" />
        <div className="eh-auth-grid" />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
