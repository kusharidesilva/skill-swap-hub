"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";
import { db } from "@/lib/firebase";
import { scopedHref } from "@/lib/role-routes";
import { useAuth } from "@/context/AuthContext";

const gigImages = [
  "/img/package%201.jpg",
  "/img/package%202.jpg",
  "/img/package%203.jpg",
  "/img/package%204.jpg",
];

type LiveGig = {
  id: string;
  providerId: string;
  title: string;
  category: string;
  rating: number;
  providerName: string;
  university: string;
  providerImage?: string;
  summary: string;
  availability: string;
  image: string;
  serviceType: string;
  tags: string[];
};

export default function SkillGigsSection() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const [gigs, setGigs] = useState<LiveGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingsVersion, setRatingsVersion] = useState(0);

  const isBuyerHome = pathname === "/home/buyer";
  const isProviderHome = pathname === "/home/provider";
  const isBothHome = pathname === "/home/both";
  const viewAllHref = isBuyerHome
    ? "/find-services/buyer"
    : isProviderHome
      ? "/explore-services?role=provider"
      : isBothHome
        ? "/find-services/both"
        : "/explore-services";

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "requests"), where("status", "==", "completed")),
      () => setRatingsVersion((value) => value + 1),
      (err) => console.error("Error subscribing to live homepage ratings:", err),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchGigs() {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const requestsSnap = await getDocs(query(collection(db, "requests"), where("status", "==", "completed")));
        const ratingsMap: Record<string, { totalStars: number; count: number }> = {};

        requestsSnap.forEach((reqDoc) => {
          const req = reqDoc.data();
          const providerId = req.providerId;
          if (providerId && req.review && typeof req.review.rating === "number") {
            ratingsMap[providerId] ??= { totalStars: 0, count: 0 };
            ratingsMap[providerId].totalStars += req.review.rating;
            ratingsMap[providerId].count += 1;
          }
        });

        const liveGigs: LiveGig[] = [];

        usersSnap.forEach((userDoc) => {
          if (userProfile && userDoc.id === userProfile.uid) return;

          const user = userDoc.data();
          const skills: string[] = user.providerProfile?.skills || [];
          const storedGigs = user.providerProfile?.gigs || [];
          const providerName: string = user.name || "Campus Student";
          const university: string = user.university || "Campus";
          const providerImage: string = user.profileImageUrl || "";
          const availability: string =
            typeof user.providerProfile?.availability === "string"
              ? user.providerProfile.availability
              : Array.isArray(user.providerProfile?.availability)
                ? (user.providerProfile.availability[0] as string) || "Flexible"
                : "Flexible";
          const ratingData = ratingsMap[userDoc.id];
          const rating = ratingData
            ? Number((ratingData.totalStars / ratingData.count).toFixed(1))
            : 0;

          const gigEntries: Array<{
            title: string;
            category: string;
            summary: string;
            image: string;
          }> =
            storedGigs.length > 0
              ? storedGigs.map((gig: { title?: string; category?: string; summary?: string; image?: string }, skillIndex: number) => ({
                  title: gig.title || skills[skillIndex] || "Student Skill",
                  category: gig.category || skills[skillIndex] || "Skill",
                  summary:
                    gig.summary ||
                    `Practical support from a verified university student.`,
                  image:
                    gig.image ||
                    user.providerProfile?.gigImages?.[skillIndex] ||
                    gigImages[skillIndex % gigImages.length],
                }))
              : skills.map((skill, skillIndex) => ({
                  title: `I will do ${skill}`,
                  category: skill,
                  summary: `Practical ${skill.toLowerCase()} support from a verified university student.`,
                  image:
                    user.providerProfile?.gigImages?.[skillIndex] ||
                    gigImages[skillIndex % gigImages.length],
                }));

          gigEntries.slice(0, 1).forEach((gigEntry, skillIndex) => {
            if (liveGigs.length >= 4) return;
            liveGigs.push({
              id: `${userDoc.id}-${skillIndex}`,
              providerId: userDoc.id,
              title: gigEntry.title,
              category: gigEntry.category,
              rating,
              providerName,
              university,
              providerImage,
              summary: gigEntry.summary,
              availability,
              image: gigEntry.image,
              serviceType: "Skill Exchange",
              tags: [gigEntry.category, "Skill Exchange", availability],
            });
          });
        });

        setGigs(liveGigs.slice(0, 4));
      } catch (err) {
        console.error("Error fetching live gigs for home section:", err);
        setGigs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGigs();
  }, [ratingsVersion, userProfile]);

  return (
    <section id="explore-skills" className="bg-white scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Explore Student Skill Gigs
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Find skills offered by verified university students.
            </p>
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f4cbf]"
          >
            View All Skills
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="h-40 w-full animate-pulse bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="flex gap-2">
                    <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-sm font-semibold text-slate-900">No live gigs yet</p>
            <p className="mt-2 text-sm text-slate-600">
              Providers have not published any gigs yet. Once they do, the latest gigs will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function GigCard({ gig }: { gig: LiveGig }) {
  const { userProfile, refreshProfile } = useAuth();
  const pathname = usePathname();
  const isBuyerHome = pathname === "/home/buyer";
  const isProviderHome = pathname === "/home/provider";
  const isBothHome = pathname === "/home/both";
  const requestRole = isBuyerHome ? "buyer" : isProviderHome ? "provider" : isBothHome ? "both" : "buyer";
  const previewHref = `/gig-preview/${requestRole}?providerId=${encodeURIComponent(gig.providerId)}&skillIndex=0`;
  const requestHref = `${scopedHref("/request-service", requestRole)}?providerId=${encodeURIComponent(gig.providerId)}`;
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
            rating: gig.rating.toFixed(1),
            image: gig.image,
            avatar: gig.providerImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(gig.providerName)}&background=2f66e7&color=fff&size=400`,
            level: gig.university,
            savedAt: `Saved ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
            description: gig.summary,
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
    <article className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-md">
      <div className="relative h-40 bg-slate-100">
        <Image
          src={gig.image}
          alt={gig.title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 320px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-slate-900/10 to-transparent" />
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
            {gig.rating > 0 ? gig.rating.toFixed(1) : "New"}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[0.97rem] font-bold leading-6 text-slate-900">
          {gig.title}
        </h3>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#2f66e7] text-[10px] font-bold text-white ring-2 ring-white">
            {gig.providerImage && gig.providerImage.startsWith("/") ? (
              <Image src={gig.providerImage} alt={gig.providerName} width={32} height={32} className="h-full w-full object-cover" />
            ) : (
              gig.providerName.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-5 text-slate-700">{gig.providerName}</p>
            <p className="truncate text-[12px] leading-4 text-slate-500">{gig.university} student</p>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-[12.5px] leading-5 text-slate-600">
          {gig.summary}
        </p>

        <div className="mt-auto border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="truncate">{gig.availability}</span>
            <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#dff2f4] px-2 py-0.5 text-[10px] font-semibold leading-none text-teal-800">
              {gig.serviceType}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={previewHref}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Gig
            </Link>
            <Link
              href={requestHref}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#2f66e7] px-2 text-xs font-semibold text-white transition hover:bg-[#2557cf]"
            >
              Request
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
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
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2} aria-hidden="true">
      <path d="M12 21s-6.4-4.1-9-8.1C1 9.8 2.4 6.2 5.8 5.6c2.1-.4 3.8.6 5 2.3.2.3.3.4.4.4s.2-.1.4-.4c1.2-1.7 2.9-2.7 5-2.3 3.4.6 4.8 4.2 2.8 7.3C18.4 16.9 12 21 12 21z" />
    </svg>
  );
}
