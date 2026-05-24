import Image from "next/image";
import Link from "next/link";

import { scopedHref, type Role } from "@/lib/role-routes";

type ProviderProfilePublicPageProps = {
  providerId: string;
  role?: Role;
  activeTab: "gigs" | "reviews";
};

const offeredGigs = [
  {
    id: "book-cover",
    title: "Creative Book Cover Design",
    rating: "5.0",
    reviews: 12,
    category: "Graphic Design",
    points: 20,
    image: "/img/package%201.jpg",
  },
  {
    id: "arch-viz",
    title: "3D Architectural Visualization",
    rating: "5.0",
    reviews: 8,
    category: "Architecture",
    points: 45,
    image: "/img/package%202.jpg",
  },
  {
    id: "logo-design",
    title: "Minimalist Logo Design",
    rating: "4.9",
    reviews: 22,
    category: "Branding",
    points: 30,
    image: "/img/package%203.jpg",
  },
];

const allReviews = [
  {
    id: "r1",
    initials: "KP",
    avatarTone: "bg-[#2f66e7] text-white",
    name: "Kasun Perera",
    meta: "2 days ago • Swap: Creative Book Cover",
    quote:
      "Amara is incredibly talented! She took my vague ideas and turned them into a stunning book cover that perfectly matches the tone of my thesis. Highly recommend her for any design work.",
  },
  {
    id: "r2",
    initials: "NR",
    avatarTone: "bg-teal-300 text-teal-900",
    name: "Nimani Ratnayake",
    meta: "1 week ago • Swap: 3D Arch Viz",
    quote:
      "Excellent communication and the technical quality of the 3D renders was beyond my expectations. She is a real pro at the University of Moratuwa.",
  },
  {
    id: "r3",
    initials: "KP",
    avatarTone: "bg-[#2f66e7] text-white",
    name: "Kasun Perera",
    meta: "2 days ago • Swap: Creative Book Cover",
    quote:
      "Amara is incredibly talented! She took my vague ideas and turned them into a stunning book cover that perfectly matches the tone of my thesis. Highly recommend her for any design work.",
  },
  {
    id: "r4",
    initials: "NR",
    avatarTone: "bg-teal-300 text-teal-900",
    name: "Nimani Ratnayake",
    meta: "1 week ago • Swap: 3D Arch Viz",
    quote:
      "Excellent communication and the technical quality of the 3D renders was beyond my expectations. She is a real pro at the University of Moratuwa.",
  },
];

export default function ProviderProfilePublicPage({
  providerId,
  role,
  activeTab,
}: ProviderProfilePublicPageProps) {
  const messageHref = role ? scopedHref("/chats", role) : "/get-started";
  const favoriteHref = role ? scopedHref("/favorites", role) : "/get-started";

  const baseProfileHref = role
    ? `/provider-profile/${providerId}?role=${role}`
    : `/provider-profile/${providerId}`;
  const gigsHref = `${baseProfileHref}${role ? "&" : "?"}tab=gigs`;
  const reviewsHref = `${baseProfileHref}${role ? "&" : "?"}tab=reviews`;

  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 md:grid-cols-[152px_minmax(0,1fr)]">
          <div className="relative h-[152px] w-[152px] overflow-hidden rounded-xl">
            <Image
              src="/img/favorites/alex.jpg"
              alt="Alex Rivera"
              fill
              className="object-cover"
              sizes="152px"
              priority
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold leading-none text-[#1453c4] md:text-[2.2rem]">
                Alex Rivera
              </h1>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-[#1453c4]">
                Verified Student
              </span>
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
                Top Rated
              </span>
            </div>
            <p className="mt-2 text-xl text-slate-700 md:text-[1.85rem]">University of Moratuwa</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={messageHref}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#1453c4] px-5 text-sm font-semibold text-white transition hover:bg-[#0f43a1]"
              >
                Message Alex
              </Link>
              <Link
                href={favoriteHref}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Save to Favorites
              </Link>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-red-600 transition hover:text-red-700"
              >
                Report Profile
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Trust Score" value="99%" sub=" " accent />
        <MetricCard title="Total Swaps" value="68" sub="Completed" />
        <MetricCard title="Avg. Rating" value="5.0" sub="★★★★★" teal />
        <MetricCard title="Avg. Response" value="1h" sub="Highly Responsive" />
      </section>

      <section>
        <div className="flex items-center gap-8 border-b border-slate-200">
          <Link
            href={gigsHref}
            className={`border-b-2 pb-3 text-lg font-semibold transition ${
              activeTab === "gigs"
                ? "border-[#1453c4] text-[#1453c4]"
                : "border-transparent text-slate-600 hover:text-slate-800"
            }`}
          >
            Offered Gigs
          </Link>
          <Link
            href={reviewsHref}
            className={`border-b-2 pb-3 text-lg font-semibold transition ${
              activeTab === "reviews"
                ? "border-[#1453c4] text-[#1453c4]"
                : "border-transparent text-slate-600 hover:text-slate-800"
            }`}
          >
            Reviews (4)
          </Link>
        </div>

        {activeTab === "gigs" ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {offeredGigs.map((gig) => (
              <article
                key={gig.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={gig.image}
                    alt={gig.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 30vw, 100vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-slate-900">{gig.title}</h3>
                  <p className="mt-1 text-base font-semibold text-slate-700">
                    ★ {gig.rating}{" "}
                    <span className="font-normal text-slate-500">({gig.reviews})</span>
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="rounded-md bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      {gig.category}
                    </span>
                    <span className="text-lg font-semibold text-[#1453c4]">
                      {gig.points} Points
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <h2 className="text-xl font-semibold text-[#1453c4]">Recent Feedback</h2>
            {allReviews.map((review) => (
              <FeedbackCard
                key={review.id}
                initials={review.initials}
                avatarTone={review.avatarTone}
                name={review.name}
                meta={review.meta}
                quote={review.quote}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  accent = false,
  teal = false,
}: {
  title: string;
  value: string;
  sub: string;
  accent?: boolean;
  teal?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-[3.2rem] font-semibold leading-none text-slate-900">{value}</p>
      <p className={`mt-2 text-xl ${teal ? "text-teal-700" : "text-slate-600"}`}>{sub}</p>
      {accent ? <div className="mx-auto mt-4 h-1.5 w-full rounded-full bg-teal-700" /> : null}
    </article>
  );
}

function FeedbackCard({
  initials,
  avatarTone,
  name,
  meta,
  quote,
}: {
  initials: string;
  avatarTone: string;
  name: string;
  meta: string;
  quote: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-[#f7f8ff] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold ${avatarTone}`}
          >
            {initials}
          </span>
          <div>
            <p className="text-xl font-semibold text-slate-900">{name}</p>
            <p className="text-sm text-slate-500">{meta}</p>
          </div>
        </div>
        <p className="text-lg text-teal-700">★★★★★</p>
      </div>
      <p className="mt-3 text-lg leading-8 text-slate-700">{quote}</p>
    </article>
  );
}
