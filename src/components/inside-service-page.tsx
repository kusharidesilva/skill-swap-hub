import Image from "next/image";
import Link from "next/link";

import { scopedHref, type Role } from "@/lib/role-routes";

type InsideServicePageProps = {
  role: Role;
};

export default function InsideServicePage({ role }: InsideServicePageProps) {
  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      {/* Service breadcrumb */}
      <p className="text-xs font-semibold text-slate-500">
        Graphics & Design <span className="px-1 text-slate-400">›</span> Book Design{" "}
        <span className="px-1 text-slate-400">›</span> Book Cover Design
      </p>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main service details and shared files */}
        <section className="space-y-5">
          <h1 className="text-2xl font-semibold leading-tight text-slate-900 md:text-[2.1rem]">
            Creative Book Cover Design - KDP & eBook
          </h1>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#996428] shadow-sm">
            <div className="relative h-[300px] w-full md:h-[420px]">
              <Image
                src="/img/package%201.jpg"
                alt="Book cover design preview"
                fill
                className="object-contain p-8 md:p-12"
                sizes="(min-width: 1280px) 760px, 100vw"
                priority
              />
            </div>
          </div>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-[#2f66e7]/20">
                <Image
                  src="/img/favorites/maya.jpg"
                  alt="Amara Silva"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">Amara Silva</h2>
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                    TOP RATED
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  University of Moratuwa • Creative Design Lead
                </p>
                <p className="mt-1 text-base font-semibold text-teal-700">★ 5.0 (68 reviews)</p>
              </div>
            </div>
          </article>
        </section>

        <aside className="space-y-4">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-[#1453c4] px-6 py-4">
              <p className="text-3xl font-semibold text-white">Premium Student Swap</p>
            </div>
            <div className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-4xl font-semibold text-slate-900">$20 Value</p>
                <p className="text-sm font-semibold text-teal-700">3-Day Delivery</p>
              </div>
              <p className="text-base leading-7 text-slate-600">
                Design one creative e-book cover. One premium stock image included.
                Unlimited revisions until you love it.
              </p>
              <ul className="space-y-2 border-y border-slate-200 py-4 text-base text-slate-700">
                <li>✓ 3D Mockup</li>
                <li>✓ Source Files</li>
                <li>✓ Back & Spine Design</li>
                <li>✓ Unlimited Revisions</li>
              </ul>

              <button
                type="button"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#1453c4] px-4 text-base font-semibold text-white transition hover:bg-[#0f43a1]"
              >
                Request Skill
              </button>
              <Link
                href={scopedHref("/chats", role)}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 px-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Message Provider
              </Link>
            </div>
            <div className="bg-slate-100 px-6 py-3 text-center text-sm font-semibold text-slate-500">
              SkillSwap Quality Guarantee
            </div>
          </article>
        </aside>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-slate-900">About this Gig</h3>
          <div className="my-4 border-t border-slate-200" />
          <p className="text-base italic text-slate-700">
            &quot;A great book deserves a cover that grabs attention and reflects its
            story.&quot;
          </p>
        </article>

        <article className="hidden xl:block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-semibold text-[#1453c4]">Skill Match</h4>
            <span className="text-xl font-semibold text-teal-700">92%</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-slate-200">
            <div className="h-full w-[92%] rounded-full bg-teal-600" />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Based on your shared skills in Content Strategy and Illustration.
          </p>
        </article>

        <div className="xl:col-span-2">
          <div className="mx-auto w-full max-w-5xl space-y-4">
            <div className="grid items-stretch gap-4 lg:grid-cols-2">
              <InfoCard
                title="What I Will Do"
                titleColor="text-[#1f57d6]"
                items={[
                  "Custom book cover design",
                  "Ebook cover (Kindle, PDF, EPUB)",
                  "KDP book cover formatting",
                  "Paperback & hardcover cover design",
                  "Spine & back cover design",
                ]}
              />
              <InfoCard
                title="Why Swap With Me"
                titleColor="text-teal-700"
                items={[
                  "Experience with KDP & self-publishing",
                  "Clean, professional, eye-catching designs",
                  "Genre-specific approach",
                  "Fast communication & on-time delivery",
                ]}
              />
            </div>

            <article className="rounded-2xl border border-slate-200 bg-[#f4f6ff] p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-slate-900">Requirements</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <RequirementBlock
                  title="Title & Author"
                  detail="Exact wording for cover typography."
                />
                <RequirementBlock
                  title="Genre & Mood"
                  detail="Visual direction and target audience."
                />
                <RequirementBlock
                  title="Book Specs"
                  detail="Page count, size, and platform (KDP/etc)."
                />
              </div>
            </article>

            {/* Session notes */}
            <section className="space-y-3">
              <h3 className="text-2xl font-semibold text-slate-900">
                What people say about this swap
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <ReviewCard
                  name="jhonhopkins"
                  quote="An amazing experience working with this seller. The cover design looks modern, clean, and perfectly aligned with the concept. Great work overall."
                />
                <ReviewCard
                  name="abigail_mend"
                  quote="Very high quality book cover design. The visuals immediately attract attention. The concept feels perfectly aligned with the book theme."
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  titleColor,
  items,
}: {
  title: string;
  titleColor: string;
  items: string[];
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className={`text-xl font-semibold ${titleColor}`}>{title}</h4>
      <ul className="mt-3 space-y-2 text-base text-slate-700">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </article>
  );
}

function RequirementBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <h5 className="text-lg font-semibold text-[#1453c4]">{title}</h5>
      <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function ReviewCard({ name, quote }: { name: string; quote: string }) {
  const badge = name.slice(0, 1).toUpperCase();

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f66e7] text-sm font-semibold text-white">
          {badge}
        </span>
        <div>
          <p className="text-xl font-semibold text-slate-900">{name}</p>
          <p className="text-base text-teal-700">★★★★★</p>
        </div>
      </div>
      <p className="mt-3 text-base leading-7 text-slate-700">&quot;{quote}&quot;</p>
    </article>
  );
}
