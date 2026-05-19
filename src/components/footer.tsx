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
      { label: "Explore Now", href: "/#explore-skills" },
      { label: "How It Works", href: "/#how-it-works" },
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
    <footer className="bg-[#f5f6fe]">
      <div className="mx-auto max-w-6xl px-10 py-6">
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col items-start text-left">
            <Link href="/" className="inline-block">
              <Image
                src="/img/Skill Swap Hub Logo.png"
                alt="Skill Swap Hub"
                width={100}
                height={100}
                className="h-auto w-20"
              />
            </Link>
            <p className="mt-1.5 max-w-[180px] text-[10px] leading-normal text-slate-500">
              Connecting Sri Lankan university students through peer-to-peer knowledge sharing.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#2b62e6]">
                  {column.title}
                </h3>
                <div className="mt-2 flex flex-col gap-1.5 text-[11px]">
                  {column.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="underline text-slate-500 hover:text-[#2b62e6] transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 border-t border-slate-200/60 pt-4 text-[10px] text-slate-400 text-center">
          © 2026 Skill Swap Hub | All Right Reserved
        </div>
      </div>
    </footer>
  );
}

