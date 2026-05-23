import { notFound } from "next/navigation";

import RatingsPageContent from "@/components/ratings-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type RolePageProps = {
  params: Promise<{ role?: string | string[] }>;
};

export default async function RoleRatingsPage({ params }: RolePageProps) {
  const { role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <RatingsPageContent />
    </ProfileShell>
  );
}
