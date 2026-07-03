"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type MyGigsPageContentProps = {
  activeTab?: "offered" | "manage";
  role?: "provider" | "both";
};

interface Gig {
  id: string;
  title: string;
  rating: string;
  reviews: number;
  category: string;
  points: number;
  image: string;
  rawIndex: number;
}

interface RequestItem {
  id: string;
  status?: string;
  providerId?: string;
  review?: {
    rating?: number;
  };
}

export default function MyGigsPageContent({
  activeTab = "offered",
  role = "provider",
}: MyGigsPageContentProps) {
  const { userProfile, loading: authLoading, refreshProfile } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [stats, setStats] = useState({
    trustScore: "99%",
    totalSwaps: "0",
    avgRating: "5.0",
    avgResponse: "1h",
    reviewsCount: 0,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 4;

  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);
  if (activeTab !== prevActiveTab) {
    setPrevActiveTab(activeTab);
    setCurrentPage(1);
  }

  const loading = authLoading || (userProfile ? dbLoading : false);

  useEffect(() => {
    if (!userProfile) {
      return;
    }
    const providerId = userProfile.uid;

    async function loadProviderData() {
      try {
        // Fetch requests for this provider to calculate real stats
        const q = query(
          collection(db, "requests"),
          where("providerId", "==", providerId)
        );
        const qSnap = await getDocs(q);
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
        const totalSwaps = completedRequests.length;
        
        // Calculate dynamic average rating
        const ratings = completedRequests
          .filter((r) => r.review && typeof r.review.rating === "number")
          .map((r) => r.review!.rating!);
        const avgRating = ratings.length > 0 
          ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
          : 5.0;

        // Calculate dynamic trust score
        const totalRequests = reqs.length;
        const totalRejected = reqs.filter((r) => r.status === "rejected").length;
        const trustScore = totalRequests === 0 
          ? "99%" 
          : `${Math.min(100, Math.max(80, Math.round(((totalRequests - totalRejected) / totalRequests) * 100)))}%`;

        setStats({
          trustScore,
          totalSwaps: String(totalSwaps),
          avgRating: avgRating.toFixed(1),
          avgResponse: "1h",
          reviewsCount: completedRequests.length,
        });

        // Generate actual offered gigs based on the skills stored in providerProfile
        const skills: string[] = userProfile?.providerProfile?.skills || [];
        const customImages: string[] = userProfile?.providerProfile?.gigImages || [];
        const dbGigs = skills.map((skill: string, index: number) => {
          let image = customImages[index];
          if (!image) {
            image = "/img/package%201.jpg";
            if (index % 3 === 1) image = "/img/package%202.jpg";
            if (index % 3 === 2) image = "/img/package%203.jpg";
          }
          return {
            id: `gig-${index}`,
            title: `Collaboration: ${skill}`,
            rating: avgRating.toFixed(1),
            reviews: completedRequests.length,
            category: skill,
            points: 30 + (index * 5),
            image,
            rawIndex: index,
          };
        });

        setGigs(dbGigs);
      } catch (err) {
        console.error("Error loading provider data in my gigs page:", err);
      } finally {
        setDbLoading(false);
      }
    }

    loadProviderData();
  }, [userProfile, authLoading]);

  // Pagination is reset during render when activeTab changes

  const handleDeleteGig = async (rawIndex: number) => {
    if (!userProfile) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this offered skill?");
    if (!confirmDelete) return;

    try {
      const userRef = doc(db, "users", userProfile.uid);
      const existingSkills = (userProfile.providerProfile?.skills || []) as string[];
      const existingImages = (userProfile.providerProfile?.gigImages || []) as string[];
      const updatedSkills = existingSkills.filter((_, idx) => idx !== rawIndex);
      const updatedImages = existingImages.filter((_, idx) => idx !== rawIndex);

      await updateDoc(userRef, {
        "providerProfile.skills": updatedSkills,
        "providerProfile.gigImages": updatedImages,
      });

      await refreshProfile();
      alert("Offered skill removed successfully.");
    } catch (err) {
      console.error("Error removing skill gig:", err);
      alert("Failed to delete the skill. Please try again.");
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
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-500">
        Please sign in to view and manage your gigs.
      </div>
    );
  }

  // Calculate pagination parameters
  const totalPages = Math.ceil(gigs.length / cardsPerPage);
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentGigs = gigs.slice(indexOfFirstCard, indexOfLastCard);

  return (
    <section className="space-y-6 pb-10">
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

      <section>
        <div className="flex items-center gap-8 border-b border-slate-200">
          <Link
            href="?tab=offered"
            className={`border-b-2 pb-3 text-[1.15rem] font-semibold ${
              !isManageTab ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-600"
            }`}
          >
            Offered Gigs
          </Link>
          <Link
            href="?tab=manage"
            className={`border-b-2 pb-3 text-[1.15rem] font-semibold ${
              isManageTab ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-600"
            }`}
          >
            Manage Gigs
          </Link>
        </div>

        {currentGigs.length > 0 ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {currentGigs.map((gig) => (
              <article
                key={gig.id}
                className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div>
                  <Link
                    href={`/gig-preview/${role}?source=my-gigs&providerId=${encodeURIComponent(userProfile?.uid || "")}&skillIndex=${gig.rawIndex}`}
                    className="relative block h-48 w-full overflow-hidden bg-slate-100 xl:h-52"
                  >
                    <Image
                      src={gig.image}
                      alt={gig.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 320px"
                      className="h-full w-full object-cover hover:scale-105 transition duration-300"
                    />
                  </Link>

                  <div className="p-5">
                    <h2 className="min-h-[3.75rem] text-[1.15rem] font-semibold leading-7 text-slate-900 line-clamp-2 transition hover:text-[#1453c4]">
                      <Link href={`/gig-preview/${role}?source=my-gigs&providerId=${encodeURIComponent(userProfile?.uid || "")}&skillIndex=${gig.rawIndex}`}>
                        {gig.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      <span className="text-teal-700">★</span> {gig.rating}{" "}
                      <span className="font-normal text-slate-500">({gig.reviews} reviews)</span>
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <span className="max-w-[60%] truncate rounded-full bg-teal-50 px-3.5 py-1.5 text-sm font-semibold text-teal-700">
                        {gig.category}
                      </span>
                      <span className="shrink-0 text-base font-semibold text-[#1453c4]">{gig.points}</span>
                    </div>
                  </div>
                </div>

                {isManageTab && (
                  <div className="p-5 pt-0">
                    <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                      <Link
                        href={`/edit-gig/${role}/${gig.id}`}
                        className="flex-1 rounded-xl bg-[#e5e7f2] px-3 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-[#d9dbe6]"
                      >
                        Edit
                      </Link>
                      <button
                        aria-label="Pause gig"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-500 transition hover:bg-slate-50"
                      >
                        ‖
                      </button>
                      <button
                        onClick={() => handleDeleteGig(gig.rawIndex)}
                        aria-label="Delete gig"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-red-500 transition hover:bg-slate-50 hover:text-red-700"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            {"You don't have any gigs listed under this tab."}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
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
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
            >
              ›
            </button>
          </div>
        )}

        {isManageTab && (
          <div className="mt-6 rounded-xl border-2 border-dashed border-[#c8d0ee] bg-[#f3f5ff] py-8 text-center">
            <Link
              href={`/post-gig/${role}`}
              aria-label="Post a New Gig"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-slate-400 hover:border-slate-600 text-xl text-slate-500 hover:text-slate-700 transition"
            >
              +
            </Link>
            <Link href={`/post-gig/${role}`} className="mt-3 block text-xl font-bold text-slate-700 hover:text-[#1453c4] transition">
              Post a New Gig
            </Link>
            <p className="mt-1 text-xs text-slate-500">Offer your expertise to fellow students</p>
          </div>
        )}
      </section>
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
      {sub ? <p className={`mt-1.5 text-sm ${teal ? "text-teal-700 font-semibold" : "text-slate-500"}`}>{sub}</p> : null}
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
