"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { scopedHref, type Role } from "@/lib/role-routes";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
};

// SVG Icon Definitions matching desktop side-nav icons exactly
function DashboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v7h-7z" />
      <path d="M4 13h7v7H4z" />
      <path d="M13 13h7v7h-7z" />
    </svg>
  );
}

function UserCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M4 20c1.7-3 5-4.5 8-4.5s6.3 1.5 8 4.5" />
    </svg>
  );
}

function SettingsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4z" />
      <path d="M4.9 12a7.1 7.1 0 0 1 .1-1l-2-1.3 2-3.4 2.2.6a7.4 7.4 0 0 1 1.7-1l.3-2.3h4l.3 2.3a7.4 7.4 0 0 1 1.7 1l2.2-.6 2 3.4-2 1.3a7.1 7.1 0 0 1 0 2l2 1.3-2 3.4-2.2-.6a7.4 7.4 0 0 1-1.7 1l-.3 2.3h-4l-.3-2.3a7.4 7.4 0 0 1-1.7-1l-2.2.6-2-3.4 2-1.3a7.1 7.1 0 0 1-.1-1z" />
    </svg>
  );
}

function PlusCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function SearchUserIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M9.5 10a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9.5 10z" />
      <path d="M3.5 16.5c1.4-2.2 3.4-3.5 6-3.5s4.6 1.3 6 3.5" />
      <path d="M15 14l5 5" />
      <circle cx="19.5" cy="18.5" r="3.5" />
    </svg>
  );
}

function ChatIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M4 5h16v11H7l-3 3z" />
    </svg>
  );
}

function StarBadgeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M12 3l2.6 5.4 5.9.9-4.3 4.1 1 5.9L12 16.8 6.8 19.3l1-5.9L3.5 9.3l5.9-.9z" />
      <path d="M4 20h16" />
    </svg>
  );
}

function SignOutIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M9 3h7a2 2 0 0 1 2 2v4" />
      <path d="M16 21H9a2 2 0 0 1-2-2V5" />
      <path d="M13 12h7" />
      <path d="M17 9l3 3-3 3" />
    </svg>
  );
}

function BriefcaseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M9 6V4h6v2" />
      <path d="M4 9h16v10H4z" />
      <path d="M4 12h16" />
    </svg>
  );
}

function InboxIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M4 5h16v12H4z" />
      <path d="M4 13h4l2 3h4l2-3h4" />
    </svg>
  );
}

const navConfig: Record<Role, NavItem[]> = {
  buyer: [
    { label: "Dashboard", href: "/dashboard/buyer", icon: DashboardIcon },
    { label: "Profile", href: "/profile/buyer", icon: UserCircleIcon },
    { label: "Settings", href: "/profile-settings/buyer", icon: SettingsIcon },
    { label: "Request", href: scopedHref("/request-service", "buyer"), icon: PlusCircleIcon },
    { label: "Find", href: scopedHref("/find-services", "buyer"), icon: SearchUserIcon },
    { label: "Chat", href: scopedHref("/chats", "buyer"), icon: ChatIcon },
    { label: "Ratings", href: scopedHref("/ratings", "buyer"), icon: StarBadgeIcon },
    { label: "Sign Out", href: "/sign-out", icon: SignOutIcon },
  ],
  provider: [
    { label: "Dashboard", href: "/dashboard/provider", icon: DashboardIcon },
    { label: "Profile", href: "/profile/provider", icon: UserCircleIcon },
    { label: "Settings", href: "/profile-settings/provider", icon: SettingsIcon },
    { label: "My Gigs", href: "/my-gigs/provider", icon: BriefcaseIcon },
    { label: "Requests", href: "/incoming-requests/provider", icon: InboxIcon },
    { label: "Chat", href: scopedHref("/chats", "provider"), icon: ChatIcon },
    { label: "Ratings", href: scopedHref("/ratings", "provider"), icon: StarBadgeIcon },
    { label: "Sign Out", href: "/sign-out", icon: SignOutIcon },
  ],
  both: [
    { label: "Dashboard", href: "/dashboard/both", icon: DashboardIcon },
    { label: "Profile", href: "/profile/both", icon: UserCircleIcon },
    { label: "Settings", href: "/profile-settings/both", icon: SettingsIcon },
    { label: "My Gigs", href: "/my-gigs/both", icon: BriefcaseIcon },
    { label: "Requests", href: "/incoming-requests/both", icon: InboxIcon },
    { label: "Request", href: scopedHref("/request-service", "both"), icon: PlusCircleIcon },
    { label: "Find", href: scopedHref("/find-services", "both"), icon: SearchUserIcon },
    { label: "Chat", href: scopedHref("/chats", "both"), icon: ChatIcon },
    { label: "Ratings", href: scopedHref("/ratings", "both"), icon: StarBadgeIcon },
    { label: "Sign Out", href: "/sign-out", icon: SignOutIcon },
  ],
};

export default function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navConfig[role];

  return (
    <nav
      className="flex items-center gap-2 overflow-x-auto px-4 py-3 bg-white/80 backdrop-blur-md scrollbar-none"
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const isSignOut = item.label === "Sign Out";
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-[#2f66e7]/10 text-[#2f66e7] shadow-sm ring-1 ring-[#2f66e7]/15"
                : isSignOut
                  ? "text-red-600 hover:bg-red-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isActive ? "scale-105" : ""}`} />
            <span className="leading-none whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
