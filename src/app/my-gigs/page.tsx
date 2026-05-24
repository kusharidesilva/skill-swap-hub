import ProfileShell from "@/components/profile-shell";
import MyGigsPageContent from "@/components/my-gigs-page";

type MyGigsPageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function MyGigsPage({ searchParams }: MyGigsPageProps) {
  const tabValue = (await searchParams).tab;
  const activeTab = tabValue === "manage" ? "manage" : "offered";

  return (
    <ProfileShell role="provider">
      <MyGigsPageContent activeTab={activeTab} role="provider" />
    </ProfileShell>
  );
}
