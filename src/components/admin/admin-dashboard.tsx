import type { ReactNode } from "react";

type StatCard = {
  label: string;
  value: string;
  accent: string;
  icon: ReactNode;
  muted?: boolean;
};

type CategoryRow = {
  label: string;
  value: string;
  accent: string;
  icon: ReactNode;
};

type ActionRow = {
  type: string;
  entity: string;
  date: string;
  status: string;
  action: string;
  icon: ReactNode;
  statusTone: "critical" | "pending";
};

const sidebarItems = [
  { label: "Dashboard", active: true, icon: <DashboardIcon /> },
  { label: "User Management", icon: <UsersIcon /> },
  { label: "Verifications", icon: <ShieldIcon /> },
  { label: "Issue Resolution", icon: <TriangleIcon /> },
];

const topStats: StatCard[] = [
  {
    label: "Total Users",
    value: "12,450",
    accent: "#1d4ed8",
    icon: <GraduationCapIcon />,
  },
  {
    label: "Verified",
    value: "11,200",
    accent: "#0f766e",
    icon: <BadgeCheckIcon />,
  },
  {
    label: "Pending Verify",
    value: "450",
    accent: "#b45309",
    icon: <ClipboardIcon />,
  },
  {
    label: "Active Matches",
    value: "3,890",
    accent: "#2563eb",
    icon: <HandshakeIcon />,
  },
];

const secondaryStats: StatCard[] = [
  {
    label: "Skill Offers",
    value: "8,200",
    accent: "#1d4ed8",
    icon: <OfferIcon />,
  },
  {
    label: "Skill Requests",
    value: "6,400",
    accent: "#0f766e",
    icon: <QuestionIcon />,
  },
  {
    label: "Open Reports",
    value: "12",
    accent: "#b91c1c",
    icon: <FlagIcon />,
    muted: true,
  },
];

const topCategories: CategoryRow[] = [
  { label: "Computer Science", value: "32%", accent: "#1d4ed8", icon: <CodeIcon /> },
  { label: "Languages", value: "25%", accent: "#0f766e", icon: <LanguageIcon /> },
  { label: "Mathematics", value: "18%", accent: "#c2410c", icon: <MathIcon /> },
  { label: "Design & Art", value: "15%", accent: "#6b7280", icon: <PaletteIcon /> },
];

const actions: ActionRow[] = [
  {
    type: "User Report",
    entity: "John D. (Spam offer)",
    date: "2 hours ago",
    status: "Critical",
    action: "Review",
    icon: <FlagIcon />,
    statusTone: "critical",
  },
  {
    type: "Payment Proof",
    entity: "Sarah M.",
    date: "5 hours ago",
    status: "Pending",
    action: "Verify",
    icon: <ClipboardIcon />,
    statusTone: "pending",
  },
  {
    type: "Edu Email",
    entity: "alex.w@university.edu",
    date: "1 day ago",
    status: "Pending",
    action: "Approve",
    icon: <BadgeCheckIcon />,
    statusTone: "pending",
  },
];

export default function AdminDashboard() {
  return (
    <div className="px-6 py-10">
      <section className="grid gap-6 xl:grid-cols-4">
        {topStats.map((stat) => (
          <StatCardBlock key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:mx-auto xl:max-w-[810px] xl:grid-cols-3">
        {secondaryStats.map((stat) => (
          <StatCardBlock key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <h3 className="text-xl font-semibold text-slate-900">User Growth</h3>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#1d4ed8]"
            >
              This Year
              <ChevronDownIcon />
            </button>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-[#f3f4ff] p-6">
            <GrowthChart />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Top Categories</h3>
          <div className="mt-3 border-t border-slate-200 pt-4">
            <div className="space-y-5">
              {topCategories.map((category) => (
                <CategoryItem key={category.label} category={category} />
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <h3 className="text-xl font-semibold text-slate-900">Action Required</h3>
          <button
            type="button"
            className="text-sm font-semibold text-[#1d4ed8]"
          >
            View All
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[1.1fr_1.6fr_1fr_0.8fr_0.8fr] border-b border-slate-200 bg-slate-50 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            <span>Type</span>
            <span>User/Entity</span>
            <span>Date Submitted</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {actions.map((row) => (
            <div
              key={row.type}
              className="grid grid-cols-[1.1fr_1.6fr_1fr_0.8fr_0.8fr] items-center border-b border-slate-200 px-6 py-4 text-sm last:border-b-0"
            >
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-[#d04b00]">{row.icon}</span>
                <span>{row.type}</span>
              </div>
              <span className="font-medium text-slate-800">{row.entity}</span>
              <span className="text-slate-600">{row.date}</span>
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                  row.statusTone === "critical"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {row.status}
              </span>
              <button
                type="button"
                className="text-left font-semibold text-[#1d4ed8]"
              >
                {row.action}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCardBlock({ stat }: { stat: StatCard }) {
  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        stat.muted ? "border-red-200 bg-[#ffe3df]" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm font-medium ${stat.muted ? "text-red-700" : "text-slate-600"}`}>
          {stat.label}
        </p>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"
          style={{ color: stat.accent }}
        >
          {stat.icon}
        </span>
      </div>
      <p className={`mt-5 text-3xl font-semibold ${stat.muted ? "text-red-800" : "text-slate-900"}`}>
        {stat.value}
      </p>
    </article>
  );
}

function CategoryItem({ category }: { category: CategoryRow }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
          style={{ color: category.accent }}
        >
          {category.icon}
        </span>
        <div className="flex-1 text-sm font-medium text-slate-800">
          {category.label}
        </div>
        <span className="text-sm text-slate-500">{category.value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full"
          style={{
            width: category.value,
            backgroundColor: category.accent,
          }}
        />
      </div>
    </div>
  );
}

function GrowthChart() {
  return (
    <div className="flex min-h-[290px] items-center justify-center rounded-xl border border-slate-200 bg-[#f3f4ff]">
      <div className="text-center">
        <svg
          className="mx-auto h-10 w-10 text-slate-500"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M8 34l8-8 6 6 10-12 8 4" />
          <path d="M35 20h5v5" />
        </svg>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Growth Chart Visualization
        </p>
      </div>
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

function GraduationCapIcon() {
  return <CapIcon />;
}

function BadgeCheckIcon() {
  return <BadgeCheckOutlineIcon />;
}

function ClipboardIcon() {
  return <ClipboardOutlineIcon />;
}

function HandshakeIcon() {
  return <HandshakeOutlineIcon />;
}

function OfferIcon() {
  return <HandHeartIcon />;
}

function QuestionIcon() {
  return <QuestionOutlineIcon />;
}

function FlagIcon() {
  return <FlagOutlineIcon />;
}

function CodeIcon() {
  return <CodeBracketIcon />;
}

function LanguageIcon() {
  return <LanguageOutlineIcon />;
}

function MathIcon() {
  return <CalculatorIcon />;
}

function PaletteIcon() {
  return <PaletteOutlineIcon />;
}

function ChevronDownIcon() {
  return <ChevronDownOutlineIcon />;
}

function SquareGridIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
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

function CapIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l9-4 9 4-9 4-9-4z" />
      <path d="M7 10v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4" />
      <path d="M21 9v5" />
    </svg>
  );
}

function BadgeCheckOutlineIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.4 2.9 3.6.4 1.4 3.4-1.4 3.4.1 3.7-3.4.8L12 21l-2.7-3.4-3.4-.8.1-3.7L4.6 9.7 6 6.3l3.6-.4L12 3z" />
      <path d="m9.2 12.1 1.9 1.9 3.7-3.7" />
    </svg>
  );
}

function ClipboardOutlineIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="5" width="12" height="16" rx="2" />
      <path d="M9 5a3 3 0 0 1 6 0" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  );
}

function HandshakeOutlineIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13 3 9l4-4 4 3" />
      <path d="M16 13l5-4-4-4-4 3" />
      <path d="M7 14l3 3a2 2 0 0 0 3 0l1-1" />
      <path d="M12 13l3-3" />
      <path d="M9 10l3 3" />
    </svg>
  );
}

function HandHeartIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 12h6l2 2" />
      <path d="M6 12V7a2 2 0 0 1 2-2h2" />
      <path d="M12 14l3 3 5-5" />
      <path d="M3 13h3l2 2" />
    </svg>
  );
}

function QuestionOutlineIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.9 2.1c-.9.6-1.4 1-1.4 2.4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function FlagOutlineIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4v16" />
      <path d="M5 5h9l-1.5 3L14 11H5" />
    </svg>
  );
}

function CodeBracketIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 8 4 12l4 4" />
      <path d="M16 8l4 4-4 4" />
    </svg>
  );
}

function LanguageOutlineIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h7M9 3v2a14 14 0 0 0 5 10" />
      <path d="M4 19c4-1 8-5 10-10" />
      <path d="M12 19h8" />
      <path d="m16 3 4 4-4 4" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h2m3 0h2m3 0h0M8 15h2m3 0h2m3 0h0" />
    </svg>
  );
}

function PaletteOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 2-2 1.5 1.5 0 0 1 1.5-1.5H18a3 3 0 0 0 0-6 1 1 0 0 1-1-1v-.5A6 6 0 0 0 12 3z" />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
      <circle cx="16" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function ChevronDownOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
