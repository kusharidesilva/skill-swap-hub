import Link from "next/link";
import ProfileShell from "@/components/profile-shell";

type Role = "buyer" | "provider" | "both";

type DashboardViewProps = {
  role: Role;
};

const dashboardCopy: Record<Role, { title: string; description: string; stats: string[] }> = {
  buyer: {
    title: "Welcome Back, Buyer!",
    description: "Track service requests, saved providers, chats, and ratings from one place.",
    stats: ["Active requests", "Saved services", "Unread chats"],
  },
  provider: {
    title: "Welcome Back, Provider!",
    description: "Manage your gigs, incoming requests, conversations, and student feedback.",
    stats: ["Published gigs", "Incoming requests", "Average rating"],
  },
  both: {
    title: "Welcome Back, Swapper!",
    description: "Use buyer and provider tools together without switching accounts.",
    stats: ["Service requests", "Provider gigs", "Open chats"],
  },
};

export default function DashboardView({ role }: DashboardViewProps) {
  const content = dashboardCopy[role];

  return (
    <ProfileShell role={role}>
      <div className="space-y-6">
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

        {/* Both Details Section (If user is both Buyer and Provider) */}
        {role === "both" && (
          <section className="grid gap-6 md:grid-cols-2">
            {/* Buyer Details Sub-section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-[#2f66e7]/40 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Buyer Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Your activity as a skill learner</p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                  Active Buyer
                </span>
              </div>
              <div className="mt-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Active Service Requests</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">0</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Saved Peer Services</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">0</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Swaps Completed</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">0</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-50">
                  <span className="text-slate-600 font-medium">Estimated Swaps Spent</span>
                  <span className="font-bold text-[#2f66e7]">0 Swaps</span>
                </div>
              </div>
              <div className="mt-5">
                <Link
                  href="/home/buyer"
                  className="block w-full text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Go to Buyer Home →
                </Link>
              </div>
            </div>

            {/* Provider Details Sub-section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-[#1caa88]/40 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Provider Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Your activity as a skill expert</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                  Active Provider
                </span>
              </div>
              <div className="mt-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Published Gig Listings</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">0</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Incoming Peer Requests</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">0</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Swaps Received</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">0</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-50">
                  <span className="text-slate-600 font-medium">Ratings & Feedback</span>
                  <span className="font-bold text-[#1caa88]">5.0 ★ (0 reviews)</span>
                </div>
              </div>
              <div className="mt-5">
                <Link
                  href="/my-gigs/both"
                  className="block w-full text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Manage Your Gigs →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Become a Seller callout (If Buyer Dashboard) */}
        {role === "buyer" && (
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-[#f8faff] p-6 shadow-sm relative">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Grow as a Peer
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Share your expertise and start earning!</h3>
                <p className="max-w-2xl text-xs text-slate-600 leading-relaxed">
                  Join our verified university provider network in Sri Lanka. List your skills in Programming, Design, Photography, or Academics, and earn rewards or swap services.
                </p>
              </div>
              <Link
                href="/become-a-seller-intro"
                className="whitespace-nowrap rounded-full bg-[#2f66e7] px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-[#2552c4] hover:shadow-lg transition-all"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        )}

        {/* Become a Buyer callout (If Provider Dashboard) */}
        {role === "provider" && (
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-[#f7fdfb] p-6 shadow-sm relative">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Learn & Swap
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Looking for other student services?</h3>
                <p className="max-w-2xl text-xs text-slate-600 leading-relaxed">
                  Become a Buyer to purchase services from other talented peers, request specialized assignment/project help, and trade skills.
                </p>
              </div>
              <Link
                href="/home/buyer"
                className="whitespace-nowrap rounded-full bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-lg transition-all"
              >
                Become a Buyer
              </Link>
            </div>
          </div>
        )}
      </div>
    </ProfileShell>
  );
}
