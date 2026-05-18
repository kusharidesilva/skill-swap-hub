import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Technology", href: "/technology" },
  { name: "Lifestyle", href: "/lifestyle" },
  { name: "Education", href: "/education" },
  { name: "Travel", href: "/travel" },
  { name: "Food", href: "/food" },
  { name: "News & Trends", href: "/news&trends" },
];

export default function Navbar() {
  // Server-safe: no client hooks or `window` usage. Mobile toggle uses a CSS checkbox.
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src="/logo2.png" alt="BlogNest Logo" width={70} height={70} className="h-16 w-16" />
        </Link>

        {/* navbar */}
        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative inline-flex flex-col items-center text-sm font-medium transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[#89a8d0] after:transition-transform after:content-[''] text-slate-600 hover:text-[#0f3b93] hover:after:scale-x-100"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Mobile view navbar (CSS-only toggle) */}
        <div className="md:hidden">
          <input id="nav-toggle" type="checkbox" className="peer sr-only" aria-label="Toggle navigation menu" />
          <label htmlFor="nav-toggle" className="rounded-md p-2 text-slate-700 transition-colors hover:text-[#0f3b93] inline-flex items-center" aria-hidden>
            <svg className="h-6 w-6 peer-checked:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg className="hidden h-6 w-6 peer-checked:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </label>
        </div>
      </div>

      <div className="transition-[max-height,opacity] duration-300 ease-out md:hidden max-h-0 opacity-0 peer-checked:max-h-96 peer-checked:opacity-100 overflow-hidden border-b border-slate-200 bg-[#f5f2fb]">
        <nav id="mobile-nav" aria-hidden className="flex flex-col gap-4 px-8 pt-4 pb-6">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="text-base font-medium text-slate-600 hover:text-[#0f3b93]">
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}