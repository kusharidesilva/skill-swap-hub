import { notFound } from "next/navigation";

import FindServicesPageContent from "@/components/find-services-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type RolePageProps = {
  params: Promise<{ role?: string | string[] }>;
};

export default async function RoleFindServicesPage({ params }: RolePageProps) {
  const { role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <FindServicesPageContent role={role} />
    </ProfileShell>
  );
}
