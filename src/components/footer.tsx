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
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_2.4fr] lg:items-start">
          <div className="mx-auto flex max-w-md flex-col items-center text-center sm:max-w-lg lg:mx-0 lg:items-start lg:text-left">
            <Link href={roleHomeHref} className="inline-block transition hover:opacity-90">
              <Image
                src="/img/Skill Swap Hub Logo.png"
                alt="Skill Swap Hub"
                width={180}
                height={180}
                className="h-auto w-24 sm:w-28 lg:w-32"
              />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              Connecting verified student providers and service seekers through trusted skill sharing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 text-center min-[520px]:grid-cols-3 min-[520px]:text-left sm:gap-7 lg:gap-x-14">
            {footerColumns.map((column) => (
              <div key={column.title} className="flex min-w-0 flex-col items-center min-[520px]:items-start">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#0f8a6b] sm:text-sm">
                  {column.title}
                </h3>
                <div className="mt-3 flex flex-col items-center gap-2 text-sm min-[520px]:items-start sm:gap-2.5">
                  {column.links.map((link) =>
                    link.href ? (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="font-medium leading-6 text-slate-600 transition-colors hover:text-[#0f8a6b] hover:underline"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span key={link.label} className="cursor-default font-medium leading-6 text-slate-600">
                        {link.label}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200/60 pt-5 text-center text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">
          &copy; {currentYear} Skill Swap Hub | All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
