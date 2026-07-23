import type { SVGProps } from "react";
import * as React from "react";

type IconType = (props: SVGProps<SVGSVGElement>) => React.ReactElement;

type Feature = {
  title: string;
  description: string;
  Icon: IconType;
  tone: string;
};

const features: Feature[] = [
  {
    title: "Provider Verification",
    description:
      "Student providers complete campus email and proof verification before offering services on the platform.",
    Icon: MailIcon,
    tone: "bg-[#e8f1ff] text-[#0f4cbf]",
  },
  {
    title: "Trusted Access",
    description:
      "Students and non-student buyers can join safely while provider access stays limited to verified university students.",
    Icon: UsersIcon,
    tone: "bg-[#e7f8f1] text-[#0f8a6b]",
  },
  {
    title: "Ratings and Reports",
    description:
      "Transparent peer-to-peer feedback systems and quick reporting for a high-quality experience.",
    Icon: ShieldIcon,
    tone: "bg-[#eef2ff] text-[#3b5bcc]",
  },
];

export default function VerifiedStudentsSection() {
  return (
    // This section explains the trust checks behind the student community.
    <section id="trust-section" className="ssh-section-band bg-[#f3f5ff] py-16 sm:py-20 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl leading-tight">
            Built for Verified Student Providers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-slate-600">
            Verified university students can offer services, while buyers and
            students request support inside a more trusted platform experience.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="ssh-card group rounded-2xl bg-white p-6 border border-slate-100/80 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${feature.tone}`}
              >
                <feature.Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path d="M4 6h16v12H4z" />
      <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path d="M8 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M17 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3z" />
      <path d="M2 20c1.4-2.3 3.8-3.5 6.5-3.5" strokeLinecap="round" />
      <path d="M13 20c.9-1.6 2.4-2.6 4.2-3" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path
        d="M9.5 12.5l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
