import type { ReactElement, SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";

type IconType = (props: SVGProps<SVGSVGElement>) => ReactElement;

type Highlight = {
  label: string;
  Icon: IconType;
};

const highlights: Highlight[] = [
  { label: "Verified Students", Icon: VerifiedIcon },
  { label: "Peer Matching", Icon: MatchIcon },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#e9f7f0]">
      <div
        className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-white/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#d2f1e4] blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {highlights.map((item) => (
              <HighlightBadge key={item.label} label={item.label} Icon={item.Icon} />
            ))}
          </div>
          <h1 className="mt-6 text-4xl font-semibold text-slate-900 sm:text-5xl">
            <span className="block">Exchange Skills</span>
            <span className="block text-[#0f4cbf]">Learn Together</span>
            <span className="block">Grow Faster</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            A trusted student-only platform for Sri Lankan university students to offer skills,
            request services, and connect with verified peers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/get-started"
              className="rounded-full bg-[#0f4cbf] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3fa1]"
            >
              Get Started
            </Link>
            <Link
              href="/explore"
              className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              Explore Skills
            </Link>
          </div>
          <form
            className="mt-8 flex w-full max-w-xl items-center gap-3 rounded-full bg-white p-2 shadow-sm ring-1 ring-slate-200"
            role="search"
          >
            <div className="flex flex-1 items-center gap-2 px-3 text-slate-400">
              <SearchIcon className="h-4 w-4" aria-hidden="true" />
              <input
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                type="text"
                placeholder="Search for skills"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-[#0f4cbf] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3fa1]"
            >
              Search Skills
            </button>
          </form>
        </div>
        <div className="relative flex items-center justify-center lg:justify-end">
          {/* <div
            className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/70 shadow-sm"
            aria-hidden="true"
          /> */}
          <Image
            src="/img/hero-illustration.png"
            alt="Student learning with laptop"
            width={520}
            height={560}
            className="h-auto w-full max-w-md object-contain lg:max-w-lg"
            priority
            sizes="(min-width: 1024px) 520px, 80vw"
          />
        </div>
      </div>
    </section>
  );
}

function HighlightBadge({ label, Icon }: { label: string; Icon: IconType }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f1ff] text-[#0f4cbf]">
        <Icon className="h-3 w-3" aria-hidden="true" />
      </span>
      {label}
    </span>
  );
}

function VerifiedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M12 3l2.6 1.4 2.9.4.4 2.9 1.4 2.6-1.4 2.6-.4 2.9-2.9.4L12 21l-2.6-1.4-2.9-.4-.4-2.9L4.7 12l1.4-2.6.4-2.9 2.9-.4L12 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MatchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M8 16c-2.5 0-4.5-2-4.5-4.5S5.5 7 8 7s4.5 2 4.5 4.5S10.5 16 8 16z" />
      <path d="M16 17c1.9 0 3.5-1.6 3.5-3.5S17.9 10 16 10s-3.5 1.6-3.5 3.5S14.1 17 16 17z" />
      <path
        d="M3.5 20c1.5-2.2 3.8-3.5 6.5-3.5 2.2 0 4.1.9 5.6 2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}
