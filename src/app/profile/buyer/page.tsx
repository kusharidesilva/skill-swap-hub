import BuyerProfile from "@/components/profile/buyer-profile";
import ProfileShell from "@/components/profile-shell";

export default function BuyerProfilePage() {
  return (
    <ProfileShell role="buyer">
      <BuyerProfile />
    </ProfileShell>
  );
}
