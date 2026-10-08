"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
const COPY = {
  az: {
    title: "Hesab açın",
    lead: "E-poçt, parol və saziş. Rol: investor.",
    name: "Ad",
    email: "Email",
    password: "Parol",
    confirm: "Parolu təkrarlayın",
    hint: "Ən azı 8 simvol.",
    show: "Göstər",
    hide: "Gizlət",
    caps: "Caps Lock açıqdır.",
    consent: "İstifadəçi sazişini və Məxfilik siyasətini qəbul edirəm.",
    terms: "İstifadəçi sazişi",
    privacy: "Məxfilik siyasəti",
    submit: "Hesab yarat",
    busy: "Yaradılır…",
    have: "Artıq hesabınız var?",
    login: "Daxil ol",
    mismatch: "Parollar üst-üstə düşmür.",
    needConsent: "Qeydiyyat üçün sazişi qəbul edin.",
    unavailable: "Qeydiyyat hazırda bağlıdır.",
    short: "Parol ən azı 8 simvol olmalıdır.",
  },
  ru: {
    title: "Создать аккаунт",
    lead: "Email, пароль и согласие. Роль — инвестор.",
    name: "Имя",
    email: "Email",
    password: "Пароль",
    confirm: "Пароль ещё раз",
    hint: "Не короче 8 символов.",
    show: "Показать",
    hide: "Скрыть",
    caps: "Включён Caps Lock.",
    consent: "Я принимаю Пользовательское соглашение и Политику конфиденциальности.",
    terms: "Пользовательское соглашение",
    privacy: "Политика конфиденциальности",
    submit: "Создать аккаунт",
    busy: "Создаём…",
    have: "Уже есть доступ?",
    login: "Войти",
    mismatch: "Пароли не совпадают.",
    needConsent: "Без согласия регистрация недоступна.",
    unavailable: "Регистрация сейчас недоступна.",
    short: "Пароль должен быть не короче 8 символов.",
  },
  en: {
    title: "Create an account",
    lead: "Email, password, and consent. Role: investor.",
    name: "Name",
    email: "Email",
    password: "Password",
    confirm: "Confirm password",
    hint: "At least 8 characters.",
    show: "Show",
    hide: "Hide",
    caps: "Caps Lock is on.",
    consent: "I accept the Terms of use and the Privacy policy.",
    terms: "Terms of use",
    privacy: "Privacy policy",
    submit: "Create account",
    busy: "Creating…",
    have: "Already have access?",
    login: "Sign in",
    mismatch: "Passwords do not match.",
    needConsent: "Registration needs your consent.",
    unavailable: "Registration is unavailable right now.",
    short: "Use at least 8 characters.",
  },
};

export default function RegisterForm() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = COPY[locale] || COPY.az;
  const { register, isConfigured, error, setError } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [busy, setBusy] = useState(false);

  const onKey = (event) => {
    setCaps(event.getModifierState?.("CapsLock") || false);
  };

  const params = useSearchParams();
  const refFromLink = String(params.get("ref") || "").trim().toUpperCase();
  useEffect(() => {
    if (refFromLink) window.localStorage.setItem("eh_ref", refFromLink);
  }, [refFromLink]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t.short);
      return;
    }
    if (password !== confirm) {
      setError(t.mismatch);
      return;
    }
    if (!acceptLegal) {
      setError(t.needConsent);
      return;
    }
    setBusy(true);
    try {
      const ref = refFromLink || window.localStorage.getItem("eh_ref") || "";
      await register(email.trim(), password, displayName.trim(), {
        acceptLegal: true,
        locale,
        ...(ref ? { ref } : {}),
      });
      if (ref) window.localStorage.removeItem("eh_ref");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || t.unavailable);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#a8a29e]">
        Digital Emlak Hub
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white">
        {t.title}
      </h1>
      <p className="mt-2 text-sm text-[#9aa3ad]">{t.lead}</p>

      {!isConfigured ? (
        <p className="mt-5 text-[12px] leading-relaxed text-[#6b7280]">{t.unavailable}</p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">
            {t.name}
          </span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="eh-term-input"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">
            {t.email}
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
            {t.password}
          </span>
          <span className="flex gap-2">
            <input
              type={show ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={onKey}
              className="eh-term-input"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="shrink-0 text-[12px] text-[#a8a29e]"
              onClick={() => setShow((v) => !v)}
            >
              {show ? t.hide : t.show}
            </button>
          </span>
          <span className="mt-1 block text-[11px] text-[#64748b]">{t.hint}</span>
          {caps ? <span className="mt-1 block text-[11px] text-amber-200">{t.caps}</span> : null}
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">
            {t.confirm}
          </span>
          <input
            type={show ? "text" : "password"}
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyUp={onKey}
            className="eh-term-input"
            autoComplete="new-password"
          />
        </label>

        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-[#d6d3d1]">
          <input
            type="checkbox"
            checked={acceptLegal}
            onChange={(e) => setAcceptLegal(e.target.checked)}
            className="mt-1"
            required
          />
          <span>
            {t.consent}{" "}
            <Link href="/legal/terms" className="text-[#93c5fd] hover:underline">
              {t.terms}
            </Link>
            {" · "}
            <Link href="/legal/privacy" className="text-[#93c5fd] hover:underline">
              {t.privacy}
            </Link>
          </span>
        </label>

        {error ? <p className="text-[12px] text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={busy || !isConfigured}
          className="eh-term-btn-primary w-full disabled:opacity-40"
        >
          {busy ? t.busy : t.submit}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-[#6b7280]">
        {t.have}{" "}
        <Link href="/login" className="text-[#d6d3d1] hover:underline">
          {t.login}
        </Link>
      </p>
    </div>
  );
}
