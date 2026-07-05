import ChatsPage from "@/components/chats-page"; 
import ProfileShell from "@/components/profile-shell";

export default function Chats() {
  return (
    <ProfileShell role="buyer">
      <ChatsPage role="buyer" />
    </ProfileShell>
  );
}
