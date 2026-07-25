"use client";

import { useState, type ReactNode } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { changeSignedInEmail } from "@/lib/auth";
import { db } from "@/lib/firebase";

const strongPasswordMessage =
  "Use at least 6 characters with uppercase, lowercase, a number, and a symbol.";

function isStrongPassword(value: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(value);
}

export default function AdminSettings() {
  const { firebaseUser, userProfile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.name || "");
  const [adminEmail, setAdminEmail] = useState(userProfile?.email || "");
  const [emailPassword, setEmailPassword] = useState("");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameNotice, setNameNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailNotice, setEmailNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const saveDisplayName = async () => {
    if (!userProfile) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setNameNotice({ type: "error", text: "Enter the admin display name first." });
      return;
    }

    setNameBusy(true);
    setNameNotice(null);

    try {
      await updateDoc(doc(db, "users", userProfile.uid), {
        name: trimmedName,
      });
      setDisplayName(trimmedName);
      await refreshProfile();
      setNameNotice({ type: "success", text: "Admin name updated." });
    } catch (error) {
      console.error("Error updating admin name:", error);
      setNameNotice({ type: "error", text: "Could not update the admin name." });
    } finally {
      setNameBusy(false);
    }
  };

  const saveAdminEmail = async () => {
    if (!userProfile) return;

    const trimmedEmail = adminEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setEmailNotice({ type: "error", text: "Enter the admin email first." });
      return;
    }

    if (!emailPassword) {
      setEmailNotice({ type: "error", text: "Enter the current password to change the admin email." });
      return;
    }

    setEmailBusy(true);
    setEmailNotice(null);

    try {
      await changeSignedInEmail(emailPassword, trimmedEmail);
      await updateDoc(doc(db, "users", userProfile.uid), {
        email: trimmedEmail,
        emailVerified: false,
        updatedAt: serverTimestamp(),
      });
      setAdminEmail(trimmedEmail);
      await refreshProfile();
      setEmailPassword("");
      setEmailNotice({ type: "success", text: "Admin email updated. Please verify the new email from your inbox." });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not update the admin email.";
      setEmailNotice({ type: "error", text: message });
    } finally {
      setEmailBusy(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordNotice(null);

    if (!firebaseUser?.email) {
      setPasswordNotice({ type: "error", text: "No signed-in admin email was found." });
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordNotice({ type: "error", text: "Please fill in all password fields." });
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setPasswordNotice({ type: "error", text: strongPasswordMessage });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setPasswordBusy(true);

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice({ type: "success", text: "Password updated successfully." });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update password.";
      setPasswordNotice({ type: "error", text: message });
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-900">Admin Settings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage the admin account profile and security settings.
          </p>
        </div>

        <section>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Admin Account Settings</h2>
            <div className="mt-4 border-t border-slate-200 pt-4">
              {nameNotice ? (
                <Notice tone={nameNotice.type}>{nameNotice.text}</Notice>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Admin Name">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
                  />
                </Field>
                <Field label="Admin Email">
                  <input
                    type="email"
                    value={adminEmail}
                    readOnly
                    className="h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                  />
                </Field>
                <Field label="Role">
                  <input
                    type="text"
                    value="Admin"
                    readOnly
                    className="h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none"
                  />
                </Field>
                <Field label="Account Status">
                  <input
                    type="text"
                    value={(userProfile?.accountStatus || "active").replace(/_/g, " ")}
                    readOnly
                    className="h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold capitalize text-slate-700 outline-none"
                  />
                </Field>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={saveDisplayName}
                  disabled={nameBusy}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-[#2f66e7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2356cb] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {nameBusy ? "Saving..." : "Save Name"}
                </button>
              </div>
            </div>
          </article>
        </section>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Password Change</h2>
          <div className="mt-4 border-t border-slate-200 pt-4">
            {passwordNotice ? (
              <Notice tone={passwordNotice.type}>{passwordNotice.text}</Notice>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-3">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                visible={showCurrent}
                onToggle={() => setShowCurrent((value) => !value)}
                autoComplete="current-password"
              />
              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                visible={showNew}
                onToggle={() => setShowNew((value) => !value)}
                autoComplete="new-password"
              />
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirm}
                onToggle={() => setShowConfirm((value) => !value)}
                autoComplete="new-password"
              />
            </div>

            <p className="mt-3 text-xs text-slate-500">{strongPasswordMessage}</p>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={passwordBusy}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-[#2f66e7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2356cb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordBusy ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Admin Email Change</h2>
          <div className="mt-4 border-t border-slate-200 pt-4">
            {emailNotice ? (
              <Notice tone={emailNotice.type}>{emailNotice.text}</Notice>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <Field label="New Admin Email">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
                />
              </Field>
              <PasswordField
                label="Current Password"
                value={emailPassword}
                onChange={setEmailPassword}
                visible={showEmailPassword}
                onToggle={() => setShowEmailPassword((value) => !value)}
                autoComplete="current-password"
              />
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={saveAdminEmail}
                disabled={emailBusy}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-[#2f66e7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2356cb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emailBusy ? "Updating Email..." : "Update Email"}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="flex h-11 items-center rounded-lg border border-slate-200 px-3 focus-within:border-[#2f66e7] focus-within:ring-4 focus-within:ring-blue-100">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-sm text-slate-700 outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="ml-2 cursor-pointer text-slate-400 transition hover:text-slate-600"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}

function Notice({ tone, children }: { tone: "success" | "error"; children: string }) {
  return (
    <div
      className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {children}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
