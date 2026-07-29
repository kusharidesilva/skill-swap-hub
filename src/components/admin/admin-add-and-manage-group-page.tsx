"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AVAILABILITY_TIME_SLOTS,
  ISSUE_TYPES,
  SERVICE_CATEGORIES,
} from "@/lib/platform";
import { UNIVERSITIES } from "@/lib/universities";

export type AddAndManageGroupKey =
  | "serviceCategories"
  | "universities"
  | "issueTypes"
  | "availabilityTimeSlots";

type AddAndManageItem = {
  id: string;
  name?: string;
  active?: boolean;
  createdAt?: unknown;
};

type AddAndManageGroup = {
  key: AddAndManageGroupKey;
  title: string;
  singular: string;
  defaults: readonly string[];
};

const addAndManageGroups: Record<AddAndManageGroupKey, AddAndManageGroup> = {
  serviceCategories: {
    key: "serviceCategories",
    title: "Service Categories",
    singular: "category",
    defaults: SERVICE_CATEGORIES,
  },
  universities: {
    key: "universities",
    title: "Universities",
    singular: "university",
    defaults: UNIVERSITIES,
  },
  issueTypes: {
    key: "issueTypes",
    title: "Issue Types",
    singular: "issue type",
    defaults: ISSUE_TYPES,
  },
  availabilityTimeSlots: {
    key: "availabilityTimeSlots",
    title: "Availability Time Slots",
    singular: "time slot",
    defaults: AVAILABILITY_TIME_SLOTS,
  },
};

export default function AdminAddAndManageGroupPage({
  groupKey,
}: {
  groupKey: AddAndManageGroupKey;
}) {
  const group = addAndManageGroups[groupKey];
  const [items, setItems] = useState<AddAndManageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, group.key),
      (snapshot) => {
        const nextItems = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AddAndManageItem, "id">),
          }))
          .sort((left, right) => itemName(left).localeCompare(itemName(right)));

        setItems(nextItems);
        setLoading(false);
      },
      (error) => {
        console.error(`Error loading ${group.key}:`, error);
        setNotice({ type: "error", text: `Could not load ${group.title}.` });
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [group.key, group.title]);

  const addAddAndManageItem = async () => {
    const name = inputValue.trim();
    if (!name) {
      setNotice({ type: "error", text: `Enter a ${group.singular} name first.` });
      return;
    }

    setBusyKey(`${group.key}-add`);
    setNotice(null);

    try {
      await setDoc(
        doc(db, group.key, slugify(name)),
        {
          name,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setInputValue("");
      setNotice({ type: "success", text: `${name} saved.` });
    } catch (error) {
      console.error(`Error saving ${group.key}:`, error);
      setNotice({ type: "error", text: `Could not save this ${group.singular}.` });
    } finally {
      setBusyKey("");
    }
  };

  const seedDefaults = async () => {
    setBusyKey(`${group.key}-seed`);
    setNotice(null);

    try {
      await Promise.all(
        group.defaults.map((name) =>
          setDoc(
            doc(db, group.key, slugify(name)),
            {
              name,
              active: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          ),
        ),
      );

      setNotice({ type: "success", text: `${group.title} defaults saved.` });
    } catch (error) {
      console.error(`Error seeding ${group.key}:`, error);
      setNotice({ type: "error", text: `Could not seed ${group.title}.` });
    } finally {
      setBusyKey("");
    }
  };

  const toggleAddAndManageItem = async (item: AddAndManageItem) => {
    const nextActive = item.active === false;
    setBusyKey(`${group.key}-${item.id}`);
    setNotice(null);

    try {
      await updateDoc(doc(db, group.key, item.id), {
        active: nextActive,
        updatedAt: serverTimestamp(),
      });

      setNotice({
        type: "success",
        text: `${itemName(item)} ${nextActive ? "activated" : "deactivated"}.`,
      });
    } catch (error) {
      console.error(`Error updating ${group.key}:`, error);
      setNotice({ type: "error", text: `Could not update this ${group.singular}.` });
    } finally {
      setBusyKey("");
    }
  };

  const activeCount = items.filter((item) => item.active !== false).length;
  const inactiveCount = items.length - activeCount;

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight text-slate-900">{group.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add new entries and manage the shared values used across the admin and user flows.
            </p>
          </div>
          <Link
            href="/admin/add-and-manage"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </Link>
        </div>

        {notice ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.text}
          </div>
        ) : null}

        <Card title={group.title}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-sm font-medium text-slate-600">Name</span>
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
                placeholder={`Add ${group.singular}`}
              />
            </label>
            <button
              type="button"
              onClick={addAddAndManageItem}
              disabled={busyKey !== ""}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2f66e7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2356cb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyKey === `${group.key}-add` ? "Saving..." : "Add"}
            </button>
            <button
              type="button"
              onClick={seedDefaults}
              disabled={busyKey !== ""}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyKey === `${group.key}-seed` ? "Saving..." : "Seed Defaults"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{activeCount} Active</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{inactiveCount} Inactive</span>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            {loading ? (
              <EmptyState>Loading...</EmptyState>
            ) : items.length === 0 ? (
              <EmptyState>No records yet.</EmptyState>
            ) : (
              <div className="scrollbar-none max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
                {items.map((item) => {
                  const active = item.active !== false;

                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-700">{itemName(item)}</p>
                        <p className="text-xs text-slate-400">{item.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAddAndManageItem(item)}
                        disabled={busyKey !== ""}
                        className={`inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          active
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {busyKey === `${group.key}-${item.id}`
                          ? "Saving..."
                          : active
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="mt-4 border-t border-slate-200 pt-4">{children}</div>
    </article>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm font-medium text-slate-400">{children}</p>;
}

function itemName(item: AddAndManageItem) {
  return item.name?.trim() || item.id;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
