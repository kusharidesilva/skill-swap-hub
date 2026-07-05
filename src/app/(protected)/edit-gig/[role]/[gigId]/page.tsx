import { notFound } from "next/navigation";

import PostNewGigPage from "@/components/post-new-gig-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type EditGigPageProps = {
  params: Promise<{ role?: string | string[]; gigId?: string | string[] }>;
};

export default async function EditGigPage({ params }: EditGigPageProps) {
  const { role, gigId } = await params;

  // Buyers cannot edit gigs, and malformed IDs should render the normal 404 page.
  if (!isRole(role) || role === "buyer" || typeof gigId !== "string" || !gigId) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <PostNewGigPage role={role} mode="edit" gigId={gigId} />
    </ProfileShell>
  );
}
