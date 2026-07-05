import Image from "next/image";
import Link from "next/link";
import { aboutHref, helpHref, homeHref, type SiteRole } from "@/lib/role-routes";

type FooterColumn = {
  title: string;
  links: { label: string; href?: string }[];
};

type SiteFooterProps = {
  role?: SiteRole;
};

export default function SiteFooter({ role = "guest" }: SiteFooterProps) {
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
        { label: "Privacy Policy" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms of Service" },
        { label: "Community Guidelines" },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-200/80 bg-[#f3f5ff]">
      {/* Brand links, role-aware navigation, and legal links */}
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
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600 sm:text-base">
              Connecting Sri Lankan university students through peer-to-peer knowledge sharing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title} className="flex flex-col items-start text-left">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f8a6b]">
                  {column.title}
                </h3>
                <div className="mt-4 flex flex-col gap-3 text-sm sm:text-base">
                  {column.links.map((link) =>
                    link.href ? (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="font-medium text-slate-600 transition-colors hover:text-[#0f8a6b] hover:underline"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span key={link.label} className="cursor-default font-medium text-slate-600">
                        {link.label}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200/80 pt-8 text-center text-sm font-semibold text-slate-500">
          © {currentYear} Skill Swap Hub | All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
