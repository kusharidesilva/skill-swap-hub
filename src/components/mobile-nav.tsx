"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { scopedHref, type Role } from "@/lib/role-routes";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

type NavItem = {
  label: string;
  href: string;
  section?: "default" | "provide" | "find" | "community" | "footer";
  icon: ComponentType<IconProps>;
};

// Mobile uses the same icon language as the desktop sidebar.
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

// Keep the compact mobile labels mapped to the same role-aware routes.
const navConfig: Record<Role, NavItem[]> = {
  buyer: [
    { label: "Dashboard", href: "/dashboard/buyer", section: "default", icon: DashboardIcon },
    { label: "Profile", href: "/profile/buyer", section: "default", icon: UserCircleIcon },
    { label: "Settings", href: "/profile-settings/buyer", section: "default", icon: SettingsIcon },
    { label: "Request", href: scopedHref("/request-service", "buyer"), section: "find", icon: PlusCircleIcon },
    { label: "Find", href: scopedHref("/find-services", "buyer"), section: "find", icon: SearchUserIcon },
    { label: "Chat", href: scopedHref("/chats", "buyer"), section: "community", icon: ChatIcon },
    { label: "Ratings", href: scopedHref("/ratings", "buyer"), section: "community", icon: StarBadgeIcon },
    { label: "Sign Out", href: "/sign-out", section: "footer", icon: SignOutIcon },
  ],
  provider: [
    { label: "Dashboard", href: "/dashboard/provider", section: "default", icon: DashboardIcon },
    { label: "Profile", href: "/profile/provider", section: "default", icon: UserCircleIcon },
    { label: "Settings", href: "/profile-settings/provider", section: "default", icon: SettingsIcon },
    { label: "My Gigs", href: "/my-gigs/provider", section: "provide", icon: BriefcaseIcon },
    { label: "Requests", href: "/incoming-requests/provider", section: "provide", icon: InboxIcon },
    { label: "Chat", href: scopedHref("/chats", "provider"), section: "community", icon: ChatIcon },
    { label: "Ratings", href: scopedHref("/ratings", "provider"), section: "community", icon: StarBadgeIcon },
    { label: "Sign Out", href: "/sign-out", section: "footer", icon: SignOutIcon },
  ],
  both: [
    { label: "Dashboard", href: "/dashboard/both", section: "default", icon: DashboardIcon },
    { label: "Profile", href: "/profile/both", section: "default", icon: UserCircleIcon },
    { label: "Settings", href: "/profile-settings/both", section: "default", icon: SettingsIcon },
    { label: "My Gigs", href: "/my-gigs/both", section: "provide", icon: BriefcaseIcon },
    { label: "Requests", href: "/incoming-requests/both", section: "provide", icon: InboxIcon },
    { label: "Request", href: scopedHref("/request-service", "both"), section: "find", icon: PlusCircleIcon },
    { label: "Find", href: scopedHref("/find-services", "both"), section: "find", icon: SearchUserIcon },
    { label: "Chat", href: scopedHref("/chats", "both"), section: "community", icon: ChatIcon },
    { label: "Ratings", href: scopedHref("/ratings", "both"), section: "community", icon: StarBadgeIcon },
    { label: "Sign Out", href: "/sign-out", section: "footer", icon: SignOutIcon },
  ],
};

export default function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navConfig[role];

  // One renderer keeps active and sign-out styling consistent for every group.
  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const isSignOut = item.label === "Sign Out";
    const Icon = item.icon;

    return (
      <Link
        key={item.label}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
          isActive
            ? "bg-[#2f66e7]/10 text-[#2f66e7] shadow-xs ring-1 ring-[#2f66e7]/15"
            : isSignOut
              ? "text-rose-600 hover:bg-rose-50"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Icon className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isActive ? "scale-105" : ""}`} />
        <span className="leading-none whitespace-nowrap">{item.label}</span>
      </Link>
    );
  };

  const defaultItems = items.filter((item) => item.section === "default" || !item.section);
  const provideItems = items.filter((item) => item.section === "provide");
  const findItems = items.filter((item) => item.section === "find");
  const communityItems = items.filter((item) => item.section === "community");
  const footerItems = items.filter((item) => item.section === "footer");

  return (
    <nav
      className="ssh-mobile-nav flex items-center gap-4 overflow-x-auto px-4 py-3.5 bg-white/80 backdrop-blur-md scrollbar-none"
      aria-label="Mobile navigation"
    >
      {/* General/Default group */}
      {defaultItems.length > 0 && (
        <div className="flex items-center gap-1.5 bg-slate-100/70 border border-slate-200/50 rounded-2xl p-1 shrink-0">
          {defaultItems.map(renderItem)}
        </div>
      )}

      {/* Provide Skills group */}
      {provideItems.length > 0 && (
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-2xl p-1 shrink-0">
          <span className="text-[9px] uppercase font-extrabold text-emerald-700 pl-2 pr-0.5 shrink-0 select-none">
            Provide:
          </span>
          {provideItems.map(renderItem)}
        </div>
      )}

      {/* Find Skills group */}
      {findItems.length > 0 && (
        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-2xl p-1 shrink-0">
          <span className="text-[9px] uppercase font-extrabold text-blue-700 pl-2 pr-0.5 shrink-0 select-none">
            Find:
          </span>
          {findItems.map(renderItem)}
        </div>
      )}

      {/* Community group */}
      {communityItems.length > 0 && (
        <div className="flex items-center gap-1.5 bg-slate-100/70 border border-slate-200/50 rounded-2xl p-1 shrink-0">
          {communityItems.map(renderItem)}
        </div>
      )}

      {/* Footer actions (e.g. Sign Out) */}
      {footerItems.length > 0 && (
        <div className="flex items-center gap-1.5 bg-rose-50/40 border border-rose-100/50 rounded-2xl p-1 shrink-0">
          {footerItems.map(renderItem)}
        </div>
      )}
    </nav>
  );
}
