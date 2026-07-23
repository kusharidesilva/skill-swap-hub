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
    <div className="ssh-page-shell flex h-screen flex-col overflow-hidden bg-[#f5f7ff] text-slate-900">
      <Navbar role={role} />

      {/* Mobile and tablet navigation */}
      <div className="ssh-mobile-rail fixed inset-x-0 top-[72px] z-40 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm xl:hidden">
        <MobileNav role={role} />
      </div>
      <div className="h-[61px] shrink-0 xl:hidden" aria-hidden="true" />

      <div className="user-content-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="grid min-h-full xl:grid-cols-[255px_minmax(0,1fr)]">
          {/* Desktop sidebar */}
          <div className="hidden xl:sticky xl:top-0 xl:block xl:h-[calc(100vh-72px)]">
            <SideNav role={role} />
          </div>
          <main className="ssh-user-main min-w-0 px-5 py-6 sm:px-6 lg:px-8 xl:px-10">
            <div className="app-route-stage mx-auto flex w-full max-w-[1220px] flex-col gap-8">
              {children}
            </div>
          </main>
        </div>
        <SiteFooter role={role} />
      </div>
    </div>
  );
}
