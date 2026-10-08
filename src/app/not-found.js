import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-lg flex-col justify-center px-6 text-[#e7e5e4]">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#78716c]">404</p>
      <h1 className="mt-3 font-serif text-3xl text-white">Səhifə tapılmadı</h1>
      <p className="mt-2 text-[14px] text-[#a8a29e]">Страница не найдена. Page not found.</p>
      <Link href="/dashboard" className="mt-6 text-[14px] text-[#93c5fd]">
        Terminal
      </Link>
    </main>
  );
}
