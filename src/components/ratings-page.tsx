"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getVerificationBadge, type IdentityRole } from "@/lib/identity-badges";
import ReviewCard from "@/components/reviews/review-card";

type Role = "buyer" | "provider" | "both";
type ReviewsTab = "received" | "given";

type RatingsPageContentProps = { role: Role };

interface ReviewItem {
  id: string;
  partnerName: string;
  partnerUniversity: string;
  skill: string;
  serviceCategory?: string;
  rating: number;
  comment: string;
  isFromProvider?: boolean;
  partnerRole: IdentityRole;
}

export default function RatingsPageContent({ role }: RatingsPageContentProps) {
  const { userProfile, loading } = useAuth();
  const [received, setReceived] = useState<ReviewItem[]>([]);
  const [given, setGiven] = useState<ReviewItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [tab, setTab] = useState<ReviewsTab>("received");
  const [filterStars, setFilterStars] = useState<"all" | "5" | "4" | "3">("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!userProfile) return;
    const currentUserId = userProfile.uid;

    async function load() {
      setFetching(true);
      try {
        const receivedList: ReviewItem[] = [];
        const givenList: ReviewItem[] = [];

        const asProviderSnap = await getDocs(
          query(
            collection(db, "requests"),
            where("providerId", "==", currentUserId),
            where("status", "==", "completed"),
          ),
        );

        asProviderSnap.forEach((d) => {
          const r = d.data();
          if (r.review && typeof r.review.rating === "number") {
            receivedList.push({
              id: `recv-prov-${d.id}`,
              partnerName: r.buyerName || "Anonymous Buyer",
              partnerUniversity: r.buyerUniversity || "Swap Partner",
              skill: r.title || "Skill Swap",
              serviceCategory: r.category || "Service",
              rating: r.review.rating,
              comment: r.review.comment || "",
              partnerRole: "buyer",
            });
          }
          if (r.providerReview && typeof r.providerReview.rating === "number") {
            givenList.push({
              id: `given-prov-${d.id}`,
              partnerName: r.buyerName || "Anonymous Buyer",
              partnerUniversity: r.buyerUniversity || "Swap Partner",
              skill: r.title || "Skill Swap",
              serviceCategory: r.category || "Service",
              rating: r.providerReview.rating,
              comment: r.providerReview.comment || "",
              partnerRole: "buyer",
            });
          }
        });

        const asBuyerSnap = await getDocs(
          query(
            collection(db, "requests"),
            where("buyerId", "==", currentUserId),
            where("status", "==", "completed"),
          ),
        );

        asBuyerSnap.forEach((d) => {
          const r = d.data();
          if (r.providerReview && typeof r.providerReview.rating === "number") {
            receivedList.push({
              id: `recv-buyer-${d.id}`,
              partnerName: r.providerName || "Anonymous Provider",
              partnerUniversity: r.providerUniversity || "Swap Partner",
              skill: r.title || "Skill Swap",
              serviceCategory: r.category || "Service",
              rating: r.providerReview.rating,
              comment: r.providerReview.comment || "",
              isFromProvider: true,
              partnerRole: "provider",
            });
          }
          if (r.review && typeof r.review.rating === "number") {
            givenList.push({
              id: `given-buyer-${d.id}`,
              partnerName: r.providerName || "Anonymous Provider",
              partnerUniversity: r.providerUniversity || "Swap Partner",
              skill: r.title || "Skill Swap",
              serviceCategory: r.category || "Service",
              rating: r.review.rating,
              comment: r.review.comment || "",
              partnerRole: "provider",
            });
          }
        });

        setReceived(receivedList);
        setGiven(givenList);
      } catch (err) {
        console.error("Error loading ratings:", err);
      } finally {
        setFetching(false);
      }
    }

    const providerQuery = query(
      collection(db, "requests"),
      where("providerId", "==", currentUserId),
      where("status", "==", "completed"),
    );
    const buyerQuery = query(
      collection(db, "requests"),
      where("buyerId", "==", currentUserId),
      where("status", "==", "completed"),
    );

    const unsubscribeProvider = onSnapshot(providerQuery, () => {
      void load();
    });
    const unsubscribeBuyer = onSnapshot(buyerQuery, () => {
      void load();
    });

    return () => {
      unsubscribeProvider();
      unsubscribeBuyer();
    };
  }, [userProfile]);

  const activeList = tab === "received" ? received : given;
  const filtered = useMemo(() => {
    if (filterStars === "all") return activeList;
    const n = Number(filterStars);
    return activeList.filter((r) => r.rating === n);
  }, [activeList, filterStars]);
  const reviewsPerPage = filtered.length > 1 ? 2 : 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / reviewsPerPage));
  const pagedReviews = filtered.slice(
    page * reviewsPerPage,
    page * reviewsPerPage + reviewsPerPage,
  );

  useEffect(() => {
    setPage(0);
  }, [tab, filterStars, userProfile?.uid]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const avgRating = received.length
    ? (received.reduce((s, r) => s + r.rating, 0) / received.length).toFixed(1)
    : "–";
  const totalReceived = received.length;
  const dist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: received.filter((r) => r.rating === s).length,
    pct: received.length
      ? Math.round(
          (received.filter((r) => r.rating === s).length / received.length) * 100,
        )
      : 0,
  }));

  if (loading || fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="space-y-5 pb-10">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Ratings &amp; Reviews</h1>
        <p className="mt-1 text-xs text-slate-500">
          Manage your reputation and view feedback from your swap partners.
        </p>
      </header>

      {role !== "buyer" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Rating
            </p>
            <p className="mt-2 text-4xl font-bold leading-none text-[#1453c4]">
              {avgRating}
            </p>
            <p className="mt-2 text-lg leading-none text-amber-500">
              {avgRating !== "–"
                ? "★".repeat(Math.round(Number(avgRating) || 0)) +
                  "☆".repeat(5 - Math.round(Number(avgRating) || 0))
                : "☆☆☆☆☆"}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-700">Review Summary</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_80px] sm:items-center">
              <div className="space-y-1.5">
                {dist.map(({ star, pct }) => (
                  <div
                    key={star}
                    className="grid grid-cols-[14px_minmax(0,1fr)_28px] items-center gap-1.5 text-xs text-slate-600"
                  >
                    <span>{star}</span>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#1453c4]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-right">{pct}%</span>
                  </div>
                ))}
              </div>
              <div className="border-l border-slate-200 pl-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{totalReceived}</p>
                <p className="text-xs text-slate-500">Reviews</p>
              </div>
            </div>
          </article>
        </div>
      )}

      <div className="flex items-center gap-5 border-b border-slate-200">
        <button
          onClick={() => setTab("received")}
          className={`border-b-2 pb-2.5 text-sm font-semibold ${tab === "received" ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Reviews Received{" "}
          {received.length > 0 && (
            <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">
              {received.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("given")}
          className={`border-b-2 pb-2.5 text-sm font-semibold ${tab === "given" ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Reviews Given{" "}
          {given.length > 0 && (
            <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">
              {given.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Filter:</span>
        {(["all", "5", "4", "3"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setFilterStars(v)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${filterStars === v ? "bg-[#1453c4] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {v === "all" ? "All" : `${v} ★`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length > 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.03)]">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {tab === "received" ? "Feedback you received" : "Feedback you shared"}
              </p>
              <p className="text-xs text-slate-500">
                {filtered.length} review{filtered.length !== 1 ? "s" : ""} available
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
                aria-label="Previous reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#1453c4] hover:text-[#1453c4] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages - 1, current + 1))
                }
                disabled={page >= totalPages - 1}
                aria-label="Next reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#1453c4] hover:text-[#1453c4] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-400">
            No reviews found.
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {pagedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                reviewerName={review.partnerName}
                reviewerMeta={review.partnerUniversity}
                rating={review.rating}
                comment={review.comment}
                serviceTitle={review.skill}
                serviceCategory={review.serviceCategory}
                contextLabel={tab === "received" ? "Reviewed Service" : "Rated Service"}
                directionLabel={tab === "received" ? "Received" : "Given"}
                roleLabel={
                  getVerificationBadge(review.partnerRole, review.partnerRole !== "buyer")
                    ?.label ||
                  (review.partnerRole === "buyer" ? "Buyer" : "Provider")
                }
                tone={tab === "received" ? "blue" : "amber"}
                compact
                className="h-full border-slate-200/70"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
