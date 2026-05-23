import AllRequestServicePage from "@/components/all-request-service-page";
import ProfileShell from "@/components/profile-shell";

export default function AllRequestsPage() {
  return (
    <ProfileShell role="buyer">
      <AllRequestServicePage role="buyer" />
    </ProfileShell>
  );
}
