import { notFound } from "next/navigation";

import IncomingRequestsPageContent from "@/components/incoming-requests-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type RolePageProps = {
  params: Promise<{ role?: string | string[] }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function RoleIncomingRequestsPage({
  params,
  searchParams,
}: RolePageProps) {
  const { role } = await params;
  const tabValue = (await searchParams).tab;
  // Unknown tab values safely open the new-request queue.
  const activeTab =
    tabValue === "accepted" || tabValue === "completed" || tabValue === "declined"
      ? tabValue
      : "new";

  if (!isRole(role)) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <IncomingRequestsPageContent activeTab={activeTab} role={role === "both" ? "both" : "provider"} />
    </ProfileShell>
  );
}
