"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  AVAILABILITY_TIME_SLOTS,
  ISSUE_TYPES,
  SERVICE_CATEGORIES,
  YEAR_OF_STUDY_OPTIONS,
} from "@/lib/platform";
import { UNIVERSITIES } from "@/lib/universities";

type LookupGroupKey =
  | "serviceCategories"
  | "universities"
  | "issueTypes"
  | "yearOfStudyOptions"
  | "availabilityTimeSlots";

type LookupItem = {
  id: string;
  name?: string;
  active?: boolean;
  createdAt?: unknown;
};

type LookupGroup = {
  key: LookupGroupKey;
  title: string;
  singular: string;
  defaults: readonly string[];
};

const lookupGroups: LookupGroup[] = [
  {
    key: "serviceCategories",
    title: "Service Categories",
    singular: "category",
    defaults: SERVICE_CATEGORIES,
  },
  {
    key: "universities",
    title: "Universities",
    singular: "university",
    defaults: UNIVERSITIES,
  },
  {
    key: "issueTypes",
    title: "Issue Types",
    singular: "issue type",
    defaults: ISSUE_TYPES,
  },
  {
    key: "yearOfStudyOptions",
    title: "Year of Study Options",
    singular: "year option",
    defaults: YEAR_OF_STUDY_OPTIONS,
  },
  {
    key: "availabilityTimeSlots",
    title: "Availability Time Slots",
    singular: "time slot",
    defaults: AVAILABILITY_TIME_SLOTS,
  },
];

const emptyLookupState: Record<LookupGroupKey, LookupItem[]> = {
  serviceCategories: [],
  universities: [],
  issueTypes: [],
  yearOfStudyOptions: [],
  availabilityTimeSlots: [],
};

const emptyInputs: Record<LookupGroupKey, string> = {
  serviceCategories: "",
  universities: "",
  issueTypes: "",
  yearOfStudyOptions: "",
  availabilityTimeSlots: "",
};

export default function AdminSettings() {
  const { userProfile } = useAuth();
  const [items, setItems] = useState(emptyLookupState);
  const [inputs, setInputs] = useState(emptyInputs);
  const [loadingGroups, setLoadingGroups] = useState<Record<LookupGroupKey, boolean>>({
    serviceCategories: true,
    universities: true,
    issueTypes: true,
    yearOfStudyOptions: true,
    availabilityTimeSlots: true,
  });
  const [busyKey, setBusyKey] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const unsubscribers = lookupGroups.map((group) =>
      onSnapshot(
        collection(db, group.key),
        (snapshot) => {
          const nextItems = snapshot.docs
            .map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<LookupItem, "id">),
            }))
            .sort((left, right) => itemName(left).localeCompare(itemName(right)));

          setItems((current) => ({ ...current, [group.key]: nextItems }));
          setLoadingGroups((current) => ({ ...current, [group.key]: false }));
        },
        (error) => {
          console.error(`Error loading ${group.key}:`, error);
          setNotice({ type: "error", text: `Could not load ${group.title}.` });
          setLoadingGroups((current) => ({ ...current, [group.key]: false }));
        },
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const totals = useMemo(
    () => ({
      categories: items.serviceCategories.filter((item) => item.active !== false).length,
      universities: items.universities.filter((item) => item.active !== false).length,
      issueTypes: items.issueTypes.filter((item) => item.active !== false).length,
      yearOptions: items.yearOfStudyOptions.filter((item) => item.active !== false).length,
      timeSlots: items.availabilityTimeSlots.filter((item) => item.active !== false).length,
    }),
    [items],
  );

  const addLookupItem = async (group: LookupGroup) => {
    const name = inputs[group.key].trim();
    if (!name) {
      setNotice({ type: "error", text: `Enter a ${group.singular} name first.` });
      return;
    }

    const docId = slugify(name);
    setBusyKey(`${group.key}-add`);
    setNotice(null);

    try {
      await setDoc(
        doc(db, group.key, docId),
        {
          name,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setInputs((current) => ({ ...current, [group.key]: "" }));
      setNotice({ type: "success", text: `${name} saved.` });
    } catch (error) {
      console.error(`Error saving ${group.key}:`, error);
      setNotice({ type: "error", text: `Could not save this ${group.singular}.` });
    } finally {
      setBusyKey("");
    }
  };

  const seedDefaults = async (group: LookupGroup) => {
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

  const toggleLookupItem = async (group: LookupGroup, item: LookupItem) => {
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

  return (
    <div className="px-6 py-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight text-slate-900">Admin Settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage the Firestore lookup data used by services, registration, and reports.
            </p>
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

          {lookupGroups.map((group) => (
            <LookupCard
              key={group.key}
              group={group}
              items={items[group.key]}
              inputValue={inputs[group.key]}
              loading={loadingGroups[group.key]}
              busyKey={busyKey}
              onInputChange={(value) =>
                setInputs((current) => ({ ...current, [group.key]: value }))
              }
              onAdd={() => addLookupItem(group)}
              onSeed={() => seedDefaults(group)}
              onToggle={(item) => toggleLookupItem(group, item)}
            />
          ))}
        </div>

        <aside className="space-y-6">
          <Card title="Admin Account">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-white shadow-md">
                <UserIcon />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {userProfile?.name || "System Administrator"}
                </p>
                <p className="truncate text-sm text-slate-500">{userProfile?.email || "Admin"}</p>
              </div>
            </div>
            <div className="mt-5 border-t border-slate-200 pt-4">
              <StatusLine label="Role" value="Admin" />
              <StatusLine label="Account Status" value={userProfile?.accountStatus || "active"} />
            </div>
          </Card>

          <Card title="Lookup Summary">
            <div className="space-y-4">
              <SummaryRow label="Active categories" value={totals.categories} />
              <SummaryRow label="Active universities" value={totals.universities} />
              <SummaryRow label="Active issue types" value={totals.issueTypes} />
              <SummaryRow label="Active year options" value={totals.yearOptions} />
              <SummaryRow label="Active time slots" value={totals.timeSlots} />
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function LookupCard({
  group,
  items,
  inputValue,
  loading,
  busyKey,
  onInputChange,
  onAdd,
  onSeed,
  onToggle,
}: {
  group: LookupGroup;
  items: LookupItem[];
  inputValue: string;
  loading: boolean;
  busyKey: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onSeed: () => void;
  onToggle: (item: LookupItem) => void;
}) {
  const activeCount = items.filter((item) => item.active !== false).length;
  const inactiveCount = items.length - activeCount;

  return (
    <Card title={group.title}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="flex-1">
          <span className="mb-2 block text-sm font-medium text-slate-600">Name</span>
          <input
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
            placeholder={`Add ${group.singular}`}
          />
        </label>
        <button
          type="button"
          onClick={onAdd}
          disabled={busyKey !== ""}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2f66e7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2356cb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyKey === `${group.key}-add` ? "Saving..." : "Add"}
        </button>
        <button
          type="button"
          onClick={onSeed}
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
          <div className="max-h-[300px] divide-y divide-slate-100 overflow-y-auto">
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
                    onClick={() => onToggle(item)}
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

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-semibold capitalize text-slate-800">{value.replace(/_/g, " ")}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-lg font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function itemName(item: LookupItem) {
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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
