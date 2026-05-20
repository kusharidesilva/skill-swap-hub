"use client";

import { useState } from "react";

const notifications = [
  {
    title: "New Match Found!",
    description:
      "You have been matched with Alex Chen for \"Advanced React Patterns\". Reach out and start swapping!",
    time: "2 mins ago",
    tone: "blue",
    icon: "◆",
    read: false,
  },
  {
    title: "New Message",
    description:
      "Sarah Miller: \"Hey! I'd love to help you with Python in exchange for some UI design tips...\"",
    time: "45 mins ago",
    tone: "emerald",
    icon: "✉",
    read: false,
  },
  {
    title: "Request Accepted",
    description:
      "Your request to swap \"Spanish Conversations\" with Carlos Ruiz was accepted.",
    time: "3 hours ago",
    tone: "green",
    icon: "✓",
    read: false,
  },
  {
    title: "Payment Verified",
    description:
      "The proof of session for \"Basic Accounting\" has been verified. Your skill credits have been updated.",
    time: "Yesterday",
    tone: "teal",
    icon: "▣",
    read: true,
  },
  {
    title: "New Review Received",
    description:
      "\"Amazing teacher! Very patient with my coding mistakes.\" - James L. gave you 5 stars!",
    time: "2 days ago",
    tone: "indigo",
    icon: "★",
    read: true,
  },
  {
    title: "Support Ticket Update",
    description:
      "Your report regarding \"No-show for session\" has been reviewed. A credit refund has been issued to your account.",
    time: "3 days ago",
    tone: "red",
    icon: "!",
    read: true,
  },
];

const toneStyles: Record<string, { badge: string; dot: string }> = {
  blue: { badge: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
  emerald: { badge: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
  green: { badge: "bg-green-50 text-green-600", dot: "bg-green-500" },
  teal: { badge: "bg-teal-50 text-teal-600", dot: "bg-teal-500" },
  indigo: { badge: "bg-indigo-50 text-indigo-600", dot: "bg-indigo-500" },
  red: { badge: "bg-red-50 text-red-600", dot: "bg-red-500" },
};

export default function NotificationsPage() {
  const [items, setItems] = useState(notifications);

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay updated with your skill swapping journey.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={handleMarkAllRead}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Mark all as read
          </button>
          <button
            onClick={handleClearAll}
            className="text-sm font-semibold text-slate-400 hover:text-slate-600"
          >
            Clear all
          </button>
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
              key={`${item.title}-${item.time}`}
              className={`flex items-start gap-4 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md ${
                item.read ? "border-slate-100 bg-white" : "border-blue-100 bg-blue-50/40"
              }`}
            >
              <div className="relative">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.badge}`}>
                  <span className="text-sm font-semibold">{item.icon}</span>
                </div>
                {!item.read ? (
                  <span className={`absolute -left-2 top-1 h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                ) : null}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
            </div>
          );
          })
        )}
      </div>
    </section>
  );
}
