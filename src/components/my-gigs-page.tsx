"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatRatingLabel } from "@/lib/ratings";
import { useAuth } from "@/context/AuthContext";
import type { ProviderGig, UserProfile } from "@/lib/auth";

type MyGigsPageContentProps = {
  activeTab?: "offered" | "manage";
  role?: "provider" | "both";
};

interface Gig {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  image: string;
  rawIndex: number;
  summary: string;
  availability: string;
  proficiency: string;
}

interface RequestItem {
  id: string;
  status?: string;
  providerId?: string;
  review?: {
    rating?: number;
  };
}

function getFallbackImage(index: number) {
  if (index % 3 === 1) return "/img/package%202.jpg";
  if (index % 3 === 2) return "/img/package%203.jpg";
  return "/img/package%201.jpg";
}

// Convert both the current gig format and older skill-only profiles into one card shape.
function buildGigs(profile: UserProfile): Gig[] {
  const providerProfile = profile.providerProfile;
  const storedGigs = providerProfile?.gigs || [];
  const legacySkills = providerProfile?.skills || [];
  const customImages = providerProfile?.gigImages || [];
  const providerBio = providerProfile?.bio?.trim();
  const providerAvailability = providerProfile?.availability?.join(", ");
  const providerProficiency = providerProfile?.proficiency || "Intermediate";

  if (storedGigs.length > 0) {
    return storedGigs.map((gig: ProviderGig, index: number) => ({
      id: `gig-${index}`,
      title: gig.title,
      shortTitle: gig.title,
      category: gig.category || legacySkills[index] || "General",
      image: gig.image || customImages[index] || getFallbackImage(index),
      rawIndex: index,
      summary:
        gig.summary ||
        gig.description ||
        providerBio ||
        `I offer ${gig.title.toLowerCase()} basics, guidance, and practical support for fellow university students.`,
      availability: gig.availability?.join(", ") || providerAvailability || "Flexible Schedule",
      proficiency: providerProfile?.proficiency || providerProficiency,
    }));
  }

  return legacySkills.map((skill: string, index: number) => ({
    id: `gig-${index}`,
    title: skill,
    shortTitle: skill.endsWith("Help") ? skill : `${skill} Help`,
    category: skill,
    image: customImages[index] || getFallbackImage(index),
    rawIndex: index,
    summary:
      providerBio ||
      `I offer ${skill.toLowerCase()} basics, guidance, and practical support for fellow university students.`,
    availability: providerAvailability || "Flexible Schedule",
    proficiency: providerProficiency,
  }));
}

export default function MyGigsPageContent({
  activeTab = "offered",
  role = "provider",
}: MyGigsPageContentProps) {
  const { userProfile, loading: authLoading, refreshProfile } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Gig | null>(null);
  const [deleteNotice, setDeleteNotice] = useState("");
  const [stats, setStats] = useState({
    trustScore: "99%",
    totalSwaps: "0",
    avgRating: "New",
    avgResponse: "1h",
    reviewsCount: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 4;

  useEffect(() => {
    if (!deleteNotice) return;

    const timer = window.setTimeout(() => setDeleteNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [deleteNotice]);

  const loading = authLoading || (userProfile ? dbLoading : false);

  useEffect(() => {
    if (!userProfile) {
      return;
    }

    // Request activity drives the performance summary shown above the gig list.
    const providerId = userProfile.uid;
    const requestsQuery = query(collection(db, "requests"), where("providerId", "==", providerId));

    const unsubscribeRequests = onSnapshot(
      requestsQuery,
      (qSnap) => {
        const reqs: RequestItem[] = [];

        qSnap.forEach((docSnap) => {
          const data = docSnap.data();
          reqs.push({
            id: docSnap.id,
            status: data.status,
            providerId: data.providerId,
            review: data.review,
          });
        });

        const completedRequests = reqs.filter((r) => r.status === "completed");
        const ratings = completedRequests
          .filter((r) => r.review && typeof r.review.rating === "number")
          .map((r) => r.review!.rating!);

        const avgRating =
          ratings.length > 0
            ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
            : 0;

        const totalRequests = reqs.length;
        const totalRejected = reqs.filter((r) => r.status === "rejected").length;
        const trustScore =
          totalRequests === 0
            ? "99%"
            : `${Math.min(100, Math.max(80, Math.round(((totalRequests - totalRejected) / totalRequests) * 100)))}%`;

        setStats({
          trustScore,
          totalSwaps: String(completedRequests.length),
          avgRating: formatRatingLabel(avgRating),
          avgResponse: "1h",
          reviewsCount: completedRequests.length,
        });

        setDbLoading(false);
      },
      (err) => {
        console.error("Error loading provider ratings in my gigs page:", err);
        setDbLoading(false);
      },
    );

    // The second listener keeps gig edits and deletions visible immediately.
    const unsubscribeUser = onSnapshot(
      doc(db, "users", providerId),
      (userSnap) => {
        if (!userSnap.exists()) {
          setGigs([]);
          setDbLoading(false);
          return;
        }

        setGigs(buildGigs(userSnap.data() as UserProfile));
        setDbLoading(false);
      },
      (err) => {
        console.error("Error loading provider data in my gigs page:", err);
        setDbLoading(false);
      },
    );

    return () => {
      unsubscribeRequests();
      unsubscribeUser();
    };
  }, [userProfile, authLoading]);

  const handleDeleteGig = async (rawIndex: number) => {
    if (!userProfile) return;

    try {
      const userRef = doc(db, "users", userProfile.uid);
      const existingSkills = (userProfile.providerProfile?.skills || []) as string[];
      const existingImages = (userProfile.providerProfile?.gigImages || []) as string[];
      const existingGigs = [...(userProfile.providerProfile?.gigs || [])];
      const removedGigId = existingGigs[rawIndex]?.id;
      // All three arrays use the same index, so they must be removed together.
      const updatedSkills = existingSkills.filter((_, idx) => idx !== rawIndex);
      const updatedImages = existingImages.filter((_, idx) => idx !== rawIndex);
      const updatedGigs = existingGigs.filter((_, idx) => idx !== rawIndex);

      await updateDoc(userRef, {
        "providerProfile.skills": updatedSkills,
        "providerProfile.gigImages": updatedImages,
        "providerProfile.gigs": updatedGigs,
      });

      if (removedGigId) {
        await updateDoc(doc(db, "gigs", removedGigId), {
          status: "removed",
          gigStatus: "removed",
          updatedAt: serverTimestamp(),
        });
      }

      await refreshProfile();
      setDeleteTarget(null);
      setDeleteNotice("Gig deleted successfully.");
    } catch (err) {
      console.error("Error removing skill gig:", err);
      setDeleteNotice("Failed to delete the gig. Please try again.");
    }
  };

  const isManageTab = activeTab === "manage";

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading your gigs...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
        Please sign in to view and manage your gigs.
      </div>
    );
  }

  const totalPages = Math.ceil(gigs.length / cardsPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  // Only the current slice is rendered, while the full list remains in memory.
  const currentGigs = gigs.slice((safeCurrentPage - 1) * cardsPerPage, safeCurrentPage * cardsPerPage);

  return (
    <section className="space-y-6 pb-10">
      {/* Provider performance summary */}
      {deleteNotice ? (
        <div className="fixed right-5 top-5 z-50 w-[min(92vw,360px)] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.45)]">
          <p className="text-sm font-semibold text-slate-900">{deleteNotice}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {deleteNotice.includes("Failed") ? "Nothing was removed." : "The list has been updated."}
          </p>
        </div>
      ) : null}

      <header>
        <h1 className="text-xl font-bold text-slate-900">
          {isManageTab ? "Manage Gigs" : "View All Gigs"}
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Trust Score" value={stats.trustScore} sub=" " accent />
        <MetricCard title="Total Swaps" value={stats.totalSwaps} sub="Completed" />
        <MetricCard title="Avg. Rating" value={stats.avgRating} sub={`${stats.reviewsCount} reviews`} teal stars />
        <MetricCard title="Avg. Response" value={stats.avgResponse} sub="Highly Responsive" />
      </div>

      {/* Offered gigs and management actions */}
      <section>
        <div className="flex items-center gap-6 border-b border-slate-200">
          <Link
            href="?tab=offered"
            className={`border-b-2 pb-3 text-[1rem] font-semibold sm:text-[1.05rem] ${
              !isManageTab ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-600"
            }`}
          >
            Offered Gigs
          </Link>
          <Link
            href="?tab=manage"
            className={`border-b-2 pb-3 text-[1rem] font-semibold sm:text-[1.05rem] ${
              isManageTab ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-600"
            }`}
          >
            Manage Gigs
          </Link>
        </div>

        {currentGigs.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {currentGigs.map((gig) => (
              <article
                key={gig.id}
                className="mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-[20px] border border-[#d9e3f1] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative">
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-white px-3.5 py-1 text-[12px] font-semibold text-[#1453c4] shadow-sm">
                    {gig.category}
                  </div>
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px] font-bold text-slate-800 shadow-sm">
                    <RatingStarIcon className="h-3.5 w-3.5 text-amber-400" />
                    <span>{stats.avgRating}</span>
                  </div>
                  <Link
                    href={`/gig-preview/${role}?source=my-gigs&providerId=${encodeURIComponent(userProfile.uid)}&skillIndex=${gig.rawIndex}`}
                    className="relative block h-36 w-full overflow-hidden bg-slate-100 sm:h-[150px]"
                  >
                    <Image
                      src={gig.image}
                      alt={gig.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 320px"
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </Link>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-[16px]">
                  <h2 className="text-[0.95rem] font-bold leading-[1.22] text-slate-900 transition hover:text-[#1453c4]">
                    <Link
                      href={`/gig-preview/${role}?source=my-gigs&providerId=${encodeURIComponent(userProfile.uid)}&skillIndex=${gig.rawIndex}`}
                    >
                      {gig.title}
                    </Link>
                  </h2>

                  <div className="mt-2">
                    <p className="text-[13px] font-semibold leading-5 text-slate-700">
                      {userProfile.name}
                    </p>
                    <p className="text-[12px] leading-5 text-slate-500">
                      {userProfile.university || "Sri Lankan University"}
                    </p>
                  </div>

                  <div className="mt-2">
                    <p className="text-[12.5px] leading-5 text-slate-600 line-clamp-2">
                      {gig.summary}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#dff7f5] px-3 py-1 text-[12px] font-semibold text-[#0d7f78]">
                      {gig.category}
                    </span>
                    <span className="rounded-full bg-[#dff7f5] px-3 py-1 text-[12px] font-semibold text-[#0d7f78]">
                      {gig.proficiency}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2.5 border-t border-slate-200 pt-2.5">
                    <span className="truncate text-[12px] text-slate-500">
                      {gig.availability}
                    </span>
                    <span className="shrink-0 rounded-full bg-[#dff7f5] px-2.5 py-1 text-[11px] font-semibold text-[#0d7f78]">
                      Service Gig
                    </span>
                  </div>

                  {!isManageTab ? (
                    <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                      <Link
                        href={`/gig-preview/${role}?source=my-gigs&providerId=${encodeURIComponent(userProfile.uid)}&skillIndex=${gig.rawIndex}`}
                        className="rounded-[13px] border border-[#cfd8e8] px-3.5 py-2.5 text-center text-[14px] font-semibold text-[#2f4c7f] transition hover:border-[#b8c6dc] hover:bg-slate-50"
                      >
                        View Gig
                      </Link>
                      <Link
                        href="?tab=manage"
                        className="rounded-[13px] bg-[#3568e6] px-3.5 py-2.5 text-center text-[14px] font-semibold text-white transition hover:bg-[#2458d8]"
                      >
                        Manage
                      </Link>
                    </div>
                  ) : null}
                </div>

                {isManageTab ? (
                  <div className="px-4 pb-4 pt-0 sm:px-[18px] sm:pb-[18px]">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2.5">
                      <Link
                        href={`/edit-gig/${role}/${gig.id}`}
                        className="rounded-[13px] border border-[#cfd8e8] px-3.5 py-2.5 text-center text-[14px] font-semibold text-[#2f4c7f] transition hover:border-[#b8c6dc] hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(gig)}
                        aria-label="Delete gig"
                        className="flex h-[44px] w-[44px] items-center justify-center rounded-[13px] border border-[#f0c8c8] text-red-500 transition hover:bg-red-50 hover:text-red-700"
                      >
                        <DeleteIcon className="h-[18px] w-[18px]" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            {"You don't have any gigs listed under this tab."}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
            >
              {"<"}
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xs font-bold transition ${
                    safeCurrentPage === pageNum
                      ? "bg-[#2f66e7] text-white"
                      : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.max(1, totalPages)))}
              disabled={safeCurrentPage === totalPages || totalPages === 0}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
            >
              {">"}
            </button>
          </div>
        )}

        {isManageTab && (
          <div className="mt-6 rounded-xl border-2 border-dashed border-[#c8d0ee] bg-[#f3f5ff] py-8 text-center">
            <Link
              href={`/post-gig/${role}`}
              aria-label="Post a New Gig"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-slate-400 text-xl text-slate-500 transition hover:border-slate-600 hover:text-slate-700"
            >
              +
            </Link>
            <Link
              href={`/post-gig/${role}`}
              className="mt-3 block text-xl font-bold text-slate-700 transition hover:text-[#1453c4]"
            >
              Post a New Gig
            </Link>
            <p className="mt-1 text-xs text-slate-500">Offer your expertise to fellow students</p>
          </div>
        )}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.55)]">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <DeleteIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-red-500">Delete Gig</p>
                <h2 className="text-base font-semibold text-slate-900">
                  Delete this gig from your profile?
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              This will remove <span className="font-semibold text-slate-700">{deleteTarget.shortTitle}</span> from your public gigs list.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteGig(deleteTarget.rawIndex)}
                className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MetricCard({
  title,
  value,
  sub,
  accent = false,
  teal = false,
  stars = false,
}: {
  title: string;
  value: string;
  sub: string;
  accent?: boolean;
  teal?: boolean;
  stars?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
      <p className="mt-2.5 text-[2.45rem] font-bold leading-none text-slate-900">{value}</p>
      {stars ? <Stars className="mt-2 justify-center text-teal-700" /> : null}
      {sub ? (
        <p className={`mt-1.5 text-sm ${teal ? "font-semibold text-teal-700" : "text-slate-500"}`}>
          {sub}
        </p>
      ) : null}
      {accent ? <div className="mx-auto mt-3 h-1 w-full rounded-full bg-teal-500" /> : null}
    </article>
  );
}

function Stars({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className ?? ""}`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          className="h-3.5 w-3.5 fill-current text-amber-500"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 1.7l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L2.2 7.4l5.4-.8L10 1.7z" />
        </svg>
      ))}
    </div>
  );
}

function RatingStarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 1.7l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L2.2 7.4l5.4-.8L10 1.7z" />
    </svg>
  );
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <path
        d="M9 4.75h6l.55 1.75H19a.75.75 0 0 1 0 1.5h-1l-.7 10.03a2 2 0 0 1-2 1.86h-6.6a2 2 0 0 1-2-1.86L6 8H5a.75.75 0 0 1 0-1.5h3.45L9 4.75z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 10.25v5.5M14 10.25v5.5" strokeLinecap="round" />
    </svg>
  );
}
