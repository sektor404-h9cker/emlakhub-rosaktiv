"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminHomeForRole } from "@/lib/adminPrivileges";

export default function AdminIndexPage() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    router.replace(adminHomeForRole(role));
  }, [role, router]);

  return null;
}
