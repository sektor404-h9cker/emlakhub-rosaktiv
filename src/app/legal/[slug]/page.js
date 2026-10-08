"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { legalDoc } from "@/lib/legal/copy";
import LegalBar from "@/components/legal/LegalBar";

export default function LegalPage() {
  const params = useParams();
  const { locale } = useLocale();
  const doc = legalDoc(String(params.slug || ""), locale);
  if (!doc) {
    return (
      <main className="min-h-[100dvh] bg-black text-[#e7e5e4]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p>404</p>
          <Link href="/dashboard" className="mt-4 inline-block text-[#93c5fd]">
            Terminal
          </Link>
        </div>
      </main>
    );
  }
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-black text-[#e7e5e4]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]"
      />
      <div className="relative mx-auto max-w-2xl px-6 py-12">
      <p className="text-[12px] leading-relaxed text-amber-200/90">{doc.draft}</p>
      <h1 className="mt-4 font-serif text-3xl text-white">{doc.title}</h1>
      <div className="mt-8 space-y-6">
        {doc.sections.map(([title, body]) => (
          <section key={title}>
            <h2 className="text-[15px] font-semibold text-white">{title}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#a8a29e]">{body}</p>
          </section>
        ))}
      </div>
      <div className="mt-10">
        <LegalBar />
      </div>
      <Link href="/dashboard" className="mt-6 inline-block text-[13px] text-[#93c5fd]">
        Terminal
      </Link>
      </div>
    </main>
  );
}
