"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type AddAndManageGroupKey =
  | "serviceCategories"
  | "universities"
  | "issueTypes"
  | "availabilityDays"
  | "availabilityTimeSlots";

type AddAndManageItem = {
  active?: boolean;
};

type AddAndManageGroup = {
  key: AddAndManageGroupKey;
  title: string;
  description: string;
  href: string;
};

const addAndManageGroups: AddAndManageGroup[] = [
  {
    key: "serviceCategories",
    title: "Service Categories",
    description: "Manage the services shown across gigs and requests.",
    href: "/admin/add-and-manage/service-categories",
  },
  {
    key: "universities",
    title: "Universities",
    description: "Control the university list used during registration.",
    href: "/admin/add-and-manage/universities",
  },
  {
    key: "issueTypes",
    title: "Issue Types",
    description: "Set the report categories available to users and admins.",
    href: "/admin/add-and-manage/issue-types",
  },
  {
    key: "availabilityDays",
    title: "Weekly Availability",
    description: "Manage the days shown in weekly availability selectors.",
    href: "/admin/add-and-manage/weekly-availability",
  },
  {
    key: "availabilityTimeSlots",
    title: "Availability Time Slots",
    description: "Keep provider availability slots consistent across the app.",
    href: "/admin/add-and-manage/availability-time-slots",
  },
];

const emptyAddAndManageState: Record<AddAndManageGroupKey, AddAndManageItem[]> = {
  serviceCategories: [],
  universities: [],
  issueTypes: [],
  availabilityDays: [],
  availabilityTimeSlots: [],
};

export default function AdminAddAndManageSettings() {
  const [items, setItems] = useState(emptyAddAndManageState);

  useEffect(() => {
    const unsubscribers = addAndManageGroups.map((group) =>
      onSnapshot(
        collection(db, group.key),
        (snapshot) => {
          setItems((current) => ({
            ...current,
            [group.key]: snapshot.docs.map(
              (docSnap) => docSnap.data() as AddAndManageItem,
            ),
          }));
        },
        (error) => {
          console.error(`Error loading ${group.key}:`, error);
        },
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const totals = useMemo(
    () => ({
      serviceCategories: items.serviceCategories.filter((item) => item.active !== false).length,
      universities: items.universities.filter((item) => item.active !== false).length,
      issueTypes: items.issueTypes.filter((item) => item.active !== false).length,
      availabilityDays: items.availabilityDays.filter((item) => item.active !== false).length,
      availabilityTimeSlots: items.availabilityTimeSlots.filter((item) => item.active !== false).length,
    }),
    [items],
  );

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-900">Add &amp; Manage Options</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Choose an option group to add new entries and manage categories, universities, issue types, and time slots.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {addAndManageGroups.map((group) => (
            <Link
              key={group.key}
              href={group.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#2f66e7] hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-900">{group.title}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1d4ed8]">
                  {totals[group.key]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">{group.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
