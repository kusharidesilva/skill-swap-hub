type IssueRow = {
  id: string;
  reportedBy: string;
  reportedUser: string;
  service: string;
  issueType: string;
  date: string;
  status: "Pending" | "Resolved" | "Rejected";
};

const stats = [
  { label: "Pending Reports", value: "24", tone: "orange" },
  { label: "Pending Follow-ups", value: "12", tone: "blue" },
  { label: "Resolved Today", value: "8", tone: "teal" },
] as const;

const issues: IssueRow[] = [
  {
    id: "#ISS-8921",
    reportedBy: "Alice W.",
    reportedUser: "JohnD",
    service: "Calculus Tutoring",
    issueType: "Inappropriate behaviour",
    date: "Oct 24, 2023",
    status: "Pending",
  },
  {
    id: "#ISS-8920",
    reportedBy: "Marcus T.",
    reportedUser: "SarahK",
    service: "Guitar Lessons",
    issueType: "Scam risk",
    date: "Oct 23, 2023",
    status: "Pending",
  },
  {
    id: "#ISS-8915",
    reportedBy: "Elena R.",
    reportedUser: "DaveB",
    service: "Web Dev Help",
    issueType: "Poor service quality",
    date: "Oct 21, 2023",
    status: "Resolved",
  },
  {
    id: "#ISS-8902",
    reportedBy: "Tom H.",
    reportedUser: "LisaM",
    service: "N/A",
    issueType: "Fake user",
    date: "Oct 19, 2023",
    status: "Rejected",
  },
];

export default function AdminIssueResolution() {
  return (
    <div className="px-6 py-10">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-slate-900">
            Manage Flagged Issues
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review and resolve user-reported incidents across the platform.
          </p>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
            <InfoIcon />
            <p>
              Admin does not monitor normal student chats. Admin reviews evidence only when a student reports an issue.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SearchBox placeholder="Search by ID or User" />
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm"
          >
            <FilterIcon />
            Filter
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[0.8fr_0.95fr_0.95fr_1fr_1fr_0.8fr_0.8fr_0.55fr] border-b border-slate-200 bg-[#f6f7ff] px-4 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          <span>Report ID</span>
          <span>Reported By</span>
          <span>Reported User</span>
          <span>Related Skill/Service</span>
          <span>Issue Type</span>
          <span>Date</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {issues.map((issue) => (
          <div
            key={issue.id}
            className="grid grid-cols-[0.8fr_0.95fr_0.95fr_1fr_1fr_0.8fr_0.8fr_0.55fr] items-center border-b border-slate-200 px-4 py-4 text-sm last:border-b-0"
          >
            <span className="text-slate-600">{issue.id}</span>
            <ReportedUser name={issue.reportedBy} />
            <span className="font-medium text-slate-700">{issue.reportedUser}</span>
            <span className="text-slate-600">{issue.service}</span>
            <span className="inline-flex w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
              {issue.issueType}
            </span>
            <span className="whitespace-pre-line text-slate-600">{issue.date}</span>
            <StatusPill status={issue.status} />
            <button
              type="button"
              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
              aria-label={`Edit ${issue.id}`}
            >
              <EditIcon />
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between gap-4 px-4 py-4 text-sm text-slate-500">
          <p>Showing 1 to 4 of 24 entries</p>
          <div className="flex items-center gap-2">
            <PagerButton>Prev</PagerButton>
            <PagerButton active>1</PagerButton>
            <PagerButton>2</PagerButton>
            <PagerButton>3</PagerButton>
            <PagerButton>Next</PagerButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ stat }: { stat: (typeof stats)[number] }) {
  const accent =
    stat.tone === "orange"
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : stat.tone === "blue"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-teal-200 bg-teal-50 text-teal-700";

  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
    </article>
  );
}

function ReportedUser({ name }: { name: string }) {
  const letter = name[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
        {letter}
      </span>
      <span className="font-medium text-slate-700">{name}</span>
    </div>
  );
}

function StatusPill({ status }: { status: IssueRow["status"] }) {
  const styles =
    status === "Pending"
      ? "bg-orange-100 text-orange-700"
      : status === "Resolved"
          ? "bg-teal-100 text-teal-700"
          : "bg-red-100 text-red-700";

  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${styles}`}>{status}</span>;
}

function SearchBox({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-10 w-[190px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 shadow-sm">
      <SearchIcon />
      <span className="text-sm text-slate-400">{placeholder}</span>
    </div>
  );
}

function PagerButton({ children, active }: { children: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`min-w-9 rounded-md border px-3 py-2 text-sm font-medium ${
        active ? "border-[#2f66e7] bg-[#2f66e7] text-white" : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v5" />
      <path d="M12 7h.01" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h8" />
      <path d="m15.5 4.5 4 4L8 20l-5 1 1-5 11.5-11.5Z" />
    </svg>
  );
}
