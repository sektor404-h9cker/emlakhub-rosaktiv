"use client";

/**
 * =============================================================================
 * RegisterForm — регистрация email/пароль → роль investor по умолчанию
 * =============================================================================
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterForm() {
  const router = useRouter();
  const { register, isConfigured, error, setError } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(email.trim(), password, displayName.trim());
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Ошибка регистрации");
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
        Запрос доступа
      </h1>
      <p className="mt-2 text-sm text-[#9aa3ad]">
        После регистрации роль — Инвестор. Админ может повысить в панели.
      </p>

      {!isConfigured && (
        <p className="mt-5 text-[12px] leading-relaxed text-[#6b7280]">
          Регистрация станет доступна после подключения Firebase. Пока используйте
          выданный доступ на странице входа.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">
            Имя / фонд
          </span>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="eh-term-input"
            placeholder="Capital Desk"
          />
        </label>
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
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">
            Пароль (мин. 6)
          </span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="eh-term-input"
            autoComplete="new-password"
          />
        </label>

        {error ? <p className="text-[12px] text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={busy || !isConfigured}
          className="eh-term-btn-primary w-full disabled:opacity-40"
        >
          {busy ? "Создание…" : "Создать аккаунт"}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-[#6b7280]">
        Уже есть доступ?{" "}
        <Link href="/login" className="text-[#b8956c] hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
