"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getRoleBadge, getVerificationBadge, type IdentityRole } from "@/lib/identity-badges";

type Role = "buyer" | "provider" | "both";
type ReviewsTab = "received" | "given";

type RatingsPageContentProps = { role: Role };

interface ReviewItem {
  id: string;
  partnerName: string;
  partnerUniversity: string;
  skill: string;
  rating: number;
  comment: string;
  isFromProvider?: boolean; // true if a provider left this review for the user (buyer)
  partnerRole: IdentityRole;
}

export default function RatingsPageContent({ role }: RatingsPageContentProps) {
  const { userProfile, loading } = useAuth();
  const [received, setReceived]   = useState<ReviewItem[]>([]);
  const [given, setGiven]         = useState<ReviewItem[]>([]);
  const [fetching, setFetching]   = useState(false);

  // Start with feedback about the user, which is usually the most useful view.
  const [tab, setTab] = useState<ReviewsTab>("received");
  const [filterStars, setFilterStars] = useState<"all" | "5" | "4" | "3">("all");

  useEffect(() => {
    if (!userProfile) return;

    async function load() {
      setFetching(true);
      try {
        const receivedList: ReviewItem[] = [];
        const givenList: ReviewItem[] = [];

        // Provider-side requests can contain reviews written in both directions.
        const asProviderSnap = await getDocs(
          query(collection(db, "requests"),
            where("providerId", "==", userProfile!.uid),
            where("status", "==", "completed"))
        );

        asProviderSnap.forEach((d) => {
          const r = d.data();
          // The buyer's review belongs in this user's received list.
          if (r.review && typeof r.review.rating === "number") {
            receivedList.push({
              id: `recv-prov-${d.id}`,
              partnerName: r.buyerName || "Anonymous Buyer",
              partnerUniversity: r.buyerUniversity || "Swap Partner",
              skill: r.title || "Skill Swap",
              rating: r.review.rating,
              comment: r.review.comment || "",
              partnerRole: "buyer",
            });
          }
          // The provider's review belongs in this user's given list.
          if (r.providerReview && typeof r.providerReview.rating === "number") {
            givenList.push({
              id: `given-prov-${d.id}`,
              partnerName: r.buyerName || "Anonymous Buyer",
              partnerUniversity: r.buyerUniversity || "Swap Partner",
              skill: r.title || "Skill Swap",
              rating: r.providerReview.rating,
              comment: r.providerReview.comment || "",
              partnerRole: "buyer",
            });
          }
        });

        // Buyer-side requests are mapped the same way from the opposite role.
        const asBuyerSnap = await getDocs(
          query(collection(db, "requests"),
            where("buyerId", "==", userProfile!.uid),
            where("status", "==", "completed"))
        );

        asBuyerSnap.forEach((d) => {
          const r = d.data();
          // The provider's review belongs in this user's received list.
          if (r.providerReview && typeof r.providerReview.rating === "number") {
            receivedList.push({
              id: `recv-buyer-${d.id}`,
              partnerName: r.providerName || "Anonymous Provider",
              partnerUniversity: r.providerUniversity || "Swap Partner",
              skill: r.title || "Skill Swap",
              rating: r.providerReview.rating,
              comment: r.providerReview.comment || "",
              isFromProvider: true,
              partnerRole: "provider",
            });
          }
          // The buyer's review belongs in this user's given list.
          if (r.review && typeof r.review.rating === "number") {
            givenList.push({
              id: `given-buyer-${d.id}`,
              partnerName: r.providerName || "Anonymous Provider",
              partnerUniversity: r.providerUniversity || "Swap Partner",
              skill: r.title || "Skill Swap",
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
      where("providerId", "==", userProfile.uid),
      where("status", "==", "completed")
    );
    const buyerQuery = query(
      collection(db, "requests"),
      where("buyerId", "==", userProfile.uid),
      where("status", "==", "completed")
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

  // Summary scores use received reviews only, never reviews written by the user.
  const avgRating = received.length
    ? (received.reduce((s, r) => s + r.rating, 0) / received.length).toFixed(1)
    : "–";
  const totalReceived = received.length;
  const dist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: received.filter((r) => r.rating === s).length,
    pct: received.length ? Math.round((received.filter((r) => r.rating === s).length / received.length) * 100) : 0,
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
      {/* Rating summary and received/given tabs */}
      <header>
        <h1 className="text-xl font-bold text-slate-900">Ratings &amp; Reviews</h1>
        <p className="mt-1 text-xs text-slate-500">Manage your reputation and view feedback from your swap partners.</p>
      </header>

      {/* Stats row - Hidden for pure buyers who do not have public listing stats */}
      {role !== "buyer" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rating</p>
            <p className="mt-2 text-4xl font-bold leading-none text-[#1453c4]">{avgRating}</p>
            <p className="mt-2 text-lg leading-none text-amber-500">
              {avgRating !== "–" 
                ? "★".repeat(Math.round(Number(avgRating) || 0)) + "☆".repeat(5 - Math.round(Number(avgRating) || 0)) 
                : "☆☆☆☆☆"}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-700">Review Summary</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_80px] sm:items-center">
              <div className="space-y-1.5">
                {dist.map(({ star, pct }) => (
                  <div key={star} className="grid grid-cols-[14px_minmax(0,1fr)_28px] items-center gap-1.5 text-xs text-slate-600">
                    <span>{star}</span>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#1453c4]" style={{ width: `${pct}%` }} />
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

      {/* Tabs */}
      <div className="flex items-center gap-5 border-b border-slate-200">
        <button
          onClick={() => setTab("received")}
          className={`border-b-2 pb-2.5 text-sm font-semibold ${tab === "received" ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Reviews Received {received.length > 0 && <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">{received.length}</span>}
        </button>
        <button
          onClick={() => setTab("given")}
          className={`border-b-2 pb-2.5 text-sm font-semibold ${tab === "given" ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Reviews Given {given.length > 0 && <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">{given.length}</span>}
        </button>
      </div>

      {/* Filter pills */}
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

      {/* Review list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-400">
            No reviews found.
          </div>
        ) : (
          filtered.map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#2f66e7]">
                    {review.partnerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900">{review.partnerName}</p>
                      <span className={`rounded-full px-2 py-0.25 text-[9px] font-extrabold ${getRoleBadge(review.partnerRole).className}`}>
                        {getRoleBadge(review.partnerRole).label}
                      </span>
                      {getVerificationBadge(review.partnerRole, review.partnerRole !== "buyer") ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.25 text-[9px] font-extrabold ${getVerificationBadge(review.partnerRole, review.partnerRole !== "buyer")?.className}`}>
                          <VerifiedBadgeIcon className={`h-3 w-3 ${getVerificationBadge(review.partnerRole, review.partnerRole !== "buyer")?.iconClassName}`} />
                          {getVerificationBadge(review.partnerRole, review.partnerRole !== "buyer")?.label}
                        </span>
                      ) : null}
                    </div>
                    {review.partnerUniversity && (
                      <p className="text-[11px] text-slate-400">{review.partnerUniversity}</p>
                    )}
                    <p className="mt-0.5 text-amber-500 text-xs">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 shrink-0">{review.skill}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-700">&ldquo;{review.comment}&rdquo;</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function VerifiedBadgeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.8 14.1 5l3-.5.9 2.9 2.8 1.3-1.4 2.7 1.4 2.7-2.8 1.3-.9 2.9-3-.5L12 20l-2.1-2.2-3 .5-.9-2.9-2.8-1.3 1.4-2.7-1.4-2.7L6 7.4l.9-2.9 3 .5z" />
      <path d="m9.6 12.1 1.6 1.6 3.4-3.5" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}
