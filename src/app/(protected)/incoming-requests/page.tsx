import ProfileShell from "@/components/profile-shell";
import IncomingRequestsPageContent from "@/components/incoming-requests-page";

type IncomingRequestsPageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function IncomingRequestsPage({ searchParams }: IncomingRequestsPageProps) {
  const tabValue = (await searchParams).tab;
  const activeTab =
    tabValue === "accepted" || tabValue === "completed" || tabValue === "declined"
      ? tabValue
      : "new";

  return (
    <ProfileShell role="provider">
      <IncomingRequestsPageContent activeTab={activeTab} role="provider" />
    </ProfileShell>
  );
}
