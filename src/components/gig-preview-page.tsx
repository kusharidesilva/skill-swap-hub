import Link from "next/link";

type GigPreviewPageProps = {
  role: "provider" | "both";
  backHref?: string;
};

export default function GigPreviewPage({ role, backHref }: GigPreviewPageProps) {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <Link
          href={backHref ?? `/post-gig/${role}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <span aria-hidden="true">&lt;</span>
          Back
        </Link>
      </div>

      <p className="text-xs font-semibold text-slate-500">
        Graphics &amp; Design <span className="px-1 text-slate-400">&gt;</span> Book Design{" "}
        <span className="px-1 text-slate-400">&gt;</span> Book Cover Design
      </p>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="space-y-5">
          <h1 className="text-2xl font-semibold text-slate-900 md:text-[2.05rem]">
            Creative Book Cover Design - KDP &amp; eBook
          </h1>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#9d6a2e] shadow-sm">
            <div className="h-[460px] w-full p-6">
              <img
                src="/img/package%201.jpg"
                alt="Creative book cover design"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-[#1453c4] px-5 py-4">
              <p className="text-[1.9rem] font-semibold text-white">Premium Student Swap</p>
            </div>
            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[2rem] font-semibold text-slate-900">$20 Value</p>
                <p className="text-lg font-medium text-teal-700">3-Day Delivery</p>
              </div>
              <p className="text-base leading-7 text-slate-600">
                Design One Creative E-book Cover. One Premium Stock Image Included. Unlimited Revisions until you
                love it.
              </p>
              <ul className="space-y-2 border-y border-slate-200 py-4 text-base text-slate-700">
                <li>o 3D Mockup</li>
                <li>o Source Files</li>
                <li>o Back &amp; Spine Design</li>
                <li>o Unlimited Revisions</li>
              </ul>
            </div>
            <div className="bg-slate-100 px-5 py-3 text-center text-sm font-semibold text-slate-500">
              SkillSwap Quality Guarantee
            </div>
          </article>
        </aside>

        <div className="xl:col-span-2">
          <div className="mx-auto w-full max-w-[980px] space-y-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-[2rem] font-semibold text-slate-900">About this Gig</h2>
              <div className="my-4 border-t border-slate-200" />
              <p className="text-lg italic text-slate-700">
                &quot;A great book deserves a cover that grabs attention and reflects its story.&quot;
              </p>
            </article>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard
                title="What I Will Do"
                titleClass="text-[#1453c4]"
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
                titleClass="text-teal-700"
                items={[
                  "Experience with KDP & self-publishing",
                  "Clean, professional, eye-catching designs",
                  "Genre-specific approach",
                  "Fast communication & on-time delivery",
                ]}
              />
            </div>

            <article className="rounded-2xl border border-slate-200 bg-[#f4f6ff] p-5 shadow-sm">
              <h3 className="text-[2rem] font-semibold text-slate-900">Requirements</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Requirement title="Title & Author" detail="Exact wording for cover typography." />
                <Requirement title="Genre & Mood" detail="Visual direction and target audience." />
                <Requirement title="Book Specs" detail="Page count, size, and platform (KDP/etc)." />
              </div>
            </article>
          </div>
        </div>
      </div>

      <div className="hidden">{role}</div>
    </div>
  );
}

function InfoCard({
  title,
  titleClass,
  items,
}: {
  title: string;
  titleClass: string;
  items: string[];
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className={`text-[1.9rem] font-semibold ${titleClass}`}>{title}</h4>
      <ul className="mt-3 space-y-2 text-base text-slate-700">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </article>
  );
}

function Requirement({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <h4 className="text-xl font-semibold text-[#1453c4]">{title}</h4>
      <p className="mt-1 text-base text-slate-600">{detail}</p>
    </div>
  );
}
