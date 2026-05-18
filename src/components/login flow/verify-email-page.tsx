import Image from "next/image";
import Link from "next/link";

interface Props {
  searchParams?: { from?: string };
}

export default function VerifyEmailPage({ searchParams }: Props) {
  const isProvider = searchParams?.from === "provider";
  const redirectUrl = isProvider ? "/home/provider" : "/home/buyer";
  return (
    <main className="relative min-h-screen bg-white">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white px-8 py-10 shadow-2xl">
          <div className="flex justify-end">
            <Link
              href="/"
              aria-label="Close"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              <CloseIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f1ff] text-[#2b62e6]">
              <MailIcon className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-slate-900">Verify Your University Email</h1>
            <p className="mt-2 text-xs text-slate-500">
              We sent a 5-digit verification code to your email. Enter the code to finish account
              setup and secure your access.
            </p>
          </div>

          <form className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <input
                  key={index}
                  inputMode="numeric"
                  maxLength={1}
                  placeholder="0"
                  aria-label={`Verification code digit ${index + 1}`}
                  className="h-12 w-11 rounded-lg border border-slate-200 text-center text-sm font-semibold text-slate-700 focus:outline-none"
                />
              ))}
            </div>

            <Link
              href={redirectUrl}
              className="w-full rounded-lg bg-[#2b62e6] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm"
            >
              Verify
            </Link>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <button type="button" className="font-semibold text-slate-500">
                Resend Code
              </button>
              <Link href="/login" className="font-semibold text-slate-500">
                Back to Login
              </Link>
            </div>
          </form>

          <div className="mt-6 rounded-2xl bg-[#e6f7f2] px-4 py-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#0f8a6b]">
                <ShieldIcon className="h-3 w-3" />
              </span>
              <span>
                This step helps Skill Swap Hub to limit the platform to verified university
                students. Accessing or sharing codes is not allowed.
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl">
            <Image
              src="/img/02.jpg"
              alt="Students learning together"
              width={480}
              height={260}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 6h16v12H4z" />
      <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path d="M9.5 12.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
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
