"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { ensureGigTitlePrefix } from "@/lib/gig-titles";
import { SERVICE_CATEGORIES } from "@/lib/platform";
import { formatRatingLabel } from "@/lib/ratings";
import { doc, updateDoc } from "firebase/firestore";
import ModalPortal from "@/components/ui/modal-portal";
import { isRole, type Role } from "@/lib/role-routes";

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
  level?: string;
  savedAt: string;
  description: string;
  university?: string;
  price?: string | number;
  availability?: string | string[];
};

const filterOptions = ["All", ...SERVICE_CATEGORIES];

export default function FavoritesPage() {
  const { userProfile, loading, refreshProfile } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

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
        [ensureGigTitlePrefix(skill.title), skill.category, skill.instructor].some((value) =>
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0f8a6b]">
              Wishlist
            </p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
              Saved Gigs
            </h1>
            <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
              Keep your favourite gig cards in one place and revisit them when you
              are ready to book, compare, or share with a friend.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <SummaryPill label="Saved" value={savedSkills.length.toString()} />
            <SummaryPill
              label="Categories"
              value={new Set(savedSkills.map((s) => s.category)).size.toString()}
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="relative block">
            <span className="sr-only">Search saved gigs</span>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by gig, tutor, or category"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="overflow-x-auto pb-1 scrollbar-none">
            <div className="flex w-max min-w-full gap-1.5">
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
        </div>
      </div>

      {/* Saved gig results or the matching empty state */}
      {visibleSkills.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleSkills.map((skill) => (
            <SavedSkillCard
              key={skill.id}
              skill={skill}
              onRemove={handleRemoveFavorite}
              role={userProfile?.role}
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
    <div className="min-w-[88px] rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[#0f4cbf]">{value}</p>
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
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
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
}: {
  skill: SavedSkill;
  onRemove: (favoriteKey: string) => void;
  role?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const ratingLabel = formatRatingLabel(skill.rating);
  const displayTitle = ensureGigTitlePrefix(skill.title);
  const activeRole: Role = isRole(role) ? role : "buyer";
  const previewHref = skill.gigId
    ? `/gig-preview/${activeRole}?source=favorites&providerId=${encodeURIComponent(skill.providerId)}&gigId=${encodeURIComponent(skill.gigId)}`
    : `/gig-preview/${activeRole}?source=favorites&providerId=${encodeURIComponent(skill.providerId)}`;
  const availability = Array.isArray(skill.availability)
    ? skill.availability.join(", ")
    : skill.availability || "Flexible schedule";
  const priceLabel = formatPrice(skill.price);
  const providerInitial = skill.instructor.charAt(0).toUpperCase();

  return (
    <>
      <article className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-md">
        <div className="relative h-40 bg-slate-100">
          <Image
            src={skill.image}
            alt={displayTitle}
            fill
            sizes="(min-width: 1536px) 18vw, (min-width: 1024px) 25vw, 100vw"
            className="object-cover"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#1453c4] shadow-sm">
            {skill.category}
          </span>
          <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => onRemove(skill.gigId || skill.providerId)}
              aria-label={`Remove ${displayTitle} from saved gigs`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm transition hover:bg-red-50"
            >
              <HeartFillIcon className="h-4.5 w-4.5" />
            </button>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
              <StarIcon className="h-3.5 w-3.5 text-amber-400" />
              {ratingLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h2 className="line-clamp-2 text-[0.97rem] font-bold leading-6 text-slate-900">
            {displayTitle}
          </h2>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            {skill.avatar && skill.avatar.startsWith("/") ? (
              <Image
                src={skill.avatar}
                alt={skill.instructor}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#2f66e7] text-[10px] font-bold text-white ring-2 ring-white">
                {providerInitial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-5 text-slate-700">
                {skill.instructor} <span className="font-medium text-slate-400">|</span>{" "}
                <span className="font-medium text-slate-500">
                  {skill.university || "Sri Lankan University"}
                </span>
              </p>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 text-[12.5px] leading-5 text-slate-600">
            {skill.description}
          </p>

          <div className="mt-auto border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="truncate">{availability}</span>
              <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#dff2f4] px-2 py-0.5 text-[10px] font-semibold leading-none text-teal-800">
                {priceLabel}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="truncate text-[11px] text-slate-400">{skill.savedAt}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View Details
              </button>
              <Link
                href={previewHref}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[#2f66e7] px-2 text-xs font-semibold text-white transition hover:bg-[#2557cf]"
              >
                Request Now
              </Link>
            </div>
          </div>
        </div>
      </article>
      {detailsOpen ? (
        <SavedGigDetailsModal
          skill={skill}
          availability={availability}
          priceLabel={priceLabel}
          previewHref={previewHref}
          onClose={() => setDetailsOpen(false)}
        />
      ) : null}
    </>
  );
}

function SavedGigDetailsModal({
  skill,
  availability,
  priceLabel,
  previewHref,
  onClose,
}: {
  skill: SavedSkill;
  availability: string;
  priceLabel: string;
  previewHref: string;
  onClose: () => void;
}) {
  const ratingLabel = formatRatingLabel(skill.rating);
  const displayTitle = ensureGigTitlePrefix(skill.title);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-md">
        <article className="relative grid max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-[0.9fr_1.1fr]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gig details"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm transition hover:text-slate-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <div className="relative min-h-[220px] bg-slate-100 p-4 md:min-h-[400px]">
            <Image
              src={skill.image}
              alt={displayTitle}
              fill
              className="object-contain p-4"
              sizes="(min-width: 768px) 340px, 100vw"
            />
          </div>
          <div className="min-w-0 overflow-y-auto p-5 md:p-6">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1453c4]">
              {skill.category}
            </span>
            <h2 className="mt-3 break-words text-xl font-bold leading-7 text-slate-900">{displayTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {skill.description || "Gig details will be shared when you open the full gig preview."}
            </p>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <InfoItem label="Price" value={priceLabel} />
              <InfoItem label="Availability" value={availability || "Flexible"} />
              <InfoItem label="Provider" value={skill.instructor} />
              <InfoItem label="Rating" value={ratingLabel} />
              <InfoItem label="Saved on" value={skill.savedAt} />
              <InfoItem label="University" value={skill.university || "Campus student"} />
            </dl>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              <Link
                href={previewHref}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2f66e7] px-5 text-sm font-semibold text-white transition hover:bg-[#2557cf]"
              >
                Request Now
              </Link>
            </div>
          </div>
        </article>
      </div>
    </ModalPortal>
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</dd>
    </div>
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

function formatPrice(value: number | string | undefined) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Price on chat";
  return `LKR ${numeric.toLocaleString("en-LK")}`;
}
