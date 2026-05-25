"use client"; 

import { usePathname } from "next/navigation"; 
import { useState, useEffect } from "react"; 
import Image from "next/image";
import Link from "next/link";
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
  const [activeSection, setActiveSection] = useState("Home");

  // Determine the active role based on prop or pathname auto-detection
  let role: SiteRole = propRole || "guest";
  if (!propRole) {
    const pathSegments = pathname.split("/");
    if (pathSegments.includes("both")) {
      role = "both";
    } else if (pathSegments.includes("provider")) {
      role = "provider";
    } else if (pathSegments.includes("buyer") || pathSegments.includes("logged-in")) {
      role = "buyer";
    }
  }

  // Set up nav links dynamically based on role
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
    pathname === notificationsHref || pathname.startsWith(`${notificationsHref}/`);

  // Scroll spy active section effect
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
      const scrollPosition = window.scrollY + 200; // offset for navbar height

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

  // Dynamically compute active section for non-home pages during render (avoids cascading render warning)
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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <input
        id="nav-toggle"
        type="checkbox"
        className="peer sr-only"
        aria-label="Toggle navigation menu"
        aria-controls="mobile-nav"
      />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-10 py-5">
        <Link href={homeLinkHref} className="flex items-center gap-3">
          <Image
            src="/img/Skill%20Swap%20Hub%20Logo%20icon-no%20bg.svg"
            alt="Skill Swap Hub"
            width={44}
            height={44}
            className="h-11 w-11"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
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
        <div className="hidden items-center gap-4 md:flex">
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
                className="rounded-full bg-[#0f4cbf] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3fa1]"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                href={notificationsHref}
                aria-label="Notifications"
                className={`rounded-full p-2 transition hover:bg-slate-100 ${
                  isNotificationsPage
                    ? "text-[#0758d8]"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <BellIcon className="h-5 w-5" />
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
              <details className="relative">
                <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                  <UserIcon className="h-5 w-5" />
                </summary>
                <div className="absolute right-0 mt-3 w-48 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-600 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    href={profileHref}
                    className="block rounded-lg px-3 py-2 hover:bg-slate-100"
                  >
                    Profile
                  </Link>
                  <Link
                    href={settingsHref}
                    className="block rounded-lg px-3 py-2 hover:bg-slate-100"
                  >
                    Settings
                  </Link>
                  <Link
                    href={helpHref(accountRole)}
                    className="block rounded-lg px-3 py-2 hover:bg-slate-100"
                  >
                    Help & Support
                  </Link>
                  <Link
                    href="/sign-out"
                    className="block rounded-lg px-3 py-2 text-red-500 hover:bg-red-50"
                  >
                    Sign Out
                  </Link>
                </div>
              </details>
            </>
          )}
        </div>
      </div>

      {/* Hamburger Toggle Label (Mobile) */}
      <label
        htmlFor="nav-toggle"
        className="absolute right-6 top-5 inline-flex items-center rounded-md p-2 text-slate-700 transition-colors hover:text-slate-900 md:hidden cursor-pointer"
      >
        <svg
          className="h-6 w-6"
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

      {/* Mobile Menu */}
      <div className="max-h-0 overflow-hidden border-b border-slate-200 bg-white/95 opacity-0 transition-[max-height,opacity] duration-300 ease-out peer-checked:max-h-96 peer-checked:opacity-100 md:hidden">
        <nav
          id="mobile-nav"
          className="flex flex-col gap-4 px-6 pb-6 pt-4 text-sm font-medium"
        >
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

          <div className="mt-2 flex flex-col gap-3">
            {role === "guest" ? (
              <>
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Login
                </Link>
                <Link
                  href="/get-started"
                  className="rounded-full bg-[#0f4cbf] px-5 py-2 text-center text-sm font-semibold text-white shadow-sm"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={notificationsHref}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Notifications
                </Link>
                <Link
                  href={favoritesHref}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Favorites
                </Link>
                <Link
                  href={profileHref}
                  className="rounded-full bg-[#0f4cbf] px-5 py-2 text-center text-sm font-semibold text-white shadow-sm"
                >
                  Profile
                </Link>
                <Link
                  href={settingsHref}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Settings
                </Link>
                <Link
                  href={helpHref(accountRole)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Help & Support
                </Link>
                <Link
                  href="/sign-out"
                  className="text-slate-600 hover:text-red-500"
                >
                  Sign Out
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
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
