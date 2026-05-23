const providerCards = [
  {
    id: "sarah-jenkins",
    name: "Sarah Jenkins",
    degree: "BSc Computer Science",
    university: "Univ of Colombo",
    rating: 4.9,
    reviews: 42,
    topSkills: ["React (Expert)", "Node.js (Advanced)"],
    summary:
      "Full-stack developer with a passion for building scalable web applications and...",
    availability: "Weekends",
    match: 92,
    avatar: "SJ",
    accent: "teal",
  },
  {
    id: "michael-chen",
    name: "Michael Chen",
    degree: "BA Graphic Design",
    university: "Univ of Moratuwa",
    rating: 4.7,
    reviews: 28,
    topSkills: ["Figma (Expert)", "UI Design (Int.)"],
    summary:
      "UI/UX design student passionate about creating intuitive and accessible digital...",
    availability: "Evenings",
    match: 86,
    avatar: "MC",
    accent: "blue",
  },
];

const filterConfig = [
  { label: "Category", options: ["All Categories", "Programming", "Design", "Languages"] },
  { label: "University", options: ["Any University", "Univ of Colombo", "Univ of Moratuwa"] },
  { label: "Rating", options: ["Any Rating", "4.5+", "4.0+", "3.5+"] },
  { label: "Availability", options: ["Any Time", "Weekends", "Evenings", "Flexible"] },
  { label: "Sort By", options: ["Match Score", "Highest Rated", "Most Reviews"] },
];

export default function FindServicesPageContent() {
  return (
    <div className="flex w-full flex-col gap-8 pb-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_26px_rgba(15,23,42,0.04)] md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Find Providers</h1>
              <p className="mt-2 text-base text-slate-600">
                Discover students offering the skills you need.
              </p>
            </div>

            <label className="relative block min-w-0 w-full xl:w-[350px] xl:max-w-[350px]">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by skill or name..."
                className="h-12 w-full min-w-0 rounded-lg border border-slate-300 bg-[#f7f8ff] pl-12 pr-4 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filterConfig.map((filter) => (
              <label key={filter.label} className="grid min-w-0 gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {filter.label}
                </span>
                <select
                  title={filter.label}
                  defaultValue={filter.options[0]}
                  className="h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
                >
                  {filter.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {providerCards.map((provider) => (
          <article
            key={provider.id}
            className="rounded-2xl border border-slate-200 bg-[#fbfbff] p-6 shadow-[0_10px_26px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                    provider.accent === "teal" ? "bg-teal-500" : "bg-[#4a74e8]"
                  }`}
                >
                  {provider.avatar}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">{provider.name}</h2>
                    <VerifiedIcon className="h-4 w-4 text-teal-700" />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{provider.degree}</p>
                  <p className="text-sm text-slate-600">{provider.university}</p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="flex items-center justify-end gap-1 text-slate-900">
                  <StarIcon className="h-4 w-4 text-[#9bb6ff]" />
                  <span className="text-2xl font-semibold">{provider.rating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-slate-500">({provider.reviews} reviews)</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Top Skills
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {provider.topSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[#dff2f4] px-3 py-1 text-sm font-medium text-teal-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-5 text-lg leading-8 text-slate-600">{provider.summary}</p>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{provider.availability}</span>
                </div>
                <p>
                  Match:{" "}
                  <span className="font-semibold text-teal-700">{provider.match}%</span>
                </p>
              </div>

              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_44px] gap-2">
                <button
                  type="button"
                  className="inline-flex h-11 min-w-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 min-w-0 items-center justify-center rounded-lg bg-[#2f66e7] px-4 text-sm font-medium text-white transition hover:bg-[#2557cf]"
                >
                  Request Service
                </button>
                <button
                  type="button"
                  aria-label="Open chat"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                >
                  <ChatIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5l2.1 2.2 3-.2.7 2.9 2.7 1.3-1 2.8 1 2.8-2.7 1.3-.7 2.9-3-.2-2.1 2.2-2.1-2.2-3 .2-.7-2.9-2.7-1.3 1-2.8-1-2.8 2.7-1.3.7-2.9 3 .2L12 2.5z" />
      <path d="M9.2 12.3l1.9 1.9 3.9-4" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 3z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 5h16v11H7l-3 3z" />
      <path d="M8 9h8M8 13h5" strokeLinecap="round" />
    </svg>
  );
}
