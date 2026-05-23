import Image from "next/image";
import Link from "next/link";
import { helpHref, homeHref, type SiteRole } from "@/lib/role-routes";

type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

type SiteFooterProps = {
  role?: SiteRole;
};

export default function SiteFooter({ role = "guest" }: SiteFooterProps) {
  const roleHomeHref = homeHref(role);
  const helpCenterHref = role === "guest" ? "/help" : helpHref(role);
  const footerColumns: FooterColumn[] = [
    {
      title: "Quick Links",
      links: [
        { label: "Home", href: roleHomeHref },
        { label: "Explore Now", href: `${roleHomeHref}#explore-skills` },
        { label: "How It Works", href: `${roleHomeHref}#how-it-works` },
        { label: "Features", href: "/features" },
        { label: "Trust", href: "/trust" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: helpCenterHref },
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

  return (
    <footer className="bg-[#f3f5ff] border-t border-slate-200/80">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.1fr_2fr]">
          <div className="flex flex-col items-center text-center">
            <Link href={roleHomeHref} className="inline-block transition hover:opacity-90">
              <Image
                src="/img/Skill Swap Hub Logo.png"
                alt="Skill Swap Hub"
                width={180}
                height={180}
                className="h-auto w-36 sm:w-40"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm sm:text-base leading-relaxed text-slate-600">
              Connecting Sri Lankan university students through peer-to-peer knowledge sharing.
            </p>
          </div>
          <div className="grid gap-8 grid-cols-2 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title} className="flex flex-col items-start text-left">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f8a6b]">
                  {column.title}
                </h3>
                <div className="mt-4 flex flex-col gap-3 text-sm sm:text-base">
                  {column.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="font-medium text-slate-600 hover:text-[#0f8a6b] transition-colors hover:underline"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-slate-200/80 pt-8 text-sm font-semibold text-slate-500 text-center">
          © 2026 Skill Swap Hub | All Rights Reserved
        </div>
      </div>
    </footer>
  );
}

