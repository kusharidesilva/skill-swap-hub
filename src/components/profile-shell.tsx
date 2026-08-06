import type { ReactNode } from "react";

import SiteFooter from "@/components/footer";
import Navbar from "@/components/navbar";
import SideNav from "@/components/side-nav";
import MobileNav from "@/components/mobile-nav";
import type { Role } from "@/lib/role-routes";

type ProfileShellProps = {
  role: Role;
  navRole?: Role;
  children: ReactNode;
};

export default function ProfileShell({ role, navRole, children }: ProfileShellProps) {
  const shellRole = navRole ?? role;

  return (
    <div className="ssh-page-shell flex h-screen flex-col overflow-hidden bg-[#f5f7ff] text-slate-900">
      <Navbar role={shellRole} />

      {/* Mobile and tablet navigation */}
      <div className="ssh-mobile-rail fixed inset-x-0 top-[68px] z-40 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm sm:top-[72px] xl:hidden">
        <MobileNav role={shellRole} />
      </div>
      <div className="h-[70px] shrink-0 sm:h-[74px] xl:hidden" aria-hidden="true" />

      <div className="user-content-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="grid min-h-full xl:grid-cols-[255px_minmax(0,1fr)]">
          {/* Desktop sidebar */}
          <div className="hidden xl:sticky xl:top-0 xl:block xl:h-[calc(100vh-72px)]">
            <SideNav role={shellRole} />
          </div>
          <main className="ssh-user-main min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
            <div className="app-route-stage mx-auto flex w-full max-w-[1220px] flex-col gap-6 sm:gap-8">
              {children}
            </div>
          </main>
        </div>
        <div className="xl:ml-[255px]">
          <SiteFooter role={shellRole} />
        </div>
      </div>
    </div>
  );
}
