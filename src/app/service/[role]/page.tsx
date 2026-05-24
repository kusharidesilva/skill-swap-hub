import { notFound } from "next/navigation";

import InsideServicePage from "@/components/inside-service-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type RolePageProps = {
  params: Promise<{ role?: string | string[] }>;
};

export default async function ServiceByRolePage({ params }: RolePageProps) {
  const { role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <InsideServicePage role={role} />
    </ProfileShell>
  );
}
