import Image from "next/image";
import type { ReactNode } from "react";

const offeredSkills = ["Graphic Design", "Python", "Web Dev", "Tutoring"];
const neededSkills = ["Java", "UI/UX", "Research Writing", "Assignment Formatting"];
const weekDays = [
  { key: "MON", enabled: true },
  { key: "TUE", enabled: true },
  { key: "WED", enabled: true },
  { key: "THU", enabled: false },
  { key: "FRI", enabled: true },
  { key: "SAT", enabled: false },
  { key: "SUN", enabled: false },
];

export type Role = "buyer" | "provider" | "both";

export default function ProfileSettings({ role }: { role: Role }) {
  const showOffered = role === "provider" || role === "both";
  const showNeeded = role === "buyer" || role === "both";
  const showAvailability = role === "provider" || role === "both";

  const description =
    role === "both"
      ? "Manage your profile details, skills offered/requested, availability, and dashboard security options."
      : role === "buyer"
      ? "Manage your profile details, skills requested, and dashboard security options."
      : "Manage your profile details, skills offered, availability, and dashboard security options.";

  return (
    <div className="flex w-full flex-col gap-8 pb-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Profile Settings</h1>
        <p className="mt-2 text-base text-slate-600">{description}</p>
      </header>

      <ProfileHeader />

      {/* Main Settings Grid */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Left Column */}
        <div className="grid gap-6">
          <BasicInformation />
          {showAvailability && <WeeklyAvailability />}
          <LoginSecurity />
        </div>

        {/* Right Column */}
        <div className="grid gap-6">
          {showOffered && <SkillsOffered />}
          {showNeeded && <SkillsNeeded />}
          <NotificationSettings />
          <PrivacySettings />
          <DangerZone />
        </div>
      </div>
    </div>
  );
}

function ProfileHeader() {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)] md:px-10 md:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md ring-1 ring-slate-200">
              <Image
                src="/img/02.jpg"
                alt="Alex Rivera"
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            </div>
            <button
              type="button"
              aria-label="Change profile photo"
              className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0758d8] text-white shadow-sm transition hover:bg-[#0648b4]"
            >
              <EditIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900">Alex Rivera</h1>
              <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#62ead8] px-4 py-1 text-sm font-semibold text-teal-800">
                <BadgeCheckIcon className="h-4 w-4" />
                Verified Student
              </span>
            </div>
            <p className="mt-2 text-base font-medium text-slate-500">
              Computer Science - Stanford University
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <StarIcon className="h-5 w-5 fill-emerald-600 text-emerald-600" />
              <span className="font-semibold text-emerald-700">4.9</span>
              <span className="font-medium text-slate-500">(128 reviews)</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-[#0758d8] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0648b4] sm:w-auto"
        >
          <SaveIcon className="h-5 w-5" />
          Save Profile
        </button>
      </div>
    </section>
  );
}

function BasicInformation() {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <SectionTitle icon={<UserIcon className="h-5 w-5" />} title="Basic Information" />

      <form className="mt-6 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full Name" defaultValue="Alex Rivera" />
          
          <label className="grid gap-2 text-sm font-medium text-slate-600">
            Current Email
            <div className="flex min-w-0 overflow-hidden rounded-md border border-slate-300 bg-[#f1f4ff] focus-within:border-[#0758d8] focus-within:ring-4 focus-within:ring-blue-100">
              <input
                type="email"
                defaultValue="alex.rivera@stanford.edu"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base font-medium text-slate-800 outline-none"
              />
              <button
                type="button"
                className="min-w-20 shrink-0 border-l border-slate-300 px-4 text-sm font-semibold text-[#0758d8] transition hover:bg-blue-50 hover:text-[#0648b4]"
              >
                Change
              </button>
            </div>
          </label>

          <Field label="University" defaultValue="Stanford University" />
          <Field label="Degree Program" defaultValue="B.Sc. Computer Science" />

          <label className="grid gap-2 text-sm font-medium text-slate-600">
            Year of Study
            <select
              defaultValue="Junior"
              className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base font-medium text-slate-800 outline-none transition focus:border-[#0758d8] focus:ring-4 focus:ring-blue-100"
            >
              <option>Freshman</option>
              <option>Sophomore</option>
              <option>Junior</option>
              <option>Senior</option>
              <option>Graduate</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-600">
          Bio
          <textarea
            defaultValue="Passionate developer and UI designer. I love helping fellow students grasp Python fundamentals while looking to improve my Java skills for my upcoming software engineering internship."
            rows={5}
            className="resize-none rounded-md border border-slate-300 px-4 py-3 text-base font-medium leading-6 text-slate-800 outline-none transition focus:border-[#0758d8] focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </form>
    </section>
  );
}

function SkillsOffered() {
  return (
    <section className="h-fit rounded-xl border border-slate-100 border-l-4 border-l-emerald-600 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-800">Skills I Can Offer</h2>
        <button
          type="button"
          aria-label="Add offered skill"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#0758d8] transition hover:bg-blue-50"
        >
          <PlusCircleIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {offeredSkills.map((skill) => (
          <button
            key={skill}
            type="button"
            className="inline-flex max-w-full items-center rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
          >
            <span className="truncate">{skill} x</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SkillsNeeded() {
  return (
    <section className="h-fit rounded-xl border border-slate-100 border-l-4 border-l-[#0758d8] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-800">Skills I Need</h2>
        <button
          type="button"
          aria-label="Add needed skill"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#0758d8] transition hover:bg-blue-50"
        >
          <PlusCircleIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {neededSkills.map((skill) => (
          <button
            key={skill}
            type="button"
            className="inline-flex max-w-full items-center rounded-full bg-blue-100 px-3 py-1.5 text-sm font-semibold text-[#2f66e7] transition hover:bg-blue-200"
          >
            <span className="truncate">{skill} x</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function WeeklyAvailability() {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <SectionTitle icon={<CalendarIcon className="h-5 w-5" />} title="Weekly Availability" />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7">
        {weekDays.map((day) => (
          <label
            key={day.key}
            className="relative flex h-[74px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-3 py-2 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:shadow-[0_10px_22px_rgba(15,23,42,0.1)]"
          >
            <input type="checkbox" defaultChecked={day.enabled} className="peer sr-only" />
            <span className="absolute right-3 top-2.5 flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white text-transparent transition peer-checked:border-[#0758d8] peer-checked:bg-[#0758d8] peer-checked:text-white">
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
            <span className="mt-4 text-lg font-bold tracking-wide text-slate-700 transition peer-checked:text-[#0758d8]">
              {day.key}
            </span>
            <span className="absolute bottom-0 left-0 h-1 w-full bg-slate-200 transition peer-checked:bg-[#0758d8]" />
          </label>
        ))}
      </div>
    </section>
  );
}

function LoginSecurity() {
  return (
    <section className="min-h-[310px] rounded-xl border border-slate-100 border-t-4 border-t-[#0758d8] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <SectionTitle icon={<LockIcon className="h-5 w-5" />} title="Login & Security" />

      <form className="mt-6 grid gap-5">
        <Field label="Current Password" type="password" defaultValue="password" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Field label="New Password" type="password" />
          <Field label="Confirm New" type="password" />
        </div>
        <button
          type="button"
          className="h-11 rounded-md bg-blue-100 px-4 text-sm font-semibold text-[#0758d8] transition hover:bg-blue-200"
        >
          Update Password
        </button>
      </form>
    </section>
  );
}

function NotificationSettings() {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <SectionTitle icon={<BellIcon className="h-5 w-5" />} title="Notifications" />

      <div className="mt-6 grid gap-5">
        <ToggleRow
          title="Email Notifications"
          description="Weekly summaries and messages"
          checked
        />
        <ToggleRow
          title="Push Notifications"
          description="Real-time alerts for skill matches"
        />
      </div>
    </section>
  );
}

function PrivacySettings() {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <SectionTitle icon={<EyeIcon className="h-5 w-5" />} title="Privacy" />

      <div className="mt-6">
        <ToggleRow
          title="Profile Visibility"
          description="Allow non-members to view your profile"
          checked
          color="teal"
        />
      </div>

      <div className="mt-5 flex gap-3 rounded-md border border-teal-100 bg-teal-50 px-4 py-4 text-sm font-medium leading-6 text-teal-700">
        <InfoIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Making your profile public helps potential external mentors find you, but
          restricts personal contact details until a swap is accepted.
        </p>
      </div>
    </section>
  );
}

function DangerZone() {
  return (
    <section className="rounded-xl border border-red-200 bg-red-50/50 p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
            Permanently deactivate your account. This action is irreversible and all your
            data, including swap history, will be removed.
          </p>
        </div>
        <button
          type="button"
          className="h-11 w-full rounded-md bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
        >
          Deactivate Account
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  type = "text",
  defaultValue = "",
}: {
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-600">
      {label}
      <input
        type={type}
        defaultValue={defaultValue}
        className="h-12 min-w-0 rounded-md border border-slate-300 px-4 text-base font-medium text-slate-800 outline-none transition focus:border-[#0758d8] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
      <span className="text-[#0758d8]">{icon}</span>
      {title}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked = false,
  color = "blue",
}: {
  title: string;
  description: string;
  checked?: boolean;
  color?: "blue" | "teal";
}) {
  const checkedColor =
    color === "teal" ? "peer-checked:bg-[#62ead8]" : "peer-checked:bg-[#0758d8]";

  return (
    <label className="flex items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block text-sm font-medium text-slate-500">
          {description}
        </span>
      </span>
      <input type="checkbox" defaultChecked={checked} className="peer sr-only" />
      <span
        className={`h-6 w-11 shrink-0 rounded-full bg-slate-300 p-1 transition after:block after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition after:content-[''] peer-checked:after:translate-x-5 ${checkedColor}`}
      />
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

function EditIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M14 7l3 3" />
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

function StarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9z" />
    </svg>
  );
}

function PlusCircleIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
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
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
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
