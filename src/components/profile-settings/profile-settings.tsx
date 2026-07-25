"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { changeSignedInEmail, type UserProfile } from "@/lib/auth";
import { AVAILABILITY_DAYS, AVAILABILITY_TIME_SLOTS } from "@/lib/platform";
import { useLookupOptions } from "@/lib/lookups";

export type Role = "buyer" | "provider" | "both";

const MAX_PROFILE_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function compressImageToBase64(
  file: File,
  maxDimension = 300,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));

    img.onload = () => {
      let { width, height } = img;

      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);

      // Firestore document limit is 1MB; keep this safely below it.
      if (dataUrl.length > 700_000) {
        reject(
          new Error(
            "Image is too large even after compression. Try a smaller image.",
          ),
        );
        return;
      }

      resolve(dataUrl);
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    reader.readAsDataURL(file);
  });
}

export default function ProfileSettings({ role }: { role: Role }) {
  const { userProfile, loading, refreshProfile } = useAuth();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Please sign in to manage settings.
        </p>
      </div>
    );
  }

  return (
    <ProfileSettingsForm
      userProfile={userProfile}
      propRole={role}
      refreshProfile={refreshProfile}
    />
  );
}

function ProfileSettingsForm({
  userProfile,
  propRole,
  refreshProfile,
}: {
  userProfile: UserProfile;
  propRole: Role;
  refreshProfile: () => Promise<void>;
}) {
  const role = userProfile.role || propRole;
  const isNonStudentBuyer =
    role === "buyer" && userProfile.accountType === "non-student";
  const isStudentAccount = userProfile.accountType === "student";
  const canChangeEmail = isNonStudentBuyer || role === "admin";
  const showOffered = role === "provider" || role === "both";
  const showNeeded = role === "buyer" || role === "both";
  const showAvailability = role === "provider" || role === "both";
  const serviceCategories = useLookupOptions("serviceCategories");
  const timeSlotOptions = useLookupOptions("availabilityTimeSlots");
  const availabilityOptions = AVAILABILITY_DAYS.flatMap((day) =>
    (timeSlotOptions.length ? timeSlotOptions : [...AVAILABILITY_TIME_SLOTS]).map(
      (slot) => `${day} ${slot}`,
    ),
  );

  const description =
    role === "both"
      ? "Manage your profile details, skills offered/requested, availability, and dashboard security options."
      : isNonStudentBuyer
        ? "Manage your buyer account details, requested services, and dashboard security options."
        : role === "buyer"
          ? "Manage your profile details, skills requested, and dashboard security options."
        : "Manage your profile details, skills offered, availability, and dashboard security options.";

  // Basic profile fields are initialized from the shared auth profile.
  const [name, setName] = useState(userProfile.name || "");
  const [email, setEmail] = useState(userProfile.email || "");
  const [university, setUniversity] = useState(userProfile.university || "");
  const [degree, setDegree] = useState(userProfile.degree || "");
  const [yearOfStudy, setYearOfStudy] = useState(
    userProfile.yearOfStudy || "1st Year",
  );
  const [emailPassword, setEmailPassword] = useState("");
  const [bio, setBio] = useState(userProfile.providerProfile?.bio || "");
  const [profileImageUrl, setProfileImageUrl] = useState(
    userProfile.profileImageUrl || "",
  );
  const [selectedProfileImageFile, setSelectedProfileImageFile] =
    useState<File | null>(null);

  // Provider skills are edited as tags before being saved as one array.
  const [offeredSkills, setOfferedSkills] = useState<string[]>(
    userProfile.providerProfile?.skills || [],
  );
  const [neededSkills, setNeededSkills] = useState<string[]>(
    userProfile.neededSkills || [],
  );
  const [newOfferedSkill, setNewOfferedSkill] = useState("");
  const [newNeededSkill, setNewNeededSkill] = useState("");

  // Availability is stored as a list of selected time slots.
  const [availability, setAvailability] = useState<string[]>(
    userProfile.providerProfile?.availability || [],
  );

  // These switches map directly to the nested Firestore settings object.
  const [emailNotifications, setEmailNotifications] = useState(
    userProfile.settings?.emailNotifications ?? true,
  );
  const [pushNotifications, setPushNotifications] = useState(
    userProfile.settings?.pushNotifications ?? false,
  );
  const [profileVisibility, setProfileVisibility] = useState(
    userProfile.settings?.profileVisibility ?? true,
  );

  // Saving and message state keeps the form feedback clear to the user.
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | "">("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailNotice, setEmailNotice] = useState<"success" | "error" | "">("");
  const [emailNoticeMessage, setEmailNoticeMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profileBadgeLabel = userProfile.verifiedStudentProvider
    ? "Verified Student"
    : isNonStudentBuyer
      ? "Buyer Account"
      : "Student Buyer";
  const profileSubline = isNonStudentBuyer
    ? userProfile.email || "Non-student buyer"
    : [degree, university].filter(Boolean).join(" - ");

  // Build one update payload so Firestore receives an atomic profile change.
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveStatus("");
    setErrorMessage("");

    try {
      const userRef = doc(db, "users", userProfile.uid);
      let nextProfileImageUrl = profileImageUrl;

      if (selectedProfileImageFile) {
        nextProfileImageUrl = await compressImageToBase64(
          selectedProfileImageFile,
        );
      }

      const updates: Record<string, unknown> = {
        name,
        profileImageUrl: nextProfileImageUrl,
        neededSkills,
        settings: {
          emailNotifications,
          pushNotifications,
          profileVisibility,
        },
      };

      if (isStudentAccount) {
        updates.university = university;
        updates.degree = degree;
        updates.yearOfStudy = yearOfStudy;
      }

      // Buyer-only accounts do not have provider fields to update.
      if (showOffered) {
        updates.providerProfile = {
          ...userProfile.providerProfile,
          bio,
          skills: offeredSkills,
          availability,
        };
      }

      await updateDoc(userRef, updates);
      setProfileImageUrl(nextProfileImageUrl);
      setSelectedProfileImageFile(null);
      await refreshProfile();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (err: unknown) {
      setSaveStatus("error");
      const message = err instanceof Error ? err.message : "";
      setErrorMessage(message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!PROFILE_IMAGE_TYPES.has(file.type)) {
      setSaveStatus("error");
      setErrorMessage("Please upload a PNG, JPG, or WEBP image.");
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      setSaveStatus("error");
      setErrorMessage("Profile image must be 2MB or smaller.");
      return;
    }

    setSaveStatus("");
    setErrorMessage("");
    setSelectedProfileImageFile(file);
    setProfileImageUrl(URL.createObjectURL(file));
  };

  const handleUpdateEmail = async () => {
    if (!canChangeEmail) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setEmailNotice("error");
      setEmailNoticeMessage("Enter your new email address first.");
      return;
    }

    if (!emailPassword) {
      setEmailNotice("error");
      setEmailNoticeMessage("Enter your current password to change the email.");
      return;
    }

    setEmailBusy(true);
    setEmailNotice("");
    setEmailNoticeMessage("");

    try {
      await changeSignedInEmail(emailPassword, trimmedEmail);

      const updates: Record<string, unknown> = {
        email: trimmedEmail,
        emailVerified: false,
        updatedAt: serverTimestamp(),
      };

      if (isNonStudentBuyer) {
        updates.accountStatus = "pending_email_verification";
        updates.canBuyServices = false;
      }

      await updateDoc(doc(db, "users", userProfile.uid), updates);
      await refreshProfile();
      setEmail(trimmedEmail);
      setEmailPassword("");
      setEmailNotice("success");
      setEmailNoticeMessage(
        isNonStudentBuyer
          ? "Email updated. Please verify the new address to continue using your buyer account."
          : "Admin email updated. Please verify the new address from your inbox.",
      );
    } catch (err: unknown) {
      setEmailNotice("error");
      setEmailNoticeMessage(
        err instanceof Error ? err.message : "Failed to update email.",
      );
    } finally {
      setEmailBusy(false);
    }
  };

  // Small helpers keep tag and availability updates out of the JSX.
  const addOfferedSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !offeredSkills.includes(trimmed)) {
      setOfferedSkills([...offeredSkills, trimmed]);
    }
    setNewOfferedSkill("");
  };

  const addNeededSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !neededSkills.includes(trimmed)) {
      setNeededSkills([...neededSkills, trimmed]);
    }
    setNewNeededSkill("");
  };

  const toggleAvailability = (slot: string) => {
    if (availability.includes(slot)) {
      setAvailability(availability.filter((s) => s !== slot));
    } else {
      setAvailability([...availability, slot]);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 pb-10">
      {/* Page title and save feedback */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Profile Settings
          </h1>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        {saveStatus === "success" && (
          <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 border border-emerald-200 shadow-sm transition animate-fade-in">
            ✓ Profile saved successfully!
          </div>
        )}
        {saveStatus === "error" && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 border border-red-200 shadow-sm transition">
            ⚠️ {errorMessage}
          </div>
        )}
      </header>

      {/* Profile photo and save action */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-14 w-14 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleProfileImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative block h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow-md ring-1 ring-slate-200"
                aria-label="Change profile image"
                title="Change profile image"
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-500 to-[#2b62e6] text-lg font-bold text-white">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/40 group-hover:opacity-100">
                  <EditIcon className="h-4 w-4" />
                </span>
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{name}</h2>
                <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#62ead8] px-2 py-0.5 text-[10px] font-bold text-teal-800">
                  <BadgeCheckIcon className="h-3.5 w-3.5" />
                  {profileBadgeLabel}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {profileSubline || "Profile details not added yet"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-[#0758d8] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0648b4] disabled:opacity-60 sm:w-auto"
          >
            <SaveIcon className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </section>

      {/* Editable account settings */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(320px,0.92fr)]">
        {/* Basic details, availability, and security */}
        <div className="grid min-w-0 gap-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle
              icon={<UserIcon className="h-4 w-4" />}
              title="Basic Information"
            />

            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                  Full Name
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 min-w-0 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[#0758d8] focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                  Current Email
                  <input
                    type="email"
                    value={userProfile.email}
                    disabled
                    className="h-9 min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-400 outline-none cursor-not-allowed"
                  />
                </label>

                {isStudentAccount ? (
                  <>
                    <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                      University
                      <input
                        type="text"
                        value={university}
                        disabled
                        className="h-9 min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500 outline-none cursor-not-allowed"
                      />
                    </label>

                    <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                      Degree Program
                      <input
                        type="text"
                        value={degree}
                        disabled
                        className="h-9 min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500 outline-none cursor-not-allowed"
                      />
                    </label>

                    <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                      Year of Study
                      <input
                        type="text"
                        value={yearOfStudy}
                        disabled
                        className="h-9 min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500 outline-none cursor-not-allowed"
                      />
                    </label>
                  </>
                ) : null}
              </div>

              {showOffered && (
                <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                  Bio / Expertise Statement
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Describe your skills, what courses you have completed, and what you can help other students learn."
                    className="resize-none rounded-md border border-slate-300 px-3 py-2 text-xs font-medium leading-relaxed text-slate-800 outline-none transition focus:border-[#0758d8] focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              )}
            </div>
          </section>

          {showAvailability && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <SectionTitle
                icon={<CalendarIcon className="h-4 w-4" />}
                title="Weekly Availability"
              />

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {availabilityOptions.map((slot) => {
                  const isChecked = availability.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleAvailability(slot)}
                      className={`relative flex h-10 cursor-pointer items-center justify-center overflow-hidden rounded-xl border px-3 py-1.5 shadow-xs transition ${
                        isChecked
                          ? "border-[#0758d8] bg-blue-50/50 text-[#0758d8]"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute right-2 top-2.5 flex h-3.5 w-3.5 items-center justify-center rounded border text-white ${
                          isChecked
                            ? "border-[#0758d8] bg-[#0758d8]"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <CheckIcon className="h-2.5 w-2.5" />}
                      </span>
                      <span className="text-xs font-bold tracking-wide">
                        {slot}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <LoginSecurity
            canChangeEmail={canChangeEmail}
            email={email}
            emailPassword={emailPassword}
            emailBusy={emailBusy}
            emailNotice={emailNotice}
            emailNoticeMessage={emailNoticeMessage}
            onEmailChange={setEmail}
            onEmailPasswordChange={setEmailPassword}
            onUpdateEmail={handleUpdateEmail}
          />
        </div>

        {/* Skills, notifications, privacy, and account removal */}
        <div className="grid min-w-0 gap-5 self-start">
          {showOffered && (
            <section className="min-w-0 rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xs font-semibold text-slate-800">
                  Skills I Can Offer
                </h2>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type skill & press Enter"
                  value={newOfferedSkill}
                  onChange={(e) => setNewOfferedSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOfferedSkill(newOfferedSkill);
                    }
                  }}
                  className="h-8 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-[#0758d8]"
                />
                <button
                  type="button"
                  onClick={() => addOfferedSkill(newOfferedSkill)}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-[#0758d8] px-3 text-[10px] font-bold text-white hover:bg-[#0648b4]"
                >
                  Add
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {offeredSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() =>
                      setOfferedSkills(offeredSkills.filter((s) => s !== skill))
                    }
                    className="inline-flex max-w-full items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 group"
                    title="Click to remove"
                  >
                    <span className="truncate">
                      {skill}{" "}
                      <span className="text-emerald-500/80 group-hover:text-emerald-700 ml-0.5">
                        ×
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick suggestions */}
              <div className="mt-3 border-t border-slate-100 pt-2.5">
                <p className="text-[9px] uppercase font-bold text-slate-400">
                  Suggestions:
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {serviceCategories.filter(
                    (s) => !offeredSkills.includes(s),
                  ).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addOfferedSkill(s)}
                      className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[9px] text-slate-500 hover:border-[#0758d8] hover:text-[#0758d8]"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Keep the buyer "Skills I Need" editor hidden for now.
          {showNeeded && (
            <section className="min-w-0 rounded-xl border border-slate-200 border-l-4 border-l-[#0758d8] bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xs font-semibold text-slate-800">
                  Skills I Need
                </h2>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type skill & press Enter"
                  value={newNeededSkill}
                  onChange={(e) => setNewNeededSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addNeededSkill(newNeededSkill);
                    }
                  }}
                  className="h-8 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-[#0758d8]"
                />
                <button
                  type="button"
                  onClick={() => addNeededSkill(newNeededSkill)}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-[#0758d8] px-3 text-[10px] font-bold text-white hover:bg-[#0648b4]"
                >
                  Add
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {neededSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() =>
                      setNeededSkills(neededSkills.filter((s) => s !== skill))
                    }
                    className="inline-flex max-w-full items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-[#2f66e7] transition hover:bg-blue-200 group"
                    title="Click to remove"
                  >
                    <span className="truncate">
                      {skill}{" "}
                      <span className="text-blue-500/80 group-hover:text-blue-800 ml-0.5">
                        ×
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          */}

          {/* Keep the notification settings card hidden for now.
          <NotificationSettings
            emailNotifications={emailNotifications}
            pushNotifications={pushNotifications}
            onEmailNotificationsChange={setEmailNotifications}
            onPushNotificationsChange={setPushNotifications}
          />
          */}
          <PrivacySettings
            profileVisibility={profileVisibility}
            onProfileVisibilityChange={setProfileVisibility}
          />
          <DangerZone />
        </div>
      </div>
    </div>
  );
}

function LoginSecurity({
  canChangeEmail,
  email,
  emailPassword,
  emailBusy,
  emailNotice,
  emailNoticeMessage,
  onEmailChange,
  onEmailPasswordChange,
  onUpdateEmail,
}: {
  canChangeEmail: boolean;
  email: string;
  emailPassword: string;
  emailBusy: boolean;
  emailNotice: "success" | "error" | "";
  emailNoticeMessage: string;
  onEmailChange: (value: string) => void;
  onEmailPasswordChange: (value: string) => void;
  onUpdateEmail: () => Promise<void>;
}) {
  const { firebaseUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<
    "success" | "error" | ""
  >("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strongPasswordMessage =
    "Use a strong password with at least 6 characters, including uppercase, lowercase, a number, and a symbol.";
  const isStrongPassword = (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(value);

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleUpdatePassword = async () => {
    setPasswordStatus("");
    setPasswordMessage("");

    if (!firebaseUser?.email) {
      setPasswordStatus("error");
      setPasswordMessage("No signed-in email account was found.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus("error");
      setPasswordMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6 || !isStrongPassword(newPassword)) {
      setPasswordStatus("error");
      setPasswordMessage(strongPasswordMessage);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordMessage("New password and confirmation do not match.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      resetPasswordForm();
      setPasswordStatus("success");
      setPasswordMessage("Password updated successfully.");
    } catch (err: unknown) {
      setPasswordStatus("error");
      setPasswordMessage(
        err instanceof Error
          ? err.message
          : "Failed to update password. Please try again.",
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 border-t-4 border-t-[#0758d8] bg-white p-5">
      <SectionTitle
        icon={<LockIcon className="h-4 w-4" />}
        title="Login & Security"
      />

      <div className="mt-4 grid gap-5">
        {canChangeEmail ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-slate-800">Change Email</h3>
              <p className="text-[11px] font-medium leading-relaxed text-slate-500">
                Update your account email and verify the new address from your inbox.
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                New Email Address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  className="h-9 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[#0758d8] focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                Current Password
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(event) => onEmailPasswordChange(event.target.value)}
                  className="h-9 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[#0758d8] focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            {emailNotice ? (
              <p
                className={`mt-4 rounded-md px-3 py-2 text-xs font-semibold ${
                  emailNotice === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {emailNoticeMessage}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void onUpdateEmail()}
                disabled={emailBusy}
                className="inline-flex h-9 min-w-[148px] items-center justify-center rounded-md bg-[#0758d8] px-4 text-xs font-bold text-white transition hover:bg-[#0648b4] disabled:opacity-60"
              >
                {emailBusy ? "Updating Email..." : "Update Email"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-slate-800">Change Password</h3>
            <p className="text-[11px] font-medium leading-relaxed text-slate-500">
              Keep your account secure with a strong new password.
            </p>
          </div>

          <form className="mt-4 grid gap-4">
            <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-slate-600">
              Current Password
              <div className="flex h-9 items-center justify-between rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-[#0758d8] focus-within:ring-4 focus-within:ring-blue-100">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showCurrent ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-slate-600">
                New Password
                <div className="flex h-9 items-center justify-between rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-[#0758d8] focus-within:ring-4 focus-within:ring-blue-100">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNew ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-slate-600">
                Confirm New
                <div className="flex h-9 items-center justify-between rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-[#0758d8] focus-within:ring-4 focus-within:ring-blue-100">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </label>
            </div>

            <p className="text-[11px] font-medium leading-[1.45] text-slate-500">
              {strongPasswordMessage}
            </p>

            {passwordMessage && (
              <p
                className={`rounded-md px-3 py-2 text-xs font-semibold ${
                  passwordStatus === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {passwordMessage}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword}
                className="inline-flex h-9 min-w-[148px] items-center justify-center rounded-md bg-[#0758d8] px-4 text-xs font-bold text-white transition hover:bg-[#0648b4] disabled:opacity-60"
              >
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function NotificationSettings({
  emailNotifications,
  pushNotifications,
  onEmailNotificationsChange,
  onPushNotificationsChange,
}: {
  emailNotifications: boolean;
  pushNotifications: boolean;
  onEmailNotificationsChange: (checked: boolean) => void;
  onPushNotificationsChange: (checked: boolean) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <SectionTitle
        icon={<BellIcon className="h-4 w-4" />}
        title="Notifications"
      />

      <div className="mt-4 grid gap-4">
        <ToggleRow
          title="Email Notifications"
          description="Weekly summaries and messages"
          checked={emailNotifications}
          onChange={onEmailNotificationsChange}
        />
        <ToggleRow
          title="System Notifications"
          description="Real-time alerts for matches & swaps"
          checked={pushNotifications}
          onChange={onPushNotificationsChange}
        />
      </div>
    </section>
  );
}

function PrivacySettings({
  profileVisibility,
  onProfileVisibilityChange,
}: {
  profileVisibility: boolean;
  onProfileVisibilityChange: (checked: boolean) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <SectionTitle icon={<EyeIcon className="h-4 w-4" />} title="Privacy" />

      <div className="mt-4">
        <ToggleRow
          title="Profile Visibility"
          description="Allow non-members to view your profile"
          checked={profileVisibility}
          onChange={onProfileVisibilityChange}
          color="teal"
        />
      </div>

      <div className="mt-4 flex gap-2.5 rounded-md border border-teal-100 bg-teal-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-teal-700">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Making your profile public helps potential external mentors find you,
          but restricts personal contact details until a swap is accepted.
        </p>
      </div>
    </section>
  );
}

function DangerZone() {
  return (
    <section className="rounded-xl border border-red-200 bg-red-50/50 p-5">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xs font-bold text-red-700">Danger Zone</h2>
          <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">
            Permanently deactivate your account. This action is irreversible and
            all your data, including swap history, will be removed.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="h-9 w-full rounded-md bg-red-200 text-red-400 border border-red-200 cursor-not-allowed px-4 text-xs font-bold"
        >
          Deactivate Account
        </button>
      </div>
    </section>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
      <span className="text-[#0758d8]">{icon}</span>
      {title}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  color = "blue",
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: "blue" | "teal";
}) {
  const checkedColor =
    color === "teal"
      ? "peer-checked:bg-[#62ead8]"
      : "peer-checked:bg-[#0758d8]";

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-xs font-bold text-slate-900">{title}</span>
        <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
          {description}
        </span>
      </span>
      {/* checkbox must directly precede the visual pill for peer-checked: to work */}
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`block h-5 w-9 rounded-full bg-slate-300 p-0.5 transition peer-checked:after:translate-x-4 ${checkedColor} after:block after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition after:content-['']`}
        />
      </span>
    </label>
  );
}

type IconProps = {
  className?: string;
};

function UserIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M4 20c1.7-3 5-4.5 8-4.5s6.3 1.5 8 4.5" />
    </svg>
  );
}

function SaveIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 4h12l2 2v14H5z" />
      <path d="M8 4v6h8V4" />
      <path d="M8 17h8" />
    </svg>
  );
}

function BadgeCheckIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3l2 2.2 3-.3.8 2.9 2.6 1.5-1.3 2.7 1.3 2.7-2.6 1.5-.8 2.9-3-.3-2 2.2-2-2.2-3 .3-.8-2.9-2.6-1.5L4.9 12 3.6 9.3l2.6-1.5.8-2.9 3 .3z" />
      <path d="M8.5 12.2l2.2 2.2 4.8-5" />
    </svg>
  );
}

function LockIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M6 10h12v10H6z" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M15 17H9m8-4V9a5 5 0 0 0-10 0v4l-2 2h14z" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </svg>
  );
}

function EyeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function InfoIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function EditIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L8 20l-5 1 1-5Z" />
    </svg>
  );
}
