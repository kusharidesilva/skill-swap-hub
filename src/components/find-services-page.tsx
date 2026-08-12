"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { buildGigRatingSummary } from "@/lib/gig-ratings";
import { ensureGigTitlePrefix } from "@/lib/gig-titles";
import { formatRatingLabel } from "@/lib/ratings";
import { type Role } from "@/lib/role-routes";
import type { ProviderGig, UserProfile } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { AVAILABILITY_TIME_SLOTS, inferServiceCategory } from "@/lib/platform";
import { useLookupOptions } from "@/lib/lookups";
import UniversityCombobox from "@/components/ui/university-combobox";
import SelectField from "@/components/ui/select-field";
import ModalPortal from "@/components/ui/modal-portal";
import { getGigCoverForCategory } from "@/lib/gig-covers";

type GigCardData = {
  id: string;
  gigId?: string;
  providerId: string;
  skillIndex: number;
  providerName: string;
  providerDegree: string;
  university: string;
  providerImage?: string;
  title: string;
  category: string;
  price: number | string;
  summary: string;
  description?: string;
  availability: string | string[];
  rating: number;
  reviews: number;
  match: number;
  image: string;
  points: number;
  tags: string[];
  serviceType: string;
};

type FindServicesPageContentProps = {
  role?: Role;
};

export default function FindServicesPageContent({ role }: FindServicesPageContentProps) {
  const { userProfile } = useAuth();
  const searchParams = useSearchParams();
  const serviceCategories = useLookupOptions("serviceCategories");
  const timeSlotOptions = useLookupOptions("availabilityTimeSlots");
  const availabilityFilters = ["Any Time", ...(timeSlotOptions.length ? timeSlotOptions : [...AVAILABILITY_TIME_SLOTS])];
  const [gigs, setGigs] = useState<GigCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingsVersion, setRatingsVersion] = useState(0);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("query") || "");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [universityFilter, setUniversityFilter] = useState("Any University");
  const [ratingFilter, setRatingFilter] = useState("Any Rating");
  const [availabilityFilter, setAvailabilityFilter] = useState("Any Time");
  const [currentPage, setCurrentPage] = useState(1);
  const hideOwnGigInMarketplace = role !== "both";

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

        const completedRequests = requestsSnapshot.docs.map((reqDoc) => reqDoc.data());

        const dbGigs: GigCardData[] = [];

        usersSnapshot.forEach((docSnap) => {
          const user = docSnap.data() as UserProfile;
          if (
            hideOwnGigInMarketplace &&
            userProfile &&
            user.uid === userProfile.uid
          ) {
            return;
          }

          const profile = user.providerProfile;
          if (!profile) return;

          const skills = profile.skills?.length ? profile.skills : ["Student Support"];
          const storedGigs = (profile.gigs || []).filter(
            (gig) => (gig.status || "active") === "active",
          );
          const providerRequests = completedRequests.filter((request) => request.providerId === user.uid);

          const gigEntries: Array<{
            title: string;
            category: string;
            price: number | string;
            summary: string;
            description?: string;
            image: string;
          }> = storedGigs.length
            ? storedGigs.map((gig: ProviderGig, skillIndex) => ({
                title: ensureGigTitlePrefix(gig.title || skills[skillIndex] || "Student Support"),
                category: gig.category || inferCategory(skills[skillIndex] || gig.title || "Support"),
                price: gig.price || "",
                summary: gig.summary || gig.description || `Practical support from a verified student.`,
                description: gig.description || gig.summary || "",
                image:
                  gig.image ||
                  (profile.gigImages && profile.gigImages[skillIndex]) ||
                  getGigCoverForCategory(
                    gig.category || skills[skillIndex] || gig.title,
                    gig.title || skills[skillIndex],
                    skillIndex,
                  ),
              }))
            : skills.map((skill, skillIndex) => ({
                title: ensureGigTitlePrefix(skill),
                category: inferCategory(skill),
                price: "",
                summary: profile.bio || `Practical ${skill.toLowerCase()} support from a verified student skill swap provider.`,
                description: profile.bio || "",
                image:
                  (profile.gigImages && profile.gigImages[skillIndex]) ||
                  getGigCoverForCategory(inferCategory(skill), skill, skillIndex),
              }));

          gigEntries.forEach((gigEntry, skillIndex) => {
            const gigId = storedGigs[skillIndex]?.id;
            const ratingSummary = buildGigRatingSummary(
              {
                id: gigId || `${user.uid}-${slugify(gigEntry.title)}-${skillIndex}`,
                gigId,
                title: gigEntry.title,
                category: gigEntry.category,
              },
              providerRequests,
            );

            dbGigs.push({
              id: gigId || `${user.uid}-${slugify(gigEntry.title)}-${skillIndex}`,
              gigId,
              providerId: user.uid,
              skillIndex,
              providerName: user.name || "Anonymous Member",
              providerDegree: user.degree || "Undergraduate",
              university: user.university || "Sri Lankan University",
              providerImage: user.profileImageUrl || "",
              title: gigEntry.title,
              category: gigEntry.category,
              price: gigEntry.price,
              summary: gigEntry.summary,
              description: gigEntry.description,
              availability: profile.availability || "Flexible",
              rating: ratingSummary.rating,
              reviews: ratingSummary.count,
              match: 95,
              image: gigEntry.image,
              points: 20 + (skillIndex % 3) * 5,
              tags: [gigEntry.category, ...(skills.slice(0, 2))].slice(0, 3),
              serviceType: "Service Gig",
            });
          });
        });

        setGigs(dbGigs);
      } catch (err) {
        console.error("Error fetching gigs:", err);
        setGigs([]);
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
        if (hideOwnGigInMarketplace && userProfile && gig.providerId === userProfile.uid) {
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
  }, [availabilityFilter, categoryFilter, gigs, hideOwnGigInMarketplace, ratingFilter, searchQuery, universityFilter, userProfile]);

  // Pagination happens after filtering so page counts always match the results.
  const cardsPerPage = 6;
  const totalPages = Math.ceil(filteredGigs.length / cardsPerPage);
  const currentGigs = filteredGigs.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);

  const previewHref = (gig: GigCardData) =>
    role
      ? `/gig-preview/${role}?source=find&providerId=${encodeURIComponent(gig.providerId)}&skillIndex=${gig.skillIndex}${gig.gigId ? `&gigId=${encodeURIComponent(gig.gigId)}` : ""}`
      : "/get-started";

  return (
    <div className="grid w-full gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
      <div className="order-2 min-w-0 lg:order-1">
        {loading ? (
          <LoadingCard />
        ) : (
          <div className="flex min-h-[calc(100dvh-11rem)] flex-col">
            {/* Filtered service results */}
            <section className="grid flex-1 content-start gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {currentGigs.length > 0 ? (
                currentGigs.map((gig) => (
                  <GigCard
                    key={gig.id}
                    gig={gig}
                    requestHref={previewHref(gig)}
                    previewHref={previewHref(gig)}
                  />
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                  <p className="text-sm text-slate-500">
                    No live gigs match your search filters.
                  </p>
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
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                />
              </div>
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
        serviceCategories={serviceCategories}
        availabilityOptions={availabilityFilters}
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const availability = Array.isArray(gig.availability) ? gig.availability.join(", ") : gig.availability;
  const isFavorited = Boolean(
    userProfile?.favorites?.some(
      (fav) =>
        (fav as { gigId?: string; providerId?: string }).gigId === gig.id ||
        ((fav as { gigId?: string; providerId?: string }).gigId
          ? false
          : (fav as { providerId?: string }).providerId === gig.providerId),
    ),
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
        updatedFavorites = favorites.filter(
          (fav) =>
            (fav as { gigId?: string; providerId?: string }).gigId !== gig.id &&
            !(
              !(fav as { gigId?: string; providerId?: string }).gigId &&
              (fav as { providerId?: string }).providerId === gig.providerId
            ),
        );
      } else {
        const now = new Date();
        updatedFavorites = [
          ...favorites,
          {
            id: gig.id,
            gigId: gig.id,
            providerId: gig.providerId,
            title: gig.title,
            category: gig.category,
            instructor: gig.providerName,
            rating: formatRatingLabel(gig.rating),
            image: gig.image,
            avatar:
              gig.providerImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(gig.providerName)}&background=2f66e7&color=fff&size=400`,
            savedAt: `Saved ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
            description: gig.summary,
            university: gig.university,
            price: gig.price,
            availability: gig.availability,
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
    <>
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
            aria-label={isFavorited ? "Remove this gig from favorites" : "Save this gig to favorites"}
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${
              isFavorited ? "bg-red-500 text-white" : "bg-white/95 text-slate-700 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <HeartIcon className="h-4.5 w-4.5" filled={isFavorited} />
          </button>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
            <StarIcon className="h-3.5 w-3.5 text-amber-400" />
            {formatRatingLabel(gig.rating)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 text-[0.97rem] font-bold leading-6 text-slate-900">
          {gig.title}
        </h2>

        <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#2f66e7] text-[10px] font-bold text-white ring-2 ring-white">
            {gig.providerImage && gig.providerImage.startsWith("/") ? (
              <Image src={gig.providerImage} alt={gig.providerName} width={32} height={32} className="h-full w-full object-cover" />
            ) : (
              gig.providerName.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-700">
              {gig.providerName} <span className="font-medium text-slate-400">|</span>{" "}
              <span className="font-medium text-slate-500">{gig.university}</span>
            </p>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-[12.5px] leading-5 text-slate-600">
          {gig.summary}
        </p>

        <div className="mt-auto border-t border-slate-200 pt-3">
          <div className="flex flex-col gap-2 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span className="line-clamp-2 min-w-0">{availability}</span>
            <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold leading-none text-emerald-800 shadow-sm">
              {formatPrice(gig.price)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Gig
            </button>
            <Link
              href={requestHref}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#2f66e7] px-2 text-xs font-semibold text-white transition hover:bg-[#2557cf]"
            >
              Request Now
            </Link>
          </div>
        </div>
      </div>
    </article>
    {detailsOpen ? (
      <GigDetailsModal
        gig={gig}
        availability={availability}
        previewHref={previewHref}
        onClose={() => setDetailsOpen(false)}
      />
    ) : null}
    </>
  );
}

function GigDetailsModal({
  gig,
  availability,
  previewHref,
  onClose,
}: {
  gig: GigCardData;
  availability: string;
  previewHref: string;
  onClose: () => void;
}) {
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-md"
        onClick={onClose}
      >
        <article
          className="relative grid max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(243,248,255,0.97))] shadow-[0_32px_90px_rgba(15,23,42,0.22)] md:grid-cols-[1.02fr_0.98fr]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gig details"
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-500 shadow-[0_10px_26px_rgba(15,23,42,0.1)] transition hover:border-slate-300 hover:text-slate-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <div className="relative min-h-[260px] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(63,94,251,0.16),transparent_34%),linear-gradient(160deg,#edf4ff_0%,#f8fbff_46%,#eef8f6_100%)] p-5 md:min-h-[440px] md:p-7">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="relative flex h-full min-h-[220px] items-center justify-center overflow-hidden rounded-[26px] border border-white/80 bg-white/90 shadow-[0_20px_44px_rgba(15,23,42,0.09)] md:min-h-[360px]">
              <Image
                src={gig.image}
                alt={gig.title}
                fill
                className="object-contain p-5 md:p-7"
                sizes="(min-width: 768px) 420px, 100vw"
              />
            </div>
          </div>
          <div className="min-w-0 overflow-y-auto p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-[#1453c4] shadow-sm">
              {gig.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                {gig.reviews > 0 ? `${formatRatingLabel(gig.rating)} rating` : "New"}
              </span>
            </div>

            <h2 className="mt-4 break-words text-[1.85rem] font-black leading-[1.08] tracking-tight text-slate-900">
              {gig.title}
            </h2>
            <p className="mt-3 line-clamp-3 break-words text-[15px] leading-7 text-slate-600">
              {gig.summary || gig.description}
            </p>

            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <InfoItem label="Price" value={formatPrice(gig.price)} />
              <InfoItem label="Availability" value={availability || "Flexible"} />
              <InfoItem label="Provider" value={gig.providerName} />
              <InfoItem
                label="Rating"
                value={gig.reviews > 0 ? `${formatRatingLabel(gig.rating)} (${gig.reviews} reviews)` : "New"}
              />
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={previewHref}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2f66e7] px-6 text-sm font-semibold text-white transition hover:bg-[#2557cf]"
              >
                View Full Details
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </article>
      </div>
    </ModalPortal>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff,#ffffff)] px-4 py-3 shadow-[0_10px_22px_rgba(15,23,42,0.03)]">
      <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="mt-1.5 break-words text-[15px] font-semibold leading-6 text-slate-800">{value}</dd>
    </div>
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
  serviceCategories: string[];
  availabilityOptions: string[];
}) {
  const filterConfig = [
    { label: "Category", options: ["All Categories", ...props.serviceCategories] },
    { label: "University", options: ["Any University"] },
    { label: "Rating", options: ["Any Rating", "4.5+", "4.0+"] },
    { label: "Availability", options: props.availabilityOptions },
  ];

  return (
    <aside className="order-1 w-full shrink-0 lg:order-2 lg:w-[320px]">
      {/* Search and matching filters */}
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.03)] scrollbar-none sm:p-5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:min-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
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

        <div className="mt-5 flex-1 space-y-4 border-t border-slate-100 pt-4">
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
                <UniversityCombobox
                  key={filter.label}
                  label={filter.label}
                  value={props.universityFilter}
                  onSelect={props.setUniversityFilter}
                  emptyValue="Any University"
                  placeholder="Any University"
                  labelClassName="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                />
              );
            }

            return (
              <SelectField
                key={filter.label}
                label={filter.label}
                value={selectValue}
                onChange={selectHandler}
                options={filter.options}
                labelClassName="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                className="h-9 px-2.5 text-xs text-slate-700"
              />
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
    <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
      <button
        type="button"
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:text-xs"
      >
        Previous
      </button>
      {Array.from({ length: totalPages }).map((_, index) => {
        const pageNum = index + 1;
        return (
          <button
            type="button"
            key={pageNum}
            onClick={() => setCurrentPage(() => pageNum)}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-[11px] font-bold transition sm:text-xs ${
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
        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:text-xs"
      >
        Next
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
  return inferServiceCategory(skill);
}

function formatPrice(value: number | string | undefined) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Price on chat";
  return `LKR ${numeric.toLocaleString("en-LK")}`;
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 6l12 12" strokeLinecap="round" />
      <path d="M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
