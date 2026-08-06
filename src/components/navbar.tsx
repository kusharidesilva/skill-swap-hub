"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  aboutHref,
  dashboardHref,
  helpHref,
  homeHref,
  profileHref as roleProfileHref,
  scopedHref,
  settingsHref as roleSettingsHref,
  type Role,
  type SiteRole,
} from "@/lib/role-routes";

type IconProps = { className?: string };

interface NavbarProps {
  role?: SiteRole;
}

export default function Navbar({ role: propRole }: NavbarProps) {
  const pathname = usePathname();
  const { firebaseUser, loading, userProfile } = useAuth();
  const [activeSection, setActiveSection] = useState("Home");
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const showUnreadNotifications = Boolean(userProfile && hasUnreadNotifications);

  // Prefer the page's role, then infer it from the URL for shared screens.
  let role: SiteRole = propRole || "guest";
  if (!propRole) {
    const pathSegments = pathname.split("/");
    if (pathSegments.includes("both")) {
      role = "both";
    } else if (pathSegments.includes("provider")) {
      role = "provider";
    } else if (
      pathSegments.includes("buyer") ||
      pathSegments.includes("logged-in")
    ) {
      role = "buyer";
    }
  }

  // Guests and signed-in roles receive different destinations from the same navbar.
  const getNavLinks = () => {
    const roleHomeHref = homeHref(role);
    const roleAboutHref = aboutHref(role);

    switch (role) {
      case "provider":
        return [
          { name: "Home", href: roleHomeHref },
          { name: "Dashboard", href: dashboardHref("provider") },
          { name: "Explore Skills", href: `${roleHomeHref}#explore-skills` },
          { name: "How It Works", href: `${roleHomeHref}#how-it-works` },
          { name: "About", href: roleAboutHref },
        ];
      case "both":
        return [
          { name: "Home", href: roleHomeHref },
          { name: "Dashboard", href: dashboardHref("both") },
          { name: "Explore Skills", href: `${roleHomeHref}#explore-skills` },
          { name: "How It Works", href: `${roleHomeHref}#how-it-works` },
          { name: "About", href: roleAboutHref },
        ];
      case "buyer":
        return [
          { name: "Home", href: roleHomeHref },
          { name: "Dashboard", href: dashboardHref("buyer") },
          { name: "Explore Skills", href: `${roleHomeHref}#explore-skills` },
          { name: "How It Works", href: `${roleHomeHref}#how-it-works` },
          { name: "About", href: roleAboutHref },
        ];
      case "guest":
      default:
        return [
          { name: "Home", href: "/" },
          { name: "Explore Skills", href: "/#explore-skills" },
          { name: "How It Works", href: "/#how-it-works" },
          { name: "About", href: "/about" },
        ];
    }
  };

  const navLinks = getNavLinks();
  const homeLinkHref = homeHref(role);
  const accountRole: Role = role === "guest" ? "buyer" : role;
  const profileHref = roleProfileHref(accountRole);
  const settingsHref = roleSettingsHref(accountRole);
  const favoritesHref = scopedHref("/favorites", accountRole);
  const notificationsHref = scopedHref("/notifications", accountRole);
  const isFavoritesPage =
    pathname === favoritesHref || pathname.startsWith(`${favoritesHref}/`);
  const isNotificationsPage =
    pathname === notificationsHref ||
    pathname.startsWith(`${notificationsHref}/`);

  useEffect(() => {
    if (loading || role === "guest" || !firebaseUser || !userProfile) {
      return;
    }

    const unreadQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userProfile.uid),
      where("read", "==", false),
    );

    const unsubscribe = onSnapshot(
      unreadQuery,
      (snapshot) => setHasUnreadNotifications(!snapshot.empty),
      () => setHasUnreadNotifications(false),
    );

    return () => unsubscribe();
  }, [firebaseUser, loading, role, userProfile]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  // On home pages, highlight the section currently visible below the fixed header.
  useEffect(() => {
    const isHomePage =
      pathname === "/" ||
      pathname === "/home/buyer" ||
      pathname === "/home/provider" ||
      pathname === "/home/both";

    if (!isHomePage) {
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Allow for the fixed navbar height.

      const exploreSection = document.getElementById("explore-skills");
      const howItWorksSection = document.getElementById("how-it-works");

      if (howItWorksSection && scrollPosition >= howItWorksSection.offsetTop) {
        setActiveSection("How It Works");
      } else if (exploreSection && scrollPosition >= exploreSection.offsetTop) {
        setActiveSection("Explore Skills");
      } else {
        setActiveSection("Home");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  // Non-home pages can determine their active link directly from the pathname.
  const isHomePage =
    pathname === "/" ||
    pathname === "/home/buyer" ||
    pathname === "/home/provider" ||
    pathname === "/home/both";
  const currentActiveSection = isHomePage
    ? activeSection
    : pathname.startsWith("/about")
      ? "About"
      : pathname.startsWith("/dashboard")
        ? "Dashboard"
        : "";

  return (
    <>
      <header className="ssh-navbar fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <input
          id="nav-toggle"
          type="checkbox"
          className="peer sr-only"
          aria-label="Toggle navigation menu"
          aria-controls="mobile-nav"
        />
        <div className="mx-auto flex h-[68px] w-full max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-8 lg:px-10">
          <Link href={homeLinkHref} className="flex items-center gap-3">
            <Image
              src="/img/Skill%20Swap%20Hub%20Logo%20icon-no%20bg.svg"
              alt="Skill Swap Hub"
              width={44}
              height={44}
              className="h-10 w-10"
              priority
            />
          </Link>

          {/* Desktop navigation links */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            {navLinks.map((link) => {
              const isActive = currentActiveSection === link.name;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`transition-colors font-semibold ${
                    isActive
                      ? "text-[#2b62e6]"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 lg:flex">
            {role === "guest" ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                >
                  Login
                </Link>
                <Link
                  href="/get-started"
                  className="ssh-primary-action rounded-full bg-[#0f4cbf] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3fa1]"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={notificationsHref}
                  aria-label="Notifications"
                  className={`relative rounded-full p-2 transition hover:bg-slate-100 ${
                    isNotificationsPage
                      ? "text-[#0758d8]"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <BellIcon className="h-5 w-5" />
                  {showUnreadNotifications ? (
                    <span className="ssh-pulse-dot absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#2f66e7] ring-2 ring-white" />
                  ) : null}
                </Link>
                <Link
                  href={favoritesHref}
                  aria-label="Favorites"
                  className={`rounded-full p-2 transition hover:bg-slate-100 ${
                    isFavoritesPage
                      ? "text-[#0758d8]"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <HeartIcon className="h-5 w-5" />
                </Link>
                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    onClick={() => setIsProfileMenuOpen((current) => !current)}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {userProfile?.profileImageUrl ? (
                      <img
                        src={userProfile.profileImageUrl}
                        alt={userProfile.name || "Profile"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                  </button>
                  {isProfileMenuOpen ? (
                    <div className="ssh-menu absolute right-0 mt-3 w-48 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-600 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                      <Link
                        href={profileHref}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 hover:bg-slate-100"
                      >
                        Profile
                      </Link>
                      <Link
                        href={settingsHref}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 hover:bg-slate-100"
                      >
                        Settings
                      </Link>
                      <Link
                        href={helpHref(accountRole)}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 hover:bg-slate-100"
                      >
                        Help & Support
                      </Link>
                      <Link
                        href="/sign-out"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-red-500 hover:bg-red-50"
                      >
                        Sign Out
                      </Link>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hamburger Toggle Label (Mobile) */}
        <label
          htmlFor="nav-toggle"
          className="absolute right-3 top-3 inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white/85 p-2 text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#0758d8] sm:right-5 sm:top-4 lg:hidden"
          aria-label="Open navigation menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </label>

        <label
          htmlFor="nav-toggle"
          className="fixed inset-0 top-[68px] z-0 hidden cursor-default bg-transparent peer-checked:block sm:top-[72px] lg:hidden"
          aria-label="Close navigation menu"
        />

        {/* Mobile Menu */}
        <div className="ssh-menu relative z-10 max-h-0 overflow-hidden border-b border-slate-200 bg-white/95 opacity-0 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-[max-height,opacity] duration-300 ease-out peer-checked:max-h-[calc(100dvh-68px)] peer-checked:opacity-100 lg:hidden">
          <nav
            id="mobile-nav"
            className="flex max-h-[calc(100dvh-68px)] flex-col gap-2 overflow-y-auto bg-linear-to-b from-white via-white to-[#f2fbfb] px-4 pb-4 pt-2.5 text-[13px] font-medium sm:px-5 sm:pb-5 sm:pt-3"
          >
            <div className="grid gap-1.5 rounded-2xl border border-slate-200/80 bg-white/85 p-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.035)] backdrop-blur min-[520px]:grid-cols-2">
              {navLinks.map((link) => {
                const isActive = currentActiveSection === link.name;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                      isActive
                        ? "bg-[#eaf1ff] text-[#0758d8] shadow-[inset_0_0_0_1px_rgba(47,102,231,0.16)]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="grid gap-1.5 rounded-2xl border border-slate-200/80 bg-white/85 p-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.035)] backdrop-blur min-[520px]:grid-cols-2">
              {role === "guest" ? (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-[13px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Login
                  </Link>
                  <Link
                    href="/get-started"
                    className="ssh-primary-action rounded-xl bg-[#0f4cbf] px-4 py-2.5 text-center text-[13px] font-semibold text-white shadow-sm"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={notificationsHref}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Notifications
                    {showUnreadNotifications ? (
                      <span className="ssh-pulse-dot h-2.5 w-2.5 rounded-full bg-[#2f66e7] ring-[3px] ring-[#e9f0ff]" />
                    ) : null}
                  </Link>
                  <Link
                    href={favoritesHref}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Favorites
                  </Link>
                  <Link
                    href={profileHref}
                    className="ssh-primary-action rounded-xl bg-linear-to-r from-[#2f66e7] to-[#0f4cbf] px-4 py-2.5 text-center text-[13px] font-semibold text-white shadow-sm"
                  >
                    Profile
                  </Link>
                  <Link
                    href={settingsHref}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Settings
                  </Link>
                  <Link
                    href={helpHref(accountRole)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Help & Support
                  </Link>
                  <Link
                    href="/sign-out"
                    className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-100 hover:text-rose-700"
                  >
                    Sign Out
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <div className="h-[68px] shrink-0 sm:h-[72px]" aria-hidden="true" />
    </>
  );
}

// Icons
function BellIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M15 17H9m8-4V9a5 5 0 0 0-10 0v4l-2 2h14l-2-2z" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </svg>
  );
}

function HeartIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 21s-6-4.5-8.2-7.5C1.6 10.4 3 7 6.4 6.3c2-.4 3.5.6 4.6 2.1 1.1-1.5 2.6-2.5 4.6-2.1C19 7 20.4 10.4 20.2 13.5 18 16.5 12 21 12 21z" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M4 20c1.7-3 5-4.5 8-4.5s6.3 1.5 8 4.5" />
    </svg>
  );
}
