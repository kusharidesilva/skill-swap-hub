"use client"; 

import { useEffect, useState } from "react"; 
import { useRouter } from "next/navigation"; 
import { useAuth } from "@/context/AuthContext"; 
import { db } from "@/lib/firebase"; 
import ReportActionModal from "@/components/report-action-modal";
import { dashboardHref, resolveRole, scopedHref } from "@/lib/role-routes";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
} from "firebase/firestore"; 
import type { ModerationAction } from "@/lib/moderation";

interface NotificationItem {
  id: string;
  title: string; 
  description: string;
  time: string;
  tone: "blue" | "emerald" | "green" | "teal" | "indigo" | "red";
  icon: string;
  read: boolean;
  type?: string;
  href?: string;
  destination?: string;
  metadata?: Record<string, unknown>;
}

const toneStyles: Record<string, { badge: string; dot: string }> = {
  blue: { badge: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
  emerald: { badge: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
  green: { badge: "bg-green-50 text-green-600", dot: "bg-green-500" },
  teal: { badge: "bg-teal-50 text-teal-600", dot: "bg-teal-500" },
  indigo: { badge: "bg-indigo-50 text-indigo-600", dot: "bg-indigo-500" },
  red: { badge: "bg-red-50 text-red-600", dot: "bg-red-500" },
};

function formatRelativeTime(createdAt: { toDate?: () => Date } | Date | string | number | null | undefined) {
  if (!createdAt) return "Just now";
  const date = typeof createdAt === "object" && createdAt && "toDate" in createdAt && typeof createdAt.toDate === "function"
    ? createdAt.toDate()
    : new Date(createdAt as Date | string | number);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReportNotification, setActiveReportNotification] = useState<NotificationItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  useEffect(() => {
    if (!userProfile) return;

    // New notifications appear instantly and remain ordered from newest to oldest.
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userProfile.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: NotificationItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          notifications.push({
            id: docSnap.id,
            title: data.title || "",
            description: data.description || "",
            time: formatRelativeTime(data.createdAt),
            tone: data.tone || "blue",
            icon: data.icon || "◆",
            read: Boolean(data.read),
            type: data.type || "",
            href: data.href || "",
            destination: data.destination || "",
            metadata:
              data.metadata && typeof data.metadata === "object"
                ? (data.metadata as Record<string, unknown>)
                : undefined,
          });
        });
        setItems(notifications);
        setCurrentPage((page) => {
          const nextTotalPages = Math.max(1, Math.ceil(notifications.length / itemsPerPage));
          return Math.min(page, nextTotalPages);
        });
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notifications:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [itemsPerPage, userProfile]);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (typeof window === "undefined") return;

      // Reserve space for the page chrome, header, actions, and pagination.
      const availableHeight = window.innerHeight - 320;
      const estimatedCardHeight = 124;
      const nextItemsPerPage = Math.max(
        4,
        Math.min(12, Math.floor(availableHeight / estimatedCardHeight)),
      );

      setItemsPerPage(nextItemsPerPage);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const handleMarkAllRead = async () => {
    if (!userProfile) return;
    try {
      // Run independent updates together so a long list does not feel slow.
      const promises = items
        .filter((item) => !item.read)
        .map((item) =>
          updateDoc(doc(db, "notifications", item.id), { read: true })
        );
      await Promise.all(promises);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleClearAll = async () => {
    if (!userProfile) return;
    try {
      const promises = items.map((item) =>
        deleteDoc(doc(db, "notifications", item.id))
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!isNotificationInteractive(item)) {
      return;
    }

    // Mark the item as read before deciding where it should open.
    if (!item.read) {
      try {
        await updateDoc(doc(db, "notifications", item.id), { read: true });
      } catch (err) {
        console.error("Error marking notification read on click:", err);
      }
    }

    if (!userProfile) return;
    const role = resolveRole(userProfile.role, "buyer");
    const metadata = item.metadata || {};
    const notificationKind =
      typeof metadata.kind === "string" ? metadata.kind : "";

    if (
      notificationKind === "report_action" &&
      typeof metadata.reportId === "string" &&
      typeof metadata.action === "string" &&
      (metadata.openPopup === true || metadata.action === "warn")
    ) {
      const reportSnapshot = await getDoc(doc(db, "reports", metadata.reportId));
      if (!reportSnapshot.exists()) {
        return;
      }

      const reportData = reportSnapshot.data() as {
        targetUserId?: string;
        reportedUserId?: string;
        reportedUser?: string;
      };
      const isReportedUser =
        reportData.targetUserId === userProfile.uid ||
        reportData.reportedUserId === userProfile.uid ||
        reportData.reportedUser === userProfile.uid;

      if (!isReportedUser) {
        return;
      }

      setActiveReportNotification(item);
      return;
    }
    
    // A stored path is the most accurate destination for newer notifications.
    const targetPath = item.href || item.destination;
    if (targetPath) {
      router.push(targetPath);
      return;
    }

    if (
      notificationKind === "review_compliance" ||
      notificationKind === "review_suspension"
    ) {
      router.push(targetPath || dashboardHref(role));
      return;
    }

    const lowerTitle = item.title.toLowerCase();
    const type = item.type || "";

    // Older records are routed by their type or title for backward compatibility.
    if (type === "message" || lowerTitle.includes("message") || lowerTitle.includes("chat")) {
      router.push(scopedHref("/chats", role));
      return;
    }

    if (type === "review" || lowerTitle.includes("review") || lowerTitle.includes("rated") || lowerTitle.includes("completed & rated")) {
      router.push(scopedHref("/ratings", role));
      return;
    }

    if (type === "request" || type === "match" || lowerTitle.includes("request")) {
      const isBuyerFocused =
        lowerTitle.includes("accepted") ||
        lowerTitle.includes("declined") ||
        lowerTitle.includes("finished") ||
        lowerTitle.includes("completed") ||
        lowerTitle.includes("session finished");

      if (isBuyerFocused) {
        router.push(scopedHref("/request-service", role));
      } else {
        router.push(scopedHref("/incoming-requests", role === "buyer" ? "provider" : role));
      }
      return;
    }

    // Unknown notification types safely return to the user's dashboard.
    router.push(dashboardHref(role));
  };

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedItems = items.slice(
    (visiblePage - 1) * itemsPerPage,
    visiblePage * itemsPerPage,
  );
  const paginationItems = buildPaginationItems(totalPages, visiblePage);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex min-h-[560px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header actions and live notification list */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay updated with your skill swapping journey.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm sm:justify-end">
          {items.some((item) => !item.read) && (
            <button
              onClick={handleMarkAllRead}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Mark all as read
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            No notifications right now.
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedItems.map((item) => {
              const styles = toneStyles[item.tone] ?? toneStyles.blue;
              const isInteractive = isNotificationInteractive(item);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isInteractive) {
                      void handleNotificationClick(item);
                    }
                  }}
                  className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition sm:flex-row sm:items-start sm:gap-4 ${
                    isInteractive
                      ? "cursor-pointer hover:border-slate-300 hover:shadow-[0_14px_32px_-24px_rgba(37,99,235,0.42)]"
                      : "cursor-default"
                  } ${
                    item.read
                      ? "border-slate-100 bg-white"
                      : "border-blue-100 bg-blue-50/40"
                  }`}
                  role={isInteractive ? "button" : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  onKeyDown={(event) => {
                    if (
                      isInteractive &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      void handleNotificationClick(item);
                    }
                  }}
                >
                  <div className="relative self-start">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.badge}`}
                    >
                      <NotificationIcon icon={item.icon} className="h-4.5 w-4.5" />
                    </div>
                    {!item.read ? (
                      <span
                        className={`absolute -left-2 top-1 h-2.5 w-2.5 rounded-full ${styles.dot}`}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {items.length > itemsPerPage ? (
        <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center sm:text-left">
            Showing {paginatedItems.length} of {items.length} notifications
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <PagerButton
              label="Previous"
              disabled={visiblePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            />
            {paginationItems.map((item, index) =>
              item === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex h-10 min-w-[42px] items-center justify-center px-1 text-sm font-semibold text-slate-400"
                >
                  ...
                </span>
              ) : (
                <PagerButton
                  key={item}
                  label={String(item)}
                  active={visiblePage === item}
                  onClick={() => setCurrentPage(item)}
                />
              ),
            )}
            <PagerButton
              label="Next"
              disabled={visiblePage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
          </div>
        </div>
      ) : null}
      {activeReportNotification && userProfile ? (
        <ReportActionModal
          open
          reportId={String(activeReportNotification.metadata?.reportId || "")}
          action={String(activeReportNotification.metadata?.action || "warn") as ModerationAction}
          decisionMessage={
            typeof activeReportNotification.metadata?.decisionMessage === "string"
              ? activeReportNotification.metadata?.decisionMessage
              : activeReportNotification.description
          }
          userId={userProfile.uid}
          userName={userProfile.name}
          onClose={() => setActiveReportNotification(null)}
        />
      ) : null}
    </section>
  );
}

function isNotificationInteractive(item: NotificationItem) {
  const metadata = item.metadata || {};
  const notificationKind =
    typeof metadata.kind === "string" ? metadata.kind : "";
  const targetPath = item.href || item.destination;
  const lowerTitle = item.title.toLowerCase();
  const type = item.type || "";

  if (
    notificationKind === "report_action" &&
    typeof metadata.reportId === "string" &&
    typeof metadata.action === "string" &&
    (metadata.openPopup === true || metadata.action === "warn")
  ) {
    return true;
  }

  if (notificationKind === "review_compliance") return true;
  if (notificationKind === "review_suspension") return true;
  if (notificationKind === "report_response") return true;
  if (targetPath) return true;

  if (type === "message" || lowerTitle.includes("message") || lowerTitle.includes("chat")) {
    return true;
  }

  if (type === "review" || lowerTitle.includes("review") || lowerTitle.includes("rated") || lowerTitle.includes("completed & rated")) {
    return true;
  }

  if (type === "request" || type === "match" || lowerTitle.includes("request")) {
    return true;
  }

  return false;
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
      className={`inline-flex h-10 min-w-[42px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? "border-[#2f66e7] bg-[#2f66e7] text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function buildPaginationItems(totalPages: number, currentPage: number) {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 1) {
    return [1, "...", totalPages] as const;
  }

  if (currentPage >= totalPages) {
    return [1, "...", totalPages] as const;
  }

  return [1, "...", currentPage, "...", totalPages] as const;
}

function NotificationIcon({
  icon,
  className,
}: {
  icon?: string;
  className?: string;
}) {
  const normalized = (icon || "").trim().toLowerCase();

  if (normalized === "alert-triangle") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="m10.3 3.9-8.1 14A1.9 1.9 0 0 0 3.8 21h16.4a1.9 1.9 0 0 0 1.6-3.1l-8.1-14a1.9 1.9 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (normalized === "check-circle") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8.8 12.3 2.2 2.2 4.6-4.8" />
      </svg>
    );
  }

  if (normalized === "x-circle") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6" />
        <path d="m15 9-6 6" />
      </svg>
    );
  }

  if (normalized === "flag") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M5 21V5" />
        <path d="M5 5c4-3 6 3 10 0l1 8c-4 3-6-3-10 0" />
      </svg>
    );
  }

  if (normalized === "star") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
      >
        <path d="m12 3.8 2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8 2.5-5Z" />
      </svg>
    );
  }

  if (normalized === "message") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M7 10h10" />
        <path d="M7 14h6" />
        <path d="M5 19l-1-4V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}
