import Link from "next/link";

type PostNewGigPageProps = {
  role: "provider" | "both";
  mode?: "create" | "edit";
  gigId?: string;
};

export default function PostNewGigPage({ role, mode = "create", gigId }: PostNewGigPageProps) {
  const isEditMode = mode === "edit";
  const previewHref =
    isEditMode && gigId
      ? `/gig-preview/${role}?source=edit&gigId=${encodeURIComponent(gigId)}`
      : `/gig-preview/${role}`;

  return (
    <section className="space-y-6 pb-8">
      <div className="mx-auto max-w-3xl">
        <div className="px-6 pt-2">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-400">
            <StepItem number={1} label="Overview" active />
            <Connector />
            <StepItem number={2} label="Description" />
            <Connector />
            <StepItem number={3} label="Media & Point" />
          </div>
        </div>

        <article className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle title="Gig Overview" />
          <div className="mt-5 space-y-4">
            <LabeledInput label="Gig Title" placeholder="e.g., I will design a modern book cover for your project" />
            <p className="-mt-3 text-xs font-medium text-slate-400">Create a catchy title starting with &apos;I will...&apos;</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledSelect label="Category" value="Graphic Design" />
              <LabeledSelect label="Subcategory" value="Book Design" />
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Search Tags / Keywords (Max 5)
              <div className="mt-2 flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-[#f6f7ff] px-3">
                <Tag label="Book Cover" />
                <Tag label="Design" />
                <span className="text-slate-400">Add a tag...</span>
              </div>
            </label>
          </div>

          <SectionTitle title="Detailed Information" className="mt-8" />
          <div className="mt-5 space-y-4">
            <LabeledInput label="Short Summary" placeholder="A one-sentence pitch for your gig" />
            <label className="block text-sm font-semibold text-slate-700">
              Detailed Description
              <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                <div className="flex h-9 items-center gap-3 border-b border-slate-200 bg-[#f2f3ff] px-3 text-sm text-slate-600">
                  <span className="font-bold">B</span>
                  <span className="italic">I</span>
                  <span>•</span>
                  <span>≡</span>
                  <span>🔗</span>
                </div>
                <textarea
                  className="h-36 w-full resize-none px-4 py-3 text-base text-slate-600 outline-none"
                  defaultValue="Describe what you are offering in detail. Mention your tools, process, and what the buyer will receive..."
                />
              </div>
            </label>
          </div>

          <SectionTitle title="Swap Terms" className="mt-8" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Point Value (Price)
              <div className="mt-2 flex h-11 items-center justify-between rounded-lg border border-slate-200 px-3">
                <span className="text-slate-500">50</span>
                <span className="font-semibold text-teal-700">PTS</span>
              </div>
              <span className="mt-1 block text-xs font-medium text-slate-400">
                How many Skill Points is this swap worth?
              </span>
            </label>
            <LabeledSelect label="Delivery Time (Days)" value="1 Day" />
          </div>

          <SectionTitle title="Portfolio & Thumbnails" className="mt-8" />
          <div className="mt-5 rounded-xl border-2 border-dashed border-[#c8d0ee] bg-[#f5f6ff] px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-300 text-xl text-teal-900">
              ⤴
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-800">Upload Gig Images</p>
            <p className="mt-2 text-lg text-slate-500">Drag and drop images or click to browse. Support JPG, PNG up to 10MB.</p>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="h-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/package%201.jpg" alt="Gig thumbnail" className="h-full w-full object-cover" />
            </div>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex h-24 items-center justify-center rounded-lg border border-slate-200 bg-[#f2f3ff] text-slate-300"
              >
                🖼
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
            <button className="rounded-lg border border-slate-300 px-5 py-2 text-base font-semibold text-slate-700">
              Save as Draft
            </button>
            <div className="flex items-center gap-6">
              <Link href={previewHref} className="text-base font-semibold text-[#1453c4]">
                Preview Gig
              </Link>
              <button className="rounded-lg bg-[#1453c4] px-7 py-2 text-base font-semibold text-white shadow-sm">
                {isEditMode ? "Save Gig" : "Publish Gig"}
              </button>
            </div>
          </div>
        </article>
      </div>

      <div className="hidden">
        <Link href={role === "both" ? "/my-gigs/both?tab=manage" : "/my-gigs/provider?tab=manage"}>Back</Link>
      </div>
    </section>
  );
}

function SectionTitle({ title, className = "" }: { title: string; className?: string }) {
  return (
    <div className={className}>
      <h2 className="text-3xl font-semibold text-slate-800">{title}</h2>
      <div className="mt-2 h-px bg-slate-200" />
    </div>
  );
}

function LabeledInput({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 text-base text-slate-600 outline-none focus:border-slate-300"
        placeholder={placeholder}
      />
    </label>
  );
}

function LabeledSelect({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <div className="mt-2 flex h-11 items-center justify-between rounded-lg border border-slate-200 px-4 text-base text-slate-700">
        <span>{value}</span>
        <span className="text-slate-500">⌄</span>
      </div>
    </label>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
      {label}
      <span>×</span>
    </span>
  );
}

function StepItem({
  number,
  label,
  active = false,
}: {
  number: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold ${
          active ? "bg-[#1453c4] text-white" : "bg-slate-100 text-slate-400"
        }`}
      >
        {number}
      </div>
      <span className={`${active ? "text-[#1453c4]" : "text-slate-400"}`}>{label}</span>
    </div>
  );
}

function Connector() {
  return <div className="-mt-8 h-px flex-1 bg-slate-200" />;
}
