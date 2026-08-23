"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import type { SVGProps } from "react";
import ScrollReveal from "@/components/scroll-reveal";
import GuestAuthModal from "@/components/guest-auth-modal";
import SharedGigDetailsModal from "@/components/gig-details-modal";
import { db } from "@/lib/firebase";
import { buildGigRatingSummary } from "@/lib/gig-ratings";
import { ensureGigTitlePrefix } from "@/lib/gig-titles";
import { formatRatingLabel } from "@/lib/ratings";
import { useAuth } from "@/context/AuthContext";
import { getGigCoverForCategory } from "@/lib/gig-covers";

type LiveGig = {
  id: string;
  gigId?: string;
  providerId: string;
  title: string;
  category: string;
  rating: number;
  providerName: string;
  university: string;
  providerImage?: string;
  summary: string;
  availability: string;
  price: number | string;
  image: string;
  serviceType: string;
  tags: string[];
};

type FirestoreGig = {
  gigId?: string;
  providerId?: string;
  status?: string;
  gigStatus?: string;
  title?: string;
  category?: string;
  providerName?: string;
  university?: string;
  providerImage?: string;
  summary?: string;
  description?: string;
  availability?: string[] | string;
  price?: number | string;
  image?: string;
  sampleWorkUrl?: string;
  updatedAt?: { toMillis?: () => number };
  createdAt?: { toMillis?: () => number };
};

type RankedLiveGig = LiveGig & {
  sortTime: number;
};

type GigRecord = {
  card: RankedLiveGig;
};

export default function SkillGigsSection() {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const [gigs, setGigs] = useState<LiveGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isBuyerHome = pathname === "/home/buyer";
  const isProviderHome = pathname === "/home/provider";
  const isBothHome = pathname === "/home/both";
  const hideOwnGig = !isBothHome;
  const viewAllHref = isBuyerHome
    ? "/find-services/buyer"
    : isProviderHome
      ? "/find-services/provider"
      : isBothHome
        ? "/find-services/both"
        : "/get-started";

  useEffect(() => {
    async function fetchGigs() {
      try {
        const statusSnapshot = await getDocs(
          query(collection(db, "gigs"), where("status", "==", "active")),
        );
        const completedRequests = userProfile
          ? (
              await getDocs(
                query(collection(db, "requests"), where("status", "==", "completed")),
              )
            ).docs.map((requestDoc) => requestDoc.data())
          : [];

        const gigRecords: GigRecord[] = statusSnapshot.docs
          .map((gigDoc, index) => {
            const gig = gigDoc.data() as FirestoreGig;
            const availability = Array.isArray(gig.availability)
              ? gig.availability.join(", ")
              : gig.availability || "Flexible";
            const ratingSummary = buildGigRatingSummary(
              {
                id: gigDoc.id,
                gigId: gig.gigId || gigDoc.id,
                title: ensureGigTitlePrefix(gig.title || "Student Skill"),
                category: gig.category || "Service",
              },
              completedRequests.filter((request) => request.providerId === (gig.providerId || "")),
            );

            const rankedGig: RankedLiveGig = {
              id: gigDoc.id,
              gigId: gig.gigId || gigDoc.id,
              providerId: gig.providerId || "",
              title: gig.title || "Student Skill",
              category: gig.category || "Service",
              rating: ratingSummary.rating,
              providerName: gig.providerName || "Campus Student",
              university: gig.university || "Campus",
              providerImage: gig.providerImage || "",
              summary:
                gig.summary ||
                gig.description ||
                "Practical support from a verified university student.",
              availability,
              price: gig.price || "",
              image:
                gig.image ||
                gig.sampleWorkUrl ||
                getGigCoverForCategory(gig.category, gig.title, index),
              serviceType: "Service Gig",
              tags: [gig.category || "Service", "Service Gig", availability],
              sortTime:
                gig.updatedAt?.toMillis?.() ||
                gig.createdAt?.toMillis?.() ||
                0,
            };

            return {
              card: rankedGig,
            };
          })
          .filter((gig) => gig.card.providerId)
          .filter((gig) => !(hideOwnGig && userProfile && gig.card.providerId === userProfile.uid))
          .sort(
            (a, b) =>
              b.card.rating - a.card.rating ||
              b.card.sortTime - a.card.sortTime,
          )
          .slice(0, 4);

        const liveGigs: LiveGig[] = gigRecords.map(({ card: gig }) => ({
          id: gig.id,
          gigId: gig.gigId,
          providerId: gig.providerId,
          title: gig.title,
          category: gig.category,
          rating: gig.rating,
          providerName: gig.providerName,
          university: gig.university,
          providerImage: gig.providerImage,
          summary: gig.summary,
          availability: gig.availability,
          price: gig.price,
          image: gig.image,
          serviceType: gig.serviceType,
          tags: gig.tags,
        }));

        setGigs(liveGigs);
      } catch (err) {
        console.error("Error fetching live gigs for home section:", err);
        setGigs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGigs();
  }, [hideOwnGig, userProfile]);

  return (
    <section id="explore-skills" className="ssh-section-clear bg-white scroll-mt-20">
      {/* Featured live service gigs */}
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-14">
        <ScrollReveal delayMs={40}>
          <div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                Explore Student Skill Gigs
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Find skills offered by verified university students.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="mt-6 grid auto-rows-fr grid-cols-1 items-stretch justify-items-stretch gap-4 min-[560px]:grid-cols-2 min-[760px]:grid-cols-3 min-[1280px]:grid-cols-4 sm:mt-8 min-[760px]:gap-3 xl:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <ScrollReveal key={i} delayMs={80 + i * 55} className="flex h-full w-full max-w-[19rem] justify-self-center min-[560px]:max-w-none">
                <div className="ssh-card flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-28 w-full animate-pulse bg-slate-200 sm:h-32 xl:h-36" />
                  <div className="space-y-3 p-4 min-[760px]:p-3.5 xl:p-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                    <div className="flex gap-2">
                      <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <ScrollReveal delayMs={100}>
            <div className="ssh-card mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-sm font-semibold text-slate-900">No live gigs yet</p>
              <p className="mt-2 text-sm text-slate-600">
                Providers have not published any gigs yet. Once they do, the latest gigs will appear here.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="mt-6 grid auto-rows-fr grid-cols-1 items-stretch justify-items-stretch gap-4 min-[560px]:grid-cols-2 min-[760px]:grid-cols-3 min-[1280px]:grid-cols-4 sm:mt-8 min-[760px]:gap-3 xl:gap-5">
            {gigs.map((gig, index) => (
              <ScrollReveal key={gig.id} delayMs={80 + index * 60} className="flex h-full w-full max-w-[19rem] justify-self-center min-[560px]:max-w-none">
                <GigCard gig={gig} />
              </ScrollReveal>
            ))}
          </div>
        )}

        {loading || gigs.length > 0 ? (
          <ScrollReveal delayMs={220}>
            <div className="mt-7 flex justify-center sm:mt-8">
              <button
                type="button"
                onClick={() => {
                  if (!userProfile) {
                    setAuthModalOpen(true);
                    return;
                  }

                  router.push(viewAllHref);
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-5 text-sm font-semibold text-[#0f4cbf] shadow-[0_10px_24px_rgba(43,98,230,0.08)] transition hover:border-blue-200 hover:bg-blue-50"
              >
                Discover More Skills
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </ScrollReveal>
        ) : null}
      </div>
      <GuestAuthModal
        open={authModalOpen}
        title="Sign in to explore all skills"
        description="To browse the full skills marketplace, log in with your existing account or create a new one first."
        onClose={() => setAuthModalOpen(false)}
      />
    </section>
  );
}

function GigCard({ gig }: { gig: LiveGig }) {
  const { userProfile, refreshProfile } = useAuth();
  const pathname = usePathname();
  const isBuyerHome = pathname === "/home/buyer";
  const isProviderHome = pathname === "/home/provider";
  const isBothHome = pathname === "/home/both";
  const requestRole = isBuyerHome ? "buyer" : isProviderHome ? "provider" : isBothHome ? "both" : null;
  const previewHref = requestRole
    ? `/gig-preview/${requestRole}?source=home&providerId=${encodeURIComponent(gig.providerId)}&skillIndex=0${gig.gigId ? `&gigId=${encodeURIComponent(gig.gigId)}` : ""}&coverImage=${encodeURIComponent(gig.image)}`
    : `/gig-preview?providerId=${encodeURIComponent(gig.providerId)}&skillIndex=0${gig.gigId ? `&gigId=${encodeURIComponent(gig.gigId)}` : ""}&coverImage=${encodeURIComponent(gig.image)}`;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isFavorited = Boolean(
    userProfile?.favorites?.some(
      (fav) =>
        (fav as { gigId?: string; providerId?: string }).gigId === gig.id ||
        ((fav as { gigId?: string; providerId?: string }).gigId
          ? false
          : (fav as { providerId?: string }).providerId === gig.providerId)
    )
  );

  const handleToggleFavorite = async () => {
    if (!userProfile) {
      setAuthModalOpen(true);
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
            )
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
            savedAt: `Saved ${now.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`,
            description: gig.summary,
            university: gig.university,
            availability: gig.availability,
            price: "",
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
      <article className="ssh-card flex h-full min-h-[310px] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-md min-[760px]:min-h-[332px] xl:min-h-[350px]">
        <div className="ssh-card-image relative h-28 bg-slate-100 sm:h-32 xl:h-40">
          <Image
            src={gig.image}
            alt={gig.title}
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 320px, (min-width: 900px) 33vw, (min-width: 560px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-slate-900/10 to-transparent" />
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#1453c4] shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
            {gig.category}
          </span>
          <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={isFavorited ? "Remove this gig from favorites" : "Save this gig to favorites"}
              className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition sm:h-9 sm:w-9 ${
                isFavorited ? "bg-red-500 text-white" : "bg-white/95 text-slate-700 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <HeartIcon className="h-4.5 w-4.5" filled={isFavorited} />
            </button>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-slate-700 shadow-sm sm:px-2.5 sm:py-1 sm:text-xs">
              <StarIcon className="h-3.5 w-3.5 text-amber-400" />
              {formatRatingLabel(gig.rating)}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-3 min-[900px]:p-3.5 xl:p-4">
          <h3 className="line-clamp-2 text-[0.9rem] font-bold leading-5 text-slate-900 xl:text-[0.97rem] xl:leading-6">
            {gig.title}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#2f66e7] text-[10px] font-bold text-white ring-2 ring-white sm:h-8 sm:w-8">
              {gig.providerImage && gig.providerImage.startsWith("/") ? (
                <Image
                  src={gig.providerImage}
                  alt={gig.providerName}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                gig.providerName.charAt(0).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold leading-5 text-slate-700 xl:text-[13px]">
                {gig.providerName} <span className="font-medium text-slate-400">|</span>{" "}
                <span className="font-medium text-slate-500">{gig.university}</span>
              </p>
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-slate-600 xl:mt-3 xl:text-[12.5px]">
            {gig.summary}
          </p>

          <div className="mt-auto border-t border-slate-200 pt-2.5 sm:pt-3">
            <div className="text-[11px] text-slate-500">
              <span className="block truncate">{gig.availability}</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 min-[760px]:gap-1.5 xl:mt-3 xl:gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View Gig
              </button>
              <Link
                href={previewHref}
                onClick={(event) => {
                  if (!userProfile) {
                    event.preventDefault();
                    setAuthModalOpen(true);
                    return;
                  }
                }}
                className="ssh-primary-action inline-flex h-9 items-center justify-center rounded-lg bg-[#2f66e7] px-2 text-xs font-semibold text-white transition hover:bg-[#2557cf]"
              >
                Request Now
              </Link>
            </div>
          </div>
        </div>
      </article>

      {previewOpen ? (
        <SharedGigDetailsModal
          gig={{
            title: ensureGigTitlePrefix(gig.title),
            category: gig.category,
            price: formatGigPrice(gig.price),
            providerName: gig.providerName,
            ratingLabel: formatRatingLabel(gig.rating),
            summary: gig.summary,
            availability: gig.availability,
            image: gig.image,
          }}
          previewHref={previewHref}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}

      <GuestAuthModal
        open={authModalOpen}
        title="Log in or create an account to continue"
        description="If you already have a Skill Swap Hub account, log in to continue with this gig. If not, create a new account first."
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

function formatGigPrice(price: number | string) {
  if (price === "" || price === 0 || price === "0") return "Price on chat";
  if (typeof price === "number") return `LKR ${price.toLocaleString()}`;
  const normalized = price.trim();
  return normalized.toLowerCase().startsWith("lkr")
    ? normalized
    : `LKR ${normalized}`;
}

function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 3z" />
    </svg>
  );
}

function HeartIcon({ className, filled = false }: { className?: string; filled?: boolean }) {
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
