"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { buildGigRatingSummary } from "@/lib/gig-ratings";
import { ensureGigTitlePrefix } from "@/lib/gig-titles";
import { formatRatingLabel } from "@/lib/ratings";
import { scopedHref, type Role } from "@/lib/role-routes";
import type { ProviderGig } from "@/lib/auth";
import { getRoleBadge, getVerificationBadge } from "@/lib/identity-badges";
import { getGigCoverForCategory } from "@/lib/gig-covers";

type ProviderProfilePublicPageProps = {
  providerId: string;
  role?: Role;
  activeTab: "gigs" | "reviews";
};

type PublicGig = {
  id: string;
  gigId?: string;
  title: string;
  rating: string;
  reviews: number;
  category: string;
  image: string;
};

type PublicReview = {
  id: string;
  name: string;
  initials: string;
  meta: string;
  quote: string;
  rating: number;
  avatarTone: string;
};

type ProviderProfileData = {
  name: string;
  degree: string;
  university: string;
  yearOfStudy: string;
  image: string;
  verified: boolean;
  topRated: boolean;
  trustScore: string;
  totalSwaps: string;
  avgRating: string;
  avgResponse: string;
  gigs: PublicGig[];
  reviews: PublicReview[];
};

type FirestoreReview = {
  rating: number;
  comment: string;
};

type FirebaseRequestDoc = {
  id: string;
  title?: string;
  status?: string;
  createdAt?: { toDate?: () => Date } | Date | string | number | null;
  buyerName?: string;
  review?: FirestoreReview;
};

type FirestoreUserProfile = {
  uid?: string;
  name?: string;
  degree?: string;
  university?: string;
  yearOfStudy?: string;
  emailVerified?: boolean;
  verifiedStudentProvider?: boolean;
  role?: string;
  profileImageUrl?: string;
  providerProfile?: {
    bio?: string;
    skills?: string[];
    gigImages?: string[];
    gigs?: ProviderGig[];
  };
  settings?: {
    profileVisibility?: boolean;
  };
};

export default function ProviderProfilePublicPage({
  providerId,
  role,
  activeTab,
}: ProviderProfilePublicPageProps) {
  const { userProfile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProviderProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);

  const getGigFavoriteKey = (gigId: string) => `${providerId}-${gigId}`;

  const isFavorited =
    userProfile?.favorites?.some(
      (fav) =>
        (fav as { providerId?: string; gigId?: string }).providerId === providerId &&
        !(fav as { gigId?: string }).gigId,
    ) || false;

  const isGigFavorited = (gigId: string) =>
    userProfile?.favorites?.some(
      (fav) => (fav as { gigId?: string }).gigId === getGigFavoriteKey(gigId),
    ) || false;

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);

      try {
        const userSnap = await getDoc(doc(db, "users", providerId));
        if (!active) return;

        if (!userSnap.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const member = userSnap.data() as FirestoreUserProfile;
        const isOwnerViewing = userProfile?.uid === providerId;

        // Privacy settings hide the page from others but never from its owner.
        if (member.settings?.profileVisibility === false && !isOwnerViewing) {
          setIsPrivateProfile(true);
          setProfile(null);
          setLoading(false);
          return;
        }

        setIsPrivateProfile(false);

        // Reject buyer-only records instead of showing an empty provider profile.
        const isProviderMember =
          member.role === "provider" ||
          member.role === "both" ||
          Boolean(member.providerProfile?.skills?.length);

        if (!isProviderMember) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // Completed requests are the source for rating, reviews, and swap totals.
        const requestsSnap = await getDocs(
          query(
            collection(db, "requests"),
            where("providerId", "==", providerId),
            where("status", "==", "completed"),
          ),
        );

        if (!active) return;

        const completedRequests = requestsSnap.docs.map(
          (requestDoc) => ({ id: requestDoc.id, ...requestDoc.data() }) as FirebaseRequestDoc,
        );

        setProfile(buildProviderProfile(member, providerId, completedRequests));
      } catch (error) {
        console.error("Error loading provider public profile:", error);
        if (active) {
          setProfile(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [providerId, userProfile?.uid]);

  const handleToggleFavorite = async () => {
    if (!userProfile || !profile) {
      if (!userProfile) {
        router.push("/get-started");
      }
      return;
    }

    try {
      const favorites = (userProfile.favorites || []) as Record<string, unknown>[];
      let updatedFavorites;

      // Profile favorites are kept for compatibility with older saved items.
      if (isFavorited) {
        updatedFavorites = favorites.filter(
          (fav) =>
            !(
              (fav as { providerId?: string; gigId?: string }).providerId === providerId &&
              !(fav as { gigId?: string }).gigId
            ),
        );
      } else {
        const now = new Date();
        updatedFavorites = [
          ...favorites,
          {
            id: providerId,
            providerId,
            title: profile.gigs[0]?.title || `Collaboration with ${profile.name}`,
            category: profile.gigs[0]?.category || "General",
            instructor: profile.name,
            rating: profile.avgRating,
            image:
              profile.image && profile.image.startsWith("/img/")
                ? profile.image
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2f66e7&color=fff&size=400`,
            avatar: profile.name.charAt(0).toUpperCase(),
            level: "Member",
            savedAt: `Saved ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
            description:
              profile.gigs[0]?.title || `Collaborate on skill swaps with ${profile.name}`,
          },
        ];
      }

      await updateDoc(doc(db, "users", userProfile.uid), {
        favorites: updatedFavorites,
      });
      await refreshProfile();
    } catch (error) {
      console.error("Error toggling provider favorite:", error);
    }
  };

  const handleToggleGigFavorite = async (gig: PublicGig) => {
    if (!userProfile || !profile) {
      if (!userProfile) {
        router.push("/get-started");
      }
      return;
    }

    try {
      const favorites = (userProfile.favorites || []) as Record<string, unknown>[];
      // A provider can have many gigs, so each one receives its own stable key.
      const favoriteKey = getGigFavoriteKey(gig.id);
      const updatedFavorites = isGigFavorited(gig.id)
        ? favorites.filter((fav) => (fav as { gigId?: string }).gigId !== favoriteKey)
        : [
            ...favorites,
            {
              id: favoriteKey,
              gigId: favoriteKey,
              providerId,
              title: gig.title,
              category: gig.category,
              instructor: profile.name,
              rating: formatRatingLabel(gig.rating),
              image: gig.image,
              avatar:
                profile.image && profile.image.startsWith("/")
                  ? profile.image
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2f66e7&color=fff&size=400`,
              level: "Gig Card",
              savedAt: `Saved ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
              description: `Gig card: ${gig.title}`,
            },
          ];

      await updateDoc(doc(db, "users", userProfile.uid), {
        favorites: updatedFavorites,
      });
      await refreshProfile();
    } catch (error) {
      console.error("Error toggling gig favorite:", error);
    }
  };

  const messageHref = role
    ? `${scopedHref("/chats", role)}?peerId=${encodeURIComponent(providerId)}`
    : "/get-started";
  const reportHref = role
    ? `${scopedHref("/report-issue", role)}/${providerId}`
    : "/get-started";
  const baseProfileHref = role
    ? `/provider-profile/${providerId}?role=${role}`
    : `/provider-profile/${providerId}`;
  const gigsHref = `${baseProfileHref}${role ? "&" : "?"}tab=gigs`;
  const reviewsHref = `${baseProfileHref}${role ? "&" : "?"}tab=reviews`;

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
        <div className="rounded-full bg-slate-100 p-5 text-slate-400">
          <LockIcon className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-800">Private Profile</h2>
        <p className="mt-2 max-w-sm text-base text-slate-500">
          This member has hidden their public profile details.
        </p>
        <Link
          href={role ? scopedHref("/find-services", role) : "/"}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#2f66e7] px-6 text-sm font-semibold text-white transition hover:bg-[#2051ca]"
        >
          Back
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

  const roleBadge = getRoleBadge("provider");
  const verificationBadge = getVerificationBadge("provider", profile.verified);

  return (
    <div className="flex w-full flex-col gap-4 pb-6">
      {/* Provider identity and quick actions */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
          <MemberAvatar image={profile.image} name={profile.name} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-bold leading-tight text-[#1453c4] sm:text-2xl">
                {profile.name}
              </h1>
              {verificationBadge ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${verificationBadge.className}`}>
                  <VerifiedBadgeIcon className={`h-3.5 w-3.5 ${verificationBadge.iconClassName}`} />
                  {verificationBadge.label}
                </span>
              ) : (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleBadge.className}`}>
                  {roleBadge.label}
                </span>
              )}
              {profile.topRated ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Top Rated
                </span>
              ) : null}
            </div>

            <p className="mt-1 break-words text-sm font-semibold text-slate-700 sm:text-base">
              {profile.university}
            </p>
            <p className="mt-0.5 break-words text-xs font-semibold text-slate-500">
              {profile.degree}
              {profile.yearOfStudy ? ` | ${profile.yearOfStudy}` : ""}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={messageHref}
                className="inline-flex h-8 items-center justify-center rounded-md bg-[#1453c4] px-3 text-xs font-semibold text-white transition hover:bg-[#0f43a1]"
              >
                Message {profile.name.split(" ")[0]}
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

      {/* Trust and performance summary */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Trust Score" value={profile.trustScore} sub="Completion Rate" accent />
        <MetricCard title="Total Swaps" value={profile.totalSwaps} sub="Completed" />
        <MetricCard
          title="Avg. Rating"
          value={formatRatingLabel(profile.avgRating)}
          sub={buildStars(profile.avgRating)}
          teal
        />
        <MetricCard title="Avg. Response" value={profile.avgResponse} sub="Highly Responsive" />
      </section>

      {/* Tabbed gig catalogue or review history */}
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
              {profile.gigs.map((gig, index) => (
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
                    <div className="absolute right-3 top-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleGigFavorite(gig)}
                        aria-label={
                          isGigFavorited(gig.id)
                            ? "Remove this gig from favorites"
                            : "Save this gig to favorites"
                        }
                        className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition ${
                          isGigFavorited(gig.id)
                            ? "bg-red-500 text-white"
                            : "bg-white/95 text-slate-700 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <HeartIcon className="h-4.5 w-4.5" filled={isGigFavorited(gig.id)} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col p-4">
                    <h3 className="line-clamp-2 text-[0.97rem] font-bold leading-6 text-slate-900">
                      {gig.title}
                    </h3>

                    <p className="mt-2 truncate text-[13px] font-semibold leading-5 text-slate-700">
                      {profile.name} <span className="font-medium text-slate-400">|</span>{" "}
                      <span className="font-medium text-slate-500">
                        {profile.university || "Sri Lankan University"}
                      </span>
                    </p>

                    <p className="mt-3 line-clamp-2 text-[12.5px] leading-5 text-slate-600">
                      Practical {gig.category.toLowerCase()} support from a verified university student.
                    </p>

                    <div className="mt-auto border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="truncate">
                          {gig.reviews > 0 ? `${gig.reviews} reviews` : "New"}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
                          <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                          {formatRatingLabel(gig.rating)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          href={`/gig-preview/${role}?providerId=${encodeURIComponent(providerId)}&skillIndex=${index}${gig.gigId ? `&gigId=${encodeURIComponent(gig.gigId)}` : ""}`}
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
            <EmptyPanel message="No offered gigs or services listed yet." />
          )
        ) : (
          <div className="mt-5 space-y-4">
            <h2 className="text-lg font-semibold text-[#1453c4]">Recent Feedback</h2>
            {profile.reviews.length > 0 ? (
              profile.reviews.map((review) => <FeedbackCard key={review.id} review={review} />)
            ) : (
              <EmptyPanel message="No reviews received yet." />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function MemberAvatar({ image, name }: { image: string; name: string }) {
  if (image) {
    return (
      <div className="relative h-20 w-20 overflow-hidden rounded-lg sm:h-24 sm:w-24">
        <Image src={image} alt={name} fill className="object-cover" sizes="96px" priority />
      </div>
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md sm:h-24 sm:w-24 sm:text-2xl">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)}
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

function FeedbackCard({ review }: { review: PublicReview }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-[#f7f8ff] p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${review.avatarTone}`}
          >
            {review.initials}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{review.name}</p>
            <p className="break-words text-xs text-slate-500">{review.meta}</p>
          </div>
        </div>
        <p className="text-lg text-teal-700">{buildStars(String(review.rating))}</p>
      </div>
      <p className="mt-2 break-words text-xs leading-5 text-slate-700">{review.quote}</p>
    </article>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

// Convert profile and request documents into display-ready public data.
function buildProviderProfile(
  member: FirestoreUserProfile,
  providerId: string,
  completedRequests: FirebaseRequestDoc[],
): ProviderProfileData {
  const ratings = completedRequests
    .filter((request) => request.review && typeof request.review.rating === "number")
    .map((request) => request.review!.rating);

  const avgRating =
    ratings.length > 0
      ? parseFloat(
          (ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1),
        )
      : 0;

  const totalRejected = completedRequests.filter((request) => request.status === "rejected").length;
  const trustScore =
    completedRequests.length === 0
      ? "99%"
      : `${Math.min(
          100,
          Math.max(
            80,
            Math.round(((completedRequests.length - totalRejected) / completedRequests.length) * 100),
          ),
        )}%`;

  const skills = member.providerProfile?.skills || [];
  const customImages = member.providerProfile?.gigImages || [];
  const storedGigs = (member.providerProfile?.gigs || []).filter(
    (gig) => (gig.status || "active") === "active",
  );
  const gigs: PublicGig[] = (
    storedGigs.length > 0
      ? storedGigs.map((gig, index) => {
          const title = ensureGigTitlePrefix(gig.title || skills[index] || "Student Support");
          const category = gig.category || skills[index] || "General";
          const ratingSummary = buildGigRatingSummary(
            {
              id: gig.id || `${providerId}-${index}`,
              gigId: gig.id,
              title,
              category,
            },
            completedRequests,
          );

          return {
            id: gig.id || `${providerId}-${index}`,
            gigId: gig.id,
            title,
            rating: ratingSummary.rating.toFixed(1),
            reviews: ratingSummary.count,
            category,
            image: gig.image || customImages[index] || fallbackGigImage(index),
          };
        })
      : skills.map((skill, index) => {
          const title = ensureGigTitlePrefix(skill);
          const ratingSummary = buildGigRatingSummary(
            {
              id: `${providerId}-${index}`,
              title,
              category: skill,
            },
            completedRequests,
          );

          return {
            id: `${providerId}-${index}`,
            gigId: undefined,
            title,
            rating: ratingSummary.rating.toFixed(1),
            reviews: ratingSummary.count,
            category: skill,
            image: customImages[index] || fallbackGigImage(index),
          };
        })
  );

  const reviews: PublicReview[] = completedRequests
    .filter((request) => request.review && typeof request.review.rating === "number")
    .map((request) => {
      const buyerName = request.buyerName || "Anonymous Buyer";
      return {
        id: request.id,
        name: buyerName,
        initials: buildInitials(buyerName),
        meta: `${formatDateLabel(request.createdAt)} | Swap: ${request.title || "Skill Swap"}`,
        quote: request.review?.comment || "Outstanding swap session!",
        rating: request.review?.rating || 5,
        avatarTone: "bg-[#2f66e7] text-white",
      };
    });

  return {
    name: member.name || "Anonymous Member",
    degree: member.degree || "Undergraduate",
    university: member.university || "Sri Lankan University",
    yearOfStudy: member.yearOfStudy || "",
    image: member.profileImageUrl || "",
    verified: member.verifiedStudentProvider === true,
    topRated: avgRating >= 4.8 && ratings.length >= 2,
    trustScore,
    totalSwaps: String(completedRequests.length),
    avgRating: avgRating.toFixed(1),
    avgResponse: "1h",
    gigs,
    reviews,
  };
}

function buildInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function fallbackGigImage(index: number) {
  return getGigCoverForCategory("", "", index);
}

function formatDateLabel(value: FirebaseRequestDoc["createdAt"]) {
  if (!value) return "Recently";

  const rawDate = value as { toDate?: () => Date } | Date | string | number;
  const date =
    typeof (rawDate as { toDate?: () => Date }).toDate === "function"
      ? (rawDate as { toDate: () => Date }).toDate()
      : new Date(rawDate as string | number | Date);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function VerifiedBadgeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.8 14.1 5l3-.5.9 2.9 2.8 1.3-1.4 2.7 1.4 2.7-2.8 1.3-.9 2.9-3-.5L12 20l-2.1-2.2-3 .5-.9-2.9-2.8-1.3 1.4-2.7-1.4-2.7L6 7.4l.9-2.9 3 .5z" />
      <path d="m9.6 12.1 1.6 1.6 3.4-3.5" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function buildStars(value: string) {
  const rating = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
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
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17.3 6.8 20l1-5.7L3.6 10l5.7-.8L12 3.9l2.7 5.3 5.7.8-4.2 4.3 1 5.7z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z"
      />
    </svg>
  );
}
