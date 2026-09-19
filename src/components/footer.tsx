"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ModalPortal from "@/components/ui/modal-portal";
import {
  legalDocuments,
  type LegalDocumentId,
} from "@/components/legal-content";
import {
  aboutHref,
  helpHref,
  homeHref,
  type SiteRole,
} from "@/lib/role-routes";

type FooterColumn = {
  title: string;
  links: { label: string; href?: string; documentId?: LegalDocumentId }[];
};

type SiteFooterProps = {
  role?: SiteRole;
};

export default function SiteFooter({ role = "guest" }: SiteFooterProps) {
  const [activeDocument, setActiveDocument] = useState<LegalDocumentId | null>(
    null,
  );
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!activeDocument) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trigger = lastTriggerRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveDocument(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [activeDocument]);

  const roleHomeHref = homeHref(role);
  const helpCenterHref = role === "guest" ? "/help" : helpHref(role);
  const aboutPageHref = aboutHref(role);
  const currentYear = new Date().getFullYear();

  const footerColumns: FooterColumn[] = [
    {
      title: "Quick Links",
      links: [
        { label: "Home", href: roleHomeHref },
        { label: "About", href: aboutPageHref },
        { label: "Trust", href: `${roleHomeHref}#trust-section` },
        { label: "Explore Now", href: `${roleHomeHref}#explore-skills` },
        { label: "How It Works", href: `${roleHomeHref}#how-it-works` },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Contact Us", href: `${helpCenterHref}#contact-section` },
        { label: "Help Center", href: helpCenterHref },
        { label: "Privacy Policy", documentId: "privacy" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms of Service", documentId: "terms" },
        { label: "Community Guidelines", documentId: "guidelines" },
      ],
    },
  ];

  return (
    <footer className="ssh-footer ssh-footer-site border-t border-slate-200/80 bg-[#f3f5ff]">
      {/* Brand links, role-aware navigation, and legal links */}
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_2.4fr] lg:items-start">
          <div className="mx-auto flex max-w-md flex-col items-center text-center sm:max-w-lg lg:mx-0 lg:items-start lg:text-left">
            <Link
              href={roleHomeHref}
              className="inline-block transition hover:opacity-90"
            >
              <Image
                src="/img/Skill Swap Hub Logo.png"
                alt="Skill Swap Hub"
                width={180}
                height={180}
                className="h-auto w-24 sm:w-28 lg:w-32"
              />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              Connecting verified student providers and service seekers through
              trusted skill sharing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 text-center min-[520px]:grid-cols-3 min-[520px]:text-left sm:gap-7 lg:gap-x-14">
            {footerColumns.map((column) => (
              <div
                key={column.title}
                className="flex min-w-0 flex-col items-center min-[520px]:items-start"
              >
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#0f8a6b] sm:text-sm">
                  {column.title}
                </h3>
                <div className="mt-3 flex flex-col items-center gap-2 text-sm min-[520px]:items-start sm:gap-2.5">
                  {column.links.map((link) =>
                    link.href ? (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="font-medium leading-6 text-slate-600 transition-colors hover:text-[#0f8a6b] hover:underline"
                      >
                        {link.label}
                      </Link>
                    ) : link.documentId ? (
                      <button
                        key={link.label}
                        type="button"
                        onClick={(event) => {
                          lastTriggerRef.current = event.currentTarget;
                          if (link.documentId)
                            setActiveDocument(link.documentId);
                        }}
                        className="cursor-pointer font-medium leading-6 text-slate-600 transition-colors hover:text-[#0f8a6b] hover:underline"
                      >
                        {link.label}
                      </button>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200/60 pt-5 text-center text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">
          &copy; {currentYear} Skill Swap Hub | All Rights Reserved
        </div>
      </div>
      {activeDocument ? (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/45 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5 sm:py-8"
            onClick={() => setActiveDocument(null)}
            role="presentation"
          >
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.24)] sm:max-h-[calc(100dvh-4rem)]"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="legal-dialog-title"
              aria-describedby="legal-dialog-intro"
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7 sm:py-6">
                <div className="min-w-0">
                  <h2
                    id="legal-dialog-title"
                    className="text-xl font-bold text-slate-900 sm:text-2xl"
                  >
                    {legalDocuments[activeDocument].title}
                  </h2>
                  <p
                    id="legal-dialog-intro"
                    className="mt-2 text-sm leading-6 text-slate-600"
                  >
                    {legalDocuments[activeDocument].introduction}
                  </p>
                </div>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setActiveDocument(null)}
                  aria-label="Close popup"
                  title="Close popup"
                  className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                <div className="space-y-6">
                  {legalDocuments[activeDocument].sections.map((section) => (
                    <section key={section.heading}>
                      <h3 className="text-base font-semibold text-slate-900">
                        {section.heading}
                      </h3>
                      <div className="mt-2 space-y-3 text-sm leading-7 text-slate-600 sm:text-[15px]">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </footer>
  );
}
