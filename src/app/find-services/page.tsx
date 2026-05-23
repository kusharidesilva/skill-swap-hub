import FindServicesPageContent from "@/components/find-services-page";
import ProfileShell from "@/components/profile-shell";

export default function FindServicesPage() {
  return (
    <ProfileShell role="buyer">
      <FindServicesPageContent role="buyer" />
    </ProfileShell>
  );
}
