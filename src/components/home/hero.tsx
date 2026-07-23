"use client";

import type { ReactElement, SVGProps } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dashboardHref, homeHref, scopedHref, type SiteRole } from "@/lib/role-routes";

type IconType = (props: SVGProps<SVGSVGElement>) => ReactElement;

type Highlight = {
  label: string;
  Icon: IconType;
};

const highlights: Highlight[] = [
  { label: "VERIFIED PROVIDERS", Icon: VerifiedIcon },
  { label: "TRUSTED MATCHING", Icon: MatchIcon },
];

type HeroSectionProps = {
  role?: SiteRole;
};

export default function HeroSection({ role = "guest" }: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const exploreHref = `${homeHref(role)}#explore-skills`;
  const primaryHref = role === "guest" ? "/get-started" : dashboardHref(role);
  const primaryLabel = role === "guest" ? "Get Started" : "Go to Dashboard";
  const searchResultsHref =
    role === "guest"
      ? "/get-started"
      : `${scopedHref("/find-services", role)}?query=${encodeURIComponent(searchQuery.trim())}`;

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (role === "guest") {
      router.push("/get-started");
      return;
    }

    const trimmedQuery = searchQuery.trim();
    router.push(
      trimmedQuery
        ? `${scopedHref("/find-services", role)}?query=${encodeURIComponent(trimmedQuery)}`
        : scopedHref("/find-services", role)
    );
  };

  return (
    // The first screen introduces the platform and directs users to the right action.
    <section className="ssh-home-hero ssh-hero-section relative overflow-hidden bg-[#ebf5f0]">
      <div
        className="ssh-hero-orbit ssh-hero-orbit-left"
        aria-hidden="true"
      />
      <div
        className="ssh-hero-orbit ssh-hero-orbit-right"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 pt-14 pb-0 lg:grid-cols-2 lg:pt-12 lg:pb-0 lg:min-h-[calc(100vh_-_85px)]"> 
        <div className="ssh-hero-copy relative z-10"> 
          <div className="flex flex-wrap items-center gap-3"> 
            {highlights.map((item) => (
              <HighlightBadge
                key={item.label}
                label={item.label}
                Icon={item.Icon}
              />
            ))}
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl leading-[1.15]"> 
            <span className="block">Exchange Skills</span>
            <span className="block text-[#2b62e6]">Learn Together</span> 
            <span className="block">Grow Faster</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base"> 
            A trusted platform where verified university students offer skills
            and both students and buyers can request services with confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-4"> 
            <Link 
              href={primaryHref}
              className="ssh-primary-action rounded-lg bg-[#2b62e6] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc]" 
            >
              {primaryLabel}
            </Link>
            <Link
              href={exploreHref}
              className="ssh-secondary-action rounded-lg border border-slate-200 bg-white/60 backdrop-blur-xs px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:border-slate-300 hover:text-slate-900" 
            >
              Explore Skills
            </Link>
          </div>
          <form
            onSubmit={handleSearchSubmit}
            className="ssh-search-card mt-8 flex w-full max-w-xl items-center gap-3 rounded-xl bg-white p-1.5 shadow-md border border-slate-200/80"
            role="search"
          >
            <div className="flex flex-1 items-center gap-2.5 px-3 text-slate-400"> 
              <SearchIcon className="h-5 w-5 text-slate-400" aria-hidden="true" /> 
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                type="text"
                placeholder="Search for skills or services"
              />
            </div>
            {role === "guest" ? (
              <Link
                href={searchResultsHref}
                className="ssh-primary-action rounded-lg bg-[#2b62e6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc]"
              >
                Search Skills
              </Link>
            ) : (
              <button
                type="submit"
                className="ssh-primary-action rounded-lg bg-[#2b62e6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc]"
              >
                Search Skills
              </button>
            )}
          </form>
        </div>
        <div className="ssh-hero-art relative flex items-end justify-center lg:justify-end -mb-5 lg:-mb-10 self-end lg:translate-x-16">
          <Image
            src="/img/hero-illustration.png"
            alt="Student learning with laptop"
            width={720}
            height={720}
            className="ssh-hero-image h-auto w-full max-w-md object-contain sm:max-w-lg lg:max-w-[630px] lg:w-[630px] transition-all duration-300 hover:scale-[1.02]"
            priority
            sizes="(min-width: 1024px) 630px, 80vw"
          />
        </div>
      </div>
    </section>
  );
}

function HighlightBadge({ 
  label, 
  Icon, 
}: { 
  label: string; 
  Icon: IconType; 
}) { 
  return ( 
    <span className="ssh-highlight-badge inline-flex items-center gap-1.5 rounded-full bg-[#e6fcf4] px-3 py-1 text-xs font-semibold text-[#0f8a6b] shadow-xs"> 
      <Icon className="h-4 w-4" aria-hidden="true" /> 
      {label} 
    </span> 
  );
}

function VerifiedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MatchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a6 6 0 00-3.44-5.32M15 8a3 3 0 11-6 0 3 3 0 016 0zM6 18.72a6 6 0 013.44-5.32M12 14c-3.3 0-6 2.7-6 6h12c0-3.3-2.7-6-6-6z"
      />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}
