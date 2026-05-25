"use client";

import { useAuth } from "@/context/AuthContext";

export type Role = "buyer" | "provider" | "both";

const defaultOfferedSkills = ["Python & Django", "UI/UX Design", "Figma", "C++ Fundamentals", "Mobile App Dev"];
const defaultNeededSkills = ["Data Analysis", "Tableau", "Public Speaking", "Econometrics"];
const availableDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Profile({ role: propRole }: { role: Role }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading profile details...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">No profile data found. Please sign in.</p>
      </div>
    );
  }

  // Derive roles and visibility
  const displayRole = userProfile.role || propRole;
  const showOffered = displayRole === "provider" || displayRole === "both";
  const showNeeded = displayRole === "buyer" || displayRole === "both";

  // Derive data fields from firestore profile
  const name = userProfile.name || "Alex Rivera";
  const university = userProfile.university || "Stanford University";
  const degree = userProfile.degree || "Computer Science";
  const yearOfStudy = userProfile.yearOfStudy || "3rd Year";
  
  // Custom or default bio
  const bio = userProfile.providerProfile?.bio || (
    displayRole === "buyer"
      ? `Hey there! I am a student at ${university} studying ${degree}. I joined Skill Swap Hub to collaborate with other students, exchange knowledge, and learn new skills.`
      : `Hey there! I am a ${degree} student passionate about building clean interfaces and scalable backend systems. I love explaining complex concepts in simple terms and believe the best way to learn is to teach someone else.`
  );

  // Skills
  const offeredSkills = userProfile.providerProfile?.skills || (showOffered ? defaultOfferedSkills : []);
  const neededSkills = userProfile.neededSkills || defaultNeededSkills;

  // Availability Mapping
  const availabilitySlots = userProfile.providerProfile?.availability || ["Weekdays", "Evenings"];
  const activeDays = new Set<string>();
  if (availabilitySlots.includes("Weekdays") || availabilitySlots.includes("Evenings")) {
    ["Mon", "Tue", "Wed", "Thu", "Fri"].forEach(d => activeDays.add(d));
  }
  if (availabilitySlots.includes("Weekends")) {
    ["Sat", "Sun"].forEach(d => activeDays.add(d));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Letter Avatar for Verified Student */}
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-gradient-to-tr from-blue-500 to-[#2b62e6] text-xl font-bold text-white shadow-inner">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold text-slate-900">{name}</h1>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {userProfile.emailVerified ? "Verified Student" : "Student Member"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {degree} ({yearOfStudy}) - {university}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    ★
                  </span>
                  <span className="font-semibold text-emerald-700">5.0</span>
                  <span className="text-slate-500">(New member reviews)</span>
                </div>
                <span className="text-slate-400">|</span>
                <span className="font-semibold text-slate-700">0 swaps</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Identity Verified Banner */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            ✓
          </span>
          <div>
            <h2 className="text-sm font-semibold text-emerald-800">Identity Verified</h2>
            <p className="text-xs text-emerald-700">
              University email ({userProfile.email}) has been verified by Skill Swap Hub
            </p>
          </div>
        </div>
      </section>

      {/* About + Skills */}
      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              i
            </span>
            About {name.split(" ")[0]}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 whitespace-pre-line">
            {bio}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {showOffered && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  ✓
                </span>
                Skills I Can Offer
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {offeredSkills.length > 0 ? (
                  offeredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No offered skills listed yet.</p>
                )}
              </div>
            </div>
          )}

          {showNeeded && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  ✓
                </span>
                Skills I Need
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {neededSkills.length > 0 ? (
                  neededSkills.map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No needed skills listed yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Reviews (Placeholder representation) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              ✦
            </span>
            Recent Reviews
          </div>
          <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View All Reviews
          </button>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center py-8">
            <p className="text-sm text-slate-500">No reviews yet. Complete your first swap to receive reviews!</p>
          </div>
        </div>
      </section>

      {/* Availability */}
      {showOffered && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              ●
            </span>
            Available for Swaps
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Preferred slots: {availabilitySlots.join(", ")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {availableDays.map((day) => (
              <span
                key={day}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  activeDays.has(day)
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {day}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
