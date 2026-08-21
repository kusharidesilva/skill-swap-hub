import { notFound } from "next/navigation";

import SiteFooter from "@/components/footer";
import GigPreviewPage from "@/components/gig-preview-page";
import Navbar from "@/components/navbar";
import ProfileShell from "@/components/profile-shell";
import { homeHref, isRole } from "@/lib/role-routes";

type GigPreviewByRolePageProps = { 
  params: Promise<{ role?: string | string[] }>;
  searchParams: Promise<{ 
    source?: string | string[]; 
    gigId?: string | string[]; 
    providerId?: string | string[]; 
    skillIndex?: string | string[]; 
    coverImage?: string | string[];
  }>; 
};

export default async function GigPreviewByRolePage({ params, searchParams }: GigPreviewByRolePageProps) {
  // Next.js provides both the role segment and preview options as promises.
  const { role } = await params;
  const query = await searchParams;
  const source = query.source;
  const gigId = query.gigId;
  const selectedGigId = typeof gigId === "string" ? gigId : undefined;
  const providerId = typeof query.providerId === "string" ? query.providerId : undefined;
  const coverImage = typeof query.coverImage === "string" ? query.coverImage : undefined;
  const skillIndex = 
    typeof query.skillIndex === "string" ? Number.parseInt(query.skillIndex, 10) : undefined; 

  if (!isRole(role)) { 
    notFound();
  }

  // Return the user to the page that originally opened this preview.
  const backHref =
    source === "edit" && typeof gigId === "string" && gigId
      ? `/edit-gig/${role}/${gigId}`
      : source === "find"
        ? `/find-services/${role}` 
      : source === "home"
        ? homeHref(role)
      : `/post-gig/${role}`;

  const content = (
    <GigPreviewPage
      role={role}
      backHref={backHref}
      gigId={selectedGigId}
      providerId={providerId}
      skillIndex={Number.isFinite(skillIndex) ? skillIndex : undefined}
      coverImage={coverImage}
    />
  );

  // Home previews use the public shell; dashboard previews keep the profile shell.
  if (source === "home") {
    return (
      <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
        <Navbar role={role} />
        <main className="mx-auto w-full max-w-6xl px-6 pb-10 pt-28">
          {content}
        </main>
        <SiteFooter role={role} />
      </div>
    );
  }

  return (
    <ProfileShell role={role}>
      {content}
    </ProfileShell>
  );
}
