"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { scopedHref, type Role } from "@/lib/role-routes";

type SubmitReviewPageProps = {
  role: Role;
  peer?: string;
};

const peerMap: Record<string, { name: string; skill: string; avatar: string }> = {
  alex: {
    name: "Alex Rivera",
    skill: "Birthday Photography",
    avatar: "/img/chats/alex-rivera.jpg",
  },
  sarah: {
    name: "Sarah Chen",
    skill: "Event Decoration Setup",
    avatar: "/img/chats/sarah-chen.jpg",
  },
  marcus: {
    name: "Marcus Johnson",
    skill: "Graphic Design Portfolio",
    avatar: "/img/chats/marcus-johnson.jpg",
  },
};

const highlightOptions = ["Professionalism", "Communication", "Skill Level", "Reliability", "Friendly"];

export default function SubmitReviewPage({ role, peer = "alex" }: SubmitReviewPageProps) {
  const partner = peerMap[peer] ?? peerMap.alex;
  const [rating, setRating] = useState(4);
  const [feedback, setFeedback] = useState("");
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>(["Professionalism"]);

  // This label lets screen-reader users hear the current star selection.
  const starLabel = useMemo(() => `Tap to rate (${rating}/5 Stars selected)`, [rating]);

  return (
    <div className="space-y-6 pb-10">
      <p className="text-sm font-semibold text-slate-500">
        <span className="text-[#1453c4]">Matches</span> &gt; Submit Review
      </p>

      <header>
        <h1 className="text-2xl font-semibold text-slate-900 md:text-[2.3rem]">Submit Your Review</h1>
        <p className="mt-2 text-base text-slate-600">
          Your feedback helps the community grow and ensures high-quality skill exchanges.
        </p>
      </header>

      {/* Review form */}
      <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
        <article className="rounded-xl border border-slate-300 bg-[#f4f5ff] p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#1453c4]">
              <Image src={partner.avatar} alt={partner.name} fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Exchange Partner</p>
              <p className="text-[1.55rem] font-semibold text-slate-900">{partner.name}</p>
              <p className="text-[1.15rem] text-slate-700">Skill: {partner.skill}</p>
            </div>
          </div>
        </article>

        <div className="mt-6">
          <h2 className="text-[1.6rem] font-semibold text-slate-900">How would you rate your experience?</h2>
          <div className="mt-3 flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = value <= rating;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`h-10 w-10 ${active ? "text-slate-700" : "text-slate-400"}`}
                  aria-label={`Rate ${value} stars`}
                >
                  <StarIcon filled={active} />
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-base italic text-slate-600">{starLabel}</p>
        </div>

        <div className="mt-6">
          <label className="block text-[1.6rem] font-semibold text-slate-900">Your Feedback</label>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            maxLength={500}
            placeholder="Share your experience working with this peer..."
            className="mt-2 h-44 w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-400"
          />
          <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
            <span>Minimum 20 characters</span>
            <span>{feedback.length} / 500</span>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[1.6rem] font-semibold text-slate-900">
            What stood out most? <span className="text-base font-normal text-slate-500">(Optional)</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {highlightOptions.map((option) => {
              const active = selectedHighlights.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setSelectedHighlights((prev) =>
                      active ? prev.filter((value) => value !== option) : [...prev, option],
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    active
                      ? "border-teal-700 bg-teal-50 text-teal-700"
                      : "border-slate-400 bg-white text-slate-700"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-end gap-3">
            <Link
              href={scopedHref("/chats", role)}
              className="rounded-lg border border-slate-300 px-8 py-3 text-lg font-semibold text-slate-700"
            >
              Cancel
            </Link>
            <Link
              href={scopedHref("/ratings", role)}
              className="rounded-lg bg-[#1453c4] px-8 py-3 text-lg font-semibold text-white"
            >
              Submit Review
            </Link>
          </div>
        </div>
      </section>

      {/* Community reminder */}
      <section className="rounded-xl border border-teal-300 bg-[#d8f4ef] p-5">
        <p className="text-base font-semibold text-teal-800">Pro Tip for Reviews</p>
        <p className="mt-1 text-[1.1rem] text-slate-700">
          Mentioning specific concepts or tasks helps other students find the perfect mentor for their needs.
        </p>
      </section>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l2.6 5.4 5.9.9-4.3 4.1 1 5.9L12 16.8 6.8 19.3l1-5.9L3.5 9.3l5.9-.9z" />
    </svg>
  );
}
