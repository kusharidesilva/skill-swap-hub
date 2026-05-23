import { notFound } from "next/navigation";

import MyGigsPageContent from "@/components/my-gigs-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type RolePageProps = {
  params: Promise<{ role?: string | string[] }>;
};

export default async function RoleMyGigsPage({ params }: RolePageProps) {
  const { role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <MyGigsPageContent />
    </ProfileShell>
  );
}
