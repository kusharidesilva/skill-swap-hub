"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <DashboardIcon /> },
  { label: "User Management", href: "/admin/user-management", icon: <UsersIcon /> },
  { label: "Verifications", href: "/admin/verifications", icon: <ShieldIcon /> },
  { label: "Issue Resolution", href: "/admin/issue-resolution", icon: <TriangleIcon /> },
];

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/user-management": "User Management",
  "/admin/verifications": "Verifications",
  "/admin/issue-resolution": "Issue Resolution",
  "/admin/settings": "Settings",
};

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const title = pageTitles[pathname] ?? "Dashboard";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="grid h-screen overflow-hidden lg:grid-cols-[255px_minmax(0,1fr)]">
      <aside className="flex h-screen flex-col border-r border-slate-300 bg-[#eef0ff] px-4 py-7">
        <div className="px-2">
          <h1 className="text-[29px] font-semibold tracking-[-0.04em] text-slate-900">
            Skill Swap Hub
          </h1>
          <p className="text-[14px] uppercase leading-4 tracking-[0.02em] text-slate-700">
            Admin Panel
          </p>
        </div>

        <nav className="mt-10 space-y-1.5">
          {navItems.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[15px] font-medium transition ${
                  active ? "bg-[#2f66e7] text-white" : "text-slate-600 hover:bg-white/80"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center ${active ? "text-white" : "text-slate-500"}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="border-t border-slate-300" />
          <div className="space-y-2 pt-6">
            <Link
              href="/admin/settings"
              className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[15px] font-medium transition ${
                pathname === "/admin/settings" ? "bg-[#2f66e7] text-white" : "text-slate-600 hover:bg-white/80"
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center ${pathname === "/admin/settings" ? "text-white" : "text-slate-500"}`}>
                <SettingsIcon />
              </span>
              Settings
            </Link>

            <Link
              href="/sign-out"
              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[15px] font-medium text-slate-600 transition hover:bg-white/80"
            >
              <span className="flex h-8 w-8 items-center justify-center text-slate-500">
                <LogoutIcon />
              </span>
              Logout
            </Link>
          </div>
        </div>
      </aside>

      <main className="min-w-0 bg-[#f8f7ff]">
        <header className="flex h-[74px] items-center justify-between border-b border-slate-300 bg-white px-12 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
          <h2 className="text-[25px] font-medium text-slate-900">{title}</h2>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex h-12 w-12 items-center justify-center rounded-full text-slate-900 transition hover:text-slate-700"
            >
              <UserCircleIcon />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-14 z-20 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                <Link
                  href="/admin/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <AccountIcon />
                  </span>
                  Account
                </Link>
                <Link
                  href="/sign-out"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <LogoutArrowIcon />
                  </span>
                  Sign Out
                </Link>
              </div>
            ) : null}
          </div>
        </header>

        <div className="h-[calc(100vh-74px)] overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function DashboardIcon() {
  return <SquareGridIcon />;
}

function UsersIcon() {
  return <UsersTwoIcon />;
}

function ShieldIcon() {
  return <ShieldCheckIcon />;
}

function TriangleIcon() {
  return <TriangleOutlineIcon />;
}

function SettingsIcon() {
  return <GearIcon />;
}

function LogoutIcon() {
  return <LogoutArrowIcon />;
}

function UserCircleIcon() {
  return <UserCircleOutlineIcon />;
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function SquareGridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="6" height="6" rx="1.2" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" />
    </svg>
  );
}

function UsersTwoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TriangleOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.3 4.3-8.2 14A2 2 0 0 0 3.8 21h16.4a2 2 0 0 0 1.7-2.7l-8.2-14a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1 0 2.8l-1.1 1.1a2 2 0 0 1-2.8 0l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V22a2 2 0 0 1-2 2h-1.6a2 2 0 0 1-2-2v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8 0L2 19.8a2 2 0 0 1 0-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H1a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 0-2.8L3.3 1.2a2 2 0 0 1 2.8 0l.1.1a1.7 1.7 0 0 0 1.9.3h.2A1.7 1.7 0 0 0 9.3.1V0a2 2 0 0 1 2-2h1.6a2 2 0 0 1 2 2v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 0l1.1 1.1a2 2 0 0 1 0 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.2a1.7 1.7 0 0 0 1.5 1H24a2 2 0 0 1 2 2v1.6a2 2 0 0 1-2 2h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

function LogoutArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18" />
    </svg>
  );
}

function UserCircleOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 19a7.5 7.5 0 0 1 11 0" />
    </svg>
  );
}
