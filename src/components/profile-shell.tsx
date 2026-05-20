import type { ReactNode } from "react";

import SiteFooter from "@/components/footer";
import Navbar from "@/components/navbar";
import SideNav from "@/components/side-nav";

type Role = "buyer" | "provider" | "both";

type ProfileShellProps = {
  role: Role;
  children: ReactNode;
};

export default function ProfileShell({ role, children }: ProfileShellProps) {
  const navRole = role === "both" ? "buyer" : role;

  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar role={navRole} />
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-6 py-8">
        <SideNav role={role} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
