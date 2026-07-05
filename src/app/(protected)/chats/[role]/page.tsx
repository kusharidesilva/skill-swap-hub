import { notFound } from "next/navigation";
import { Suspense } from "react";

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
      <Suspense fallback={ 
        <div className="flex h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white"> 
          <div className="flex flex-col items-center gap-3"> 
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" /> 
            <p className="text-sm text-slate-500">Loading chat session...</p>  
          </div> 
        </div> 
      }> 
        <ChatsPage role={role} /> 
      </Suspense> 
    </ProfileShell> 
  );
}
