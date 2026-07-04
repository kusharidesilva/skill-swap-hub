import Image from "next/image";
import Link from "next/link";

const storyImages = [
  { src: "/img/01.png", alt: "Students collaborating" },
  { src: "/img/02.jpg", alt: "Design work session" },
  { src: "/img/03.jpg", alt: "Editing presentation" },
  { src: "/img/04.jpg", alt: "Study group" },
];

const values = [
  {
    title: "Skill Sharing",
    description:
      "Students offer skills they already have and request the skills they need, creating a useful peer-to-peer network.",
    icon: "book",
  },
  { 
    title: "Trusted Student Community",
    description:
      "Every student is verified using their official university email and verification code, keeping the community safe.",
    icon: "shield",
  },
  {
    title: "Peer Learning",
    description:
      "Students learn from others who understand their academic needs, study challenges, and practical skill gaps.",
    icon: "users",
  },
];

type AboutPageProps = {
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  ctaButtonLabel: string;
  ctaButtonHref: string;
};

export default function AboutPage({
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  ctaButtonLabel,
  ctaButtonHref,
}: AboutPageProps) {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#eef1ff]">
        <div
          className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-white/70 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#c3cfff] blur-3xl"
          aria-hidden="true"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 pt-14 pb-0 lg:grid-cols-2 lg:pt-12 lg:pb-0 lg:min-h-[calc(100vh_-_85px)]">
          <div className="relative z-10 flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#dfe8ff] px-3 py-1 text-xs font-semibold text-[#315ccf]">
              <span className="h-2 w-2 rounded-full bg-[#315ccf]" />
              WHY SKILL SWAP HUB
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl leading-tight">
              <span className="block">Empowering</span>
              <span className="block text-[#2b62e6]">Sri Lankan</span>
              <span className="block text-[#2b62e6]">University Students</span>
              <span className="block">to Grow Together.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Skill Swap Hub is a trusted student-only platform for Sri Lankan
              university students to share skills, request services, learn from
              verified peers, and gain practical experience.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href={primaryCtaHref}
                className="rounded-lg bg-[#2b62e6] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc]"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                href={secondaryCtaHref}
                className="rounded-lg border border-slate-200 bg-white/60 backdrop-blur-xs px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:border-slate-300 hover:text-slate-900"
              >
                {secondaryCtaLabel}
              </Link>
            </div>
          </div>
          <div className="relative flex items-end justify-center lg:justify-end -mb-5 lg:-mb-10 self-end lg:translate-x-16">
            <Image
              src="/img/about%20img.png"
              alt="Student using a laptop"
              width={720}
              height={720}
              className="h-auto w-full max-w-md object-contain sm:max-w-lg lg:max-w-[590px] lg:w-[590px] transition-all duration-300 hover:scale-[1.02] block"
              priority
              sizes="(min-width: 1024px) 590px, 80vw"
            />
          </div>
        </div>
      </section>

      <section id="story" className="bg-white scroll-mt-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_1.05fr]">
          <div className="grid grid-cols-2 gap-4">
            {storyImages.map((image) => (
              <div
                key={image.src}
                className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 280px"
                />
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              The Story Behind the Skill Swap Hub
            </h2>
            <div className="mt-2 h-1 w-10 rounded-full bg-[#0f4cbf]" />
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
              <p>
                Many university students in Sri Lanka have useful skills such as
                programming, graphic design, tutoring, writing, CV preparation,
                presentation design, and content creation. However, most
                students do not have a trusted and organized platform to offer
                these skills or request help from other students.
              </p>
              <p>
                At present, students often depend on friends, WhatsApp groups,
                Facebook groups, or global freelance platforms. These methods
                are not always reliable because students may face slow
                responses, poor quality services, lack of trust, and difficulty
                finding the right person for a specific skill.
              </p>
              <p>
                Skill Swap Hub was created to solve this problem by building a
                student-focused platform where verified university students can
                post skill offers, request services, find suitable matches, chat
                privately, and give ratings and reviews after completing a
                service or skill exchange.
              </p>
            </div>

            {/* Counts */}
            {/* <div className="mt-8 flex flex-wrap gap-6 text-sm font-semibold text-slate-700">
              <div>
                <div className="text-3xl font-semibold text-[#0f4cbf]">15+</div>
                <div className="text-xs uppercase tracking-wide">
                  Universities
                </div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-[#0f4cbf]">5k+</div>
                <div className="text-xs uppercase tracking-wide">Students</div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-[#0f4cbf]">10+</div>
                <div className="text-xs uppercase tracking-wide">
                  Skill Categories
                </div>
              </div>
            </div> */}
            
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              Our Core Values
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              The values that guide every interaction on Skill Swap Hub.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef1ff] text-[#0f4cbf]">
                  <ValueIcon type={value.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-[#0f4cbf] px-8 py-10 text-center text-white shadow-lg">
            <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -right-16 -top-12 h-44 w-44 rounded-full bg-white/10" />
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Ready to swap your first skill?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90">
              Join a trusted student-only platform where Sri Lankan university
              students can share skills, request services, connect with peers,
              and grow together.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={ctaButtonHref}
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#0f4cbf] shadow-sm"
              >
                {ctaButtonLabel}
              </Link>
              <Link
                href={secondaryCtaHref}
                className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Browse Skills
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ValueIcon({ type, className }: { type: string; className?: string }) {
  if (type === "shield") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
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

  if (type === "users") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="8" cy="8.25" r="3.25" />
        <circle cx="16.25" cy="9.5" r="2.75" />
        <path
          d="M3.5 18.5c1.3-2.7 4-4.25 7-4.25s5.7 1.55 7 4.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.25 17.25c.9-1.45 2.42-2.37 4.25-2.37 1.05 0 2.01.29 2.82.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 5h16v14H4z" />
      <path d="M7 8h10" strokeLinecap="round" />
      <path d="M7 12h10" strokeLinecap="round" />
      <path d="M7 16h6" strokeLinecap="round" />
    </svg>
  );
}
