import { notFound } from "next/navigation";

import AllRequestServicePage from "@/components/all-request-service-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type RolePageProps = {
  params: Promise<{ role?: string | string[] }>;
};

export default async function RoleAllRequestsPage({ params }: RolePageProps) {
  const { role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <AllRequestServicePage role={role} />
    </ProfileShell>
  );
}
