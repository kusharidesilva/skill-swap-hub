"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  getAdminReportStatus,
  isPendingAdminReport,
  isRejectedAdminReport,
  isResolvedAdminReport,
  normalizeAdminRole,
} from "@/lib/admin-panel";
import { createNotification } from "@/lib/notifications";
import { formatRatingLabel } from "@/lib/ratings";
import { isRole, scopedHref } from "@/lib/role-routes";
import SelectField from "@/components/ui/select-field";
import ModalPortal from "@/components/ui/modal-portal";

type TimestampLike =
  | { toDate?: () => Date; toMillis?: () => number }
  | Date
  | string
  | number
  | null
  | undefined;

type ManagedUser = {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  profileImageUrl?: string;
  role?: string;
  accountType?: string;
  accountStatus?: string;
  providerVerificationStatus?: string;
  university?: string;
  degree?: string;
  yearOfStudy?: string;
  createdAt?: TimestampLike;
  averageRating?: number | string;
  rating?: number | string;
  totalReviews?: number;
  providerProfile?: {
    skills?: string[];
    servicesOffered?: string[];
  };
};

type ReportRecord = {
  id: string;
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  targetUserId?: string;
  targetUserName?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  issueType?: string;
  category?: string;
  description?: string;
  status?: string;
  adminNeedsReview?: boolean;
  createdAt?: TimestampLike;
  adminNote?: string;
};

function notificationHrefForRole(role?: string) {
  const normalizedRole = normalizeAdminRole(role);
  return isRole(normalizedRole) ? scopedHref("/notifications", normalizedRole) : "/notifications";
}

const accountFilters = ["All Statuses", "Active", "Pending Verification", "Suspended"];
const verificationFilters = ["All Verifications", "Approved", "Pending", "Rejected", "Verified"];
const roleFilters = ["All Roles", "Buyer", "Provider", "Both", "Admin"];
const typeFilters = ["All Types", "Student", "Non-student"];
const USERS_PER_PAGE = 6;

export default function AdminUserManagement() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(roleFilters[0]);
  const [typeFilter, setTypeFilter] = useState(typeFilters[0]);
  const [accountFilter, setAccountFilter] = useState(accountFilters[0]);
  const [verificationFilter, setVerificationFilter] = useState(verificationFilters[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState("");
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [selectedUserReports, setSelectedUserReports] = useState<ManagedUser | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<ManagedUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const nextUsers = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ManagedUser, "id">),
          }))
          .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));

        setUsers(nextUsers);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading users:", error);
        setNotice({ type: "error", text: "Could not load users from Firestore." });
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "reports"),
      (snapshot) => {
        const nextReports = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ReportRecord, "id">),
          }))
          .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));

        setReports(nextReports);
      },
      (error) => {
        console.error("Error loading reports:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        [user.name, user.email, user.university, user.degree, user.role]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      const accountStatus = normalizeStatus(user.accountStatus || "active");
      const matchesAccount =
        accountFilter === "All Statuses" ||
        (normalizeStatus(accountFilter) === "pending_verification"
          ? accountStatus.startsWith("pending")
          : accountStatus === normalizeStatus(accountFilter));

      const role = normalizeAdminRole(user.role || "buyer");
      const matchesRole =
        roleFilter === "All Roles" ||
        (normalizeAdminRole(roleFilter) === "buyer" && (role === "buyer" || role === "both")) ||
        (normalizeAdminRole(roleFilter) === "provider" && (role === "provider" || role === "both")) ||
        role === normalizeAdminRole(roleFilter);

      const accountType = normalizeStatus(user.accountType || "");
      const matchesType =
        typeFilter === "All Types" ||
        accountType === normalizeStatus(typeFilter).replace("_", "-") ||
        accountType === normalizeStatus(typeFilter);

      const verificationStatus = normalizeStatus(user.providerVerificationStatus || "not_required");
      const matchesVerification =
        verificationFilter === "All Verifications" ||
        (normalizeStatus(verificationFilter) === "verified" && verificationStatus === "not_required") ||
        verificationStatus === normalizeStatus(verificationFilter);

      return matchesSearch && matchesRole && matchesType && matchesAccount && matchesVerification;
    });
  }, [accountFilter, roleFilter, searchTerm, typeFilter, users, verificationFilter]);

  const activeUsers = users.filter((user) => normalizeStatus(user.accountStatus || "active") === "active");
  const pendingUsers = users.filter(
    (user) => normalizeStatus(user.accountStatus || "").startsWith("pending"),
  );
  const suspendedUsers = users.filter((user) => normalizeStatus(user.accountStatus || "") === "suspended");
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, typeFilter, accountFilter, verificationFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleAccountStatus = async (
    user: ManagedUser,
    nextStatus: "active" | "suspended",
    reason = "",
  ) => {
    const targetUserId = user.uid || user.id;

    if (targetUserId === userProfile?.uid && nextStatus === "suspended") {
      setNotice({ type: "error", text: "You cannot suspend your own admin account." });
      return;
    }

    setBusyUserId(`${targetUserId}-${nextStatus}`);
    setNotice(null);

    try {
      await updateDoc(doc(db, "users", targetUserId), {
        accountStatus: nextStatus,
        adminSuspensionReason: nextStatus === "suspended" ? reason.trim() : "",
        suspensionCode: nextStatus === "suspended" ? "admin_action" : "",
        suspensionTitle: nextStatus === "suspended" ? "Your account has been suspended by an admin" : "",
        suspensionReason:
          nextStatus === "suspended"
            ? reason.trim() || "Your account was suspended by an admin."
            : "",
        suspensionReportId: "",
        suspensionRequestId: "",
        suspendedAt: nextStatus === "suspended" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });

      if (targetUserId !== userProfile?.uid) {
        const trimmedReason = reason.trim();
        await createNotification({
          userId: targetUserId,
          title: nextStatus === "active" ? "Account activated" : "Account suspended",
          description:
            nextStatus === "active"
              ? "Your Skill Swap Hub account is active again."
              : trimmedReason
                ? `Your Skill Swap Hub account has been suspended by admin. Reason: ${trimmedReason}`
                : "Your Skill Swap Hub account has been suspended by admin.",
          type: "system",
          icon: nextStatus === "active" ? "check-circle" : "alert-triangle",
          tone: nextStatus === "active" ? "emerald" : "red",
          href: notificationHrefForRole(user.role),
          destination: notificationHrefForRole(user.role),
        });
      }

      setNotice({
        type: "success",
        text: `${user.name || user.email || "User"} is now ${nextStatus}.`,
      });
    } catch (error) {
      console.error("Error updating account status:", error);
      setNotice({ type: "error", text: "Could not update the account status." });
    } finally {
      setBusyUserId("");
    }
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Role", "Account Type", "Account Status", "Verification", "Created"];
    const rows = filteredUsers.map((user) => [
      user.name || "",
      user.email || "",
      roleLabel(user.role),
      accountTypeLabel(user.accountType),
      accountStatusLabel(user.accountStatus),
      verificationLabel(user.providerVerificationStatus),
      formatDate(user.createdAt),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "skill-swap-users.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const reportsForUser = useMemo(() => {
    if (!selectedUserReports) return [];

    const targetUserId = selectedUserReports.uid || selectedUserReports.id;
    const normalizedName = (selectedUserReports.name || "").trim().toLowerCase();

    return reports.filter((report) => {
      const reportTargetId = report.targetUserId || report.reportedUserId;
      const reportTargetName = (report.targetUserName || report.reportedUserName || "").trim().toLowerCase();

      return reportTargetId === targetUserId || (!!normalizedName && reportTargetName === normalizedName);
    });
  }, [reports, selectedUserReports]);

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    await handleAccountStatus(suspendTarget, "suspended", suspendReason);
    setSuspendTarget(null);
    setSuspendReason("");
  };

  return (
    <div className="px-6 py-10">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-900">User Management</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage buyers, providers, pending students, and admin accounts from the users table.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <DownloadIcon />
          Export CSV
        </button>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <StatCard label="Active Users" value={activeUsers.length} tone="blue" />
        <StatCard label="Pending Students" value={pendingUsers.length} tone="amber" />
        <StatCard label="Suspended Users" value={suspendedUsers.length} tone="rose" />
      </section>

      {notice ? (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr_0.8fr_1fr_1fr_auto]">
          <Field label="Search Users">
            <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-slate-500 shadow-sm">
              <SearchIcon />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Name, email, role..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </Field>

          <SelectField
            label="Role"
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleFilters}
            title="Filter by role"
            wrapperClassName="min-w-0"
            labelClassName="mb-0 text-sm font-medium text-slate-600"
            className="h-12 rounded-xl border-slate-200 px-4 text-sm font-medium text-slate-700 shadow-sm"
          />

          <SelectField
            label="User Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeFilters}
            title="Filter by user type"
            wrapperClassName="min-w-0"
            labelClassName="mb-0 text-sm font-medium text-slate-600"
            className="h-12 rounded-xl border-slate-200 px-4 text-sm font-medium text-slate-700 shadow-sm"
          />

          <SelectField
            label="Account Status"
            value={accountFilter}
            onChange={setAccountFilter}
            options={accountFilters}
            title="Filter by account status"
            wrapperClassName="min-w-0"
            labelClassName="mb-0 text-sm font-medium text-slate-600"
            className="h-12 rounded-xl border-slate-200 px-4 text-sm font-medium text-slate-700 shadow-sm"
          />

          <SelectField
            label="Verification"
            value={verificationFilter}
            onChange={setVerificationFilter}
            options={verificationFilters}
            title="Filter by verification status"
            wrapperClassName="min-w-0"
            labelClassName="mb-0 text-sm font-medium text-slate-600"
            className="h-12 rounded-xl border-slate-200 px-4 text-sm font-medium text-slate-700 shadow-sm"
          />

          <Field label="Clear">
            <button
              value={roleFilter}
              type="button"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter(roleFilters[0]);
                setTypeFilter(typeFilters[0]);
                setAccountFilter(accountFilters[0]);
                setVerificationFilter(verificationFilters[0]);
              }}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              aria-label="Clear filters"
            >
              <FilterOffIcon />
            </button>
          </Field>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-[1.55fr_1.2fr_0.7fr_0.85fr_0.95fr_0.8fr_0.9fr] border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <span>Name &amp; Email</span>
              <span>Academic Details</span>
              <span className="justify-self-center">Role</span>
              <span className="justify-self-center">User Type</span>
              <span className="justify-self-center">Status</span>
              <span className="justify-self-center">Rating</span>
              <span className="justify-self-center">Actions</span>
            </div>

            {loading ? (
              <EmptyRow>Loading users...</EmptyRow>
            ) : filteredUsers.length === 0 ? (
              <EmptyRow>No users found.</EmptyRow>
            ) : (
              paginatedUsers.map((user) => {
                const targetUserId = user.uid || user.id;
                const isSuspended = normalizeStatus(user.accountStatus || "") === "suspended";
                const isSelf = targetUserId === userProfile?.uid;
                const isStudentAccount = normalizeStatus(user.accountType || "") === "student";
                const isAdminAccount = normalizeAdminRole(user.role) === "admin";

                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1.55fr_1.2fr_0.7fr_0.85fr_0.95fr_0.8fr_0.9fr] items-center border-b border-slate-200 px-6 py-5 text-sm last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar
                        name={user.name || user.email || "User"}
                        profileImageUrl={user.profileImageUrl}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{user.name || "Unnamed user"}</p>
                        <p className="truncate text-sm text-slate-500">{user.email || "No email"}</p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700">
                        {isStudentAccount ? user.university || "Not added" : "Not applicable"}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {isStudentAccount
                          ? [user.degree, user.yearOfStudy].filter(Boolean).join(" - ") || "Not added"
                          : "Not applicable"}
                      </p>
                    </div>

                    <div className="justify-self-center">
                      <StatusChip tone={roleTone(user.role)}>{roleLabel(user.role)}</StatusChip>
                    </div>
                    <span className="justify-self-center font-medium text-slate-600">{accountTypeLabel(user.accountType)}</span>
                    <div className="justify-self-center space-y-1.5 text-center">
                      <StatusChip tone={accountTone(user.accountStatus)}>
                        {accountStatusLabel(user.accountStatus)}
                      </StatusChip>
                      <p className="text-xs font-medium text-slate-400">
                        {verificationLabel(user.providerVerificationStatus)}
                      </p>
                    </div>

                    <p className="justify-self-center flex items-center gap-1 font-medium text-slate-700">
                      <StarIcon />
                      {ratingLabel(user)}
                    </p>

                    <div className="flex min-w-[120px] max-w-[120px] justify-self-center flex-col items-stretch gap-3">
                      <button
                        type="button"
                        disabled={isAdminAccount}
                        onClick={() => setSelectedUserReports(user)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reports
                      </button>
                      <button
                        type="button"
                        disabled={isAdminAccount || busyUserId !== "" || (isSelf && !isSuspended)}
                        onClick={() => {
                          if (isSuspended) {
                            void handleAccountStatus(user, "active");
                            return;
                          }

                          setSuspendTarget(user);
                          setSuspendReason("");
                        }}
                        className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isSuspended
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-[#ef295a] text-white hover:bg-[#db1f4d]"
                        }`}
                      >
                        {busyUserId === `${targetUserId}-${isSuspended ? "active" : "suspended"}`
                          ? "Saving..."
                          : isSuspended
                            ? "Activate"
                            : "Suspend"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          <p>
            Showing {paginatedUsers.length} of {filteredUsers.length} users
          </p>
          <div className="flex items-center gap-2">
            <PagerButton
              label="Previous"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            />
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <PagerButton
                key={page}
                label={String(page)}
                active={currentPage === page}
                onClick={() => setCurrentPage(page)}
              />
            ))}
            <PagerButton
              label="Next"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
          </div>
        </div>
      </section>

      <ReportsModal
        user={selectedUserReports}
        reports={reportsForUser}
        onClose={() => setSelectedUserReports(null)}
      />

      <SuspendConfirmModal
        user={suspendTarget}
        reason={suspendReason}
        busy={busyUserId !== ""}
        onReasonChange={setSuspendReason}
        onClose={() => {
          setSuspendTarget(null);
          setSuspendReason("");
        }}
        onConfirm={() => void confirmSuspend()}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "amber" | "rose";
}) {
  const styles =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100/70"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100/70"
        : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100/70";

  return (
    <article className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md ${styles}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    </article>
  );
}

function EmptyRow({ children }: { children: ReactNode }) {
  return <div className="px-6 py-12 text-center text-sm font-medium text-slate-500">{children}</div>;
}

function StatusChip({
  tone,
  children,
}: {
  tone: "teal" | "amber" | "blue" | "violet" | "cyan" | "green" | "rose" | "slate";
  children: ReactNode;
}) {
  const styles =
    tone === "teal"
      ? "bg-teal-100 text-teal-700"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700"
        : tone === "blue"
          ? "bg-blue-100 text-blue-700"
          : tone === "violet"
            ? "bg-violet-100 text-violet-700"
            : tone === "cyan"
              ? "bg-cyan-100 text-cyan-700"
              : tone === "green"
                ? "bg-green-100 text-green-700"
              : tone === "rose"
                ? "bg-rose-100 text-rose-700"
                : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {children}
    </span>
  );
}

function Avatar({ name, profileImageUrl }: { name: string; profileImageUrl?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0d6c6] text-sm font-bold text-[#7a3e1b]">
      {profileImageUrl ? (
        <img src={profileImageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials || "U"
      )}
    </div>
  );
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function accountStatusLabel(status?: string) {
  const normalized = normalizeStatus(status || "active");
  if (normalized === "pending_email_verification") return "Pending Email";
  if (normalized === "pending_admin_verification") return "Pending Admin";
  if (normalized === "pending_verification") return "Pending Verification";
  if (normalized === "suspended") return "Suspended";
  return "Active";
}

function accountTypeLabel(accountType?: string) {
  const normalized = normalizeStatus(accountType || "");
  if (normalized === "student") return "Student";
  if (normalized === "non_student") return "Non-student";
  return "Not set";
}

function verificationLabel(status?: string) {
  const normalized = normalizeStatus(status || "not_required");
  if (normalized === "approved") return "Approved";
  if (normalized === "pending") return "Pending";
  if (normalized === "rejected") return "Rejected";
  return "Verified";
}

function roleLabel(role?: string) {
  const normalized = normalizeAdminRole(role);
  if (normalized === "both") return "Buyer + Provider";
  if (normalized === "provider") return "Provider";
  if (normalized === "admin") return "Admin";
  return "Buyer";
}

function accountTone(status?: string): "cyan" | "amber" | "rose" {
  const normalized = normalizeStatus(status || "active");
  if (normalized.startsWith("pending")) return "amber";
  if (normalized === "suspended") return "rose";
  return "cyan";
}

function roleTone(role?: string): "blue" | "violet" | "green" | "slate" {
  const normalized = normalizeAdminRole(role);
  if (normalized === "admin") return "violet";
  if (normalized === "provider" || normalized === "both") return "blue";
  if (normalized === "buyer") return "green";
  return "slate";
}

function ratingLabel(user: ManagedUser) {
  const rating = user.averageRating ?? user.rating;
  return formatRatingLabel(rating);
}

function toMillis(value: TimestampLike) {
  if (!value) return 0;
  if (typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object") return 0;
  return new Date(value).getTime() || 0;
}

function formatDate(value: TimestampLike) {
  const millis = toMillis(value);
  if (!millis) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(millis));
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function FilterOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
      <path d="m5 5 14 14" />
    </svg>
  );
}

function PagerButton({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 min-w-[42px] cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? "border-[#2f66e7] bg-[#2f66e7] text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-500" fill="currentColor">
      <path d="m12 2.8 2.8 5.7 6.3.9-4.5 4.3 1.1 6.2-5.7-3-5.7 3 1.1-6.2-4.5-4.3 6.3-.9L12 2.8z" />
    </svg>
  );
}

function ReportsModal({
  user,
  reports,
  onClose,
}: {
  user: ManagedUser | null;
  reports: ReportRecord[];
  onClose: () => void;
}) {
  if (!user) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/18 px-4 py-6 backdrop-blur-md">
        <div className="w-full max-w-[720px] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">User Reports</p>
              <h3 className="mt-2 text-[28px] font-semibold tracking-tight text-slate-900">
                {user.name || user.email || "User"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {reports.length ? `${reports.length} report${reports.length === 1 ? "" : "s"} found` : "No reports found"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Close reports"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="scrollbar-none max-h-[65vh] overflow-y-auto px-6 py-5">
            {reports.length ? (
              <div className="space-y-4">
                {reports.map((report) => {
                  const displayStatus = getAdminReportStatus(report);
                  const normalizedStatus = normalizeStatus(displayStatus);
                  const isPending = isPendingAdminReport(report);

                  return (
                    <article
                      key={report.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {report.issueType || report.category || "User report"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(report.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isPending
                              ? "bg-amber-100 text-amber-700"
                              : isResolvedAdminReport(report.status)
                                ? "bg-emerald-100 text-emerald-700"
                                : isRejectedAdminReport(report.status)
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {report.description || "No report description provided."}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                          Reporter: {report.reporterName || report.reporterEmail || "Unknown"}
                        </div>
                        <Link
                          href="/admin/issue-resolution"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#1454cc] transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          {isPending ? "Handle Report" : "Open Report Handling"}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-12 text-center text-sm text-slate-500">
                This user has not received any reports yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function SuspendConfirmModal({
  user,
  reason,
  busy,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  user: ManagedUser | null;
  reason: string;
  busy: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!user) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/18 px-4 py-6 backdrop-blur-md">
        <div className="w-full max-w-[560px] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-400">Confirm Suspension</p>
              <h3 className="mt-2 text-[26px] font-semibold tracking-tight text-slate-900">
                Suspend {user.name || user.email || "this user"}?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Are you sure you want to suspend this account? Add a short reason before continuing.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Close suspend confirmation"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="px-6 py-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Reason</span>
              <textarea
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="Add a short reason for the suspension..."
                className="min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy || !reason.trim()}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#ef295a] px-5 text-sm font-semibold text-white transition hover:bg-[#db1f4d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Suspending..." : "Suspend User"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}
