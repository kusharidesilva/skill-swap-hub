import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Explore Skills", href: "/explore" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about" },
];

export default function Navbar() {
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
            <Link
              key={link.name}
              href={link.href}
              className="transition-colors hover:text-slate-900"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            Login
          </Link>
          <Link
            href="/get-started"
            className="rounded-full bg-[#0f4cbf] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3fa1]"
          >
            Get Started
          </Link>
        </div>
      </div>

      <label
        htmlFor="nav-toggle"
        className="absolute right-6 top-5 inline-flex items-center rounded-md p-2 text-slate-700 transition-colors hover:text-slate-900 md:hidden"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </label>

      <div className="max-h-0 overflow-hidden border-b border-slate-200 bg-white/95 opacity-0 transition-[max-height,opacity] duration-300 ease-out peer-checked:max-h-96 peer-checked:opacity-100 md:hidden">
        <nav
          id="mobile-nav"
          className="flex flex-col gap-4 px-6 pb-6 pt-4 text-sm font-medium"
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-slate-600 hover:text-slate-900"
            >
              {link.name}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-3">
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Login
            </Link>
            <Link
              href="/get-started"
              className="rounded-full bg-[#0f4cbf] px-5 py-2 text-center text-sm font-semibold text-white shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
