import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";

type Gig = {
  title: string;
  category: string;
  rating: number;
  student: string;
  tags: string[];
  image: string;
};

const gigs: Gig[] = [
  {
    title: "Graphic Design for Social Media Posts",
    category: "Design",
    rating: 4.8,
    student: "Rajini Campus student",
    tags: ["Skill Exchange / Paid", "Weekends"],
    image: "/img/package%201.jpg",
  },
  {
    title: "Python Programming Help",
    category: "Programming",
    rating: 4.7,
    student: "SLIIT student",
    tags: ["Skill Exchange", "Evenings"],
    image: "/img/package%202.jpg",
  },
  {
    title: "CV Writing and LinkedIn Help",
    category: "Career",
    rating: 4.9,
    student: "NSBM student",
    tags: ["Paid", "Flexible"],
    image: "/img/package%203.jpg",
  },
  {
    title: "PowerPoint Presentation Design",
    category: "Academic",
    rating: 4.6,
    student: "KDU student",
    tags: ["Skill Exchange / Paid", "Weekdays"],
    image: "/img/package%204.jpg",
  },
];

export default function SkillGigsSection() {
  return (
    <section id="explore-skills" className="bg-white scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Explore Student Skill Gigs
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Find skills offered by verified university students.
            </p>
          </div>
          <Link
            href="/#explore-skills"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f4cbf]"
          >
            View All Skills
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {gigs.map((gig) => (
            <div
              key={gig.title}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={gig.image}
                  alt={gig.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/45 via-slate-900/10 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                  {gig.category}
                </span>
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700">
                  <StarIcon
                    className="h-3 w-3 text-amber-400"
                    aria-hidden="true"
                  />
                  {gig.rating.toFixed(1)}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  {gig.title}
                </h3>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-7 w-7 rounded-full bg-slate-200" />
                  <span>{gig.student}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {gig.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 3z" />
    </svg>
  );
}
