"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AVAILABILITY_DAYS,
  AVAILABILITY_TIME_SLOTS,
  ISSUE_TYPES,
  MANAGED_SERVICE_CATEGORIES,
} from "@/lib/platform";
import { UNIVERSITIES } from "@/lib/universities";

export type AddAndManageGroupKey =
  | "serviceCategories"
  | "universities"
  | "issueTypes"
  | "availabilityDays"
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
    defaults: MANAGED_SERVICE_CATEGORIES,
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
  availabilityDays: {
    key: "availabilityDays",
    title: "Weekly Availability",
    singular: "availability day",
    defaults: AVAILABILITY_DAYS,
  },
  availabilityTimeSlots: {
    key: "availabilityTimeSlots",
    title: "Availability Time Slots",
    singular: "time slot",
    defaults: AVAILABILITY_TIME_SLOTS,
  },
};

function sortGroupItems(group: AddAndManageGroup, values: AddAndManageItem[]) {
  const defaultOrder = group.defaults.map((value) => value.trim().toLowerCase());
  const orderIndex = new Map(
    defaultOrder.map((value, index) => [value, index]),
  );

  return [...values].sort((left, right) => {
    const leftName = itemName(left);
    const rightName = itemName(right);
    const leftIndex = orderIndex.get(leftName.trim().toLowerCase());
    const rightIndex = orderIndex.get(rightName.trim().toLowerCase());

    if (leftIndex !== undefined && rightIndex !== undefined) {
      return leftIndex - rightIndex;
    }
    if (leftIndex !== undefined) {
      return -1;
    }
    if (rightIndex !== undefined) {
      return 1;
    }

    return leftName.localeCompare(rightName);
  });
}

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
  const [formNotice, setFormNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AddAndManageItem | null>(null);
  const autoSeededRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, group.key),
      (snapshot) => {
        const nextItems = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AddAndManageItem, "id">),
          }));

        setItems(sortGroupItems(group, nextItems));
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
      setFormNotice({ type: "error", text: `Enter a ${group.singular} name first.` });
      return;
    }

    const normalizedInput = normalizeLookupValue(name);
    const nextSlug = slugify(name);
    const alreadyExists = items.some((item) => {
      const normalizedName = normalizeLookupValue(itemName(item));
      return normalizedName === normalizedInput || item.id === nextSlug;
    });

    if (alreadyExists) {
      setFormNotice({
        type: "error",
        text: `This ${group.singular} already exists. Try a different name.`,
      });
      return;
    }

    setBusyKey(`${group.key}-add`);
    setNotice(null);
    setFormNotice(null);

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
      setFormNotice({ type: "success", text: `${name} added successfully.` });
    } catch (error) {
      console.error(`Error saving ${group.key}:`, error);
      setFormNotice({ type: "error", text: `Could not save this ${group.singular}.` });
    } finally {
      setBusyKey("");
    }
  };

  const seedDefaults = async () => {
    setBusyKey(`${group.key}-seed`);
    setNotice(null);
    setFormNotice(null);

    try {
      const existingByNormalizedName = new Map(
        items.map((item) => [normalizeLookupValue(itemName(item)), item] as const),
      );
      const existingById = new Map(items.map((item) => [item.id, item] as const));
      const missingDefaults = group.defaults.filter((name) => {
        const normalizedName = normalizeLookupValue(name);
        return (
          !existingById.has(slugify(name)) &&
          !existingByNormalizedName.has(normalizedName)
        );
      });
      const inactiveDefaults = group.defaults
        .map((name) => {
          const normalizedName = normalizeLookupValue(name);
          return existingById.get(slugify(name)) || existingByNormalizedName.get(normalizedName) || null;
        })
        .filter((item): item is AddAndManageItem => Boolean(item && item.active === false));

      if (missingDefaults.length === 0 && inactiveDefaults.length === 0) {
        setFormNotice({
          type: "error",
          text: `All default ${group.title.toLowerCase()} already exist and are active.`,
        });
        return;
      }

      await Promise.all([
        ...missingDefaults.map((name) =>
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
        ...inactiveDefaults.map((item) =>
          updateDoc(doc(db, group.key, item.id), {
            active: true,
            updatedAt: serverTimestamp(),
          }),
        ),
      ]);

      const resultParts: string[] = [];
      if (missingDefaults.length > 0) {
        resultParts.push(
          `${missingDefaults.length} default ${
            missingDefaults.length === 1 ? group.singular : group.title.toLowerCase()
          } added`,
        );
      }
      if (inactiveDefaults.length > 0) {
        resultParts.push(
          `${inactiveDefaults.length} default ${
            inactiveDefaults.length === 1 ? group.singular : group.title.toLowerCase()
          } reactivated`,
        );
      }

      setFormNotice({
        type: "success",
        text: `${resultParts.join(" and ")}.`,
      });
    } catch (error) {
      console.error(`Error seeding ${group.key}:`, error);
      setFormNotice({ type: "error", text: `Could not seed ${group.title}.` });
    } finally {
      setBusyKey("");
    }
  };

  useEffect(() => {
    if (loading || items.length > 0 || autoSeededRef.current) {
      return;
    }

    if (!group.defaults.length) {
      return;
    }

    autoSeededRef.current = true;
    void seedDefaults();
  }, [group.defaults, items.length, loading]);

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

  const deleteAddAndManageItem = async (item: AddAndManageItem) => {
    setBusyKey(`${group.key}-${item.id}-delete`);
    setNotice(null);

    try {
      await deleteDoc(doc(db, group.key, item.id));
      setDeleteTarget(null);
      setNotice({
        type: "success",
        text: `${itemName(item)} deleted successfully.`,
      });
    } catch (error) {
      console.error(`Error deleting ${group.key}:`, error);
      setNotice({ type: "error", text: `Could not delete this ${group.singular}.` });
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
                onChange={(event) => {
                  setInputValue(event.target.value);
                  if (formNotice) {
                    setFormNotice(null);
                  }
                }}
                className={`h-11 w-full rounded-lg border px-3 text-sm text-slate-700 outline-none transition focus:ring-4 ${
                  formNotice?.type === "error"
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-[#2f66e7] focus:ring-blue-100"
                }`}
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
              onClick={() => void seedDefaults()}
              disabled={busyKey !== ""}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyKey === `${group.key}-seed` ? "Loading..." : "Add Defaults"}
            </button>
          </div>

          {formNotice ? (
            <p
              className={`mt-3 text-sm font-medium ${
                formNotice.type === "success" ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {formNotice.text}
            </p>
          ) : null}

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
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          disabled={busyKey !== ""}
                          className="inline-flex h-9 items-center rounded-lg bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAddAndManageItem(item)}
                          disabled={busyKey !== ""}
                          className={`inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/28 px-4 py-6 backdrop-blur-md"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Confirm Delete
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">
              Are you sure?
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will permanently delete <span className="font-semibold text-slate-800">{itemName(deleteTarget)}</span> from {group.title.toLowerCase()}.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={busyKey !== ""}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteAddAndManageItem(deleteTarget)}
                disabled={busyKey !== ""}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyKey === `${group.key}-${deleteTarget.id}-delete` ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

function normalizeLookupValue(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
