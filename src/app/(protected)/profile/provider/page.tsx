import Profile from "@/components/profile/profile"; 
import ProfileShell from "@/components/profile-shell";

export default function ProviderProfilePage() {
  return (
    <ProfileShell role="provider">
      <Profile role="provider" /> 
    </ProfileShell>
  );
}
