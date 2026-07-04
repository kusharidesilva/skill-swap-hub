import type { ReactNode } from "react";
import AdminShell from "@/components/admin/admin-shell";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f4ff] text-slate-900">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
