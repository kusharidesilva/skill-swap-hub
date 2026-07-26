import GigPreviewPage from "@/components/gig-preview-page";

type PublicGigPreviewPageProps = {
  searchParams: Promise<{
    providerId?: string | string[];
    gigId?: string | string[];
    skillIndex?: string | string[];
  }>;
};

export default async function PublicGigPreviewPage({
  searchParams,
}: PublicGigPreviewPageProps) {
  const query = await searchParams;
  const providerId = typeof query.providerId === "string" ? query.providerId : undefined;
  const gigId = typeof query.gigId === "string" ? query.gigId : undefined;
  const rawSkillIndex = typeof query.skillIndex === "string" ? Number(query.skillIndex) : 0;
  const skillIndex = Number.isFinite(rawSkillIndex) ? rawSkillIndex : 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <GigPreviewPage
        role="guest"
        backHref="/"
        providerId={providerId}
        gigId={gigId}
        skillIndex={skillIndex}
      />
    </main>
  );
}
