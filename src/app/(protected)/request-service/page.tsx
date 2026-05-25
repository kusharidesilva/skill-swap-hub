import RequestServiceContent from "@/components/request-service-page";
import ProfileShell from "@/components/profile-shell";
import { Suspense } from "react";

export default function RequestServicePage() {
  return (
    <ProfileShell role="buyer">
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
        <RequestServiceContent role="buyer" />
      </Suspense>
    </ProfileShell>
  );
}

