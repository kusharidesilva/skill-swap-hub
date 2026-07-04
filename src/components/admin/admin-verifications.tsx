type VerificationStatus = "Pending" | "Expired" | "Verified" | "Failed";

type VerificationRow = {
  initials: string;
  name: string;
  email: string;
  domain: string;
  status: VerificationStatus;
  sentTime: string;
  expiry: string;
};

type StatItem = {
  label: string;
  value: string;
  tone: "teal" | "blue" | "peach" | "rose";
  note?: string;
};

const stats: StatItem[] = [
  { label: "Verified Users", value: "8,402", tone: "teal" },
  { label: "Pending Verification", value: "145", tone: "blue" },
  { label: "Verified Today", value: "38", tone: "peach" },
  { label: "Rejected Accounts", value: "12", tone: "rose" },
];

const rows: VerificationRow[] = [
  {
    initials: "JD",
    name: "Jane Doe",
    email: "j.doe@stanford.edu",
    domain: "stanford.edu",
    status: "Pending",
    sentTime: "Oct 24,\n10:45\nAM",
    expiry: "Expires\nin 2h",
  },
  {
    initials: "MS",
    name: "Michael Smith",
    email: "msmith22@mit.edu",
    domain: "mit.edu",
    status: "Expired",
    sentTime: "Oct 23,\n09:15\nAM",
    expiry: "Expired",
  },
  {
    initials: "SJ",
    name: "Sarah Jenkins",
    email: "s.jenkins@berkeley.edu",
    domain: "berkeley.edu",
    status: "Verified",
    sentTime: "Oct 24,\n08:30\nAM",
    expiry: "-",
  },
  {
    initials: "DL",
    name: "David Lee",
    email: "david.lee@nyu.edu",
    domain: "nyu.edu",
    status: "Failed",
    sentTime: "Oct 24,\n11:20 AM",
    expiry: "Invalid\nDomain",
  },
];

export default function AdminVerifications() {
  return (
    <div className="px-6 py-10">
      <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-slate-900">
            University Verifications
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Manage and review student .edu email verifications to maintain platform integrity.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <SearchBox />
          <button
            type="button"
            aria-label="Filter"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 shadow-[0_4px_10px_rgba(15,23,42,0.05)]"
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

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
        <div className="grid grid-cols-[1.2fr_1.55fr_0.95fr_0.9fr_0.8fr_0.9fr_0.55fr] gap-4 border-b border-slate-300 bg-[#f0f1ff] px-8 py-5 text-[13px] font-medium text-slate-700">
          <span>Student Name</span>
          <span>University Email</span>
          <span>Domain</span>
          <span>Status</span>
          <span className="whitespace-pre-line">Code{"\n"}Sent{"\n"}Time</span>
          <span className="whitespace-pre-line">Expiry{"\n"}Status</span>
          <span>Actions</span>
        </div>

        {rows.map((row, index) => (
          <div
            key={row.email}
            className="grid grid-cols-[1.2fr_1.55fr_0.95fr_0.9fr_0.8fr_0.9fr_0.55fr] items-center gap-4 border-b border-slate-300 px-8 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <Avatar initials={row.initials} index={index} />
              <span className="text-sm font-medium text-slate-800">{row.name}</span>
            </div>
            <span className="text-sm text-slate-700">{row.email}</span>
            <span className="inline-flex w-fit rounded-full bg-[#e5e7f4] px-3 py-1 text-xs font-medium tracking-[0.01em] text-slate-600">
              {row.domain}
            </span>
            <StatusPill status={row.status} />
            <span className="whitespace-pre-line text-sm leading-6 text-slate-700">{row.sentTime}</span>
            <span
              className={`whitespace-pre-line text-sm leading-6 ${
                row.status === "Expired"
                  ? "text-[#b45309]"
                  : row.status === "Failed"
                    ? "text-[#dc2626]"
                    : "text-slate-700"
              }`}
            >
              {row.expiry}
            </span>
            <button type="button" aria-label={`View ${row.name}`} className="text-slate-600 transition hover:text-slate-900">
              <EyeIcon />
            </button>
          </div>
        ))}

        <div className="flex flex-col gap-4 px-4 py-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-4 xl:px-4">
          <p className="px-2">Showing 1 to 10 of 145 pending</p>
          <div className="flex items-center gap-2">
            <PagerButton label="Previous" />
            <PagerButton label="1" active />
            <PagerButton label="2" />
            <PagerButton label="Next" />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ stat }: { stat: StatItem }) {
  const toneClasses =
    stat.tone === "teal"
      ? {
          accent: "bg-[#66ead9] text-[#006d63]",
          wash: "bg-[#d9faf3]",
        }
      : stat.tone === "blue"
        ? {
            accent: "bg-[#dfe5ff] text-[#21367d]",
            wash: "bg-[#e5ecff]",
          }
        : stat.tone === "peach"
          ? {
              accent: "bg-[#ffdccc] text-[#9a4a1f]",
              wash: "bg-[#faeadf]",
            }
          : {
              accent: "bg-[#ffd8d8] text-[#b91c1c]",
              wash: "bg-[#fbe9e9]",
            };

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${toneClasses.wash}`} />
      <div className="relative flex min-h-[120px] flex-col">
        <div className="flex items-start justify-between gap-4">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses.accent}`}>
            <StatIcon tone={stat.tone} />
          </span>
          {stat.note ? <span className="pt-1 text-xs font-semibold text-[#0f766e]">{stat.note}</span> : null}
        </div>
        <div className="mt-auto">
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
          <p className="mt-2 text-sm text-slate-700">{stat.label}</p>
        </div>
      </div>
    </article>
  );
}

function SearchBox() {
  return (
    <div className="flex h-11 w-[258px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-slate-500 shadow-[0_4px_10px_rgba(15,23,42,0.05)]">
      <SearchIcon />
      <span className="text-sm text-slate-500">Search here.</span>
    </div>
  );
}

function StatusPill({ status }: { status: VerificationStatus }) {
  const toneClass =
    status === "Pending"
      ? "bg-[#dfe6ff] text-[#1d4ed8]"
      : status === "Expired"
        ? "bg-[#ffd9c8] text-[#9a3412]"
        : status === "Verified"
          ? "bg-[#68ead8] text-[#0f766e]"
          : "bg-[#ffdada] text-[#c81e1e]";

  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function Avatar({ initials, index }: { initials: string; index: number }) {
  const tones = [
    "bg-[#dce3ff] text-[#34468c]",
    "bg-[#dce3ff] text-[#34468c]",
    "bg-[#dce3ff] text-[#34468c]",
    "bg-[#dce3ff] text-[#34468c]",
  ];

  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${tones[index % tones.length]}`}>
      {initials}
    </div>
  );
}

function PagerButton({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-8 items-center justify-center rounded-md border px-4 text-sm ${
        active
          ? "border-[#1454cc] bg-[#1454cc] font-semibold text-white"
          : "border-slate-300 bg-white text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function StatIcon({ tone }: { tone: StatItem["tone"] }) {
  if (tone === "teal") {
    return <CheckCircleIcon />;
  }
  if (tone === "blue") {
    return <ClockIcon />;
  }
  if (tone === "peach") {
    return <ShieldCheckIcon />;
  }
  return <XCircleIcon />;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="m8.8 12.2 2.1 2.1 4.4-4.7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 6 5.5v5.7c0 3.9 2.6 7.5 6 8.8 3.4-1.3 6-4.9 6-8.8V5.5L12 3Z" />
      <path d="m9.4 11.7 1.8 1.8 3.5-3.7" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="m9.5 9.5 5 5" />
      <path d="m14.5 9.5-5 5" />
    </svg>
  );
}
