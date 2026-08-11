"use client";

type ReviewTone = "blue" | "teal" | "amber";

type ReviewCardProps = {
  reviewerName: string;
  reviewerMeta?: string;
  rating: number;
  comment: string;
  serviceTitle?: string;
  serviceCategory?: string;
  contextLabel?: string;
  directionLabel?: string;
  roleLabel?: string;
  tone?: ReviewTone;
  compact?: boolean;
  tight?: boolean;
  className?: string;
};

const toneMap: Record<
  ReviewTone,
  {
    avatar: string;
    accent: string;
    badge: string;
  }
> = {
  blue: {
    avatar: "bg-[linear-gradient(135deg,#2f66e7,#5b87ff)] text-white",
    accent: "text-[#2b62e6]",
    badge: "border-blue-100 bg-blue-50 text-[#2b62e6]",
  },
  teal: {
    avatar: "bg-[linear-gradient(135deg,#0f9f87,#34d2b3)] text-white",
    accent: "text-teal-700",
    badge: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  amber: {
    avatar: "bg-[linear-gradient(135deg,#d97706,#f59e0b)] text-white",
    accent: "text-amber-700",
    badge: "border-amber-100 bg-amber-50 text-amber-700",
  },
};

export default function ReviewCard({
  reviewerName,
  reviewerMeta,
  rating,
  comment,
  serviceTitle,
  serviceCategory,
  contextLabel = "Service",
  directionLabel,
  roleLabel,
  tone = "blue",
  compact = false,
  tight = false,
  className = "",
}: ReviewCardProps) {
  const ui = toneMap[tone];
  const safeComment = comment.trim() || "Shared feedback after the completed swap.";
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const isCompact = compact || tight;

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,1))] ${tight ? "p-3 sm:p-3.5" : isCompact ? "p-3.5 sm:p-4" : "p-4 sm:p-5"} shadow-[0_10px_24px_rgba(15,23,42,0.035)] ${className}`.trim()}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            className={`flex ${tight ? "h-9 w-9 text-[12px]" : isCompact ? "h-10 w-10 text-[13px]" : "h-11 w-11 text-sm"} shrink-0 items-center justify-center rounded-2xl font-bold shadow-[0_10px_22px_rgba(15,23,42,0.08)] ${ui.avatar}`}
          >
            {buildInitials(reviewerName)}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`${tight ? "text-xs" : isCompact ? "text-[13px]" : "text-sm"} font-bold text-slate-900`}>
                {reviewerName}
              </p>
              {directionLabel ? <MetaBadge label={directionLabel} tone="slate" /> : null}
              {roleLabel ? <MetaBadge label={roleLabel} tone={tone} /> : null}
            </div>
            {reviewerMeta ? (
              <p className={`mt-1 ${tight ? "text-[10px] leading-4" : isCompact ? "text-[11px] leading-4.5" : "text-xs leading-5"} text-slate-500`}>
                {reviewerMeta}
              </p>
            ) : null}
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 self-start rounded-full border border-amber-100 bg-amber-50 ${tight ? "px-2 py-1" : isCompact ? "px-2.5 py-1" : "px-3 py-1.5"}`}>
          <ReviewStars rating={safeRating} />
          <span className={`${tight ? "text-[10px]" : isCompact ? "text-[11px]" : "text-xs"} font-semibold text-amber-700`}>
            {safeRating.toFixed(1)}
          </span>
        </div>
      </div>

      {serviceTitle || serviceCategory ? (
        <div className={`rounded-xl border border-slate-200/80 bg-white ${tight ? "mt-2.5 px-3 py-2" : isCompact ? "mt-3 px-3.5 py-2.5" : "mt-4 px-4 py-3"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {contextLabel}
            </span>
            {serviceCategory ? (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${ui.badge}`}
              >
                {serviceCategory}
              </span>
            ) : null}
          </div>
          {serviceTitle ? (
            <p className={`mt-2 ${tight ? "text-xs leading-4.5" : isCompact ? "text-[13px] leading-5" : "text-sm leading-6"} font-semibold ${ui.accent}`}>
              {serviceTitle}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={`rounded-xl border border-slate-200/80 bg-white ${tight ? "mt-2.5 px-3 py-2" : isCompact ? "mt-3 px-3.5 py-2.5" : "mt-4 px-4 py-3"}`}>
        <p className={`${tight ? "text-xs leading-4.5" : isCompact ? "text-[13px] leading-5" : "text-sm leading-6"} italic text-slate-600`}>
          &ldquo;{safeComment}&rdquo;
        </p>
      </div>
    </article>
  );
}

function MetaBadge({
  label,
  tone,
}: {
  label: string;
  tone: ReviewTone | "slate";
}) {
  const classes =
    tone === "slate"
      ? "border-slate-200 bg-slate-100 text-slate-600"
      : toneMap[tone].badge;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${classes}`}
    >
      {label}
    </span>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < Math.round(rating);
        return (
          <svg
            key={index}
            viewBox="0 0 24 24"
            className={`h-3.5 w-3.5 ${filled ? "text-amber-400" : "text-amber-200"}`}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 17.3 6.8 20l1-5.7L3.6 10l5.7-.8L12 3.9l2.7 5.3 5.7.8-4.2 4.3 1 5.7z" />
          </svg>
        );
      })}
    </span>
  );
}

function buildInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "SS"
  );
}
