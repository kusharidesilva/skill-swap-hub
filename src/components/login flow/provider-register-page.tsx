import Image from "next/image";
import Link from "next/link";

const skills = ["Programming", "UX Design", "Add more..."];
const levels = ["Beginner", "Intermediate", "Advanced"];
const availability = ["Weekdays", "Evenings", "Weekends"];

export default function ProviderRegisterPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="relative grid w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
          <button
            title="Close"
            className="absolute right-6 top-6 z-10 text-slate-400 hover:text-slate-600"
          >
            <CloseIcon className="h-5 w-5" />
          </button>

          <section className="px-8 py-10">
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Become a Provider
            </span>
            <div className="mt-4">
              <h1 className="text-2xl font-semibold text-[#2543d7]">
                Join as a Service
              </h1>
              <h2 className="text-2xl font-semibold text-[#2543d7]">Provider</h2>
              <p className="mt-3 text-xs text-slate-600">
                Share your expertise, help your peers, and grow your professional portfolio within the Sri Lankan university
                community.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#e9fbf6] px-4 py-3 text-xs text-slate-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#1caa88]">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Get Verified</p>
                <p className="mt-1 text-xs text-slate-600">
                  Verified providers receive more swap requests and exclusive access to the university network.
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              <Image
                src="/img/03.jpg"
                alt="Student working on creative projects"
                width={520}
                height={320}
                className="h-auto w-full object-cover"
              />
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-slate-700">Why join Skill Swap Hub?</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 text-[#0f8a6b]" />
                  Build a credible academic portfolio.
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 text-[#0f8a6b]" />
                  Network with university students across the country.
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 text-[#0f8a6b]" />
                  Earn money to get income from your skills.
                </li>
              </ul>
            </div>
          </section>

          <section className="border-l border-slate-200 px-8 py-10">
            <form className="space-y-6">
              <section>
                <p className="text-xs font-semibold text-slate-500">Account Information</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">University Email</label>
                    <input
                      type="email"
                      placeholder="mail@uni.ac.lk"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Password</label>
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-slate-500">Academic Profile</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">University Name</label>
                    <input
                      type="text"
                      placeholder="Your University Name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Degree Programme</label>
                    <input
                      type="text"
                      placeholder="Your Degree Programme"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Year of Study</label>
                    <select
                      title="Select Year of Study"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-slate-500">Skills & Services</p>
                <div className="mt-3 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Skills You Offer</label>
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                            skill === "Add more..."
                              ? "border border-dashed border-slate-300 text-slate-400"
                              : "bg-[#eef1ff] text-[#2b54d6]"
                          }`}
                        >
                          {skill}
                          {skill !== "Add more..." && <span className="text-[10px]">x</span>}
                        </span>
                      ))}
                      
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-600">Primary Skill Proficiency</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {levels.map((level) => (
                        <span
                          key={level}
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                            level === "Intermediate"
                              ? "border-[#2543d7] bg-[#eef1ff] text-[#2543d7]"
                              : "border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-600">Availability</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availability.map((slot) => (
                        <span
                          key={slot}
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                            slot === "Weekdays"
                              ? "border-[#1caa88] bg-[#e9fbf6] text-[#1caa88]"
                              : "border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-600">Short Bio / Expertise Summary</p>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe your experience and what you can teach others."
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </section>

              <Link
                href="/verify-email?from=provider"
                className="w-full rounded-lg bg-[#2b62e6] px-10 py-2.5 text-center text-xs font-semibold text-white shadow-sm"
              >
                Create Provider Account →
              </Link>
              <p className="text-[10px] text-slate-400 mt-5">
                By creating an account, you agree to the Community Guidelines and Service Standards.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path
        d="M9.5 12.5l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M6 6l12 12" strokeLinecap="round" />
      <path d="M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
