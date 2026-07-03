type VerificationRow = {
  name: string;
  email: string;
  domain: string;
  status: "Pending" | "Expired" | "Verified" | "Failed";
  time: string;
  expiry: string;
};

type StatItem = {
  label: string;
  value: string;
  tone: "teal" | "blue" | "orange" | "rose";
  note?: string;
};

const stats: StatItem[] = [
  { label: "Verified Users", value: "8,402", tone: "teal", note: "+12% this week" },
  { label: "Pending Verification", value: "145", tone: "blue" },
  { label: "Verified Today", value: "38", tone: "orange" },
  { label: "Rejected Accounts", value: "12", tone: "rose" },
] as const;

const rows: VerificationRow[] = [
  {
    name: "Jane Doe",
    email: "j.doe@stanford.edu",
    domain: "stanford.edu",
    status: "Pending",
    time: "Oct 24, 10:45 AM",
    expiry: "Expires in 2h",
  },
  {
    name: "Michael Smith",
    email: "msmith22@mit.edu",
    domain: "mit.edu",
    status: "Expired",
    time: "Oct 23, 09:15 AM",
    expiry: "Expired",
  },
  {
    name: "Sarah Jenkins",
    email: "s.jenkins@berkeley.edu",
    domain: "berkeley.edu",
    status: "Verified",
    time: "Oct 24, 08:30 AM",
    expiry: "-",
  },
  {
    name: "David Lee",
    email: "david.lee@nyu.edu",
    domain: "nyu.edu",
    status: "Failed",
    time: "Oct 24, 11:20 AM",
    expiry: "Invalid Domain",
  },
];

export default function AdminVerifications() {
  return (
    <div className="px-6 py-10">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-slate-900">
            University Verifications
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage and review student `.edu` email verifications to maintain platform integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SearchBox placeholder="Search here." />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm"
            aria-label="Filter"
          >
            <FilterIcon />
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr_0.75fr] border-b border-slate-200 bg-[#f6f7ff] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          <span>Student Name</span>
          <span>University Email</span>
          <span>Domain</span>
          <span>Status</span>
          <span>Code Sent Time</span>
          <span>Expiry Status</span>
        </div>

        {rows.map((row, index) => (
          <div
            key={`${row.email}-${row.time}`}
            className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr_0.75fr] items-center border-b border-slate-200 px-6 py-5 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <Avatar initials={row.name} tone={index} />
              <span className="font-medium text-slate-800">{row.name}</span>
            </div>
            <span className="text-slate-600">{row.email}</span>
            <span className="inline-flex w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
              {row.domain}
            </span>
            <StatusPill status={row.status} />
            <span className="whitespace-pre-line text-sm leading-5 text-slate-600">{row.time}</span>
            <span
              className={`text-sm font-medium ${
                row.status === "Expired"
                  ? "text-orange-700"
                  : row.status === "Failed"
                    ? "text-rose-700"
                    : "text-slate-600"
              }`}
            >
              {row.expiry}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between gap-4 px-6 py-4 text-sm text-slate-500">
          <p>Showing 1 to 10 of 145 pending</p>
          <div className="flex items-center gap-2">
            <PagerButton>Previous</PagerButton>
            <PagerButton active>1</PagerButton>
            <PagerButton>2</PagerButton>
            <PagerButton>Next</PagerButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  stat,
}: {
  stat: StatItem;
}) {
  const bg =
    stat.tone === "teal"
      ? "from-teal-100 to-transparent"
      : stat.tone === "blue"
        ? "from-blue-100 to-transparent"
        : stat.tone === "orange"
          ? "from-orange-100 to-transparent"
          : "from-rose-100 to-transparent";

  const iconColor =
    stat.tone === "teal"
      ? "text-teal-600"
      : stat.tone === "blue"
        ? "text-blue-600"
        : stat.tone === "orange"
          ? "text-orange-600"
          : "text-rose-600";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`absolute right-0 top-0 h-20 w-20 rounded-bl-[60px] bg-gradient-to-br ${bg}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{stat.label}</p>
          <p className="mt-4 text-[30px] font-semibold leading-none tracking-tight text-slate-900">
            {stat.value}
          </p>
          {stat.note ? (
            <p className="mt-3 text-xs font-semibold text-teal-700">{stat.note}</p>
          ) : null}
        </div>
        <div className={`rounded-xl bg-slate-100 p-2 ${iconColor}`}>
          <VerificationIcon tone={stat.tone} />
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: VerificationRow["status"] }) {
  const styles =
    status === "Pending"
      ? "bg-blue-100 text-blue-700"
      : status === "Expired"
        ? "bg-orange-100 text-orange-700"
        : status === "Verified"
          ? "bg-teal-100 text-teal-700"
          : "bg-rose-100 text-rose-700";

  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{status}</span>;
}

function PagerButton({
  children,
  active,
}: {
  children: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`min-w-9 rounded-md border px-3 py-2 text-sm font-medium ${
        active
          ? "border-[#2f66e7] bg-[#2f66e7] text-white"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function SearchBox({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-10 w-[190px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 shadow-sm">
      <SearchIcon />
      <span className="text-sm text-slate-400">{placeholder}</span>
    </div>
  );
}

function Avatar({ initials, tone }: { initials: string; tone: number }) {
  const letters = initials
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tones = [
    "bg-slate-200 text-slate-600",
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
  ];

  return <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${tones[tone % tones.length]}`}>{letters}</div>;
}

function VerificationIcon({ tone }: { tone: StatItem["tone"] }) {
  if (tone === "teal") {
    return <CheckCircleIcon />;
  }
  if (tone === "blue") {
    return <ClockIcon />;
  }
  if (tone === "orange") {
    return <EyeOffIcon />;
  }
  return <XCircleIcon />;
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

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
      <path d="M9.9 5.1A10.6 10.6 0 0 1 12 5c5 0 9 4 10 7-0.3 1-1 2.1-2 3.2" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}
