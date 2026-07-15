"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type LookupGroupKey =
  | "serviceCategories"
  | "universities"
  | "issueTypes"
  | "yearOfStudyOptions"
  | "availabilityTimeSlots";

type LookupItem = {
  active?: boolean;
};

type LookupGroup = {
  key: LookupGroupKey;
  title: string;
  description: string;
  href: string;
};

const lookupGroups: LookupGroup[] = [
  {
    key: "serviceCategories",
    title: "Service Categories",
    description: "Manage the services shown across gigs and requests.",
    href: "/admin/lookup-settings/service-categories",
  },
  {
    key: "universities",
    title: "Universities",
    description: "Control the university list used during registration.",
    href: "/admin/lookup-settings/universities",
  },
  {
    key: "issueTypes",
    title: "Issue Types",
    description: "Set the report categories available to users and admins.",
    href: "/admin/lookup-settings/issue-types",
  },
  {
    key: "yearOfStudyOptions",
    title: "Year of Study Options",
    description: "Choose the year values used in registration and profiles.",
    href: "/admin/lookup-settings/year-of-study-options",
  },
  {
    key: "availabilityTimeSlots",
    title: "Availability Time Slots",
    description: "Keep provider availability slots consistent across the app.",
    href: "/admin/lookup-settings/availability-time-slots",
  },
];

const emptyLookupState: Record<LookupGroupKey, LookupItem[]> = {
  serviceCategories: [],
  universities: [],
  issueTypes: [],
  yearOfStudyOptions: [],
  availabilityTimeSlots: [],
};

export default function AdminLookupSettings() {
  const [items, setItems] = useState(emptyLookupState);

  useEffect(() => {
    const unsubscribers = lookupGroups.map((group) =>
      onSnapshot(
        collection(db, group.key),
        (snapshot) => {
          setItems((current) => ({
            ...current,
            [group.key]: snapshot.docs.map(
              (docSnap) => docSnap.data() as LookupItem,
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
      yearOfStudyOptions: items.yearOfStudyOptions.filter((item) => item.active !== false).length,
      availabilityTimeSlots: items.availabilityTimeSlots.filter((item) => item.active !== false).length,
    }),
    [items],
  );

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-900">Lookup Settings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Choose a lookup area to manage categories, universities, issue types, year options, and time slots.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {lookupGroups.map((group) => (
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
