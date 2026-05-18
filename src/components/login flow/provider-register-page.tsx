import Image from "next/image";
import Link from "next/link";

const skills = ["Programming", "UX Design", "Add more..."];
const levels = ["Beginner", "Intermediate", "Advanced"];
const availability = ["Weekdays", "Evenings", "Weekends"];

export default function ProviderRegisterPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
          <section className="bg-white px-8 py-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Join as a Service</h1>
                <h2 className="text-xl font-semibold text-slate-900">Provider</h2>
                <p className="mt-2 text-xs text-slate-600">
                  Share your expertise, help your peers, and grow your professional portfolio within
                  the Sri Lankan university community.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#e6fbf5] px-4 py-3 text-xs text-slate-600">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#1caa88]">
                <ShieldIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Get Verified</p>
                <p className="mt-1 text-xs text-slate-600">
                  Validate academic records to show strong expertise and access verified service
                  requests.
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl">
              <Image
                src="/img/03.jpg"
                alt="Student working on creative projects"
                width={360}
                height={240}
                className="h-auto w-full object-cover"
              />
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-700">Why join Skill Swap Hub?</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#2b62e6]" />
                  Build a credible academic portfolio.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#2b62e6]" />
                  Network with university students across the country.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#2b62e6]" />
                  Earn money to get income from your skills.
                </li>
              </ul>
            </div>
          </section>

          <section className="relative border-l border-slate-200 px-8 py-8">
            <Link
              href="/"
              aria-label="Close"
              className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              <CloseIcon className="h-4 w-4" />
            </Link>

            <form className="space-y-5">
              <section>
                <p className="text-xs font-semibold text-slate-500">Account Information</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                  />
                  <input
                    type="email"
                    placeholder="mail@uni.ac.lk"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                  />
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-slate-500">Academic Profile</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select title="Select University" className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                    <option>Select University</option>
                    <option>University of Colombo</option>
                    <option>University of Moratuwa</option>
                    <option>University of Peradeniya</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Degree Programme"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                  />
                  <select title="Select Year of Study" className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                    <option>Year of Study</option>
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                  </select>
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-slate-500">Skills & Services</p>
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    placeholder="Skills You Offer"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400"
                  />
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#eef1ff] px-3 py-1 text-[11px] font-semibold text-[#2b54d6]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-600">Primary Skill Proficiency</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {levels.map((level) => (
                        <span
                          key={level}
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            level === "Intermediate"
                              ? "bg-[#e6fbf5] text-[#1caa88]"
                              : "bg-[#f3f4f8] text-slate-500"
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
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            slot === "Weekdays"
                              ? "bg-[#e6fbf5] text-[#1caa88]"
                              : "bg-[#f3f4f8] text-slate-500"
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
                className="w-full rounded-lg bg-[#2b62e6] px-4 py-2.5 text-center text-xs font-semibold text-white shadow-sm"
              >
                Create Provider Account →
              </Link>
              <p className="text-[10px] text-slate-400">
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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path d="M9.5 12.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 6l12 12" strokeLinecap="round" />
      <path d="M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
