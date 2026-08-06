import { notFound } from "next/navigation";

import ProfileShell from "@/components/profile-shell";
import RequestServiceContent from "@/components/request-service-page";
import { isRole } from "@/lib/role-routes";

type RolePageProps = {
  params: Promise<{ role?: string | string[] }>;
};

export default async function RoleRequestServicePage({ params }: RolePageProps) {
  const { role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  return (
    <ProfileShell role={role} navRole={role === "both" ? "buyer" : role}>
      <RequestServiceContent role={role} />
    </ProfileShell>
  );
}
