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
    title: "University Email Verification",
    description: "Strict access for students only. Every user must have a valid campus domain email.",
    Icon: MailIcon,
    tone: "bg-[#e8f1ff] text-[#0f4cbf]",
  },
  {
    title: "Student-Only Community",
    description:
      "A safe space designed specifically for the academic community, free from outside noise.",
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
    <section className="bg-[#f3f5ff]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Built for Verified University Students
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
            Students are verified using their official email and a verification code to create a
            trusted student-only environment.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tone}`}
              >
                <feature.Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M4 6h16v12H4z" />
      <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M8 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M17 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3z" />
      <path d="M2 20c1.4-2.3 3.8-3.5 6.5-3.5" strokeLinecap="round" />
      <path d="M13 20c.9-1.6 2.4-2.6 4.2-3" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path d="M9.5 12.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
