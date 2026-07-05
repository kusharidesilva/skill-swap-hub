import type { ReactNode } from "react";

export default function AdminSettings() {
  return (
    <div className="px-6 py-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card title="Basic Information">
            <div className="flex items-start gap-5">
              <div className="flex flex-col items-center gap-2 pt-1">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-white shadow-md">
                  <PhoneIcon />
                </div>
                <button type="button" className="text-xs font-semibold text-[#1d4ed8]">
                  Change Picture
                </button>
              </div>

              <div className="flex-1 space-y-4">
                <InputField label="Admin Name" value="System Administrator" />
                <InputField label="Admin Email" value="admin@university.edu" />
              </div>
            </div>
          </Card>

          <Card title="Change Password">
            <div className="space-y-4">
              <InputField label="Current Password" />
              <InputField label="New Password" />
              <InputField label="Confirm New Password" />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Security Status">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-600">Account Status</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Active
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-medium text-slate-600">Last Login</p>
                <p className="mt-2 text-sm leading-5 text-slate-700">Oct 24, 2024 at 10:45 AM</p>
              </div>
            </div>
          </Card>

          <div className="space-y-3 pt-10">
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center rounded-lg bg-[#2f66e7] text-sm font-semibold text-white shadow-sm transition hover:bg-[#2356cb]"
            >
              Save Changes
            </button>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="mt-4 border-t border-slate-200 pt-4">{children}</div>
    </article>
  );
}

function InputField({ label, value }: { label: string; value?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <div className="flex h-10 items-center rounded-sm border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm">
        {value ?? ""}
      </div>
    </label>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M10 6h4" />
      <path d="M11 18h2" />
      <path d="M11 10h2" />
    </svg>
  );
}
