"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
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
    : "-";
  const totalReceived = received.length;
  const totalGiven = given.length;
  const currentRoleLabel =
    role === "both" ? "Buyer + Provider" : role === "provider" ? "Provider" : "Buyer";
  const dist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: received.filter((r) => r.rating === s).length,
    pct: received.length
      ? Math.round((received.filter((r) => r.rating === s).length / received.length) * 100)
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
      <header className="rounded-[1.4rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,248,255,0.97))] p-6 shadow-[0_16px_36px_rgba(15,23,42,0.04)] sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1453c4]">
              {currentRoleLabel} Reputation
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
              Ratings &amp; Reviews
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
              Manage your reputation, review partner feedback, and keep every completed
              swap easy to revisit from one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <MetricCard
              label="Average Rating"
              value={avgRating}
              suffix="/ 5.0"
              helper="Your current received review average."
              accent="blue"
            />
            <MetricCard
              label="Reviews Received"
              value={String(totalReceived)}
              helper="Feedback collected from completed swaps."
            />
            <MetricCard
              label="Reviews Given"
              value={String(totalGiven)}
              helper="Ratings and comments you shared."
            />
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <article className="rounded-[1.3rem] border border-slate-200/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Feedback View
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">
                Switch between received and given reviews
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {tab === "received"
                ? "See what others said about your completed swaps."
                : "Review the feedback you already shared with partners."}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <TabSummaryCard
              title="Reviews Received"
              description="Ratings from your swap partners after finished work."
              count={received.length}
              active={tab === "received"}
              tone="blue"
              onClick={() => setTab("received")}
            />
            <TabSummaryCard
              title="Reviews Given"
              description="Comments and ratings you sent to others."
              count={given.length}
              active={tab === "given"}
              tone="amber"
              onClick={() => setTab("given")}
            />
          </div>
        </article>

        <article className="rounded-[1.3rem] border border-slate-200/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Review Summary
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">
                Received rating breakdown
              </h2>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
              <p className="text-2xl font-bold leading-none text-slate-900">{totalReceived}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Reviews
              </p>
            </div>
          </div>

          <div className="mt-4">
            <RatingStars rating={avgRating === "-" ? 0 : Number(avgRating)} />
          </div>

          <div className="mt-5 space-y-3">
            {dist.map(({ star, pct, count }) => (
              <div
                key={star}
                className="grid grid-cols-[18px_minmax(0,1fr)_42px_36px] items-center gap-2 text-sm text-slate-600"
              >
                <span className="font-semibold">{star}</span>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#2b62e6,#61b9f8)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right text-xs font-semibold text-slate-400">{pct}%</span>
                <span className="text-right text-xs font-semibold text-slate-500">{count}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="rounded-[1.3rem] border border-slate-200/80 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.035)] sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {(["received", "given"] as const).map((value) => {
                const active = tab === value;
                const count = value === "received" ? received.length : given.length;

                return (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-[#1453c4] bg-[#1453c4] text-white shadow-[0_10px_24px_rgba(43,98,230,0.18)]" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"}`}
                  >
                    <span>{value === "received" ? "Reviews Received" : "Reviews Given"}</span>
                    <span
                      className={`inline-flex min-w-7 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Filter by rating
              </span>
              {(["all", "5", "4", "3"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilterStars(v)}
                  className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${filterStars === v ? "border-[#1453c4] bg-blue-50 text-[#1453c4]" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}
                >
                  {v === "all" ? "All ratings" : `${v} star`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                {tab === "received" ? "Feedback you received" : "Feedback you shared"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {filtered.length} review{filtered.length !== 1 ? "s" : ""} available
              </p>
            </div>

            {filtered.length > 0 ? (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-sm font-semibold text-slate-400">
                  {Math.min(page + 1, totalPages)} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  aria-label="Previous reviews"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#1453c4] hover:text-[#1453c4] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next reviews"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#1453c4] hover:text-[#1453c4] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-slate-700">No reviews found</p>
            <p className="mt-2 text-sm text-slate-400">
              Try another rating filter or switch the feedback tab.
            </p>
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
                    ?.label || (review.partnerRole === "buyer" ? "Buyer" : "Provider")
                }
                tone={tab === "received" ? "blue" : "amber"}
                compact
                tight
                className="h-full border-slate-200/70"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  helper,
  suffix,
  accent = "slate",
}: {
  label: string;
  value: string;
  helper: string;
  suffix?: string;
  accent?: "blue" | "slate";
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <div className="mt-3 flex items-end gap-2">
        <span
          className={`text-4xl font-bold leading-none ${accent === "blue" ? "text-[#1453c4]" : "text-slate-900"}`}
        >
          {value}
        </span>
        {suffix ? (
          <span className="pb-1 text-xs font-semibold text-slate-400">{suffix}</span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
}

function TabSummaryCard({
  title,
  description,
  count,
  active,
  tone,
  onClick,
}: {
  title: string;
  description: string;
  count: number;
  active: boolean;
  tone: "blue" | "amber";
  onClick: () => void;
}) {
  const activeClasses =
    tone === "blue"
      ? "border-blue-200 bg-[linear-gradient(135deg,rgba(43,98,230,0.08),rgba(81,164,255,0.04))] shadow-[0_10px_24px_rgba(43,98,230,0.08)]"
      : "border-amber-200 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,247,237,0.9))] shadow-[0_10px_24px_rgba(245,158,11,0.08)]";

  const countClasses =
    tone === "blue" ? "bg-[#1453c4] text-white" : "bg-amber-500 text-white";

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition ${active ? activeClasses : "border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <span
          className={`inline-flex min-w-9 items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold ${active ? countClasses : "bg-slate-200 text-slate-600"}`}
        >
          {count}
        </span>
      </div>
    </button>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-1" aria-label={`${rounded} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < rounded;
        return (
          <svg
            key={index}
            viewBox="0 0 24 24"
            className={`h-4.5 w-4.5 ${filled ? "text-amber-400" : "text-amber-200"}`}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 17.3 6.8 20l1-5.7L3.6 10l5.7-.8L12 3.9l2.7 5.3 5.7.8-4.2 4.3 1 5.7z" />
          </svg>
        );
      })}
    </div>
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
