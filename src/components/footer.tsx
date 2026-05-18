import Image from "next/image";
import Link from "next/link";

type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

const footerColumns: FooterColumn[] = [
  {
    title: "Quick Links",
    links: [
      { label: "Home", href: "/" },
      { label: "Explore Now", href: "/explore" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Features", href: "/features" },
      { label: "Trust", href: "/trust" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Community Guidelines", href: "/community" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-[#f1f3ff]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1.1fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/img/Skill%20Swap%20Hub%20Logo%20icon-no%20bg.svg"
                alt="Skill Swap Hub"
                width={44}
                height={44}
                className="h-11 w-11"
              />
              <span className="text-base font-semibold text-slate-900">Skill Swap Hub</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-slate-600">
              Connecting Sri Lankan university students through peer-to-peer knowledge sharing.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {column.title}
                </h3>
                <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                  {column.links.map((link) => (
                    <Link key={link.label} href={link.href} className="hover:text-slate-900">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
          © 2026 Skill Swap Hub | All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
