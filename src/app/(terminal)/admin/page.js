"use client";

/**
 * /admin — редирект на первый раздел админки
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/users");
  }, [router]);
  return (
    <div className="font-mono text-[11px] text-[#6b7280]">Переход в админку…</div>
  );
}
