import { notFound } from "next/navigation";

import GigPreviewPage from "@/components/gig-preview-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type GigPreviewByRolePageProps = {
  params: Promise<{ role?: string | string[] }>;
  searchParams: Promise<{ source?: string | string[]; gigId?: string | string[] }>;
};

export default async function GigPreviewByRolePage({ params, searchParams }: GigPreviewByRolePageProps) {
  const { role } = await params;
  const query = await searchParams;
  const source = query.source;
  const gigId = query.gigId;

  if (!isRole(role) || role === "buyer") {
    notFound();
  }

  const backHref =
    source === "edit" && typeof gigId === "string" && gigId
      ? `/edit-gig/${role}/${gigId}`
      : `/post-gig/${role}`;

  return (
    <ProfileShell role={role}>
      <GigPreviewPage role={role} backHref={backHref} />
    </ProfileShell>
  );
}
