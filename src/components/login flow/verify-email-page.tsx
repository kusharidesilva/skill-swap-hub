"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef } from "react";

interface Props {
  searchParams?: { from?: string };
}

const verificationSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

type VerificationValues = z.infer<typeof verificationSchema>;

export default function VerifyEmailPage({ searchParams }: Props) {
  const isProvider = searchParams?.from === "provider";
  const redirectUrl = isProvider ? "/home/provider" : "/home/buyer";
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { code: "" },
  });

  const codeValue = watch("code");
  const codeDigits = Array.from({ length: 6 }).map((_, index) => codeValue?.[index] ?? "");

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "");
    const nextCode = codeDigits
      .map((digit, i) => (i === index ? sanitized.slice(-1) : digit))
      .join("")
      .padEnd(6, "");
    setValue("code", nextCode, { shouldValidate: true });

    // Automatically focus next input box
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      if (!codeDigits[index] && index > 0) {
        // If current is empty, delete previous and go back
        const nextCode = codeDigits
          .map((digit, i) => (i === index - 1 ? "" : digit))
          .join("")
          .padEnd(6, "");
        setValue("code", nextCode, { shouldValidate: true });
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);
    if (digits.length === 6) {
      setValue("code", digits, { shouldValidate: true });
      inputRefs.current[5]?.focus();
    }
  };

  const onSubmit = () => {
    router.push(redirectUrl);
  };
  return (
    <main className="relative min-h-screen bg-[#f6f4fb]">
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f5f2] text-[#0f8a6b]">
            <CapIcon className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            Verify Your University Email
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We sent a 6-digit verification code to your university email. Enter the code below to activate
            your account.
          </p>

          <div className="mt-8 rounded-2xl bg-white px-6 py-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex items-center justify-center gap-3">
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    placeholder=""
                    value={digit}
                    aria-label={`Verification code digit ${index + 1}`}
                    onChange={(event) => handleDigitChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={handlePaste}
                    className="h-12 w-12 rounded-xl border border-slate-200 text-center text-base font-semibold text-slate-700 focus:border-[#2b62e6] focus:outline-none"
                  />
                ))}
                <input type="hidden" {...register("code")} />
              </div>
              {errors.code && (
                <p className="text-xs text-red-500">{errors.code.message}</p>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-[#3b56d8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2e47d8]"
              >
                Verify
              </button>

              <button type="button" className="text-xs font-semibold text-[#3b56d8]">
                Resend Code
              </button>
              <Link href="/login" className="block text-xs font-semibold text-slate-500">
                Back to Login
              </Link>
            </form>
          </div>

          <div className="mt-5 rounded-2xl border border-[#c8e6ec] bg-[#ecf9ff] px-4 py-3 text-xs text-[#137c8a]">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#137c8a]">
                <ShieldIcon className="h-3 w-3" />
              </span>
              <span>
                This step helps keep Skill Swap Hub limited to real university students. Securing our peer-to-peer
                system.
              </span>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl">
            <Image
              src="/img/02.jpg"
              alt="Students learning together"
              width={520}
              height={300}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function CapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M2 9l10-5 10 5-10 5-10-5z" />
      <path d="M6 12v4c0 1.1 2.7 2 6 2s6-.9 6-2v-4" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path
        d="M9.5 12.5l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

