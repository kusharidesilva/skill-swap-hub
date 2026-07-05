import { notFound } from "next/navigation";

import MyGigsPageContent from "@/components/my-gigs-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type RolePageProps = {
  params: Promise<{ role?: string | string[] }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function RoleMyGigsPage({ params, searchParams }: RolePageProps) {
  const { role } = await params;
  const tabValue = (await searchParams).tab;
  // Only the management tab needs a special query value.
  const activeTab = tabValue === "manage" ? "manage" : "offered";

  if (!isRole(role)) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <MyGigsPageContent activeTab={activeTab} role={role === "both" ? "both" : "provider"} />
    </ProfileShell>
  );
}
