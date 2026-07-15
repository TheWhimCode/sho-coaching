"use client";

import { usePathname } from "next/navigation";
import AdminShell from "@/app/admin/AdminShell";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
