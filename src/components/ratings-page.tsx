"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Role = "buyer" | "provider" | "both";
type ReviewsTab = "received" | "given";

type RatingsPageContentProps = {
  role: Role;
};

type ReviewItem = {
  id: string;
  name: string;
  date: string;
  skill: string;
  text: string;
  reply?: string | null;
};

const receivedReviews: ReviewItem[] = [
  {
    id: "r1",
    name: "Alex Thompson",
    date: "2 days ago",
    skill: "React Development",
    text: "Incredible mentor! They explained complex state management concepts in a way that finally clicked for me.",
    reply: null,
  },
  {
    id: "r2",
    name: "Sarah Jenkins",
    date: "Oct 12, 2023",
    skill: "Academic Writing",
    text: "Great help with my thesis structure. Very patient and provided detailed feedback on citation style.",
    reply: "Thanks Sarah! Sorry again about the rescheduling, glad the feedback helped your thesis!",
  },
  {
    id: "r3",
    name: "Jordan Lee",
    date: "Sep 28, 2023",
    skill: "UI Design Basics",
    text: "This swap was a game changer for my personal project. Super knowledgeable and easy to talk to.",
    reply: null,
  },
];

const givenReviews: ReviewItem[] = [
  {
    id: "g1",
    name: "Malith Perera",
    date: "1 day ago",
    skill: "React Development",
    text: "Very clear explanations and excellent session structure. Would definitely recommend.",
  },
  {
    id: "g2",
    name: "Nimali Silva",
    date: "Oct 04, 2023",
    skill: "Data Analysis",
    text: "Great support with pandas and visualization. Super patient and practical guidance.",
  },
  {
    id: "g3",
    name: "Arjun Raman",
    date: "Sep 11, 2023",
    skill: "SQL Advanced Queries",
    text: "Strong technical depth and well-prepared examples. Session was very useful.",
  },
];

export default function RatingsPageContent({ role }: RatingsPageContentProps) {
  const roleDefaultTab: ReviewsTab = role === "buyer" ? "given" : "received";
  const [tab, setTab] = useState<ReviewsTab>(roleDefaultTab);
  const [filter, setFilter] = useState<"all" | "5" | "4">("all");

  const canSeeReceived = role === "provider" || role === "both";
  const canSeeGiven = role === "buyer" || role === "both";

  const list = useMemo(() => {
    const base = tab === "received" ? receivedReviews : givenReviews;
    if (filter === "all") return base;
    return filter === "5" ? base.slice(0, 2) : base.slice(1);
  }, [tab, filter]);

  return (
    <section className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 md:text-[2.4rem]">Ratings &amp; Reviews</h1>
        <p className="mt-2 text-base text-slate-600">
          Manage your reputation and view feedback from your swap partners.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <article className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-slate-600">Global Rating</p>
          <p className="mt-3 text-center text-[2.6rem] font-semibold leading-none text-[#1453c4]">4.8 / 5</p>
          <p className="mt-3 text-center text-2xl text-amber-600">★★★★☆</p>
        </article>

        <article className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-lg font-semibold text-slate-700">Review Summary</p>
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_120px] md:items-center">
            <div className="space-y-2">
              <BarRow label="5" width="85%" pct="85%" />
              <BarRow label="4" width="10%" pct="10%" />
              <BarRow label="3" width="5%" pct="5%" />
            </div>
            <div className="border-l border-slate-200 pl-4 text-center">
              <p className="text-[1.9rem] font-semibold text-slate-900">124</p>
              <p className="text-sm text-slate-600">Total Reviews</p>
            </div>
          </div>
        </article>
      </div>

      <div className="flex items-center gap-8 border-b border-slate-200">
        {canSeeReceived ? (
          <button
            onClick={() => setTab("received")}
            className={`border-b-2 pb-3 text-base font-semibold ${
              tab === "received" ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-600"
            }`}
          >
            Reviews Received
          </button>
        ) : null}
        {canSeeGiven ? (
          <button
            onClick={() => setTab("given")}
            className={`border-b-2 pb-3 text-base font-semibold ${
              tab === "given" ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-600"
            }`}
          >
            Reviews Given
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base text-slate-700">Filter by:</span>
          <FilterPill active={filter === "all"} label="All Ratings" onClick={() => setFilter("all")} />
          <FilterPill active={filter === "5"} label="5 Stars" onClick={() => setFilter("5")} />
          <FilterPill active={filter === "4"} label="4 Stars" onClick={() => setFilter("4")} />
        </div>
        <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          Newest First
        </button>
      </div>

      <div className="space-y-4">
        {list.map((review) => (
          <article key={review.id} className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-200" />
                <div>
                  <p className="text-[1.35rem] font-semibold text-slate-900">{review.name}</p>
                  <p className="text-sm text-amber-600">★★★★★ <span className="text-slate-600">{review.date}</span></p>
                </div>
              </div>
              <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700">{review.skill}</span>
            </div>

            <p className="mt-3 text-base leading-7 text-slate-700">&quot;{review.text}&quot;</p>

            {review.reply ? (
              <div className="mt-3 rounded-lg border-l-4 border-[#1453c4] bg-[#f4f5ff] p-3">
                <p className="text-sm font-semibold text-[#1453c4]">Your Response</p>
                <p className="mt-1 text-base italic text-slate-700">&quot;{review.reply}&quot;</p>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-4 border-t border-slate-200 pt-3 text-sm font-semibold text-slate-600">
              <button>Reply</button>
              <button>Report</button>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-slate-700">{"<"}</button>
        <button className="h-10 w-10 rounded-lg bg-[#1453c4] text-white">1</button>
        <button className="text-slate-700">2</button>
        <button className="text-slate-700">3</button>
        <span className="text-slate-500">...</span>
        <button className="text-slate-700">12</button>
        <button className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-slate-700">{">"}</button>
      </div>

      <div className="hidden">
        <Link href="/ratings">ratings</Link>
      </div>
    </section>
  );
}

function BarRow({ label, width, pct }: { label: string; width: string; pct: string }) {
  return (
    <div className="grid grid-cols-[18px_minmax(0,1fr)_34px] items-center gap-2 text-sm text-slate-700">
      <span>{label}</span>
      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-[#1453c4]" style={{ width }} />
      </div>
      <span>{pct}</span>
    </div>
  );
}

function FilterPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
        active ? "bg-[#1453c4] text-white" : "bg-slate-200 text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
