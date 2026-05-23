import Link from "next/link";
import type { ReactNode } from "react";

const recentRequests = [
  {
    id: "active-react-native",
    category: "Programming",
    title: "React Native Setup",
    description: "Looking for someone to help set up a React Native environment on",
    status: "Active",
    style: "emerald",
  },
  {
    id: "matched-thesis",
    category: "",
    title: "Thesis Proofreading",
    description: "",
    status: "Matched",
    style: "blue",
  },
  {
    id: "completed-figma",
    category: "Design",
    title: "Figma Prototype Review",
    description: "",
    status: "Completed",
    style: "slate",
  },
];

const skillCategories = [
  "Select Category",
  "Programming",
  "Design",
  "Writing",
  "Business",
  "Data Science",
];

const levelOptions = ["Beginner", "Intermediate", "Advanced"];

export default function RequestServiceContent() {
  return (
    <div className="flex w-full max-w-[1080px] flex-col gap-6 pb-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Request a Service</h1>
        <p className="mt-2 text-base text-slate-600">
          Describe clearly what help you need so the system can find better matches.
        </p>
      </header>

      <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <RequestForm />
        <RecentRequestsPanel />
      </section>
    </div>
  );
}

function RequestForm() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] md:p-8">
      <form className="grid gap-6">
        {/* Skill Needed and Category */}
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Skill Needed">
            <input
              type="text"
              placeholder="e.g., Python Data Analysis"
              className={fieldClassName}
            />
          </Field>

          <Field label="Skill Category">
            <select
              defaultValue={skillCategories[0]}
              title="Skill Category"
              className={fieldClassName}
            >
              {skillCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={5}
            placeholder="Detail the specific tasks, project scope, or areas you need help with..."
            className="w-full resize-none rounded-lg border border-slate-300 bg-[#f7f8ff] px-4 py-3 text-base leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
          />
        </Field>

        {/* Required Level and Service Type */}
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Required Level">
            <select
              defaultValue={levelOptions[0]}
              title="Required Level"
              className={fieldClassName}
            >
              {levelOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Service Type">
            <div className="flex max-w-[260px] flex-wrap items-center gap-2 pt-0.5">
              <TypePill label="Free Help" />
              <TypePill label="Skill Exchange" active />
              <TypePill label="Paid" />
            </div>
          </Field>
        </div>

        {/* Preferred Date/ Time, University, and Budget */}
        <div className="grid items-end gap-3 md:grid-cols-3">
          <Field label="Preferred Date/ Time">
            <input
              type="text"
              placeholder="Weekends, Evenings"
              className={fieldClassName}
            />
          </Field>

          <Field label="Preferred University (Optional)">
            <input
              type="text"
              placeholder="e.g., State Uni"
              className={fieldClassName}
            />
          </Field>

          <Field label="Budget (Optional)">
            <input
              type="text"
              placeholder="e.g., $20/hr"
              className={fieldClassName}
            />
          </Field>
        </div>

        {/* Submit Button */}
        <div className="border-t border-slate-200 pt-6">
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2f66e7] px-8 text-base font-semibold text-white shadow-sm transition hover:bg-[#2557cf] sm:w-auto sm:min-w-56"
            >
              Submit Request
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}


function RecentRequestsPanel() {
  return (
    <aside className="min-w-0">
      <h2 className="text-2xl font-semibold text-slate-900">My Recent Requests</h2>

      <div className="mt-4 grid gap-4">
        {recentRequests.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] ${
              item.style === "emerald"
                ? "border-r-4 border-r-emerald-500"
                : item.style === "blue"
                  ? "border-r-4 border-r-[#2f66e7]"
                  : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  item.style === "emerald"
                    ? "bg-emerald-100 text-emerald-700"
                    : item.style === "blue"
                      ? "bg-slate-200 text-transparent"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {item.category || "Category"}
              </span>
              <span
                className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                  item.style === "emerald"
                    ? "bg-emerald-100 text-emerald-700"
                    : item.style === "blue"
                      ? "bg-blue-50 text-[#2f66e7]"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.status}
              </span>
            </div>

            <h3 className="mt-3 max-w-40 text-lg font-semibold leading-7 text-slate-900">
              {item.title}
            </h3>

            {item.description ? (
              <p className="mt-2 text-sm leading-5 text-slate-600">{item.description}</p>
            ) : null}

            {item.id === "active-react-native" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 min-w-40 items-center justify-center rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  View Matches
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100"
                  aria-label="Edit request"
                >
                  <EditIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-red-500 transition hover:bg-red-50"
                  aria-label="Delete request"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {item.id === "matched-thesis" ? (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#2f66e7] px-4 text-sm font-semibold text-white transition hover:bg-[#2557cf]"
                >
                  <ChatIcon className="mr-2 h-4 w-4" />
                  Open Chat
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href="/request-service/all"
          className="text-sm font-medium text-[#2f66e7] transition hover:text-[#2557cf]"
        >
          View All
        </Link>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const optionalIndex = label.indexOf(" (Optional)");
  const labelText = optionalIndex > -1 ? label.slice(0, optionalIndex) : label;
  const isOptional = optionalIndex > -1;

  return (
    <label className="grid min-w-0 gap-2">
      <span className="min-h-12 text-base font-semibold leading-6 text-slate-800">
        {labelText}
        {isOptional ? (
          <span className="ml-1 text-xs font-medium text-slate-500">(Optional)</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function TypePill({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-semibold leading-none transition ${
        active
          ? "border-[#2f66e7] bg-[#2f66e7] text-white"
          : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

const fieldClassName =
  "h-12 w-full rounded-lg border border-slate-300 bg-[#f7f8ff] px-4 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100";

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12z" />
      <path d="M5 19c1.3-2.5 3.8-4 7-4s5.7 1.5 7 4" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M14 7l3 3" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 5h16v11H7l-3 3z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 12h14" />
      <path d="M13 5l7 7-7 7" />
    </svg>
  );
}
