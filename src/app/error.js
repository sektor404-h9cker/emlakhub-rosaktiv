"use client";

export default function RootError({ reset }) {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-lg flex-col justify-center px-6 text-[#e7e5e4]">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#78716c]">500</p>
      <h1 className="mt-3 font-serif text-3xl text-white">Не удалось загрузить данные</h1>
      <p className="mt-2 text-[14px] text-[#a8a29e]">
        Məlumat yüklənmədi. Data could not be loaded. Try again.
      </p>
      <div className="mt-6 flex gap-4 text-[14px]">
        <button type="button" onClick={() => reset()} className="text-[#93c5fd]">
          Retry
        </button>
        <a href="/dashboard" className="text-[#93c5fd]">
          Terminal
        </a>
      </div>
    </main>
  );
}
