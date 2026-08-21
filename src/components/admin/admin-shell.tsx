"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isPendingAdminReport } from "@/lib/admin-panel";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <DashboardIcon /> },
  { label: "Verification", href: "/admin/verifications", icon: <ShieldIcon /> },
  { label: "User Management", href: "/admin/user-management", icon: <UsersIcon /> },
  { label: "Report Handling", href: "/admin/issue-resolution", icon: <TriangleIcon /> },
  { label: "Add & Manage", href: "/admin/add-and-manage", icon: <CollectionIcon /> },
];

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/user-management": "User Management",
  "/admin/verifications": "Verification",
  "/admin/issue-resolution": "Report Handling",
  "/admin/add-and-manage": "Add & Manage Options",
  "/admin/settings": "Settings",
  "/admin/sign-out": "Sign Out",
};

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, loading } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0);
  const [pendingReportCount, setPendingReportCount] = useState(0);
  const title = pageTitles[pathname] ?? "Dashboard";
  const isAdmin = userProfile?.role === "admin";
  const isStandaloneAdminAuthPage =
    pathname === "/admin/login" || pathname === "/admin/sign-out";
  const totalPendingAdminItems = pendingVerificationCount + pendingReportCount;

  useEffect(() => {
    if (isStandaloneAdminAuthPage) return;
    if (loading) return;

    if (!userProfile) {
      router.replace("/admin/login");
      return;
    }

    if (userProfile.role !== "admin") {
      router.replace(`/dashboard/${userProfile.role === "both" ? "both" : userProfile.role}`);
      return;
    }
  }, [isStandaloneAdminAuthPage, loading, router, userProfile]);

  useEffect(() => {
    // Close the account menu when the admin clicks anywhere outside it.
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }

      if (!notificationMenuRef.current?.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const unsubscribeVerifications = onSnapshot(
      collection(db, "providerVerifications"),
      (snapshot) => {
        setPendingVerificationCount(
          snapshot.docs.filter((docSnap) => {
            const data = docSnap.data();
            return data.status === "pending";
          }).length,
        );
      },
      (error) => {
        console.error("Error loading admin verification badge count:", error);
      },
    );

    const unsubscribeReports = onSnapshot(
      collection(db, "reports"),
      (snapshot) => {
        setPendingReportCount(
          snapshot.docs.filter((docSnap) => {
            const data = docSnap.data();
            return isPendingAdminReport({
              status: typeof data.status === "string" ? data.status : undefined,
              adminNeedsReview: data.adminNeedsReview === true,
            });
          }).length,
        );
      },
      (error) => {
        console.error("Error loading admin report badge count:", error);
      },
    );

    return () => {
      unsubscribeVerifications();
      unsubscribeReports();
    };
  }, [isAdmin]);

  if (isStandaloneAdminAuthPage) {
    return <>{children}</>;
  }

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f7ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2f66e7] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-interaction-scope grid h-screen overflow-hidden lg:grid-cols-[255px_minmax(0,1fr)]">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
        />
      ) : null}

      {/* Admin navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[255px] flex-col border-r border-slate-300 bg-[#eef0ff] px-4 py-7 transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
                onClick={() => {
                  setSidebarOpen(false);
                  setMenuOpen(false);
                }}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[15px] font-medium transition ${
                  active ? "bg-[#2f66e7] text-white" : "text-slate-600 hover:bg-white/80"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center ${active ? "text-white" : "text-slate-500"}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {item.label === "Verification" && pendingVerificationCount > 0 ? (
                  <span
                    className={`ml-auto inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {pendingVerificationCount}
                  </span>
                ) : null}
                {item.label === "Report Handling" && pendingReportCount > 0 ? (
                  <span
                    className={`ml-auto inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {pendingReportCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="border-t border-slate-300" />
          <div className="space-y-2 pt-6">
            <Link
              href="/admin/settings"
              onClick={() => {
                setSidebarOpen(false);
                setMenuOpen(false);
              }}
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
              href="/admin/sign-out"
              onClick={() => {
                setSidebarOpen(false);
                setMenuOpen(false);
              }}
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

      {/* Current admin page and account menu */}
      <main className="min-w-0 bg-[#f8f7ff]">
        <header className="flex h-[74px] items-center justify-between border-b border-slate-300 bg-white px-12 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
            >
              <MenuIcon />
            </button>
            <h2 className="text-[25px] font-medium text-slate-900">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div ref={notificationMenuRef} className={`relative ${notificationMenuOpen ? "z-[220]" : ""}`}>
              <button
                type="button"
                onClick={() => setNotificationMenuOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={notificationMenuOpen}
                aria-label="Open admin notifications"
                className={`relative inline-flex h-12 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                  totalPendingAdminItems > 0
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <BellIcon />
                <span className="hidden sm:inline">
                  {totalPendingAdminItems > 0
                    ? `${totalPendingAdminItems} pending`
                    : "No alerts"}
                </span>
                {totalPendingAdminItems > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                    {totalPendingAdminItems}
                  </span>
                ) : null}
              </button>

              {notificationMenuOpen ? (
                <div className="absolute right-0 top-14 z-[220] w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                  <div className="border-b border-slate-100 px-2 pb-3">
                    <p className="text-sm font-semibold text-slate-900">Admin notifications</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Pending items stay here until they are reviewed.
                    </p>
                  </div>
                  <div className="space-y-2 px-1 pt-3">
                    <NotificationLink
                      href="/admin/verifications"
                      title="Student provider proofs"
                      description={
                        pendingVerificationCount > 0
                          ? `${pendingVerificationCount} verification request${pendingVerificationCount === 1 ? "" : "s"} waiting for review`
                          : "No pending verification requests"
                      }
                      count={pendingVerificationCount}
                      tone="blue"
                      onClick={() => setNotificationMenuOpen(false)}
                    />
                    <NotificationLink
                      href="/admin/issue-resolution"
                      title="Reported issues"
                      description={
                        pendingReportCount > 0
                          ? `${pendingReportCount} report${pendingReportCount === 1 ? "" : "s"} still need action`
                          : "No pending reports"
                      }
                      count={pendingReportCount}
                      tone="red"
                      onClick={() => setNotificationMenuOpen(false)}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div ref={menuRef} className={`relative ${menuOpen ? "z-[220]" : ""}`}>
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 text-slate-900 transition hover:border-slate-300 hover:text-slate-700"
              >
                {userProfile.profileImageUrl ? (
                  <img
                    src={userProfile.profileImageUrl}
                    alt={userProfile.name || "Admin profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="/img/Skill Swap Hub Logo icon.png"
                    alt="Skill Swap Hub logo"
                    className="h-full w-full p-1 object-contain"
                  />
                )}
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-14 z-[220] w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
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
                    href="/admin/sign-out"
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
          </div>
        </header>

        <div className="admin-content-scroll h-[calc(100vh-74px)] overflow-y-auto">
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

function CollectionIcon() {
  return <LayersIcon />;
}

function NotificationLink({
  href,
  title,
  description,
  count,
  tone,
  onClick,
}: {
  href: string;
  title: string;
  description: string;
  count: number;
  tone: "blue" | "red";
  onClick: () => void;
}) {
  const toneClasses =
    tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : "bg-red-50 text-red-600";

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-start gap-3 rounded-2xl px-3 py-3 transition hover:bg-slate-50"
    >
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneClasses}`}
      >
        {tone === "blue" ? <ShieldIcon /> : <TriangleIcon />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      {count > 0 ? (
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function SettingsIcon() {
  return <SettingsSliderIcon />;
}

function LogoutIcon() {
  return <LogoutDoorIcon />;
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 17H9" />
      <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
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

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Z" />
      <path d="m21 12-9 4.5L3 12" />
      <path d="m21 16.5-9 4.5-9-4.5" />
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

function SettingsSliderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="11" cy="18" r="2" />
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

function LogoutDoorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 5h6v14h-6" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M18 12H6" />
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
