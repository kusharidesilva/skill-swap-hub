"use client";

import Image from "next/image";
import { useState } from "react";
import ScrollReveal from "@/components/scroll-reveal";
import ModalPortal from "@/components/ui/modal-portal";

const categories = [
  {
    title: "Account & Profile",
    description:
      "Guidance on creating a buyer or student account, completing email or proof verification, updating profile details, and setting up a provider profile after approval.",
    tone: "bg-[#e7edff] text-[#2452da]",
    cardTone: "bg-white",
    icon: "user",
    details: [
      "Create an account as a student or non-student buyer.",
      "Students submit university details and a student proof document for admin review.",
      "Approved students can set up provider skills, availability, bio, and service details.",
      "Profile settings let users update account details after registration.",
    ],
  },
  {
    title: "Safety & Security",
    description:
      "Learn how student verification, private chat, ratings, reviews, and report options help maintain a safer and more trusted exchange environment.",
    tone: "bg-[#ffe8e3] text-[#f06447]",
    cardTone: "bg-[#f4f5ff]",
    icon: "shield",
    details: [
      "Student provider access is controlled through admin approval.",
      "Private chat keeps service discussions between the two users.",
      "Reports can be submitted with evidence when an eligible completed exchange exists.",
      "Admin review helps handle reports, verification issues, and unsafe behavior.",
    ],
  },
  {
    title: "Skill Swapping",
    description:
      "Understand how to browse gig profiles, filter providers, post service requests, and connect with verified student providers through the platform.",
    tone: "bg-[#77efe0] text-[#087e78]",
    cardTone: "bg-[#ecfbfa]",
    icon: "swap",
    details: [
      "Providers publish active gig profiles with category, price, availability, and summary.",
      "Buyers can browse, search, filter, save gigs, and request a provider.",
      "Requests and direct gig requests connect users into a service conversation.",
      "Completed exchanges support ratings and reviews for future trust.",
    ],
  },
  {
    title: "Payments & Private Agreements",
    description:
      "Skill Swap Hub does not process payments. If two users agree on a paid service, pricing, payment, and any payment proof stay private between them.",
    tone: "bg-[#ffe9dc] text-[#bf642e]",
    cardTone: "bg-white",
    icon: "wallet",
    details: [
      "Skill Swap Hub does not process payments or store bank transaction flows.",
      "Any paid-service agreement is discussed privately between the users.",
      "Payment proof or slips should only be shared in private chat when both users agree.",
      "If a payment-related issue happens, keep evidence and use the report flow when eligible.",
    ],
  },
];

const faqs = [
  {
    question: "How do I verify my account?",
    answer:
      "Non-student buyers verify their email before using the platform. Student registrations include proof such as a student ID or confirmation letter, and provider access only opens after admin approval.",
  },
  {
    question: "Is Skill Swap Hub only for university students?",
    answer:
      "No. Buyers can be students or non-students. Only verified university students can become providers, and they must be approved before they can publish gigs or accept service requests.",
  },
  {
    question: "How do ratings and reviews help?",
    answer:
      "Ratings and reviews are shown after completed exchanges, helping users understand provider reliability, service quality, and past buyer experiences before requesting support.",
  },
  {
    question:
      "What happens if a provider takes money but does not complete the service?",
    answer:
      "Skill Swap Hub does not handle refunds or payment recovery directly because payments happen outside the platform. Save your chat messages and payment proof, then contact admin through support so the case can be reviewed.",
  },
  {
    question: "Can admin see private chats?",
    answer:
      "No. Admin does not normally monitor private chats. Admin only reviews the evidence that users choose to submit through the reporting flow.",
  },
  {
    question: "Can I request services from students at other universities?",
    answer:
      "Yes. The platform supports service requests and skill exchanges with verified student providers from different Sri Lankan universities.",
  },
  {
    question: "How can I find a provider for a service?",
    answer:
      "You can browse gig profiles and search by skill or gig name, then narrow results using category, university, rating, and availability filters to find a suitable provider.",
  },
  {
    question: "Does the platform handle payments?",
    answer:
      "No. Skill Swap Hub does not process payments or bank transactions. If two users agree on a paid service, payment is handled privately outside the platform.",
  },
];

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number] | null>(null);

  return (
    <main className="ssh-page-main bg-white">
      {/* Help page introduction */}
      <section className="ssh-support-hero bg-[#eef1ff]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 text-center sm:gap-4 sm:px-6 sm:py-14 lg:py-20">
          <span className="ssh-highlight-badge inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-[#0f8a6b]">
            Support Center
          </span>
          <h1 className="max-w-4xl text-2xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            Skill Swap Hub Help & Support
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            Find simple guides for account setup, email or student proof
            verification, provider approval, service requests, ratings,
            reviews, reports, and safer communication across the platform.
          </p>
        </div>
      </section>

      {/* Support categories */}
      <section className="ssh-section-clear bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <ScrollReveal delayMs={30}>
            <h2 className="text-center text-2xl font-semibold leading-tight text-slate-900 sm:text-left sm:text-[1.7rem]">
              Information Categories
            </h2>
          </ScrollReveal>
          <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 md:grid-cols-2">
            {categories.map((item, index) => (
              <ScrollReveal key={item.title} delayMs={80 + index * 60}>
                <button
                  type="button"
                  onClick={() => setActiveCategory(item)}
                  className={`ssh-card flex w-full cursor-pointer flex-col items-start gap-3 rounded-[14px] border border-[#d7def1] px-5 py-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 min-[460px]:flex-row min-[460px]:gap-4 sm:px-7 sm:py-6 ${item.cardTone}`}
                >
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${item.tone}`}
                  >
                    <CategoryIcon
                      type={item.icon}
                      className="h-[17px] w-[17px]"
                    />
                  </div>
                  <div className="min-w-0 max-w-[25rem]">
                    <h3 className="text-[16px] font-semibold leading-[1.25] text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.55] text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </button>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently asked questions */}
      <section className="ssh-section-clear bg-white">
        <ScrollReveal delayMs={30}>
          <div className="mx-auto max-w-4xl px-4 pb-6 pt-2 text-center sm:px-6 sm:pt-4">
            <h2 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-[1.7rem]">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Quick reference for common community inquiries.
            </p>
          </div>
        </ScrollReveal>
        <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="space-y-5 border-l-2 border-slate-200 pl-4 sm:space-y-6 sm:pl-6">
            {faqs.map((faq, index) => (
              <ScrollReveal key={faq.question} delayMs={70 + index * 45}>
                <div
                  className="group relative cursor-pointer transition-all duration-300 hover:translate-x-1 hover:scale-[1.02]"
                >
                  <div className="absolute -left-8.5 top-1.5 h-6 w-1 rounded-full bg-slate-300 transition-all duration-300 group-hover:top-0 group-hover:h-10 group-hover:bg-[#0f4cbf]" />
                  <h3 className="text-sm font-semibold text-slate-900 transition-colors duration-300 group-hover:text-[#0f4cbf]">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 transition-colors duration-300 group-hover:text-slate-800">
                    {faq.answer}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact support options */}
      <section id="contact-section" className="ssh-section-clear bg-white pb-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal delayMs={70}>
            <div className="ssh-cta-panel grid gap-7 rounded-[24px] bg-[#1654d1] px-5 py-7 text-white shadow-lg sm:rounded-[30px] sm:px-8 sm:py-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-10 lg:py-10">
            <div className="max-w-[35rem]">
              <h2 className="text-[22px] font-semibold leading-tight sm:text-[24px]">
                Contact Information
              </h2>
              <p className="mt-4 max-w-[32rem] text-[14px] leading-[1.6] text-white/82">
                Our support team can help with account access, verification
                status, reporting guidance, and general platform-related
                questions.
              </p>
              <div className="mt-6 grid gap-x-8 gap-y-4 text-[14px] text-white/95 sm:mt-8 sm:grid-cols-2 sm:gap-y-5">
                <div className="flex items-center gap-3">
                  <MailIcon className="h-[18px] w-[18px] shrink-0" />
                  <span>support@skillswap.lk</span>
                </div>
                <div className="flex items-center gap-3">
                  <HelpDeskIcon className="h-[18px] w-[18px] shrink-0" />
                  <span>Platform Help Desk</span>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-[18px] w-[18px] shrink-0" />
                  <span>Mon-Fri: 9AM - 6PM</span>
                </div>
                <div className="flex items-center gap-3">
                  <ChatSupportIcon className="h-[18px] w-[18px] shrink-0" />
                  <span>Report & Verification Support</span>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[18px] bg-white/10 lg:justify-self-end">
              <Image
                src="/img/03.jpg"
                alt="Support team assisting a student"
                width={420}
                height={250}
                className="h-[190px] w-full object-cover sm:h-[230px] lg:h-[182px] lg:w-[330px]"
              />
            </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {activeCategory ? (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-lg sm:px-5 sm:py-8"
            onClick={() => setActiveCategory(null)}
            role="presentation"
          >
            <div
              className="relative max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-[0_28px_90px_rgba(15,23,42,0.24)] sm:p-7"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-dialog-title"
            >
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                aria-label="Close details"
                className="absolute right-4 top-4 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${activeCategory.tone}`}
              >
                <CategoryIcon
                  type={activeCategory.icon}
                  className="h-[19px] w-[19px]"
                />
              </div>
              <h2
                id="category-dialog-title"
                className="mt-5 pr-12 text-lg font-semibold leading-tight text-slate-900 sm:text-xl"
              >
                {activeCategory.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activeCategory.description}
              </p>
              <div className="mt-5 space-y-3">
                {activeCategory.details.map((detail) => (
                  <div
                    key={detail}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-700 sm:px-4"
                  >
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </main>
  );
}

function CategoryIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  if (type === "shield") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M12 3.25l6.5 2.8v5.8c0 4-2.7 7.47-6.5 8.75-3.8-1.28-6.5-4.75-6.5-8.75v-5.8l6.5-2.8z" />
        <path
          d="M9.4 12.35l1.9 1.9 3.7-3.95"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "swap") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M7 7h9.5" strokeLinecap="round" />
        <path
          d="M13.5 4.5L17 7l-3.5 2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M17 17H7.5" strokeLinecap="round" />
        <path
          d="M10.5 14.5L7 17l3.5 2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M7 7v10" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "wallet") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M4 7.25h14.5a1.75 1.75 0 0 1 1.75 1.75v6a1.75 1.75 0 0 1-1.75 1.75H5.5A1.5 1.5 0 0 1 4 15.25v-8z" />
        <path d="M4 7.25V5.8A1.8 1.8 0 0 1 5.8 4h10.95" />
        <path d="M15.5 11h4.75v2.5H15.5A1.25 1.25 0 0 1 14.25 12.25 1.25 1.25 0 0 1 15.5 11z" />
        <circle cx="16.75" cy="12.25" r="0.85" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="8.1" r="3.4" />
      <path
        d="M6.4 18.2c0-3.1 2.5-5.25 5.6-5.25s5.6 2.15 5.6 5.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8.1" r="1.35" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 7.5h16v9H4z" />
      <path d="M5 8.5l7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HelpDeskIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 7.5h14v9H5z" />
      <path d="M8 11h8" strokeLinecap="round" />
      <path d="M8 14h5" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M6 6l12 12" strokeLinecap="round" />
      <path d="M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function ChatSupportIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 6.5h14v9H9l-4 3v-12z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10h6" strokeLinecap="round" />
      <path d="M9 13h4" strokeLinecap="round" />
    </svg>
  );
}
