"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";
import { db } from "@/lib/firebase";
import { scopedHref } from "@/lib/role-routes";

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
  summary: string;
  availability: string;
  image: string;
  serviceType: string;
  tags: string[];
};

export default function SkillGigsSection() {
  const pathname = usePathname();
  const [gigs, setGigs] = useState<LiveGig[]>([]);
  const [loading, setLoading] = useState(true);

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
    async function fetchGigs() {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const liveGigs: LiveGig[] = [];
        let userIndex = 0;

        usersSnap.forEach((userDoc) => {
          const user = userDoc.data();
          const skills: string[] = user.providerProfile?.skills || [];
          const providerName: string = user.name || "Campus Student";
          const university: string = user.university || "Campus";
          const availability: string =
            typeof user.providerProfile?.availability === "string"
              ? user.providerProfile.availability
              : Array.isArray(user.providerProfile?.availability)
                ? (user.providerProfile.availability[0] as string) || "Flexible"
                : "Flexible";

          skills.slice(0, 1).forEach((skill, skillIndex) => {
            if (liveGigs.length >= 4) return;
            liveGigs.push({
              id: `${userDoc.id}-${skillIndex}`,
              providerId: userDoc.id,
              title: `${skill} Help`,
              category: skill,
              rating: 4.5 + Math.round(Math.random() * 5) / 10,
              providerName,
              university,
              summary: `Practical ${skill.toLowerCase()} support from a verified university student.`,
              availability,
              image: gigImages[(userIndex + skillIndex) % gigImages.length],
              serviceType: "Skill Exchange",
              tags: [skill, "Skill Exchange", availability],
            });
          });
          userIndex++;
        });

        setGigs(liveGigs.slice(0, 4));
      } catch (err) {
        console.error("Error fetching live gigs for home section:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchGigs();
  }, []);

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
          // Fallback static cards if no providers have skills yet
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { id: "graphic-design-social-posts", providerId: "graphic-design-social-posts", title: "Graphic Design for Social Media Posts", category: "Design", rating: 4.8, providerName: "Campus student", university: "Rajini Campus", availability: "Weekends", image: "/img/package%201.jpg", serviceType: "Skill Exchange / Paid", summary: "Creative design support for polished social content and branding assets.", tags: ["Design", "Skill Exchange / Paid", "Weekends"] },
              { id: "python-programming-help", providerId: "python-programming-help", title: "Python Programming Help", category: "Programming", rating: 4.7, providerName: "Campus student", university: "SLIIT", availability: "Evenings", image: "/img/package%202.jpg", serviceType: "Skill Exchange", summary: "Friendly coding support for Python tasks, debugging, and project guidance.", tags: ["Programming", "Skill Exchange", "Evenings"] },
              { id: "cv-writing-linkedin-help", providerId: "cv-writing-linkedin-help", title: "CV Writing and LinkedIn Help", category: "Career", rating: 4.9, providerName: "Campus student", university: "NSBM", availability: "Flexible", image: "/img/package%203.jpg", serviceType: "Paid", summary: "Professional profile help to improve CVs, LinkedIn presence, and applications.", tags: ["Career", "Paid", "Flexible"] },
              { id: "powerpoint-design-help", providerId: "powerpoint-design-help", title: "PowerPoint Presentation Design", category: "Academic", rating: 4.6, providerName: "Campus student", university: "KDU", availability: "Weekdays", image: "/img/package%204.jpg", serviceType: "Skill Exchange / Paid", summary: "Clean and persuasive slide design for academic or project presentations.", tags: ["Academic", "Skill Exchange / Paid", "Weekdays"] },
            ].map((gig) => (
              <GigCard key={gig.id} gig={gig} viewAllHref={viewAllHref} />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} viewAllHref={viewAllHref} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function GigCard({ gig, viewAllHref }: { gig: LiveGig; viewAllHref: string }) {
  const pathname = usePathname();
  const isBuyerHome = pathname === "/home/buyer";
  const isProviderHome = pathname === "/home/provider";
  const isBothHome = pathname === "/home/both";
  const requestRole = isBuyerHome ? "buyer" : isProviderHome ? "provider" : isBothHome ? "both" : "buyer";
  const previewHref = `/gig-preview/${requestRole}?providerId=${encodeURIComponent(gig.providerId)}&skillIndex=0`;
  const requestHref = `${scopedHref("/request-service", requestRole)}?providerId=${encodeURIComponent(gig.providerId)}`;

  return (
    <article className="flex min-h-[330px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-md">
      <div className="relative h-32 bg-slate-100">
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
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
          <span className="text-amber-400">â˜…</span>
          {gig.rating.toFixed(1)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="min-h-[3rem] line-clamp-2 text-base font-semibold leading-6 text-slate-900">
          {gig.title}
        </h3>

        <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2f66e7] text-[10px] font-bold text-white">
            {gig.providerName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-700">{gig.providerName}</p>
            <p className="truncate text-slate-500">{gig.university} student</p>
          </div>
        </div>

        <p className="mt-3 min-h-[2.5rem] line-clamp-2 text-xs leading-5 text-slate-600">
          {gig.summary}
        </p>

        <div className="mt-3 min-h-[2.5rem] flex flex-wrap gap-1">
          {gig.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#dff2f4] px-2.5 py-0.5 text-xs font-medium text-teal-800"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3">
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
