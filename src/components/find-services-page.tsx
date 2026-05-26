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

const ALL_SKILLS = [
  "Programming", "UX Design", "Graphic Design", "Mathematics",
  "Photography", "Video Editing", "Data Analysis", "Web Development",
  "Content Writing", "Music",
];

const filterConfig = [
  { label: "Category", options: ["All Categories", ...ALL_SKILLS] },
  { label: "University", options: ["Any University", "Univ of Colombo", "Univ of Moratuwa", "SLIIT", "NSBM"] },
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
        
        // Fetch completed requests to compute dynamic aggregate star ratings and review counts
        const requestsSnapshot = await getDocs(
          query(collection(db, "requests"), where("status", "==", "completed"))
        );
        
        const ratingsMap: Record<string, { totalStars: number; count: number }> = {};
        requestsSnapshot.forEach((reqDoc) => {
          const req = reqDoc.data();
          const pId = req.providerId;
          if (pId && req.review && typeof req.review.rating === "number") {
            if (!ratingsMap[pId]) {
              ratingsMap[pId] = { totalStars: 0, count: 0 };
            }
            ratingsMap[pId].totalStars += req.review.rating;
            ratingsMap[pId].count += 1;
          }
        });
        
        const dbProviders: ProviderCardData[] = [];
        let index = 0;
        
        querySnapshot.forEach((docSnap) => {
          const u = docSnap.data() as UserProfile;
          if (u.providerProfile) {
            const rData = ratingsMap[u.uid];
            const avgRating = rData ? parseFloat((rData.totalStars / rData.count).toFixed(1)) : 5.0;
            const reviewCount = rData ? rData.count : 0;

            dbProviders.push({
              id: u.uid,
              name: u.name || "Anonymous Member",
              degree: u.degree || "Undergraduate",
              university: u.university || "Sri Lankan University",
              rating: avgRating,
              reviews: reviewCount,
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

  const getRequestHref = (providerId: string) =>
    role ? `${scopedHref("/request-service", role)}?providerId=${providerId}` : "/get-started";
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
        
        // Direct case-insensitive comparison first (e.g. if the category name is inside their skills)
        const directMatch = p.topSkills.some(
          (s) => s.toLowerCase().includes(catLower) || catLower.includes(s.toLowerCase())
        );

        if (directMatch) {
          matchesCat = true;
        } else {
          if (catLower === "programming") {
            const keywords = ["program", "python", "java", "c++", "code", "dev", "c#", "javascript", "typescript", "golang", "ruby", "rust", "software"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          } else if (catLower === "ux design") {
            const keywords = ["ux", "ui", "user experience", "user interface", "figma", "wireframe", "prototype", "interaction"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          } else if (catLower === "graphic design") {
            const keywords = ["graphic", "design", "illustrator", "photoshop", "indesign", "logo", "branding", "vector", "poster", "art", "drawing"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          } else if (catLower === "web development") {
            const keywords = ["web", "development", "developer", "frontend", "backend", "fullstack", "react", "next", "node", "html", "css", "wordpress", "javascript", "typescript"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          } else if (catLower === "content writing") {
            const keywords = ["writing", "write", "content", "essay", "copywriting", "proofread", "edit", "report", "paper", "blog"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          } else if (catLower === "business") {
            const keywords = ["business", "marketing", "sales", "finance", "accounting", "management", "consulting", "strategy", "economics", "startup"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          } else if (catLower === "data analysis") {
            const keywords = ["data", "analysis", "analytics", "statistics", "excel", "sql", "tableau", "power bi", "pandas"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          } else if (catLower === "music") {
            const keywords = ["music", "guitar", "piano", "sing", "instrument", "audio", "song", "band", "vocal"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          } else if (catLower === "mathematics") {
            const keywords = ["math", "calculus", "algebra", "geometry", "trigonometry", "arithmetic", "statistics"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          } else if (catLower === "photography") {
            const keywords = ["photography", "photo", "camera", "lens", "shoot", "lightroom"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          } else if (catLower === "video editing") {
            const keywords = ["video", "edit", "premiere", "after effects", "cut", "film", "youtube"];
            matchesCat = p.topSkills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)));
          }
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 4;

  // Reset pagination when filters or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, universityFilter, ratingFilter, availabilityFilter, sortBy]);

  const totalPages = Math.ceil(filteredProviders.length / cardsPerPage);
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentProviders = filteredProviders.slice(indexOfFirstCard, indexOfLastCard);

  return (
    <div className="flex w-full flex-col lg:flex-row gap-8 pb-10">
      {/* Left Column: Compact Cards List & Pagination */}
      <div className="flex-1 min-w-0 order-2 lg:order-1">
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
              <p className="text-sm text-slate-500">Loading providers...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              {currentProviders.length > 0 ? (
                currentProviders.map((provider) => {
                  const displayAvail = Array.isArray(provider.availability)
                    ? provider.availability.join(", ")
                    : provider.availability;

                  return (
                    <article
                      key={provider.id}
                      className="rounded-xl border border-slate-200 bg-[#fbfbff] p-4 shadow-[0_4px_12px_rgba(15,23,42,0.03)] flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                                provider.accent === "teal" ? "bg-teal-500" : "bg-[#4a74e8]"
                              }`}
                            >
                              {provider.avatar}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <h2 className="text-base font-semibold text-slate-900 truncate max-w-[110px] sm:max-w-none">{provider.name}</h2>
                                <VerifiedIcon className="h-3.5 w-3.5 shrink-0 text-teal-700" />
                              </div>
                              <p className="text-xs text-slate-600 truncate">{provider.degree}</p>
                              <p className="text-xs text-slate-500 truncate">{provider.university}</p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="flex items-center justify-end gap-0.5 text-slate-900">
                              <StarIcon className="h-3.5 w-3.5 text-[#9bb6ff]" />
                              <span className="text-base font-bold">{provider.rating.toFixed(1)}</span>
                            </div>
                            <p className="text-[10px] text-slate-500">({provider.reviews} reviews)</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Top Skills
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {provider.topSkills.length > 0 ? (
                              provider.topSkills.slice(0, 3).map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-[#dff2f4] px-2.5 py-0.5 text-xs font-medium text-teal-800"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400">No skills listed</span>
                            )}
                            {provider.topSkills.length > 3 && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                +{provider.topSkills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                          {provider.summary}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-slate-200 pt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[120px]">{displayAvail}</span>
                          </div>
                          <p className="shrink-0">
                            Match: <span className="font-semibold text-teal-700">{provider.match}%</span>
                          </p>
                        </div>

                        <div className="mt-3 grid grid-cols-[1fr_1.1fr_36px] gap-1.5">
                          <Link
                            href={profileHref(provider.id)}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 text-center"
                          >
                            Profile
                          </Link>
                          <Link
                            href={getRequestHref(provider.id)}
                            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#2f66e7] px-2 text-xs font-semibold text-white transition hover:bg-[#2557cf] text-center"
                          >
                            Request
                          </Link>
                          <Link
                            href={chatHref}
                            aria-label="Open chat"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                          >
                            <ChatIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                  <p className="text-sm text-slate-500">No providers match your search filters.</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("All Categories");
                      setUniversityFilter("Any University");
                      setRatingFilter("Any Rating");
                      setAvailabilityFilter("Any Time");
                    }}
                    className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </section>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-4">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                        currentPage === pageNum
                          ? "bg-[#2f66e7] text-white"
                          : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Search & Filters Sidebar - like side nav vertically stacked */}
      <aside className="w-full lg:w-72 shrink-0 order-1 lg:order-2">
        <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.03)] space-y-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Find Providers</h1>
            <p className="mt-1 text-xs text-slate-500 leading-normal">
              Discover students offering the skills you need.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by skill or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-[#f7f8ff] pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* Filters Stacked */}
          <div className="space-y-4 pt-1 border-t border-slate-100">
            {filterConfig.map((filter) => {
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
                <div key={filter.label} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {filter.label}
                  </span>
                  <select
                    title={filter.label}
                    value={selectValue}
                    onChange={(e) => selectHandler(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
                  >
                    {filter.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
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
