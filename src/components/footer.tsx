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
    <footer className="ssh-footer ssh-footer-site border-t border-slate-200/80 bg-[#f3f5ff]">
      {/* Brand links, role-aware navigation, and legal links */}
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-8 md:grid-cols-[0.88fr_2.4fr] md:items-start">
          <div className="flex flex-col items-start text-left">
            <Link href={roleHomeHref} className="inline-block transition hover:opacity-90">
              <Image
                src="/img/Skill Swap Hub Logo.png"
                alt="Skill Swap Hub"
                width={180}
                height={180}
                className="h-auto w-28 sm:w-32"
              />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              Connecting verified student providers and service seekers through trusted skill sharing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-3 lg:gap-x-16">
            {footerColumns.map((column) => (
              <div key={column.title} className="flex flex-col items-start text-left">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f8a6b]">
                  {column.title}
                </h3>
                <div className="mt-3 flex flex-col gap-2.5 text-sm">
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

        <div className="mt-8 border-t border-slate-200/60 pt-5 text-center text-xs font-semibold text-slate-500 sm:text-sm">
          &copy; {currentYear} Skill Swap Hub | All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
