import { notFound } from "next/navigation";

import PostNewGigPage from "@/components/post-new-gig-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type RolePostGigPageProps = {
  params: Promise<{ role?: string | string[] }>;
};

export default async function RolePostGigPage({ params }: RolePostGigPageProps) {
  const { role } = await params;

  if (!isRole(role) || role === "buyer") {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <PostNewGigPage role={role} />
    </ProfileShell>
  );
}
