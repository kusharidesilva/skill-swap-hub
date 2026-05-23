import { notFound } from "next/navigation";

import ChatsPage from "@/components/chats-page";
import ProfileShell from "@/components/profile-shell";
import { isRole } from "@/lib/role-routes";

type RolePageProps = {
  params: Promise<{ role?: string | string[] }>;
};

export default async function RoleChatsPage({ params }: RolePageProps) {
  const { role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <ChatsPage role={role} />
    </ProfileShell>
  );
}
