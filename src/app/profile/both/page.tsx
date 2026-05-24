import Profile from "@/components/profile/profile";
import ProfileShell from "@/components/profile-shell";

export default function BothProfilePage() {
  return (
    <ProfileShell role="both">
      <Profile role="both" />
    </ProfileShell>
  );
}
