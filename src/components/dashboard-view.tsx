import ProfileShell from "@/components/profile-shell";

type Role = "buyer" | "provider" | "both";

type DashboardViewProps = {
  role: Role;
};

const dashboardCopy: Record<Role, { title: string; description: string; stats: string[] }> = {
  buyer: {
    title: "Buyer Dashboard",
    description: "Track service requests, saved providers, chats, and ratings from one place.",
    stats: ["Active requests", "Saved services", "Unread chats"],
  },
  provider: {
    title: "Provider Dashboard",
    description: "Manage your gigs, incoming requests, conversations, and student feedback.",
    stats: ["Published gigs", "Incoming requests", "Average rating"],
  },
  both: {
    title: "Buyer & Provider Dashboard",
    description: "Use buyer and provider tools together without switching accounts.",
    stats: ["Service requests", "Provider gigs", "Open chats"],
  },
};

export default function DashboardView({ role }: DashboardViewProps) {
  const content = dashboardCopy[role];

  return (
    <ProfileShell role={role}>
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#2f66e7]">
          Dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{content.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{content.description}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {content.stats.map((stat) => (
            <div key={stat} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">{stat}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">0</p>
            </div>
          ))}
        </div>
      </section>
    </ProfileShell>
  );
}
