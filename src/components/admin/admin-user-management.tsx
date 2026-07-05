import type { ReactNode } from "react";

type UserRow = {
  name: string;
  email: string;
  university: string;
  programme: string;
  verification: "Verified" | "Pending ID";
  account: "Active" | "Suspended";
  rating: string;
};

// This table currently uses sample users and is ready for a Firestore admin query.
const users: UserRow[] = [
  {
    name: "Sarah Jenkins",
    email: "s.jenkins@mit.edu",
    university: "Mass. Institute of Technology",
    programme: "BSc Computer Science",
    verification: "Verified",
    account: "Active",
    rating: "4.9",
  },
  {
    name: "Marcus Rodriguez",
    email: "m.rodriguez@stanford.edu",
    university: "Stanford University",
    programme: "BA Graphic Design",
    verification: "Pending ID",
    account: "Active",
    rating: "New",
  },
  {
    name: "David Chen",
    email: "d.chen@oxford.ac.uk",
    university: "Oxford University",
    programme: "MA Linguistics",
    verification: "Verified",
    account: "Suspended",
    rating: "3.2",
  },
];

export default function AdminUserManagement() {
  return (
    <div className="px-6 py-10">
      {/* Page heading and export action */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-900">User Management</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review, verify, and manage student accounts across all participating universities.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <DownloadIcon />
          Export CSV
        </button>
      </section>

      {/* User filters */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
          <Field label="Search Users">
            <InputLike placeholder="Name or email..." icon={<SearchIcon />} />
          </Field>
          <Field label="Verification">
            <SelectLike value="All Statuses" />
          </Field>
          <Field label="University">
            <SelectLike value="All Universities" />
          </Field>
          <Field label="Skill Category">
            <SelectLike value="All Skills" />
          </Field>
          <button
            type="button"
            className="mt-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            aria-label="Clear filters"
          >
            <FilterOffIcon />
          </button>
        </div>
      </section>

      {/* User management table */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.6fr_1.4fr_0.85fr_0.8fr_0.75fr_0.4fr] border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          <span>Student Name &amp; Email</span>
          <span>University &amp; Programme</span>
          <span>Verification</span>
          <span>Account Status</span>
          <span>Rating</span>
          <span>Actions</span>
        </div>

        {users.map((user) => (
          <div
            key={user.email}
            className="grid grid-cols-[1.6fr_1.4fr_0.85fr_0.8fr_0.75fr_0.4fr] items-center border-b border-slate-200 px-6 py-5 last:border-b-0"
          >
            <div className="flex items-center gap-4">
              <Avatar name={user.name} />
              <div>
                <p className="font-semibold text-slate-800">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>

            <div>
              <p className="font-medium text-slate-700">{user.university}</p>
              <p className="text-sm text-slate-500">{user.programme}</p>
            </div>

            <StatusChip tone={user.verification === "Verified" ? "teal" : "amber"}>{user.verification}</StatusChip>
            <StatusChip tone={user.account === "Active" ? "indigo" : "rose"}>{user.account}</StatusChip>

            <div>
              <p className="flex items-center gap-1 font-medium text-slate-700">
                <StarIcon />
                {user.rating}
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label={`Edit ${user.name}`}
            >
              <EditIcon />
            </button>
          </div>
        ))}

        <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          <p>Showing 1 to 3 of 1,248 users</p>
          <div className="flex items-center gap-2">
            <PagerButton disabled>Previous</PagerButton>
            <PagerButton active>1</PagerButton>
            <PagerButton>2</PagerButton>
            <PagerButton>3</PagerButton>
            <span className="px-2 text-slate-400">...</span>
            <PagerButton>Next</PagerButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function InputLike({
  placeholder,
  icon,
}: {
  placeholder: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-slate-500 shadow-sm">
      {icon}
      <span className="text-sm text-slate-400">{placeholder}</span>
    </div>
  );
}

function SelectLike({ value }: { value: string }) {
  return (
    <div className="flex h-14 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm">
      <span className="text-sm">{value}</span>
      <ChevronDownIcon />
    </div>
  );
}

function StatusChip({
  tone,
  children,
}: {
  tone: "teal" | "amber" | "blue" | "indigo" | "rose";
  children: ReactNode;
}) {
  const styles =
    tone === "teal"
      ? "bg-teal-100 text-teal-700"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700"
      : tone === "blue"
        ? "bg-blue-100 text-blue-700"
      : tone === "indigo"
        ? "bg-indigo-100 text-indigo-700"
        : "bg-rose-100 text-rose-700";

  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${styles}`}>{children}</span>;
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0d6c6] text-sm font-bold text-[#7a3e1b]">{initials}</div>;
}

function PagerButton({
  children,
  active,
  disabled,
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-[#2f66e7] bg-[#2f66e7] text-white"
          : disabled
            ? "border-slate-200 text-slate-300"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function FilterOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
      <path d="m5 5 14 14" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L8 20l-5 1 1-5z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-500" fill="currentColor">
      <path d="m12 2.8 2.8 5.7 6.3.9-4.5 4.3 1.1 6.2-5.7-3-5.7 3 1.1-6.2-4.5-4.3 6.3-.9L12 2.8z" />
    </svg>
  );
}
