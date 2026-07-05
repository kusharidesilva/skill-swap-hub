"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

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
          });
        });
        setItems(notifications);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notifications:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

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
    // Mark the item as read before deciding where it should open.
    if (!item.read) {
      try {
        await updateDoc(doc(db, "notifications", item.id), { read: true });
      } catch (err) {
        console.error("Error marking notification read on click:", err);
      }
    }

    if (!userProfile) return;
    const role = userProfile.role || "buyer";
    
    // A stored path is the most accurate destination for newer notifications.
    const targetPath = item.href || item.destination;
    if (targetPath) {
      router.push(targetPath);
      return;
    }

    const lowerTitle = item.title.toLowerCase();
    const type = item.type || "";

    // Older records are routed by their type or title for backward compatibility.
    if (type === "message" || lowerTitle.includes("message") || lowerTitle.includes("chat")) {
      router.push(role === "both" ? "/chats/both" : role === "provider" ? "/chats/provider" : "/chats/buyer");
      return;
    }

    if (type === "review" || lowerTitle.includes("review") || lowerTitle.includes("rated") || lowerTitle.includes("completed & rated")) {
      router.push(role === "both" ? "/ratings/both" : "/ratings/provider");
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
        router.push(role === "both" ? "/request-service/both" : "/request-service/buyer");
      } else {
        router.push(role === "both" ? "/incoming-requests/both" : "/incoming-requests/provider");
      }
      return;
    }

    // Unknown notification types safely return to the user's dashboard.
    router.push(`/dashboard/${role}`);
  };

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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header actions and live notification list */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay updated with your skill swapping journey.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
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

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            No notifications right now.
          </div>
        ) : (
          items.map((item) => {
            const styles = toneStyles[item.tone] ?? toneStyles.blue;

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${
                  item.read
                    ? "border-slate-100 bg-white"
                    : "border-blue-100 bg-blue-50/40"
                }`}
              >
                <div className="relative">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.badge}`}
                  >
                    <span className="text-sm font-semibold">{item.icon}</span>
                  </div>
                  {!item.read ? (
                    <span
                      className={`absolute -left-2 top-1 h-2.5 w-2.5 rounded-full ${styles.dot}`}
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
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
          })
        )}
      </div>
    </section>
  );
}
