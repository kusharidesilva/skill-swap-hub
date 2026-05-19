import Image from "next/image";
import Link from "next/link";

type IconProps = { className?: string };

const navLinks = [
  { name: "Home", href: "/home/provider" },
  { name: "Explore Skills", href: "/explore" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about/provider" },
];

export default function ProviderNavbar() {
  return (
    <header className="relative sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <input
        id="nav-toggle"
        type="checkbox"
        className="peer sr-only"
        aria-label="Toggle navigation menu"
        aria-controls="mobile-nav"
      />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-10 py-5">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/img/Skill%20Swap%20Hub%20Logo%20icon-no%20bg.svg"
            alt="Skill Swap Hub"
            width={44}
            height={44}
            className="h-11 w-11"
            priority
          />
          {/* <span className="text-base font-semibold text-slate-900">Skill Swap Hub</span> */}
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="transition-colors hover:text-slate-900">
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <BellIcon className="h-5 w-5" />
          </Link>
          <Link
            href="/favorites"
            aria-label="Favorites"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <HeartIcon className="h-5 w-5" />
          </Link>
          <details className="relative">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
              <UserIcon className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 mt-3 w-48 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-600 shadow-lg">
              <Link href="/profile" className="block rounded-lg px-3 py-2 hover:bg-slate-100">
                Profile
              </Link>
              <Link href="/settings" className="block rounded-lg px-3 py-2 hover:bg-slate-100">
                Settings
              </Link>
              <Link href="/help/provider" className="block rounded-lg px-3 py-2 hover:bg-slate-100">
                Help & Support
              </Link>
              <Link href="/sign-out" className="block rounded-lg px-3 py-2 text-red-500 hover:bg-red-50">
                Sign Out
              </Link>
            </div>
          </details>
        </div>
      </div>

      <label
        htmlFor="nav-toggle-provider"
        className="absolute right-6 top-5 inline-flex items-center rounded-md p-2 text-slate-700 transition-colors hover:text-slate-900 md:hidden"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </label>

      <div className="max-h-0 overflow-hidden border-b border-slate-200 bg-white/95 opacity-0 transition-[max-height,opacity] duration-300 ease-out peer-checked:max-h-96 peer-checked:opacity-100 md:hidden">
        <nav
          id="mobile-nav-provider"
          className="flex flex-col gap-4 px-6 pb-6 pt-4 text-sm font-medium"
        >
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="text-slate-600 hover:text-slate-900">
              {link.name}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-3">
            <Link href="/notifications" className="text-slate-600 hover:text-slate-900">
              Notifications
            </Link>
            <Link href="/favorites" className="text-slate-600 hover:text-slate-900">
              Favorites
            </Link>
            <Link
              href="/profile"
              className="rounded-full bg-[#0f4cbf] px-5 py-2 text-center text-sm font-semibold text-white shadow-sm"
            >
              Profile
            </Link>
            <Link href="/settings" className="text-slate-600 hover:text-slate-900">
              Settings
            </Link>
            <Link href="/help/provider" className="text-slate-600 hover:text-slate-900">
              Help & Support
            </Link>
            <Link href="/sign-out" className="text-slate-600 hover:text-red-500">
              Sign Out
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M15 17H9m8-4V9a5 5 0 0 0-10 0v4l-2 2h14l-2-2z" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </svg>
  );
}

function HeartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 21s-6-4.5-8.2-7.5C1.6 10.4 3 7 6.4 6.3c2-.4 3.5.6 4.6 2.1 1.1-1.5 2.6-2.5 4.6-2.1C19 7 20.4 10.4 20.2 13.5 18 16.5 12 21 12 21z" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M4 20c1.7-3 5-4.5 8-4.5s6.3 1.5 8 4.5" />
    </svg>
  );
}
