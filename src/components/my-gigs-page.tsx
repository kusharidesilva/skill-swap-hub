import Link from "next/link";
import Image from "next/image";

const gigs = [
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

type MyGigsPageContentProps = {
  activeTab?: "offered" | "manage";
};

export default function MyGigsPageContent({ activeTab = "offered" }: MyGigsPageContentProps) {
  const isManageTab = activeTab === "manage";

  return (
    <section className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 md:text-[2.9rem]">
          {isManageTab ? "Manage Gigs" : "View All Gigs"}
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Trust Score" value="99%" sub=" " accent />
        <MetricCard title="Total Swaps" value="68" sub="Completed" />
        <MetricCard title="Avg. Rating" value="5.0" sub="" teal stars />
        <MetricCard title="Avg. Response" value="1h" sub="Highly Responsive" />
      </div>

      <section>
        <div className="flex items-center gap-8 border-b border-slate-200">
          <Link
            href="?tab=offered"
            className={`border-b-2 pb-3 text-[1.15rem] font-semibold ${
              !isManageTab ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-600"
            }`}
          >
            Offered Gigs
          </Link>
          <Link
            href="?tab=manage"
            className={`border-b-2 pb-3 text-[1.15rem] font-semibold ${
              isManageTab ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-600"
            }`}
          >
            Manage Gigs
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {gigs.map((gig) => (
            <article
              key={gig.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div
                className="h-36 w-full overflow-hidden bg-slate-100"
              >
                <Image src={gig.image} alt={gig.title} width={600} height={240} className="h-full w-full object-cover" />
              </div>

              <div className="p-4">
                <h2 className="text-[1.45rem] font-semibold leading-tight text-slate-900">
                  {gig.title}
                </h2>
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  <span className="text-teal-700">★</span> {gig.rating}{" "}
                  <span className="font-normal text-slate-500">({gig.reviews} reviews)</span>
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="rounded-md bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    {gig.category}
                  </span>
                  <span className="text-base font-semibold text-[#1453c4]">{gig.points} Points</span>
                </div>

                {isManageTab ? (
                  <div className="mt-5 border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-3">
                      <button className="flex-1 rounded-lg bg-[#e5e7f2] px-3 py-2 text-sm font-semibold text-slate-800">
                        ✎ Edit
                      </button>
                      <button
                        aria-label="Pause gig"
                        className="h-9 w-9 rounded-full border border-slate-300 text-slate-500"
                      >
                        ‖
                      </button>
                      <button
                        aria-label="Delete gig"
                        className="h-9 w-9 rounded-full border border-slate-300 text-slate-500"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {isManageTab ? (
          <div className="mt-6 rounded-xl border-2 border-dashed border-[#c8d0ee] bg-[#f3f5ff] py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-500 text-2xl text-slate-500">
              +
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-700">Post a New Gig</p>
            <p className="mt-2 text-base text-slate-500">Offer your expertise to fellow students</p>
          </div>
        ) : null}
      </section>
    </section>
  );
}

function MetricCard({
  title,
  value,
  sub,
  accent = false,
  teal = false,
  stars = false,
}: {
  title: string;
  value: string;
  sub: string;
  accent?: boolean;
  teal?: boolean;
  stars?: boolean;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-[3rem] font-semibold leading-none text-slate-900">{value}</p>
      {stars ? <Stars className="mt-2 justify-center text-teal-700" /> : null}
      {sub ? <p className={`mt-2 text-base ${teal ? "text-teal-700" : "text-slate-600"}`}>{sub}</p> : null}
      {accent ? <div className="mx-auto mt-4 h-1.5 w-full rounded-full bg-teal-700" /> : null}
    </article>
  );
}

function Stars({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          className="h-5 w-5 fill-current"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 1.7l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L2.2 7.4l5.4-.8L10 1.7z" />
        </svg>
      ))}
    </div>
  );
}
