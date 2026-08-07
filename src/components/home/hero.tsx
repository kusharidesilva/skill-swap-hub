"use client";

import type { ReactElement, SVGProps } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GuestAuthModal from "@/components/guest-auth-modal";
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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const exploreHref = `${homeHref(role)}#explore-skills`;
  const primaryHref = role === "guest" ? "/get-started" : dashboardHref(role);
  const primaryLabel = role === "guest" ? "Get Started" : "Go to Dashboard";

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (role === "guest") {
      setAuthModalOpen(true);
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
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 sm:px-6 sm:py-12 md:py-14 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,0.82fr)] lg:items-center lg:gap-8 lg:pt-9 lg:pb-0 lg:min-h-[calc(100vh_-_72px)] xl:gap-10 xl:pt-10 xl:pb-0">
        <div className="ssh-hero-copy relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center lg:mx-0 lg:max-w-none lg:items-start lg:self-center lg:pt-0 lg:text-left xl:-mt-1">
          <div className="flex flex-nowrap items-center justify-center gap-2 min-[420px]:gap-3 lg:justify-start">
            {highlights.map((item) => (
              <HighlightBadge
                key={item.label}
                label={item.label}
                Icon={item.Icon}
              />
            ))}
          </div>
          <h1 className="mt-5 text-[clamp(2.05rem,5vw,2.75rem)] font-bold leading-[1.12] tracking-tight text-slate-900 lg:mt-4 lg:text-[3.55rem] lg:leading-[1.03] xl:mt-5 xl:text-[3.85rem] 2xl:text-[4.05rem]">
            <span className="block">Exchange Skills</span>
            <span className="block text-[#2b62e6]">Learn Together</span>
            <span className="block">Grow Faster</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-[0.95rem] md:mt-6 lg:mx-0 lg:max-w-[27rem] lg:text-[0.92rem] xl:max-w-[28rem]">
            A trusted platform where verified university students offer skills
            and both students and buyers can request services with confidence.
          </p>
          <div className="mt-6 flex w-full flex-nowrap justify-center gap-3 sm:gap-4 md:mt-7 lg:justify-start">
            <Link
              href={primaryHref}
              className="ssh-primary-action inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[#2b62e6] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1f55cc] min-[420px]:flex-none min-[420px]:px-5 sm:px-6 sm:py-3 sm:text-sm"
            >
              {primaryLabel}
            </Link>
            <Link
              href={exploreHref}
              onClick={(event) => {
                if (role !== "guest") return;
                event.preventDefault();
                setAuthModalOpen(true);
              }}
              className="ssh-secondary-action inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white/60 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-xs transition hover:border-slate-300 hover:bg-white hover:text-slate-900 min-[420px]:flex-none min-[420px]:px-5 sm:px-6 sm:py-3 sm:text-sm"
            >
              Explore Skills
            </Link>
          </div>
          <form
            onSubmit={handleSearchSubmit}
            className="ssh-search-card mx-auto mt-5 flex w-full max-w-lg flex-col items-stretch gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_12px_28px_rgba(43,98,230,0.09)] backdrop-blur min-[500px]:flex-row min-[500px]:items-center min-[500px]:gap-1.5 md:mt-6 lg:mx-0 lg:max-w-[46rem]"
            role="search"
          >
            <div className="flex min-h-9 flex-1 items-center gap-2 rounded-xl px-3 text-slate-400 transition focus-within:bg-slate-50 min-[500px]:min-h-10">
              <SearchIcon className="h-4 w-4 text-slate-400 sm:h-4.5 sm:w-4.5" aria-hidden="true" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none sm:text-sm"
                type="text"
                placeholder="Search for skills or services"
              />
            </div>
            <button
              type="submit"
              className="ssh-primary-action min-h-9 rounded-xl bg-[#2b62e6] px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#1f55cc] min-[500px]:min-h-10 min-[500px]:w-auto min-[500px]:shrink-0 min-[500px]:px-5 sm:text-sm"
            >
              Search Skills
            </button>
          </form>
        </div>
        <div className="ssh-hero-art relative hidden items-end justify-center self-end lg:-mb-10 lg:flex lg:justify-end lg:self-end lg:translate-x-10 xl:-mb-10 xl:translate-x-14">
          <Image
            src="/img/hero-illustration.png"
            alt="Student learning with laptop"
            width={720}
            height={720}
            className="ssh-hero-image h-auto w-full max-w-md object-contain sm:max-w-lg lg:w-[min(36vw,495px)] lg:max-w-none xl:w-[540px] 2xl:w-[580px] transition-all duration-300 hover:scale-[1.02]"
            priority
            sizes="(min-width: 1536px) 580px, (min-width: 1280px) 540px, (min-width: 1024px) 36vw, 80vw"
          />
        </div>
      </div>
      <GuestAuthModal
        open={authModalOpen}
        title="Sign in to continue"
        description="To search skills or continue exploring the marketplace, log in with your account or create a new one first."
        onClose={() => setAuthModalOpen(false)}
      />
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
    <span className="ssh-highlight-badge inline-flex min-w-0 shrink items-center gap-1 rounded-full bg-[#e6fcf4] px-2 py-1 text-[10px] font-bold leading-none text-[#0f8a6b] shadow-xs min-[420px]:gap-1.5 min-[420px]:px-3 min-[420px]:text-xs">
      <Icon className="h-3.5 w-3.5 shrink-0 min-[420px]:h-4 min-[420px]:w-4" aria-hidden="true" />
      <span className="truncate">{label}</span>
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
