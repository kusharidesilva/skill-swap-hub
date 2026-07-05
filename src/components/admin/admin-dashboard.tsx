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
  id: string;
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
  { label: "Verifications", icon: <ShieldIcon /> },
  { label: "User Management", icon: <UsersIcon /> },
  { label: "Issue Resolution", icon: <TriangleIcon /> },
];

// Dashboard figures are presentation data ready to be replaced by admin queries.
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
    id: "report-1",
    type: "User Report",
    entity: "John D. (Spam offer)",
    date: "2 hours ago",
    status: "Critical",
    action: "Review",
    icon: <FlagIcon />,
    statusTone: "critical",
  },
  {
    id: "report-2",
    type: "User Report",
    entity: "Nethmi P. (Abusive messages)",
    date: "5 hours ago",
    status: "Critical",
    action: "Review",
    icon: <FlagIcon />,
    statusTone: "critical",
  },
  {
    id: "report-3",
    type: "User Report",
    entity: "Ishan K. (Fake payment proof)",
    date: "1 day ago",
    status: "Pending",
    action: "Review",
    icon: <FlagIcon />,
    statusTone: "pending",
  },
];

export default function AdminDashboard() {
  return (
    <div className="px-6 py-10">
      {/* Main platform totals */}
      <section className="grid gap-6 xl:grid-cols-4">
        {topStats.map((stat) => (
          <StatCardBlock key={stat.label} stat={stat} />
        ))}
      </section>

      {/* Request and moderation totals */}
      <section className="mt-6 grid gap-6 xl:mx-auto xl:max-w-[810px] xl:grid-cols-3">
        {secondaryStats.map((stat) => (
          <StatCardBlock key={stat.label} stat={stat} />
        ))}
      </section>

      {/* Growth chart and top skill categories */}
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

      {/* Recent admin actions */}
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
              key={row.id}
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
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function UsersTwoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 19.5v-.8A3.7 3.7 0 0 0 11.8 15H7.2a3.7 3.7 0 0 0-3.7 3.7v.8" />
      <circle cx="9.5" cy="8" r="3.25" />
      <path d="M16.5 15.5a3.5 3.5 0 0 1 3 3.2v.8" />
      <path d="M15.6 5.2a3.1 3.1 0 0 1 0 5.6" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5.5 5.9v5.7c0 4.4 2.8 7.2 6.5 8.9 3.7-1.7 6.5-4.5 6.5-8.9V5.9L12 3Z" />
      <path d="m9.4 11.9 1.8 1.8 3.6-3.8" />
    </svg>
  );
}

function TriangleOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 4.8 3.8 16a2 2 0 0 0 1.7 3h13a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.2v4.3" />
      <circle cx="12" cy="16.9" r=".75" fill="currentColor" stroke="none" />
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
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 8.5 9-4 9 4-9 4-9-4Z" />
      <path d="M7 10.5v3.3c0 1.8 2.2 3.2 5 3.2s5-1.4 5-3.2v-3.3" />
      <path d="M21 9v4.5" />
    </svg>
  );
}

function BadgeCheckOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.8 6.8 5.1v4.7c0 4 2.3 6.8 5.2 8.4 2.9-1.6 5.2-4.4 5.2-8.4V5.1L12 2.8Z" />
      <path d="m9.7 10.9 1.6 1.7 3.2-3.4" />
      <path d="M8.8 18.2 8.1 21l3.9-1.6 3.9 1.6-.7-2.8" />
    </svg>
  );
}

function ClipboardOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4.75" width="12" height="15.5" rx="2.2" />
      <path d="M9 4.75h6a1.5 1.5 0 0 1 1.5 1.5v.25H7.5v-.25A1.5 1.5 0 0 1 9 4.75Z" />
      <path d="M9 10.5h6" />
      <path d="M9 14h6" />
      <path d="M9 17.5h3.5" />
    </svg>
  );
}

function HandshakeOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="8.5" r="2.5" />
      <circle cx="15.5" cy="15.5" r="2.5" />
      <path d="m10.3 10.3 3.4 3.4" />
      <path d="m13.7 10.3-3.4 3.4" />
    </svg>
  );
}

function HandHeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 7.5h9.8a2 2 0 0 1 1.4.6l1.8 1.8a2 2 0 0 1 0 2.8l-5.7 5.7a2 2 0 0 1-2.8 0l-4.5-4.5a2 2 0 0 1 0-2.8l2.8-2.8a2 2 0 0 1 1.2-.6Z" />
      <path d="M14.5 7.5v4h4" />
      <circle cx="9.2" cy="11.2" r="1.1" />
    </svg>
  );
}

function QuestionOutlineIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.9 2.1c-.9.6-1.4 1-1.4 2.4" />
      <circle cx="12" cy="17" r=".75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FlagOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 4v16" />
      <path d="M5.5 5h9l-1.8 3 1.8 3h-9" />
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
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4" />
      <path d="M12 3.8a12.5 12.5 0 0 1 0 16.4" />
      <path d="M12 3.8a12.5 12.5 0 0 0 0 16.4" />
      <path d="M8.5 7.5h2.2" />
      <path d="M13.6 15.8h3.1" />
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
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17h1.7a1.8 1.8 0 0 0 1.8-1.8 1.4 1.4 0 0 1 1.4-1.4h.9a3.7 3.7 0 0 0 0-7.4h-.6a1.2 1.2 0 0 1-1.2-1.2V8A4.5 4.5 0 0 0 12 3.5Z" />
      <circle cx="7.8" cy="10" r=".9" fill="currentColor" stroke="none" />
      <circle cx="11.1" cy="7.7" r=".9" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="9.4" r=".9" fill="currentColor" stroke="none" />
      <circle cx="9.4" cy="14.2" r=".9" fill="currentColor" stroke="none" />
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
