"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { scopedHref, type Role } from "@/lib/role-routes";
import type { UserProfile } from "@/lib/auth";

interface ProviderCardData {
  id: string;
  name: string;
  degree: string;
  university: string;
  rating: number;
  reviews: number;
  topSkills: string[];
  summary: string;
  availability: string | string[];
  match: number;
  avatar: string;
  accent: string;
}

const mockProviderCards: ProviderCardData[] = [
  {
    id: "sarah-jenkins",
    name: "Sarah Jenkins",
    degree: "BSc Computer Science",
    university: "Univ of Colombo",
    rating: 4.9,
    reviews: 42,
    topSkills: ["React (Expert)", "Node.js (Advanced)"],
    summary: "Full-stack developer with a passion for building scalable web applications and...",
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
    summary: "UI/UX design student passionate about creating intuitive and accessible digital...",
    availability: "Evenings",
    match: 86,
    avatar: "MC",
    accent: "blue",
  },
];

const filterConfig = [
  { label: "Category", options: ["All Categories", "Programming", "Design", "Languages"] },
  { label: "University", options: ["Any University", "Univ of Colombo", "Univ of Moratuwa"] },
  { label: "Rating", options: ["Any Rating", "4.5+", "4.0+"] },
  { label: "Availability", options: ["Any Time", "Weekends", "Evenings", "Weekdays"] },
  { label: "Sort By", options: ["Match Score", "Highest Rated", "Most Reviews"] },
];

type FindServicesPageContentProps = {
  role?: Role;
};

export default function FindServicesPageContent({ role }: FindServicesPageContentProps) {
  const [providers, setProviders] = useState<ProviderCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [universityFilter, setUniversityFilter] = useState("Any University");
  const [ratingFilter, setRatingFilter] = useState("Any Rating");
  const [availabilityFilter, setAvailabilityFilter] = useState("Any Time");
  const [sortBy, setSortBy] = useState("Match Score");

  useEffect(() => {
    async function fetchProviders() {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "in", ["provider", "both"]));
        const querySnapshot = await getDocs(q);
        
        const dbProviders: ProviderCardData[] = [];
        let index = 0;
        
        querySnapshot.forEach((docSnap) => {
          const u = docSnap.data() as UserProfile;
          if (u.providerProfile) {
            dbProviders.push({
              id: u.uid,
              name: u.name || "Anonymous Member",
              degree: u.degree || "Undergraduate",
              university: u.university || "Sri Lankan University",
              rating: 5.0,
              reviews: 0,
              topSkills: u.providerProfile.skills || [],
              summary: u.providerProfile.bio || "Student partner ready to collaborate and exchange skills.",
              availability: u.providerProfile.availability || "Flexible",
              match: 95,
              avatar: u.name ? u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "US",
              accent: index % 2 === 0 ? "teal" : "blue",
            });
            index++;
          }
        });

        // Use real providers if registered; otherwise fall back to mock data
        setProviders(dbProviders.length > 0 ? dbProviders : mockProviderCards);
      } catch (err) {
        console.error("Error fetching providers:", err);
        setProviders(mockProviderCards); // Fallback on error
      } finally {
        setLoading(false);
      }
    }

    fetchProviders();
  }, []);

  const requestHref = role ? scopedHref("/request-service", role) : "/get-started";
  const chatHref = role ? scopedHref("/chats", role) : "/get-started";
  const profileHref = (providerId: string) =>
    role
      ? `/provider-profile/${providerId}?role=${role}`
      : `/provider-profile/${providerId}`;

  // Filtering Logic
  const filteredProviders = providers
    .filter((p) => {
      // 1. Search Query
      const queryLower = searchQuery.toLowerCase();
      const matchesQuery =
        p.name.toLowerCase().includes(queryLower) ||
        p.topSkills.some((s) => s.toLowerCase().includes(queryLower)) ||
        p.degree.toLowerCase().includes(queryLower) ||
        p.university.toLowerCase().includes(queryLower);

      if (!matchesQuery) return false;

      // 2. Category Filter
      if (categoryFilter !== "All Categories") {
        const catLower = categoryFilter.toLowerCase();
        let matchesCat = false;
        
        if (catLower === "programming") {
          const keywords = ["program", "python", "web", "react", "node", "java", "c++", "code", "dev"];
          matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
        } else if (catLower === "design") {
          const keywords = ["design", "figma", "ux", "ui", "graphic", "photo", "illustrator", "sketch"];
          matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
        } else if (catLower === "languages") {
          const keywords = ["lang", "english", "sinhala", "tamil", "french", "german", "writing", "speak"];
          matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
        }
        
        if (!matchesCat) return false;
      }

      // 3. University Filter
      if (universityFilter !== "Any University") {
        const matchesUniv =
          p.university.toLowerCase().includes(universityFilter.toLowerCase()) ||
          universityFilter.toLowerCase().includes(p.university.toLowerCase());
        if (!matchesUniv) return false;
      }

      // 4. Rating Filter
      if (ratingFilter !== "Any Rating") {
        const minRating = ratingFilter.includes("4.5") ? 4.5 : 4.0;
        if (p.rating < minRating) return false;
      }

      // 5. Availability Filter
      if (availabilityFilter !== "Any Time") {
        const filterVal = availabilityFilter.toLowerCase();
        const availList = Array.isArray(p.availability) ? p.availability : [p.availability];
        const matchesAvail = availList.some((s) => s.toLowerCase().includes(filterVal));
        if (!matchesAvail) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sorting Logic
      if (sortBy === "Highest Rated") {
        return b.rating - a.rating;
      }
      if (sortBy === "Most Reviews") {
        return b.reviews - a.reviews;
      }
      return b.match - a.match; // Default Match Score
    });

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

            <div className="relative block min-w-0 w-full xl:w-[350px] xl:max-w-[350px]">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by skill or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full min-w-0 rounded-lg border border-slate-300 bg-[#f7f8ff] pl-12 pr-4 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filterConfig.map((filter) => {
              // Connect options with states
              const selectValue =
                filter.label === "Category"
                  ? categoryFilter
                  : filter.label === "University"
                  ? universityFilter
                  : filter.label === "Rating"
                  ? ratingFilter
                  : filter.label === "Availability"
                  ? availabilityFilter
                  : sortBy;

              const selectHandler = (val: string) => {
                if (filter.label === "Category") setCategoryFilter(val);
                else if (filter.label === "University") setUniversityFilter(val);
                else if (filter.label === "Rating") setRatingFilter(val);
                else if (filter.label === "Availability") setAvailabilityFilter(val);
                else setSortBy(val);
              };

              return (
                <label key={filter.label} className="grid min-w-0 gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {filter.label}
                  </span>
                  <select
                    title={filter.label}
                    value={selectValue}
                    onChange={(e) => selectHandler(e.target.value)}
                    className="h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
                  >
                    {filter.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
            <p className="text-sm text-slate-500">Loading providers...</p>
          </div>
        </div>
      ) : (
        <section className="grid gap-6 xl:grid-cols-2">
          {filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => {
              const displayAvail = Array.isArray(provider.availability)
                ? provider.availability.join(", ")
                : provider.availability;

              return (
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
                      {provider.topSkills.length > 0 ? (
                        provider.topSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[#dff2f4] px-3 py-1 text-sm font-medium text-teal-800"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No skills listed yet</span>
                      )}
                    </div>
                  </div>

                  <p className="mt-5 text-lg leading-8 text-slate-600 line-clamp-3">
                    {provider.summary}
                  </p>

                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{displayAvail}</span>
                      </div>
                      <p>
                        Match:{" "}
                        <span className="font-semibold text-teal-700">{provider.match}%</span>
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_44px] gap-2">
                      <Link
                        href={profileHref(provider.id)}
                        className="inline-flex h-11 min-w-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={requestHref}
                        className="inline-flex h-11 min-w-0 items-center justify-center rounded-lg bg-[#2f66e7] px-4 text-sm font-medium text-white transition hover:bg-[#2557cf]"
                      >
                        Request Service
                      </Link>
                      <Link
                        href={chatHref}
                        aria-label="Open chat"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                      >
                        <ChatIcon className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <p className="text-base text-slate-500">No providers match your search filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("All Categories");
                  setUniversityFilter("Any University");
                  setRatingFilter("Any Rating");
                  setAvailabilityFilter("Any Time");
                }}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      )}
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

// Replaced StarIcon definition to avoid explicit any / compile warning issues
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
