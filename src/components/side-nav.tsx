"use client";

import type { ReactElement } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "buyer" | "provider" | "both";

type NavItem = {
  label: string;
  href: string;
  section?: "default" | "find" | "community" | "footer";
  icon: (props: { className?: string }) => ReactElement;
};

type SideNavProps = {
  role?: Role;
};

const navConfig: Record<Role, NavItem[]> = {
  buyer: [
    { label: "Dashboard", href: "/dashboard/buyer", icon: DashboardIcon },
    { label: "My Profile", href: "/profile/buyer", icon: UserCircleIcon },
    {
      label: "Profile Settings",
      href: "/profile-settings/buyer",
      icon: SettingsIcon,
    },
    {
      label: "Request Service",
      href: "/request-service",
      section: "find",
      icon: PlusCircleIcon,
    },
    {
      label: "Find Services",
      href: "/find-services",
      section: "find",
      icon: SearchUserIcon,
    },
    {
      label: "Chat",
      href: "/chats",
      section: "community",
      icon: ChatIcon,
    },
    {
      label: "Ratings",
      href: "/ratings",
      section: "community",
      icon: StarBadgeIcon,
    },
    {
      label: "Report Issue",
      href: "/report-issue",
      section: "footer",
      icon: AlertTriangleIcon,
    },
    {
      label: "Sign Out",
      href: "/sign-out",
      section: "footer",
      icon: SignOutIcon,
    },
  ],
  provider: [
    { label: "Dashboard", href: "/dashboard/provider", icon: DashboardIcon },
    { label: "My Profile", href: "/profile/provider", icon: UserCircleIcon },
    {
      label: "Profile Settings",
      href: "/profile-settings/provider",
      icon: SettingsIcon,
    },
    {
      label: "My Gigs",
      href: "/my-gigs",
      section: "find",
      icon: BriefcaseIcon,
    },
    {
      label: "Incoming Requests",
      href: "/incoming-requests",
      section: "find",
      icon: InboxIcon,
    },
    {
      label: "Chat",
      href: "/chats",
      section: "community",
      icon: ChatIcon,
    },
    {
      label: "Ratings",
      href: "/ratings",
      section: "community",
      icon: StarBadgeIcon,
    },
    {
      label: "Report Issue",
      href: "/report-issue",
      section: "footer",
      icon: AlertTriangleIcon,
    },
    {
      label: "Sign Out",
      href: "/sign-out",
      section: "footer",
      icon: SignOutIcon,
    },
  ],
  both: [
    { label: "Dashboard", href: "/dashboard/both", icon: DashboardIcon },
    { label: "My Profile", href: "/profile/both", icon: UserCircleIcon },
    {
      label: "Profile Settings",
      href: "/profile-settings/both",
      icon: SettingsIcon,
    },
    { label: "My Gigs", href: "/my-gigs", section: "find", icon: BriefcaseIcon },
    {
      label: "Incoming Requests",
      href: "/incoming-requests",
      section: "find",
      icon: InboxIcon,
    },
    {
      label: "Request Service",
      href: "/request-service",
      section: "find",
      icon: PlusCircleIcon,
    },
    {
      label: "Find Services",
      href: "/find-services",
      section: "find",
      icon: SearchUserIcon,
    },
    {
      label: "Chat",
      href: "/chats",
      section: "community",
      icon: ChatIcon,
    },
    {
      label: "Ratings",
      href: "/ratings",
      section: "community",
      icon: StarBadgeIcon,
    },
    {
      label: "Report Issue",
      href: "/report-issue",
      section: "footer",
      icon: AlertTriangleIcon,
    },
    {
      label: "Sign Out",
      href: "/sign-out",
      section: "footer",
      icon: SignOutIcon,
    },
  ],
};

export default function SideNav({ role: roleProp }: SideNavProps) {
  const pathname = usePathname();

  const role: Role = roleProp
    ? roleProp
    : pathname.includes("/provider")
      ? "provider"
      : pathname.includes("/both")
        ? "both"
        : "buyer";

  const links = navConfig[role];

  const defaultItems = links.filter(
    (item) => !item.section || item.section === "default",
  );
  const findItems = links.filter((item) => item.section === "find");
  const communityItems = links.filter((item) => item.section === "community");
  const footerItems = links.filter((item) => item.section === "footer");

  return (
    <aside className="sticky top-24 h-fit w-64 rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
      <nav className="flex flex-col text-sm font-semibold">
        <div className="flex flex-col gap-1">
          {defaultItems.map((link) => (
            <SideNavLink key={link.label} link={link} pathname={pathname} />
          ))}
        </div>

        <div className="mt-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Find Skills
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {findItems.map((link) => (
              <SideNavLink key={link.label} link={link} pathname={pathname} />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Community
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {communityItems.map((link) => (
              <SideNavLink key={link.label} link={link} pathname={pathname} />
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex flex-col gap-1">
            {footerItems.map((link) => (
              <SideNavLink key={link.label} link={link} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}

function SideNavLink({ link, pathname }: { link: NavItem; pathname: string }) {
  const isActive =
    pathname === link.href || pathname.startsWith(`${link.href}/`);
  const Icon = link.icon;
  const isSignOut = link.label === "Sign Out";

  return (
    <Link
      key={link.label}
      href={link.href}
      aria-current={isActive ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isActive
          ? "bg-[#2f66e7] text-white shadow-sm"
          : isSignOut
            ? "text-amber-700 hover:bg-amber-50"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          isActive
            ? "bg-white/15"
            : isSignOut
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span>{link.label}</span>
    </Link>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v7h-7z" />
      <path d="M4 13h7v7H4z" />
      <path d="M13 13h7v7h-7z" />
    </svg>
  );
}

function UserCircleIcon({ className }: { className?: string }) {
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

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4z" />
      <path d="M4.9 12a7.1 7.1 0 0 1 .1-1l-2-1.3 2-3.4 2.2.6a7.4 7.4 0 0 1 1.7-1l.3-2.3h4l.3 2.3a7.4 7.4 0 0 1 1.7 1l2.2-.6 2 3.4-2 1.3a7.1 7.1 0 0 1 0 2l2 1.3-2 3.4-2.2-.6a7.4 7.4 0 0 1-1.7 1l-.3 2.3h-4l-.3-2.3a7.4 7.4 0 0 1-1.7-1l-2.2.6-2-3.4 2-1.3a7.1 7.1 0 0 1-.1-1z" />
    </svg>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function SearchUserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9.5 10a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9.5 10z" />
      <path d="M3.5 16.5c1.4-2.2 3.4-3.5 6-3.5s4.6 1.3 6 3.5" />
      <path d="M15 14l5 5" />
      <circle cx="19.5" cy="18.5" r="3.5" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 5h16v11H7l-3 3z" />
    </svg>
  );
}

function StarBadgeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3l2.6 5.4 5.9.9-4.3 4.1 1 5.9L12 16.8 6.8 19.3l1-5.9L3.5 9.3l5.9-.9z" />
      <path d="M4 20h16" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3l9 16H3z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9 3h7a2 2 0 0 1 2 2v4" />
      <path d="M16 21H9a2 2 0 0 1-2-2V5" />
      <path d="M13 12h7" />
      <path d="M17 9l3 3-3 3" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9 6V4h6v2" />
      <path d="M4 9h16v10H4z" />
      <path d="M4 12h16" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 5h16v12H4z" />
      <path d="M4 13h4l2 3h4l2-3h4" />
    </svg>
  );
}
