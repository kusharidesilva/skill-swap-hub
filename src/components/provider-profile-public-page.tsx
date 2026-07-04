"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { scopedHref, type Role } from "@/lib/role-routes";
import { useAuth } from "@/context/AuthContext";

type ProviderProfilePublicPageProps = {
  providerId: string;
  role?: Role;
  activeTab: "gigs" | "reviews";
};

interface GigData {
  id: string;
  title: string;
  rating: string;
  reviews: number;
  category: string;
  image: string;
}

interface ReviewData {
  id: string;
  initials: string;
  avatarTone: string;
  name: string;
  meta: string;
  quote: string;
  rating: number;
}

interface PublicProviderProfile {
  name: string;
  degree: string;
  university: string;
  rating: string;
  reviewsCount: number;
  image: string;
  verified: boolean;
  topRated: boolean;
  trustScore: string;
  totalSwaps: string;
  avgRating: string;
  avgResponse: string;
  gigs: GigData[];
  reviews: ReviewData[];
}

interface FirebaseRequestDoc {
  id: string;
  buyerName?: string;
  title?: string;
  status?: string;
  createdAt?: { toDate?: () => Date } | Date | null;
  review?: {
    rating: number;
    comment: string;
  };
}

// Fallback/Mock data for unregistered/demo providers
const providersData: Record<string, {
  name: string;
  degree: string;
  university: string;
  rating: string;
  reviewsCount: number;
  image: string;
  verified: boolean;
  topRated: boolean;
  trustScore: string;
  totalSwaps: string;
  avgRating: string;
  avgResponse: string;
  gigs: GigData[];
}> = {
  "sarah-jenkins": {
    name: "Sarah Jenkins",
    degree: "BSc Computer Science",
    university: "Univ of Colombo",
    rating: "4.9",
    reviewsCount: 42,
    image: "/img/favorites/sofia.jpg",
    verified: true,
    topRated: true,
    trustScore: "98%",
    totalSwaps: "42",
    avgRating: "4.9",
    avgResponse: "2h",
    gigs: [
      {
        id: "react-web",
        title: "Modern React Web Development",
        rating: "4.9",
        reviews: 30,
        category: "Programming",
        points: 40,
        image: "/img/package%201.jpg",
      },
      {
        id: "node-api",
        title: "RESTful API with Node.js & Express",
        rating: "4.8",
        reviews: 12,
        category: "Backend Development",
        points: 50,
        image: "/img/package%202.jpg",
      },
    ]
  },
  "michael-chen": {
    name: "Michael Chen",
    degree: "BA Graphic Design",
    university: "Univ of Moratuwa",
    rating: "4.7",
    reviewsCount: 28,
    image: "/img/favorites/david.jpg",
    verified: true,
    topRated: false,
    trustScore: "95%",
    totalSwaps: "28",
    avgRating: "4.7",
    avgResponse: "1h",
    gigs: [
      {
        id: "figma-design",
        title: "High-Fidelity UI/UX Design in Figma",
        rating: "4.8",
        reviews: 18,
        category: "UI/UX Design",
        points: 35,
        image: "/img/package%203.jpg",
      },
      {
        id: "logo-brand",
        title: "Modern Minimalist Logo Design",
        rating: "4.6",
        reviews: 10,
        category: "Branding",
        points: 25,
        image: "/img/package%201.jpg",
      },
    ]
  },
  "alex-rivera": {
    name: "Alex Rivera",
    degree: "BSc Design",
    university: "University of Moratuwa",
    rating: "5.0",
    reviewsCount: 68,
    image: "/img/favorites/alex.jpg",
    verified: true,
    topRated: true,
    trustScore: "99%",
    totalSwaps: "68",
    avgRating: "5.0",
    avgResponse: "1h",
    gigs: [
      {
        id: "book-cover",
        title: "Creative Book Cover Design",
        rating: "5.0",
        reviews: 12,
        category: "Graphic Design",
        points: 20,
        image: "/img/package%201.jpg",
      },
      {
        id: "arch-viz",
        title: "3D Architectural Visualization",
        rating: "5.0",
        reviews: 8,
        category: "Architecture",
        points: 45,
        image: "/img/package%202.jpg",
      },
      {
        id: "logo-design",
        title: "Minimalist Logo Design",
        rating: "4.9",
        reviews: 22,
        category: "Branding",
        points: 30,
        image: "/img/package%203.jpg",
      },
    ]
  }
};

const allReviewsMock: ReviewData[] = [
  {
    id: "r1",
    initials: "KP",
    avatarTone: "bg-[#2f66e7] text-white",
    name: "Kasun Perera",
    meta: "2 days ago • Swap: Creative Book Cover",
    quote:
      "Amara is incredibly talented! She took my vague ideas and turned them into a stunning book cover that perfectly matches the tone of my thesis. Highly recommend her for any design work.",
    rating: 5,
  },
  {
    id: "r2",
    initials: "NR",
    avatarTone: "bg-teal-300 text-teal-900",
    name: "Nimani Ratnayake",
    meta: "1 week ago • Swap: 3D Arch Viz",
    quote:
      "Excellent communication and the technical quality of the 3D renders was beyond my expectations. She is a real pro at the University of Moratuwa.",
    rating: 5,
  },
];

export default function ProviderProfilePublicPage({
  providerId,
  role,
  activeTab,
}: ProviderProfilePublicPageProps) {
  const { userProfile, loading: authLoading, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<PublicProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);

  const isFavorited = userProfile?.favorites?.some((fav) => (fav as { providerId?: string }).providerId === providerId) || false;

  const handleToggleFavorite = async () => {
    if (!userProfile) {
      window.location.href = "/get-started";
      return;
    }
    if (!profile) return;

    try {
      const favorites = (userProfile.favorites || []) as Record<string, unknown>[];
      let updatedFavorites;

      if (isFavorited) {
        updatedFavorites = favorites.filter((fav) => (fav as { providerId?: string }).providerId !== providerId);
      } else {
        const now = new Date();
        const savedAtStr = `Saved ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
        const newFav = {
          id: providerId,
          providerId: providerId,
          title: profile.gigs[0]?.title || `Collaboration with ${profile.name}`,
          category: profile.gigs[0]?.category || "General",
          instructor: profile.name,
          rating: profile.avgRating,
          image: profile.image && profile.image.startsWith("/img/")
            ? profile.image
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2f66e7&color=fff&size=400`,
          avatar: profile.name.charAt(0).toUpperCase(),
          level: "Member",
          savedAt: savedAtStr,
          description: profile.gigs[0]?.title || `Collaborate on skill swaps with ${profile.name}`,
        };
        updatedFavorites = [...favorites, newFav];
      }

      await updateDoc(doc(db, "users", userProfile.uid), {
        favorites: updatedFavorites,
      });
      await refreshProfile();
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  useEffect(() => {
    let active = true;
    const userRef = doc(db, "users", providerId);
    const requestsQuery = query(
      collection(db, "requests"),
      where("providerId", "==", providerId),
      where("status", "==", "completed")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      async (qSnap) => {
        try {
          const userDoc = await getDoc(userRef);
          if (!active) return;

          const reqs: FirebaseRequestDoc[] = [];
          qSnap.forEach((docSnap) => {
            reqs.push({ id: docSnap.id, ...docSnap.data() } as FirebaseRequestDoc);
          });

          if (userDoc.exists()) {
            const u = userDoc.data();

            if (u.settings?.profileVisibility === false && (!userProfile || userProfile.uid !== providerId)) {
              setIsPrivateProfile(true);
              setLoading(false);
              return;
            }
            setIsPrivateProfile(false);

            const completedRequests = reqs.filter((r) => r.status === "completed");
            const totalSwaps = completedRequests.length;

            const ratings = completedRequests
              .filter((r) => r.review && typeof r.review.rating === "number")
              .map((r) => r.review!.rating);
            const avgRating = ratings.length > 0
              ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
              : 5.0;

            const totalRequests = reqs.length;
            const totalRejected = reqs.filter((r) => r.status === "rejected").length;
            const trustScore = totalRequests === 0
              ? "99%"
              : `${Math.min(100, Math.max(80, Math.round(((totalRequests - totalRejected) / totalRequests) * 100)))}%`;

            const skills: string[] = u.providerProfile?.skills || [];
            const customImages: string[] = u.providerProfile?.gigImages || [];
            const gigs: GigData[] = skills.map((skill: string, index: number) => {
              let image = customImages[index];
              if (!image) {
                image = "/img/package%201.jpg";
                if (index % 3 === 1) image = "/img/package%202.jpg";
                if (index % 3 === 2) image = "/img/package%203.jpg";
              }
              return {
                id: `gig-${index}`,
                title: `I will do ${skill}`,
                rating: avgRating.toFixed(1),
                reviews: completedRequests.length,
                category: skill,
                image,
              };
            });

            const reviews: ReviewData[] = completedRequests
              .filter((r) => r.review && typeof r.review.rating === "number")
              .map((r) => {
                const rating = r.review!.rating;
                const comment = r.review!.comment || "Outstanding swap session!";
                const buyerName = r.buyerName || "Anonymous Student";
                const initials = buyerName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "US";

                let dateStr = "Recently";
                if (r.createdAt) {
                  const rawDate = r.createdAt as { toDate?: () => Date } | Date | string | number;
                  let d: Date;
                  if (rawDate && typeof (rawDate as { toDate?: () => Date }).toDate === "function") {
                    d = (rawDate as { toDate: () => Date }).toDate();
                  } else {
                    d = new Date(rawDate as Date | string | number);
                  }
                  dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                }

                return {
                  id: r.id,
                  initials,
                  avatarTone: "bg-[#2f66e7] text-white",
                  name: buyerName,
                  meta: `${dateStr} • Swap: ${r.title}`,
                  quote: comment,
                  rating,
                };
              });

            setProfile({
              name: u.name || "Anonymous Member",
              degree: u.degree || "Undergraduate",
              university: u.university || "Sri Lankan University",
              rating: avgRating.toFixed(1),
              reviewsCount: completedRequests.length,
              image: u.profileImageUrl || "",
              verified: true,
              topRated: avgRating >= 4.8 && completedRequests.length >= 2,
              trustScore,
              totalSwaps: String(totalSwaps),
              avgRating: avgRating.toFixed(1),
              avgResponse: "1h",
              gigs,
              reviews,
            });
          } else {
            const mock = providersData[providerId] || providersData["alex-rivera"];
            setProfile({
              ...mock,
              reviews: allReviewsMock,
            });
          }
        } catch (err) {
          console.error("Error fetching provider profile from db:", err);
          const mock = providersData[providerId] || providersData["alex-rivera"];
          setProfile({
            ...mock,
            reviews: allReviewsMock,
          });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error subscribing to provider profile ratings:", err);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [providerId, userProfile]);

  if (loading || authLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (isPrivateProfile) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="rounded-full bg-slate-105 p-5 text-slate-450 bg-slate-100 text-slate-400">
          <svg
            className="h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-800">Private Profile</h2>
        <p className="mt-2 text-base text-slate-500 max-w-sm">
          This member has set their profile visibility to private. Only they can view their profile details and listings.
        </p>
        <Link
          href={role ? scopedHref("/find-services", role) : "/"}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#2f66e7] px-6 text-sm font-semibold text-white transition hover:bg-[#2051ca]"
        >
          Back to Find Services
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Provider profile not found.</p>
      </div>
    );
  }

  const firstName = profile.name.split(" ")[0];
  const messageHref = role ? `${scopedHref("/chats", role)}?peerId=${encodeURIComponent(providerId)}` : "/get-started";
  const reportHref = role
    ? `${scopedHref("/report-issue", role)}/${providerId}`
    : "/get-started";

  const baseProfileHref = role
    ? `/provider-profile/${providerId}?role=${role}`
    : `/provider-profile/${providerId}`;
  const gigsHref = `${baseProfileHref}${role ? "&" : "?"}tab=gigs`;
  const reviewsHref = `${baseProfileHref}${role ? "&" : "?"}tab=reviews`;

  // Render rating stars string dynamically
  const starsString = () => {
    const num = Math.round(parseFloat(profile.avgRating) || 5);
    return "★".repeat(num) + "☆".repeat(Math.max(0, 5 - num));
  };

  return (
    <div className="flex w-full flex-col gap-4 pb-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
          {profile.image && profile.image.startsWith("/") ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-lg sm:h-24 sm:w-24">
              <Image
                src={profile.image}
                alt={profile.name}
                fill
                className="object-cover"
                sizes="96px"
                priority
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md sm:h-24 sm:w-24 sm:text-2xl">
              {profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-bold leading-tight text-[#1453c4] sm:text-2xl">
                {profile.name}
              </h1>
              {profile.verified && (
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-[#1453c4]">
                  Verified Student
                </span>
              )}
              {profile.topRated && (
                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                  Top Rated
                </span>
              )}
            </div>
            <p className="mt-1 break-words text-sm font-semibold text-slate-700 sm:text-base">{profile.university}</p>
            <p className="mt-0.5 break-words text-xs font-semibold text-slate-500">{profile.degree}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={messageHref}
                className="inline-flex h-8 items-center justify-center rounded-md bg-[#1453c4] px-3 text-xs font-semibold text-white transition hover:bg-[#0f43a1]"
              >
                Message {firstName}
              </Link>
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-semibold transition ${
                  isFavorited
                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <HeartIcon className="h-3.5 w-3.5" filled={isFavorited} />
                  {isFavorited ? "Saved" : "Save"}
                </span>
              </button>
              <Link
                href={reportHref}
                className="inline-flex h-8 items-center justify-center rounded-md px-2 text-xs font-semibold text-red-600 transition hover:text-red-700"
              >
                Report Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Trust Score" value={profile.trustScore} sub="Completion Rate" accent />
        <MetricCard title="Total Swaps" value={profile.totalSwaps} sub="Completed" />
        <MetricCard title="Avg. Rating" value={profile.avgRating} sub={starsString()} teal />
        <MetricCard title="Avg. Response" value={profile.avgResponse} sub="Highly Responsive" />
      </section>

      <section>
        <div className="flex items-center gap-6 border-b border-slate-200">
          <Link
            href={gigsHref}
            className={`border-b-2 pb-2.5 text-sm font-semibold transition ${
              activeTab === "gigs"
                ? "border-[#1453c4] text-[#1453c4]"
                : "border-transparent text-slate-600 hover:text-slate-800"
            }`}
          >
            Offered Gigs ({profile.gigs.length})
          </Link>
          <Link
            href={reviewsHref}
            className={`border-b-2 pb-2.5 text-sm font-semibold transition ${
              activeTab === "reviews"
                ? "border-[#1453c4] text-[#1453c4]"
                : "border-transparent text-slate-600 hover:text-slate-800"
            }`}
          >
            Reviews ({profile.reviews.length})
          </Link>
        </div>

        {activeTab === "gigs" ? (
          profile.gigs.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {profile.gigs.map((gig: GigData, index: number) => (
                <article
                  key={gig.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-md"
                >
                  <div className="relative h-40 w-full bg-slate-100">
                    <Image
                      src={gig.image}
                      alt={gig.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 30vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-slate-900/10 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#1453c4] shadow-sm">
                      {gig.category}
                    </span>
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
                      <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                      {gig.rating}
                    </span>
                  </div>
                  <div className="flex flex-col p-4">
                    <h3 className="line-clamp-2 text-[0.97rem] font-bold leading-6 text-slate-900">
                      {gig.title}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2f66e7] text-[10px] font-bold text-white ring-2 ring-white">
                        {profile.name
                          .split(" ")
                          .map((part: string) => part[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold leading-5 text-slate-700">{profile.name}</p>
                        <p className="truncate text-[12px] leading-4 text-slate-500">
                          {profile.university} student
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-[12.5px] leading-5 text-slate-600">
                      Practical {gig.category.toLowerCase()} support from a verified university student.
                    </p>

                    <div className="mt-auto border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="truncate">Skill Exchange</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
                          <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                          {gig.rating}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          href={`/gig-preview/${role}?providerId=${encodeURIComponent(providerId)}&skillIndex=${index}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          View Gig
                        </Link>
                        <Link
                          href={`/request-service/${role}?providerId=${encodeURIComponent(providerId)}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-[#2f66e7] px-2 text-xs font-semibold text-white transition hover:bg-[#2557cf]"
                        >
                          Request
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No offered gigs or services listed yet.
            </div>
          )
        ) : (
          <div className="mt-5 space-y-4">
            <h2 className="text-lg font-semibold text-[#1453c4]">Recent Feedback</h2>
            {profile.reviews.length > 0 ? (
              profile.reviews.map((review: ReviewData) => (
                <FeedbackCard
                  key={review.id}
                  initials={review.initials}
                  avatarTone={review.avatarTone}
                  name={review.name}
                  meta={review.meta}
                  quote={review.quote}
                  rating={review.rating}
                />
              ))
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                No reviews received yet.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  accent = false,
  teal = false,
}: {
  title: string;
  value: string;
  sub: string;
  accent?: boolean;
  teal?: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-1.5 text-2xl font-bold leading-none text-slate-900 md:text-3xl">{value}</p>
      <p className={`mt-1.5 text-xs font-medium ${teal ? "text-teal-700" : "text-slate-600"}`}>{sub}</p>
      {accent ? <div className="mx-auto mt-2.5 h-1 w-full rounded-full bg-teal-700" /> : null}
    </article>
  );
}

function HeartIcon({
  className,
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
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
      <path d="M12 17.3 6.8 20l1-5.7L3.6 10l5.7-.8L12 3.9l2.7 5.3 5.7.8-4.2 4.3 1 5.7z" />
    </svg>
  );
}

function FeedbackCard({
  initials,
  avatarTone,
  name,
  meta,
  quote,
  rating = 5,
}: {
  initials: string;
  avatarTone: string;
  name: string;
  meta: string;
  quote: string;
  rating?: number;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-[#f7f8ff] p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${avatarTone}`}
          >
            {initials}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{name}</p>
            <p className="break-words text-xs text-slate-500">{meta}</p>
          </div>
        </div>
        <p className="text-lg text-teal-700">{"★".repeat(rating)}</p>
      </div>
      <p className="mt-2 break-words text-xs leading-5 text-slate-700">{quote}</p>
    </article>
  );
}
