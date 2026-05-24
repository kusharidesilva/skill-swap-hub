import ProfileShell from "@/components/profile-shell";
import PostNewGigPage from "@/components/post-new-gig-page";

export default function PostGigPage() {
  return (
    <ProfileShell role="provider">
      <PostNewGigPage role="provider" />
    </ProfileShell>
  );
}
