import type { Role } from "@/lib/role-routes";

type ReportProfilePageProps = {
  providerName: string;
  role: Role;
};

const historyRows = [
  {
    id: "#TR-8821",
    target: "Alice Chen",
    category: "Quality",
    status: "Pending",
    tone: "pending",
  },
  {
    id: "#TR-8705",
    target: "Mike Ross",
    category: "No-show",
    status: "Resolved",
    tone: "resolved",
  },
];

export default function ReportProfilePage({
  providerName,
  role,
}: ReportProfilePageProps) {
  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900">Trust & Safety Center</h1>
          <p className="mt-2 max-w-3xl text-xl text-slate-600">
            We are committed to maintaining a high-quality community. If you encounter any
            issues during an exchange or with another user, please let us know immediately.
          </p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50 px-5 py-4">
          <p className="text-xl font-semibold text-teal-800">Community Protection</p>
          <p className="text-base text-teal-700">All reports are strictly confidential.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-2xl font-semibold text-slate-900">Report a Problem</h2>
            <p className="text-base text-slate-600">Provide as much detail as possible.</p>
          </div>

          <form className="space-y-5 p-5">
            <Field label="Who are you reporting?">
              <select
                defaultValue={providerName}
                title="Who are you reporting?"
                className={inputClassName}
              >
                <option>{providerName}</option>
                <option>Alice Chen</option>
                <option>Mike Ross</option>
              </select>
            </Field>

            <Field label="Reason for Report">
              <select defaultValue="Choose a category" title="Reason for Report" className={inputClassName}>
                <option>Choose a category</option>
                <option>No-show</option>
                <option>Low quality service</option>
                <option>Abusive behavior</option>
                <option>Fraud concern</option>
              </select>
            </Field>

            <Field label="Detailed Description">
              <textarea
                rows={5}
                placeholder="Explain what happened in detail..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-2 text-sm text-slate-400">
                Minimum 50 characters requested for priority review.
              </p>
            </Field>

            <Field label="Supporting Evidence">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                <p className="text-xl text-slate-700">
                  Drag & drop files or{" "}
                  <button type="button" className="font-semibold text-[#1453c4] underline">
                    click to browse
                  </button>
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Screenshots, PDFs, or relevant chat logs (Max 10MB)
                </p>
              </div>
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                I verify this information is accurate.
              </label>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#e11d48] px-6 text-base font-semibold text-white transition hover:bg-[#c7173f]"
              >
                Submit Report
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-2xl font-semibold text-slate-900">Your Reporting History</h3>
            </div>
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <p>Report ID</p>
              <p>Target User</p>
              <p>Category</p>
              <p>Status</p>
            </div>
            {historyRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_1fr_1fr_1fr] items-center gap-2 border-t border-slate-100 px-5 py-4 text-base text-slate-700"
              >
                <p className="text-slate-500">{row.id}</p>
                <p className="font-semibold text-slate-800">{row.target}</p>
                <p>{row.category}</p>
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    row.tone === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {row.status}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-100 px-5 py-4 text-center">
              <button type="button" className="text-sm font-semibold text-[#1453c4]">
                Load Previous History
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
            <h3 className="text-2xl font-semibold text-indigo-900">Submission Tips</h3>
            <ul className="mt-3 space-y-3 text-base leading-7 text-indigo-900">
              <li>• Attach evidence: include screenshots or chat logs.</li>
              <li>• Timeliness: report within 24 hours for faster response.</li>
              <li>• Stay professional and objective in your description.</li>
            </ul>
          </section>
        </aside>
      </div>

      <p className="text-xs text-slate-400">Logged-in role: {role}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <p className="mb-2 text-base font-semibold text-slate-700">{label}</p>
      {children}
    </label>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100";
