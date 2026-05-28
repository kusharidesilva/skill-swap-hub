import { notFound } from "next/navigation";

import GigPreviewPage from "@/components/gig-preview-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type GigPreviewByRolePageProps = {
  params: Promise<{ role?: string | string[] }>;
  searchParams: Promise<{
    source?: string | string[];
    gigId?: string | string[];
    providerId?: string | string[];
    skillIndex?: string | string[];
  }>;
};

export default async function GigPreviewByRolePage({ params, searchParams }: GigPreviewByRolePageProps) {
  const { role } = await params;
  const query = await searchParams;
  const source = query.source;
  const gigId = query.gigId;
  const providerId = typeof query.providerId === "string" ? query.providerId : undefined;
  const skillIndex =
    typeof query.skillIndex === "string" ? Number.parseInt(query.skillIndex, 10) : undefined;

  if (!isRole(role)) {
    notFound();
  }

  const backHref =
    source === "edit" && typeof gigId === "string" && gigId
      ? `/edit-gig/${role}/${gigId}`
      : source === "find"
        ? `/find-services/${role}`
      : `/post-gig/${role}`;

  return (
    <ProfileShell role={role}>
      <GigPreviewPage
        role={role}
        backHref={backHref}
        providerId={providerId}
        skillIndex={Number.isFinite(skillIndex) ? skillIndex : undefined}
      />
    </ProfileShell>
  );
}
