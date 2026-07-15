"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { SERVICE_CATEGORIES } from "@/lib/platform";
import { formatRatingLabel } from "@/lib/ratings";
import { doc, updateDoc } from "firebase/firestore";

type SavedSkill = {
  id: string;
  gigId?: string;
  providerId: string;
  title: string;
  category: string;
  instructor: string;
  rating: string | number;
  image: string;
  avatar: string;
  level: string;
  savedAt: string;
  description: string;
};

const filterOptions = ["All", ...SERVICE_CATEGORIES];

export default function FavoritesPage() {
  const { userProfile, loading, refreshProfile } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Favorites are stored inside the user's profile, so no extra query is needed.
  const savedSkills = useMemo(() => {
    return (userProfile?.favorites || []) as SavedSkill[];
  }, [userProfile]);

  const handleRemoveFavorite = async (favoriteKey: string) => {
    if (!userProfile) return;
    try {
      // New favorites use a gig key; the provider check supports older saved records.
      const updated = savedSkills.filter(
        (fav) =>
          fav.gigId !== favoriteKey &&
          !(fav.gigId ? false : fav.providerId === favoriteKey),
      );
      await updateDoc(doc(db, "users", userProfile.uid), {
        favorites: updated,
      });
      await refreshProfile();
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  const visibleSkills = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    // A card must satisfy both the selected category and the search text.
    return savedSkills.filter((skill) => {
      const matchesFilter =
        activeFilter === "All" ||
        skill.category.toLowerCase() === activeFilter.toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        [skill.title, skill.category, skill.instructor].some((value) =>
          (value || "").toLowerCase().includes(query)
        );

      return matchesFilter && matchesSearch;
    });
  }, [savedSkills, activeFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading saved gigs...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Page summary and controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f8a6b]">
              Wishlist
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Saved Gigs
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep your favourite gig cards in one place and revisit them when you
              are ready to book, compare, or share with a friend.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <SummaryPill label="Saved" value={savedSkills.length.toString()} />
            <SummaryPill
              label="Categories"
              value={new Set(savedSkills.map((s) => s.category)).size.toString()}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Search saved gigs</span>
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by gig, tutor, or category"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setViewMode("grid")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-[#2f66e7] text-white shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-slate-900"
              }`}
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => setViewMode("list")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                viewMode === "list"
                  ? "bg-[#2f66e7] text-white shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-slate-900"
              }`}
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={activeFilter === option}
              onClick={() => setActiveFilter(option)}
            />
          ))}
        </div>
      </div>

      {/* Saved gig results or the matching empty state */}
      {visibleSkills.length > 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-5 xl:grid-cols-2" : "flex flex-col gap-3"}>
          {visibleSkills.map((skill) => (
            <SavedSkillCard
              key={skill.id}
              skill={skill}
              onRemove={handleRemoveFavorite}
              role={userProfile?.role}
              listView={viewMode === "list"}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            No saved gigs found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {savedSkills.length === 0
              ? "Browse gig cards and save your favorites here!"
                : "Try a different search term or choose another category."}
            </p>
        </div>
      )}
    </section>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 min-w-[100px]">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-[#0f4cbf]">{value}</p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-[#2f66e7] bg-[#2f66e7] text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-[#0f4cbf]"
      }`}
    >
      {label}
    </button>
  );
}

function SavedSkillCard({
    skill,
    onRemove,
  role,
  listView = false,
}: {
  skill: SavedSkill;
  onRemove: (favoriteKey: string) => void;
  role?: string;
  listView?: boolean;
}) {
  const profileHref = `/provider-profile/${skill.providerId}${role ? `?role=${role}` : ""}`;
  const ratingLabel = formatRatingLabel(skill.rating);

  return (
    <article className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${listView ? 'flex flex-row' : ''}`}>
      <div className={`relative ${listView ? 'w-1/3 h-auto min-h-[200px]' : 'h-48'}`}>
        <Image
          src={skill.image}
          alt={skill.title}
          fill
          sizes={listView ? "(min-width: 1024px) 33vw, 100vw" : "(min-width: 1280px) 420px, (min-width: 1024px) 50vw, 100vw"}
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
        <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#0f8a6b] shadow-sm">
          {skill.category}
        </span>
        <button
          type="button"
          onClick={() => onRemove(skill.gigId || skill.providerId)}
          aria-label={`Remove ${skill.title} from saved gigs`}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-105 hover:bg-red-50 text-red-600"
        >
          <HeartFillIcon className="h-5 w-5" />
        </button>
      </div>

      <div className={`p-5 ${listView ? 'w-2/3 flex flex-col justify-between' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-bold leading-6 text-slate-950">
              {skill.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
              {skill.description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700">
            <StarIcon className="h-4 w-4" />
            {ratingLabel}
          </div>
        </div>

        <div>
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              {skill.avatar && skill.avatar.startsWith("/") ? (
                <Image
                  src={skill.avatar}
                  alt={skill.instructor}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-slate-800 ring-2 ring-white">
                  {skill.instructor.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {skill.instructor}
                </p>
                <p className="truncate text-xs text-slate-400">{skill.savedAt}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {skill.level}
            </span>
          </div>

          <div className="mt-5 flex gap-3">
            <Link
              href={profileHref}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#0f4cbf] text-sm font-bold text-white transition hover:bg-[#0d3fa1]"
            >
              View Details
            </Link>
            <button
              type="button"
              aria-label={`Share ${skill.title}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0f4cbf]"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 4h6v6H4z" />
      <path d="M14 4h6v6h-6z" />
      <path d="M4 14h6v6H4z" />
      <path d="M14 14h6v6h-6z" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </svg>
  );
}

function HeartFillIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 21s-6.4-4.1-9-8.1C1 9.8 2.4 6.2 5.8 5.6c2.1-.4 3.8.6 5 2.3.2.3.3.4.4.4s.2-.1.4-.4c1.2-1.7 2.9-2.7 5-2.3 3.4.6 4.8 4.2 2.8 7.3C18.4 16.9 12 21 12 21z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3.2 14.7 8.7l6.1.9-4.4 4.3 1 6.1-5.4-2.9L6.6 20l1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-4" />
      <path d="m8.6 13.5 6.8 4" />
    </svg>
  );
}
