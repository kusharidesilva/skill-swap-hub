import type { ReactNode } from "react";

import SiteFooter from "@/components/footer";
import Navbar from "@/components/navbar";
import SideNav from "@/components/side-nav";
import MobileNav from "@/components/mobile-nav";
import type { Role } from "@/lib/role-routes";

type ProfileShellProps = {
  role: Role;
  children: ReactNode;
};

export default function ProfileShell({ role, children }: ProfileShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar role={role} />

      {/* Mobile and tablet navigation */}
      <div className="fixed inset-x-0 top-[85px] z-40 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm xl:hidden">
        <MobileNav role={role} />
      </div>
      <div className="h-[61px] shrink-0 xl:hidden" aria-hidden="true" />

      <div className="mx-auto flex w-full max-w-6xl flex-col xl:flex-row gap-8 px-6 pt-6 xl:pt-10 pb-8">
        {/* Desktop sidebar */}
        <div className="hidden xl:block w-64 shrink-0">
          <SideNav role={role} />
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <SiteFooter role={role} />
    </div>
  );
}
