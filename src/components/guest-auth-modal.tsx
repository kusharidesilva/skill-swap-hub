"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import ModalPortal from "@/components/ui/modal-portal";

type GuestAuthModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  loginHref?: string;
  registerHref?: string;
  onClose: () => void;
};

export default function GuestAuthModal({
  open,
  title = "Do you already have an account?",
  description = "Sign in with your existing account, or create a new Skill Swap Hub account to continue.",
  loginHref = "/login",
  registerHref = "/get-started",
  onClose,
}: GuestAuthModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-md">
        <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_28px_90px_rgba(15,23,42,0.24)] sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div className="max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1453c4]">
                Sign In Required
              </p>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-slate-900">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close popup"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push(loginHref)}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#1453c4] px-5 text-sm font-bold text-white transition hover:bg-[#0f43a1]"
            >
              I already have an account
            </button>
            <button
              type="button"
              onClick={() => router.push(registerHref)}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-800 transition hover:bg-slate-100"
            >
              Create a new account
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
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
  );
}
