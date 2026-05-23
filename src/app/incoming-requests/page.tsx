import ProfileShell from "@/components/profile-shell";
import IncomingRequestsPageContent from "@/components/incoming-requests-page";

export default function IncomingRequestsPage() {
  return (
    <ProfileShell role="provider">
      <IncomingRequestsPageContent />
    </ProfileShell>
  );
}
