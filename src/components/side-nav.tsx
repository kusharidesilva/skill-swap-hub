"use client";

import type { ReactElement } from "react";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { scopedHref, type Role } from "@/lib/role-routes";

type NavItem = {
  label: string;
  href: string;
  section?: "default" | "provide" | "find" | "community" | "footer";
  icon: (props: { className?: string }) => ReactElement;
};

type SideNavProps = {
  role?: Role;
};

// Each role gets only the workflows that make sense for that account.
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
      href: scopedHref("/request-service", "buyer"),
      section: "find",
      icon: PlusCircleIcon,
    },
    {
      label: "Find Services",
      href: scopedHref("/find-services", "buyer"),
      section: "find",
      icon: SearchUserIcon,
    },
    {
      label: "Chat",
      href: scopedHref("/chats", "buyer"),
      section: "community",
      icon: ChatIcon,
    },
    {
      label: "Ratings",
      href: scopedHref("/ratings", "buyer"),
      section: "community",
      icon: StarBadgeIcon,
    },
    {
      label: "Report Issue",
      href: scopedHref("/report-issue", "buyer"),
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
      href: scopedHref("/my-gigs", "provider"),
      section: "provide",
      icon: BriefcaseIcon,
    },
    {
      label: "Incoming Requests",
      href: scopedHref("/incoming-requests", "provider"),
      section: "provide",
      icon: InboxIcon,
    },
    {
      label: "Chat",
      href: scopedHref("/chats", "provider"),
      section: "community",
      icon: ChatIcon,
    },
    {
      label: "Ratings",
      href: scopedHref("/ratings", "provider"),
      section: "community",
      icon: StarBadgeIcon,
    },
    {
      label: "Report Issue",
      href: scopedHref("/report-issue", "provider"),
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
    { label: "My Gigs", href: scopedHref("/my-gigs", "both"), section: "provide", icon: BriefcaseIcon },
    {
      label: "Incoming Requests",
      href: scopedHref("/incoming-requests", "both"),
      section: "provide",
      icon: InboxIcon,
    },
    {
      label: "Request Service",
      href: scopedHref("/request-service", "both"),
      section: "find",
      icon: PlusCircleIcon,
    },
    {
      label: "Find Services",
      href: scopedHref("/find-services", "both"),
      section: "find",
      icon: SearchUserIcon,
    },
    {
      label: "Chat",
      href: scopedHref("/chats", "both"),
      section: "community",
      icon: ChatIcon,
    },
    {
      label: "Ratings",
      href: scopedHref("/ratings", "both"),
      section: "community",
      icon: StarBadgeIcon,
    },
    {
      label: "Report Issue",
      href: scopedHref("/report-issue", "both"),
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
  const searchParams = useSearchParams();
  const previewSource = searchParams.get("source");

  // The explicit shell role wins; the pathname is only a safe fallback.
  const role: Role = roleProp
    ? roleProp
    : pathname.includes("/provider")
      ? "provider"
      : pathname.includes("/both")
        ? "both"
        : "buyer";

  const links = navConfig[role];

  // Grouping adds clear labels without duplicating separate navigation components.
  const defaultItems = links.filter((item) => !item.section || item.section === "default");
  const provideItems = links.filter((item) => item.section === "provide");
  const findItems    = links.filter((item) => item.section === "find");
  const communityItems = links.filter((item) => item.section === "community");
  const footerItems  = links.filter((item) => item.section === "footer");

  const effectiveDefaultItems  = defaultItems;
  const effectiveProvideItems  = provideItems;
  const effectiveFindItems     = findItems;

  return (
    <aside className="ssh-sidebar scrollbar-none flex h-full w-full flex-col overflow-y-auto border-r border-slate-300 bg-[#eef0ff] px-4 py-5">
      <nav className="flex min-h-0 flex-1 flex-col text-[14px] font-medium">
        <div className="flex flex-col gap-1">
          {effectiveDefaultItems.map((link) => (
            <SideNavLink key={link.label} link={link} pathname={pathname} previewSource={previewSource} />
          ))}
        </div>

        {effectiveProvideItems.length > 0 && (
          <div className="mt-3">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Provide Skills
            </p>
            <div className="mt-1.5 flex flex-col gap-1">
              {effectiveProvideItems.map((link) => (
                <SideNavLink key={link.label} link={link} pathname={pathname} previewSource={previewSource} />
              ))}
            </div>
          </div>
        )}

        {effectiveFindItems.length > 0 && (
          <div className="mt-3">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Find Skills
            </p>
            <div className="mt-1.5 flex flex-col gap-1">
              {effectiveFindItems.map((link) => (
                <SideNavLink key={link.label} link={link} pathname={pathname} previewSource={previewSource} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Community
          </p>
          <div className="mt-1.5 flex flex-col gap-1">
            {communityItems.map((link) => (
              <SideNavLink key={link.label} link={link} pathname={pathname} previewSource={previewSource} />
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-slate-300 pt-3">
          <div className="flex flex-col gap-1">
            {footerItems.map((link) => (
              <SideNavLink key={link.label} link={link} pathname={pathname} previewSource={previewSource} />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}

function SideNavLink({
  link,
  pathname,
  previewSource,
}: {
  link: NavItem;
  pathname: string;
  previewSource: string | null;
}) {
  const isInsideServicePage = pathname.startsWith("/service/");
  const isFindServicesLink = link.label === "Find Services";
  const isReportIssueLink = link.label === "Report Issue";
  const isReportIssuePage = pathname.startsWith("/report-issue");
  const isPostGigPage = pathname.startsWith("/post-gig");
  const isGigPreviewPage = pathname.startsWith("/gig-preview");
  const isEditGigPage = pathname.startsWith("/edit-gig");
  const isMyGigsLink = link.label === "My Gigs";
  const isActive =
    pathname === link.href ||
    pathname.startsWith(`${link.href}/`) ||
    (isInsideServicePage && isFindServicesLink) ||
    (isReportIssuePage && isReportIssueLink) ||
    (isPostGigPage && isMyGigsLink) ||
    (isGigPreviewPage && isMyGigsLink && previewSource === "my-gigs") ||
    (isEditGigPage && isMyGigsLink);
  const Icon = link.icon;
  const isSignOut = link.label === "Sign Out";

  return (
    <Link
      key={link.label}
      href={link.href}
      aria-current={isActive ? "page" : undefined}
      className={`group flex min-h-10 items-center gap-3 rounded-[10px] px-3 py-2 transition-colors ${
        isActive
          ? "bg-[#2f66e7] text-white shadow-sm"
          : isSignOut
            ? "text-amber-700 hover:bg-white/80"
            : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isActive
            ? "bg-white/15"
            : isSignOut
              ? "bg-amber-50 text-amber-700"
              : "bg-white/70 text-slate-500 group-hover:text-slate-700"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate">{link.label}</span>
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="13" width="7" height="7.5" rx="1.5" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.8-3 4.4-4.5 7-4.5s5.2 1.5 7 4.5" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.62 2.88a1 1 0 0 1 .98-.88h.8a1 1 0 0 1 .98.88l.3 2.16a7.51 7.51 0 0 1 1.67.7l1.74-1.32a1 1 0 0 1 1.31.1l.56.56a1 1 0 0 1 .1 1.31l-1.32 1.74c.29.53.52 1.09.7 1.67l2.16.3a1 1 0 0 1 .88.98v.8a1 1 0 0 1-.88.98l-2.16.3a7.5 7.5 0 0 1-.7 1.67l1.32 1.74a1 1 0 0 1-.1 1.31l-.56.56a1 1 0 0 1-1.31.1l-1.74-1.32a7.51 7.51 0 0 1-1.67.7l-.3 2.16a1 1 0 0 1-.98.88h-.8a1 1 0 0 1-.98-.88l-.3-2.16a7.51 7.51 0 0 1-1.67-.7L7.47 19.6a1 1 0 0 1-1.31-.1l-.56-.56a1 1 0 0 1-.1-1.31l1.32-1.74a7.49 7.49 0 0 1-.7-1.67l-2.16-.3a1 1 0 0 1-.88-.98v-.8a1 1 0 0 1 .88-.98l2.16-.3c.18-.58.41-1.14.7-1.67L5.5 6.45a1 1 0 0 1 .1-1.31l.56-.56a1 1 0 0 1 1.31-.1L9.2 5.8c.53-.29 1.09-.52 1.67-.7l.3-2.16ZM12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z"
      />
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 5.5h6l3 3V18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2z" />
      <path d="M14 5.5V9h3" />
      <path d="M12 11v5" />
      <path d="M9.5 13.5h5" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="5" />
      <path d="M18.5 18.5 21 21" />
      <path d="M9.5 11h3" />
      <path d="M11 9.5v3" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6.5h12A2.5 2.5 0 0 1 20.5 9v6A2.5 2.5 0 0 1 18 17.5H11l-4.5 3v-3H6A2.5 2.5 0 0 1 3.5 15V9A2.5 2.5 0 0 1 6 6.5z" />
      <path d="M8.5 11.5h7" />
      <path d="M8.5 14h4.5" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 4 2.47 5 5.53.8-4 3.9.95 5.5L12 16.6 7.05 19.2 8 13.7l-4-3.9 5.53-.8z" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5 5 6.2v5.35c0 4.02 2.4 7.72 6.13 9.42a2.2 2.2 0 0 0 1.74 0C16.6 19.27 19 15.57 19 11.55V6.2z" />
      <path d="M12 8.75v4.1" />
      <path d="M12 16h.01" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 4.5H7.5A2.5 2.5 0 0 0 5 7v10a2.5 2.5 0 0 0 2.5 2.5H10" />
      <path d="M13 8.5 17.5 12 13 15.5" />
      <path d="M9.5 12h8" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 7V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v1" />
      <rect x="4" y="7" width="16" height="11.5" rx="2" />
      <path d="M4 11.5h16" />
      <path d="M10.5 11.5v1.5h3v-1.5" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 7.5h14l1.5 5v5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-5z" />
      <path d="M4.5 12.5H9l1.75 2h2.5l1.75-2h4.5" />
    </svg>
  );
}
