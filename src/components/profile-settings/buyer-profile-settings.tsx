import Image from "next/image";
import type { ReactNode } from "react";

const neededSkills = ["Java", "UI/UX", "Research Writing", "Assignment Formatting"];

export default function BuyerProfileSettings() {
  return (
    <div className="flex w-full max-w-[880px] flex-col gap-7 pb-10">
      <ProfileHeader />

      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <BasicInformation />
        <SkillsNeeded />
      </section>

      <section>
        <div className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900">
          <DashboardIcon className="h-5 w-5 text-[#0758d8]" />
          Account Dashboard
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,1fr)]">
          <LoginSecurity />
          <div className="grid gap-6">
            <NotificationSettings />
            <PrivacySettings />
          </div>
        </div>
      </section>

      <DangerZone />
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
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
          <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-600">
            Permanently deactivate your account. This action is irreversible and all your
            data, including swap history, will be removed.
          </p>
        </div>
        <button
          type="button"
          className="min-h-12 w-full shrink-0 rounded-md bg-red-700 px-8 py-3 text-sm font-semibold leading-5 text-white transition hover:bg-red-800 sm:w-auto md:max-w-44"
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
  const checkedColor = color === "teal" ? "peer-checked:bg-[#62ead8]" : "peer-checked:bg-[#0758d8]";

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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M4 20c1.7-3 5-4.5 8-4.5s6.3 1.5 8 4.5" />
    </svg>
  );
}

function SaveIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 4h12l2 2v14H5z" />
      <path d="M8 4v6h8V4" />
      <path d="M8 17h8" />
    </svg>
  );
}

function EditIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M14 7l3 3" />
    </svg>
  );
}

function BadgeCheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function DashboardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v7h-7z" />
      <path d="M4 13h7v7H4z" />
      <path d="M13 13h3v3h4v4h-7z" />
    </svg>
  );
}

function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 10h12v10H6z" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M15 17H9m8-4V9a5 5 0 0 0-10 0v4l-2 2h14z" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </svg>
  );
}

function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function InfoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}
