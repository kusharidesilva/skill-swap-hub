"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { upgradeToProvider, checkBuyerHistory } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

const ALL_SKILLS = [
  "Programming",
  "UX Design",
  "Graphic Design",
  "Mathematics",
  "Photography",
  "Video Editing",
  "Data Analysis",
  "Web Development",
  "Content Writing",
  "Music",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const AVAILABILITY_OPTIONS = ["Weekdays", "Evenings", "Weekends"] as const;

const providerSchema = z.object({
  university: z.string().min(2, "Enter your university name."),
  degree: z.string().min(2, "Enter your degree programme."),
  yearOfStudy: z.string(),
  skills: z.array(z.string()).min(1, "Select at least one skill."),
  proficiency: z.enum(["Beginner", "Intermediate", "Advanced"]),
  availability: z.array(z.string()).min(1, "Select at least one availability slot."),
  bio: z.string().min(20, "Write at least 20 characters about yourself."),
});

type ProviderValues = z.infer<typeof providerSchema>;

export default function ProviderRegisterPage() {
  const router = useRouter();
  const { firebaseUser, userProfile, refreshProfile, loading } = useAuth();
  const [serverError, setServerError] = useState("");
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProviderValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      university: "",
      degree: "",
      yearOfStudy: "1st Year",
      skills: [],
      proficiency: "Intermediate",
      availability: [],
      bio: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      // If the user has already upgraded, redirect them to the correct dashboard
      if (userProfile.role === "both") {
        checkBuyerHistory(userProfile.uid).then((hasHistory) => {
          if (hasHistory) {
            router.replace("/home/both");
          } else {
            router.replace("/home/provider");
          }
        });
        return;
      }
      if (userProfile.role === "provider") {
        router.replace("/home/provider");
        return;
      }

      if (userProfile.university) {
        setValue("university", userProfile.university, { shouldValidate: true });
      }
      if (userProfile.degree) {
        setValue("degree", userProfile.degree, { shouldValidate: true });
      }
      if (userProfile.yearOfStudy) {
        setValue("yearOfStudy", userProfile.yearOfStudy, { shouldValidate: true });
      }
    }
  }, [userProfile, setValue, router]);

  const selectedSkills = useWatch({ control, name: "skills" }) || [];
  const selectedProficiency = useWatch({ control, name: "proficiency" }) || "Intermediate";
  const selectedAvailability = useWatch({ control, name: "availability" }) || [];

  // ── Skill tag helpers ────────────────────────────────────────────────────────

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || selectedSkills.includes(trimmed)) return;
    setValue("skills", [...selectedSkills, trimmed], { shouldValidate: true });
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setValue(
      "skills",
      selectedSkills.filter((s) => s !== skill),
      { shouldValidate: true }
    );
  };

  const toggleAvailability = (slot: string) => {
    const next = selectedAvailability.includes(slot)
      ? selectedAvailability.filter((s) => s !== slot)
      : [...selectedAvailability, slot];
    setValue("availability", next, { shouldValidate: true });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = async (data: ProviderValues) => {
    setServerError("");
    if (!firebaseUser) {
      setServerError("You must be logged in to upgrade your account.");
      return;
    }
    try {
      const redirectPath = await upgradeToProvider(firebaseUser.uid, {
        university: data.university,
        degree: data.degree,
        yearOfStudy: data.yearOfStudy,
        skills: data.skills,
        proficiency: data.proficiency,
        availability: data.availability,
        bio: data.bio,
      });
      // Refresh the in-memory profile so AuthContext reflects the new "both"
      // role immediately — without this, the cached "buyer" role stays stale
      // until the user logs out and back in.
      await refreshProfile();
      setUpgradeSuccess(true);
      setTimeout(() => {
        router.push(redirectPath);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upgrade failed.";
      setServerError(msg);
    }
  };

  const isUpgraded = userProfile && (userProfile.role === "both" || userProfile.role === "provider");

  if (loading || isUpgraded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">
            {isUpgraded ? "Redirecting to your dashboard..." : "Loading…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-white">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="relative grid w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
          <button
            onClick={() => router.push("/home/buyer")}
            title="Close"
            className="absolute right-6 top-6 z-10 text-slate-400 hover:text-slate-600"
          >
            <CloseIcon className="h-5 w-5" />
          </button>

          {/* ── Left info panel ── */}
          <section className="px-8 py-10">
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Become a Provider
            </span>
            <div className="mt-4">
              <h1 className="text-2xl font-semibold text-[#2543d7]">
                Join as a Service
              </h1>
              <h2 className="text-2xl font-semibold text-[#2543d7]">Provider</h2>
              <p className="mt-3 text-xs text-slate-600">
                Share your expertise, help your peers, and grow your professional
                portfolio within the Sri Lankan university community.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#e9fbf6] px-4 py-3 text-xs text-slate-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#1caa88]">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Get Verified</p>
                <p className="mt-1 text-xs text-slate-600">
                  Verified providers receive more swap requests and exclusive access
                  to the university network.
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              <Image
                src="/img/03.jpg"
                alt="Student working on creative projects"
                width={520}
                height={320}
                className="h-auto w-full object-cover"
              />
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-slate-700">
                Why join Skill Swap Hub?
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 text-[#0f8a6b]" />
                  Build a credible academic portfolio.
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 text-[#0f8a6b]" />
                  Network with university students across the country.
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 text-[#0f8a6b]" />
                  Earn income from your skills.
                </li>
              </ul>
            </div>
          </section>

          {/* ── Right form panel ── */}
          <section className="border-l border-slate-200 px-8 py-10">
            {serverError && (
              <div className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-200">
                {serverError}
              </div>
            )}

            {upgradeSuccess && (
              <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-left shadow-xs animate-pulse">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm">
                    🎉
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">Provider Account Activated!</p>
                    <p className="mt-1 text-[11px] text-emerald-600">
                      Congratulations! Your profile has been upgraded. Redirecting to your provider dashboard...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* ── Academic Profile ── */}
              <section>
                <p className="text-xs font-semibold text-slate-500">
                  Academic Profile
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      University Name
                    </label>
                    <input
                      id="provider-university"
                      type="text"
                      placeholder="Your University Name"
                      {...register("university")}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#2b62e6]"
                    />
                    {errors.university && (
                      <p className="text-[10px] text-red-500">
                        {errors.university.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Degree Programme
                    </label>
                    <input
                      id="provider-degree"
                      type="text"
                      placeholder="Your Degree Programme"
                      {...register("degree")}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#2b62e6]"
                    />
                    {errors.degree && (
                      <p className="text-[10px] text-red-500">
                        {errors.degree.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Year of Study
                    </label>
                    <select
                      {...register("yearOfStudy")}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:outline-none focus:border-[#2b62e6]"
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* ── Skills & Services ── */}
              <section>
                <p className="text-xs font-semibold text-slate-500">
                  Skills & Services
                </p>
                <div className="mt-3 space-y-4">
                  {/* Skill tag input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Skills You Offer
                    </label>
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 min-h-[44px]">
                      {selectedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-full bg-[#eef1ff] px-3 py-1 text-[11px] font-semibold text-[#2b54d6]"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-0.5 text-[#2b54d6]/60 hover:text-[#2b54d6]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={skillInput}
                        placeholder="Type a skill & press Enter"
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill(skillInput);
                          }
                        }}
                        className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {/* Quick-add suggestions */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ALL_SKILLS.filter((s) => !selectedSkills.includes(s)).map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => addSkill(s)}
                            className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10px] text-slate-400 hover:border-[#2b62e6] hover:text-[#2b62e6] transition-colors"
                          >
                            + {s}
                          </button>
                        )
                      )}
                    </div>
                    {errors.skills && (
                      <p className="text-[10px] text-red-500">
                        {errors.skills.message}
                      </p>
                    )}
                  </div>

                  {/* Proficiency */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-600">
                      Primary Skill Proficiency
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            setValue("proficiency", level, {
                              shouldValidate: true,
                            })
                          }
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                            selectedProficiency === level
                              ? "border-[#2543d7] bg-[#eef1ff] text-[#2543d7]"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-600">
                      Availability
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {AVAILABILITY_OPTIONS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => toggleAvailability(slot)}
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                            selectedAvailability.includes(slot)
                              ? "border-[#1caa88] bg-[#e9fbf6] text-[#1caa88]"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                    {errors.availability && (
                      <p className="text-[10px] text-red-500">
                        {errors.availability.message}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-600">
                      Short Bio / Expertise Summary
                    </p>
                    <textarea
                      id="provider-bio"
                      rows={3}
                      placeholder="Briefly describe your experience and what you can teach others."
                      {...register("bio")}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#2b62e6]"
                    />
                    {errors.bio && (
                      <p className="text-[10px] text-red-500">
                        {errors.bio.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <button
                id="provider-submit"
                type="submit"
                disabled={isSubmitting}
                className="block w-full rounded-lg bg-[#2b62e6] px-10 py-2.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-[#1f3ac0] transition-colors disabled:opacity-60"
              >
                {isSubmitting
                  ? "Upgrading Account…"
                  : "Upgrade to Provider Account →"}
              </button>
              <p className="text-[10px] text-slate-400 mt-1">
                By creating an account, you agree to the Community Guidelines
                and Service Standards.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path
        d="M9.5 12.5l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M6 6l12 12" strokeLinecap="round" />
      <path d="M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="9" />
      <path
        d="M8.5 12.5l2.5 2.5 4.5-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
