"use client";

/**
 * =============================================================================
 * LoginForm — минималистичный вход (OLED)
 * =============================================================================
 * Без Firebase: тестовые аккаунты → src/data/TEST_ACCESS.md
 * =============================================================================
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const router = useRouter();
  const { login, error, setError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const dest = await login(email.trim(), password);
      router.push(dest || "/dashboard");
    } catch (err) {
      setError(err.message || "Ошибка входа");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#b8956c]">
        Digital Emlak Hub
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white">
        Вход в терминал
      </h1>
      <p className="mt-2 text-sm text-[#9aa3ad]">
        Закрытый контур для профессионального капитала.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="eh-term-input"
            placeholder="you@capital.com"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">
            Пароль
          </span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="eh-term-input"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        {error ? (
          <p className="text-[12px] text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="eh-term-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Вход…" : "Войти"}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-[#6b7280]">
        Нет доступа?{" "}
        <Link href="/register" className="text-[#b8956c] hover:underline">
          Регистрация
        </Link>
        {" · "}
        <Link href="/" className="text-[#9aa3ad] hover:text-white">
          На главную
        </Link>
      </p>
    </div>
  );
}
