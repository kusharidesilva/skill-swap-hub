"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { scopedHref, type Role } from "@/lib/role-routes";
import type { UserProfile } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { UNIVERSITIES } from "@/lib/universities";

type GigCardData = {
  id: string;
  providerId: string;
  skillIndex: number;
  providerName: string;
  providerDegree: string;
  university: string;
  providerImage?: string;
  title: string;
  category: string;
  summary: string;
  availability: string | string[];
  rating: number;
  reviews: number;
  match: number;
  image: string;
  points: number;
  tags: string[];
  serviceType: string;
};

const ALL_SKILLS = [
  "Programming",
  "UX Design",
  "Graphic Design",
  "Mathematics",
  "Photography",
  "Video Editing",
  "Data Analysis",
  "Web Development",
  "Content Writing",
  "Music",
];

const filterConfig = [
  { label: "Category", options: ["All Categories", ...ALL_SKILLS] },
  {
    label: "University",
    options: ["Any University", ...UNIVERSITIES],
  },
  { label: "Rating", options: ["Any Rating", "4.5+", "4.0+"] },
  { label: "Availability", options: ["Any Time", "Weekends", "Evenings", "Weekdays"] },
];

const gigImages = [
  "/img/package%201.jpg",
  "/img/package%202.jpg",
  "/img/package%203.jpg",
  "/img/package%204.jpg",
  "/img/favorites/web-development.jpg",
  "/img/favorites/ui-ux-design.jpg",
  "/img/favorites/data-science.jpg",
  "/img/favorites/mathematics.jpg",
];

const mockGigCards: GigCardData[] = [
  {
    id: "gig-react-dashboard",
    providerId: "sarah-jenkins",
    skillIndex: 0,
    providerName: "Sarah Jenkins",
    providerDegree: "BSc Computer Science",
    university: "Univ of Colombo",
    title: "I will build a clean React dashboard for your project",
    category: "Web Development",
    summary: "Frontend help for layouts, components, data tables, and responsive screens.",
    availability: "Weekends",
    rating: 4.9,
    reviews: 42,
    match: 92,
    image: "/img/favorites/web-development.jpg",
    points: 30,
    tags: ["React", "Next.js", "Tailwind"],
    serviceType: "Skill Exchange",
  },
  {
    id: "gig-figma-prototype",
    providerId: "michael-chen",
    skillIndex: 0,
    providerName: "Michael Chen",
    providerDegree: "BA Graphic Design",
    university: "Univ of Moratuwa",
    title: "I will design a Figma prototype for your app idea",
    category: "UX Design",
    summary: "Wireframes, clickable prototypes, and visual polish for student products.",
    availability: "Evenings",
    rating: 4.7,
    reviews: 28,
    match: 86,
    image: "/img/favorites/ui-ux-design.jpg",
    points: 25,
    tags: ["Figma", "UI Design", "Prototype"],
    serviceType: "Skill Exchange",
  },
];

type FindServicesPageContentProps = {
  role?: Role;
};

export default function FindServicesPageContent({ role }: FindServicesPageContentProps) {
  const { userProfile, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const [gigs, setGigs] = useState<GigCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingsVersion, setRatingsVersion] = useState(0);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("query") || "");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [universityFilter, setUniversityFilter] = useState("Any University");
  const [ratingFilter, setRatingFilter] = useState("Any Rating");
  const [availabilityFilter, setAvailabilityFilter] = useState("Any Time");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "requests"), where("status", "==", "completed")),
      () => setRatingsVersion((value) => value + 1),
      (err) => console.error("Error subscribing to live ratings in find services:", err),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchGigs() {
      try {
        const usersRef = collection(db, "users");
        const usersQuery = query(usersRef, where("role", "in", ["provider", "both"]));
        const usersSnapshot = await getDocs(usersQuery);
        const requestsSnapshot = await getDocs(
          query(collection(db, "requests"), where("status", "==", "completed")),
        );

        const ratingsMap: Record<string, { totalStars: number; count: number }> = {};
        requestsSnapshot.forEach((reqDoc) => {
          const req = reqDoc.data();
          const providerId = req.providerId;
          if (providerId && req.review && typeof req.review.rating === "number") {
            ratingsMap[providerId] ??= { totalStars: 0, count: 0 };
            ratingsMap[providerId].totalStars += req.review.rating;
            ratingsMap[providerId].count += 1;
          }
        });

        const dbGigs: GigCardData[] = [];
        let index = 0;

        usersSnapshot.forEach((docSnap) => {
          const user = docSnap.data() as UserProfile;
          // Exclude current logged-in user from search results
          if (userProfile && user.uid === userProfile.uid) return;

          const profile = user.providerProfile;
          if (!profile) return;

          const skills = profile.skills?.length ? profile.skills : ["Student Support"];
          const ratingData = ratingsMap[user.uid];
          const rating = ratingData
            ? Number((ratingData.totalStars / ratingData.count).toFixed(1))
            : 5.0;

          skills.forEach((skill, skillIndex) => {
            const category = inferCategory(skill);
            dbGigs.push({
              id: `${user.uid}-${slugify(skill)}-${skillIndex}`,
              providerId: user.uid,
              skillIndex,
              providerName: user.name || "Anonymous Member",
              providerDegree: user.degree || "Undergraduate",
              university: user.university || "Sri Lankan University",
              providerImage: user.profileImageUrl || "",
              title: `I will do ${skill}`,
              category,
              summary:
                profile.bio ||
                `Practical ${skill} support from a verified student skill swap provider.`,
              availability: profile.availability || "Flexible",
              rating,
              reviews: ratingData?.count || 0,
              match: 95,
              image: (profile.gigImages && profile.gigImages[skillIndex]) || gigImages[index % gigImages.length],
              points: 20 + (skillIndex % 3) * 5,
              tags: skills.slice(0, 3),
              serviceType: "Skill Exchange",
            });
            index += 1;
          });
        });

        setGigs(dbGigs.length > 0 ? dbGigs : mockGigCards);
      } catch (err) {
        console.error("Error fetching gigs:", err);
        setGigs(mockGigCards);
      } finally {
        setLoading(false);
      }
    }

    fetchGigs();
  }, [userProfile, ratingsVersion]);

  const updateFilters = (update: () => void) => {
    update();
    setCurrentPage(1);
  };

  const filteredGigs = useMemo(() => {
    return gigs
      .filter((gig) => {
        // Exclude current user's own gigs/profiles from search
        if (userProfile && gig.providerId === userProfile.uid) {
          return false;
        }

        const queryLower = searchQuery.toLowerCase();
        const matchesQuery =
          gig.title.toLowerCase().includes(queryLower) ||
          gig.providerName.toLowerCase().includes(queryLower) ||
          gig.tags.some((tag) => tag.toLowerCase().includes(queryLower)) ||
          gig.category.toLowerCase().includes(queryLower) ||
          gig.university.toLowerCase().includes(queryLower);

        if (!matchesQuery) return false;

        if (categoryFilter !== "All Categories" && gig.category !== categoryFilter) {
          return false;
        }

        if (universityFilter && universityFilter !== "Any University") {
          const university = gig.university.toLowerCase();
          const filter = universityFilter.toLowerCase();
          if (!university.includes(filter) && !filter.includes(university)) return false;
        }

        if (ratingFilter !== "Any Rating") {
          const minRating = ratingFilter.includes("4.5") ? 4.5 : 4.0;
          if (gig.rating < minRating) return false;
        }

        if (availabilityFilter !== "Any Time") {
          const availability = Array.isArray(gig.availability) ? gig.availability : [gig.availability];
          if (!availability.some((item) => item.toLowerCase().includes(availabilityFilter.toLowerCase()))) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.match - a.match);
  }, [availabilityFilter, categoryFilter, gigs, ratingFilter, searchQuery, universityFilter, userProfile]);

  const cardsPerPage = 4;
  const totalPages = Math.ceil(filteredGigs.length / cardsPerPage);
  const currentGigs = filteredGigs.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);

  const requestHref = (providerId: string) =>
    role ? `${scopedHref("/request-service", role)}?providerId=${providerId}` : "/get-started";
  const previewHref = (gig: GigCardData) =>
    role
      ? `/gig-preview/${role}?source=find&providerId=${encodeURIComponent(gig.providerId)}&skillIndex=${gig.skillIndex}`
      : "/get-started";

  return (
    <div className="flex w-full flex-col gap-8 pb-10 lg:flex-row">
      <div className="min-w-0 flex-1 order-2 lg:order-1">
        {loading ? (
          <LoadingCard />
        ) : (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              {currentGigs.length > 0 ? (
                currentGigs.map((gig) => (
                  <GigCard
                    key={gig.id}
                    gig={gig}
                    requestHref={requestHref(gig.providerId)}
                    previewHref={previewHref(gig)}
                  />
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                  <p className="text-sm text-slate-500">No gigs match your search filters.</p>
                  <button
                    type="button"
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

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>

      <FiltersSidebar
        searchQuery={searchQuery}
        setSearchQuery={(value) => updateFilters(() => setSearchQuery(value))}
        categoryFilter={categoryFilter}
        setCategoryFilter={(value) => updateFilters(() => setCategoryFilter(value))}
        universityFilter={universityFilter}
        setUniversityFilter={(value) => updateFilters(() => setUniversityFilter(value))}
        ratingFilter={ratingFilter}
        setRatingFilter={(value) => updateFilters(() => setRatingFilter(value))}
        availabilityFilter={availabilityFilter}
        setAvailabilityFilter={(value) => updateFilters(() => setAvailabilityFilter(value))}
      />
    </div>
  );
}

function GigCard({
  gig,
  requestHref,
  previewHref,
}: {
  gig: GigCardData;
  requestHref: string;
  previewHref: string;
}) {
  const { userProfile, refreshProfile } = useAuth();
  const availability = Array.isArray(gig.availability) ? gig.availability.join(", ") : gig.availability;
  const isFavorited = Boolean(
    userProfile?.favorites?.some((fav) => (fav as { providerId?: string }).providerId === gig.providerId),
  );

  const handleToggleFavorite = async () => {
    if (!userProfile) {
      window.location.href = "/get-started";
      return;
    }

    try {
      const favorites = (userProfile.favorites || []) as Record<string, unknown>[];
      let updatedFavorites;

      if (isFavorited) {
        updatedFavorites = favorites.filter((fav) => (fav as { providerId?: string }).providerId !== gig.providerId);
      } else {
        const now = new Date();
        updatedFavorites = [
          ...favorites,
          {
            id: gig.providerId,
            providerId: gig.providerId,
            title: gig.title,
            category: gig.category,
            instructor: gig.providerName,
            rating: gig.rating.toFixed(1),
            image: gig.image,
            avatar:
              gig.providerImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(gig.providerName)}&background=2f66e7&color=fff&size=400`,
            level: gig.providerDegree,
            savedAt: `Saved ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
            description: gig.summary,
          },
        ];
      }

      await updateDoc(doc(db, "users", userProfile.uid), {
        favorites: updatedFavorites,
      });
      await refreshProfile();
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  return (
    <article className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-md">
      <div className="relative h-40 bg-slate-100">
        <Image src={gig.image} alt={gig.title} fill className="object-cover" sizes="(min-width: 1024px) 320px, 100vw" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#1453c4] shadow-sm">
          {gig.category}
        </span>
        <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${
              isFavorited ? "bg-red-500 text-white" : "bg-white/95 text-slate-700 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <HeartIcon className="h-4.5 w-4.5" filled={isFavorited} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 text-[0.97rem] font-bold leading-6 text-slate-900">
          {gig.title}
        </h2>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <StarIcon className="h-3.5 w-3.5 text-amber-400" />
            {gig.rating.toFixed(1)}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#2f66e7] text-[10px] font-bold text-white ring-2 ring-white">
            {gig.providerImage && gig.providerImage.startsWith("/") ? (
              <Image src={gig.providerImage} alt={gig.providerName} width={32} height={32} className="h-full w-full object-cover" />
            ) : (
              gig.providerName.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-5 text-slate-700">{gig.providerName}</p>
            <p className="truncate text-[12px] leading-4 text-slate-500">{gig.university}</p>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-[12.5px] leading-5 text-slate-600">
          {gig.summary}
        </p>

        <div className="mt-auto border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="truncate">{availability}</span>
            <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#dff2f4] px-2 py-0.5 text-[10px] font-semibold leading-none text-teal-800">
              {gig.serviceType}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={previewHref}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View More
            </Link>
            <Link
              href={requestHref}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#2f66e7] px-2 text-xs font-semibold text-white transition hover:bg-[#2557cf]"
            >
              Request
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function HeartIcon({ className, filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2} aria-hidden="true">
      <path d="M12 21s-6.4-4.1-9-8.1C1 9.8 2.4 6.2 5.8 5.6c2.1-.4 3.8.6 5 2.3.2.3.3.4.4.4s.2-.1.4-.4c1.2-1.7 2.9-2.7 5-2.3 3.4.6 4.8 4.2 2.8 7.3C18.4 16.9 12 21 12 21z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 3z" />
    </svg>
  );
}

function FiltersSidebar(props: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  universityFilter: string;
  setUniversityFilter: (value: string) => void;
  ratingFilter: string;
  setRatingFilter: (value: string) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (value: string) => void;
}) {
  return (
    <aside className="w-full shrink-0 order-1 lg:order-2 lg:w-72">
      <div className="sticky top-24 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.03)]">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Find Gig Profiles</h1>
          <p className="mt-1 text-xs leading-normal text-slate-500">
            Discover student gigs that match the skill you need.
          </p>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by skill or gig..."
            value={props.searchQuery}
            onChange={(e) => props.setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-[#f7f8ff] pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-1">
          {filterConfig.map((filter) => {
            const selectValue =
              filter.label === "Category"
                ? props.categoryFilter
                : filter.label === "University"
                  ? props.universityFilter
                  : filter.label === "Rating"
                    ? props.ratingFilter
                    : props.availabilityFilter;

            const selectHandler = (value: string) => {
              if (filter.label === "Category") props.setCategoryFilter(value);
              else if (filter.label === "University") props.setUniversityFilter(value);
              else if (filter.label === "Rating") props.setRatingFilter(value);
              else props.setAvailabilityFilter(value);
            };

            if (filter.label === "University") {
              return (
                <div key={filter.label} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {filter.label}
                  </span>
                  <input
                    type="text"
                    value={props.universityFilter === "Any University" ? "" : props.universityFilter}
                    onChange={(e) => props.setUniversityFilter(e.target.value || "Any University")}
                    placeholder="Type or select university..."
                    list="find-university-options"
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
                  />
                  <datalist id="find-university-options">
                    {filter.options.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>
              );
            }

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
  );
}

function Pagination({
  currentPage,
  totalPages,
  setCurrentPage,
}: {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (updater: (prev: number) => number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button
        type="button"
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        &lsaquo;
      </button>
      {Array.from({ length: totalPages }).map((_, index) => {
        const pageNum = index + 1;
        return (
          <button
            type="button"
            key={pageNum}
            onClick={() => setCurrentPage(() => pageNum)}
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
        type="button"
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        &rsaquo;
      </button>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
        <p className="text-sm text-slate-500">Loading gig profiles...</p>
      </div>
    </div>
  );
}

function inferCategory(skill: string) {
  const value = skill.toLowerCase();
  if (["ux", "ui", "figma", "prototype"].some((term) => value.includes(term))) return "UX Design";
  if (["graphic", "logo", "poster", "illustrator", "photoshop"].some((term) => value.includes(term))) {
    return "Graphic Design";
  }
  if (["math", "calculus", "algebra", "statistics"].some((term) => value.includes(term))) return "Mathematics";
  if (["photo", "camera", "lightroom"].some((term) => value.includes(term))) return "Photography";
  if (["video", "premiere", "film"].some((term) => value.includes(term))) return "Video Editing";
  if (["data", "sql", "excel", "analytics"].some((term) => value.includes(term))) return "Data Analysis";
  if (["web", "react", "next", "html", "css", "node"].some((term) => value.includes(term))) return "Web Development";
  if (["write", "content", "essay", "copy"].some((term) => value.includes(term))) return "Content Writing";
  if (["music", "guitar", "piano", "audio"].some((term) => value.includes(term))) return "Music";
  return "Programming";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}
