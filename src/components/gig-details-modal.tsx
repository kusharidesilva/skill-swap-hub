"use client";

import Image from "next/image";
import Link from "next/link";
import ModalPortal from "@/components/ui/modal-portal";
import { AVAILABILITY_DAYS } from "@/lib/platform";

export type GigDetailsModalData = {
  title: string;
  category: string;
  price: string;
  providerName: string;
  ratingLabel: string;
  summary?: string;
  description?: string;
  availability?: string | string[];
  image: string;
};

type GigDetailsModalProps = {
  gig: GigDetailsModalData;
  previewHref: string;
  onClose: () => void;
};

export default function GigDetailsModal({ gig, previewHref, onClose }: GigDetailsModalProps) {
  const modalFacts = [
    { label: "Category", value: gig.category },
    { label: "Price", value: gig.price },
    { label: "Provider", value: gig.providerName },
    { label: "Rating", value: gig.ratingLabel },
  ];
  const availabilitySummary = formatAvailabilitySummary(gig.availability);
  const bodyText = gig.summary || gig.description || "";

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/40 px-3 py-5 backdrop-blur-md sm:px-4 sm:py-6 md:items-center"
        onClick={onClose}
      >
        <article
          className="relative grid max-h-[calc(100dvh-2.5rem)] w-full max-w-4xl overflow-y-auto rounded-[26px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(243,248,255,0.97))] shadow-[0_28px_76px_rgba(15,23,42,0.2)] md:max-h-[calc(100dvh-3rem)] md:grid-cols-[1fr_0.95fr] md:rounded-[28px]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gig details"
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-500 shadow-[0_10px_26px_rgba(15,23,42,0.1)] transition hover:border-slate-300 hover:text-slate-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          <div className="relative min-h-[230px] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(63,94,251,0.16),transparent_34%),linear-gradient(160deg,#edf4ff_0%,#f8fbff_46%,#eef8f6_100%)] p-4 md:min-h-[390px] md:p-6">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="relative flex h-full min-h-[200px] items-center justify-center overflow-hidden rounded-[22px] border border-white/80 bg-white/90 shadow-[0_18px_38px_rgba(15,23,42,0.08)] md:min-h-[320px] md:rounded-[24px]">
              <Image
                src={gig.image}
                alt={gig.title}
                fill
                className="object-contain p-4 md:p-6"
                sizes="(min-width: 768px) 420px, 100vw"
              />
            </div>
          </div>

          <div className="min-w-0 p-5 pt-13 sm:pt-14 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-[#1453c4] shadow-sm">
                {gig.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                {gig.ratingLabel}
              </span>
            </div>

            <h2 className="mt-4 break-words text-[1.45rem] font-black leading-[1.1] tracking-tight text-slate-900 sm:text-[1.65rem]">
              {gig.title}
            </h2>
            {bodyText ? (
              <p className="mt-2.5 line-clamp-3 break-words text-sm leading-6 text-slate-600">
                {bodyText}
              </p>
            ) : null}

            <div className="mt-5 space-y-3">
              <div className="rounded-[18px] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff,#ffffff)] px-4 py-3 shadow-[0_10px_22px_rgba(15,23,42,0.03)]">
                <dl className="grid gap-2.5 text-sm sm:grid-cols-2">
                  {modalFacts.map((fact) => (
                    <div key={fact.label} className="min-w-0">
                      <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{fact.label}</dt>
                      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-[18px] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff,#ffffff)] px-4 py-3 shadow-[0_10px_22px_rgba(15,23,42,0.03)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Availability</p>
                {availabilitySummary.days.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {availabilitySummary.days.map((day) => (
                      <span
                        key={day.short}
                        className={`min-w-8 rounded-full px-2 py-1 text-center text-[10px] font-bold ${
                          day.active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {day.short}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 break-words text-[15px] font-semibold leading-6 text-slate-800">
                    {availabilitySummary.label}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href={previewHref}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2f66e7] px-5 text-sm font-semibold text-white transition hover:bg-[#2557cf]"
              >
                View Full Details
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </article>
      </div>
    </ModalPortal>
  );
}

function formatAvailabilitySummary(value: string | string[] | undefined) {
  const slots = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((item) => item.trim());
  const cleanSlots = slots.filter(Boolean);

  if (cleanSlots.length === 0) {
    return {
      label: "Flexible",
      days: [],
    };
  }

  const activeDays = new Set(
    AVAILABILITY_DAYS.filter((day) =>
      cleanSlots.some((slot) => slot.toLowerCase().startsWith(day.toLowerCase())),
    ),
  );

  return {
    label: cleanSlots.join(", "),
    days: AVAILABILITY_DAYS.map((day) => ({
      short: day.slice(0, 3),
      active: activeDays.has(day),
    })),
  };
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 6l12 12" strokeLinecap="round" />
      <path d="M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
