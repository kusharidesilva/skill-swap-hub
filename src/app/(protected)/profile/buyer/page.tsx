import Profile from "@/components/profile/profile"; 
import ProfileShell from "@/components/profile-shell";

export default function BuyerProfilePage() {
  return (
    <ProfileShell role="buyer">
      <Profile role="buyer" />
    </ProfileShell>
  );
}
