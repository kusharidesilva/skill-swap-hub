"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AVAILABILITY_DAYS,
  AVAILABILITY_TIME_SLOTS,
  ISSUE_TYPES,
  MANAGED_SERVICE_CATEGORIES,
  YEAR_OF_STUDY_OPTIONS,
} from "@/lib/platform";
import { UNIVERSITIES } from "@/lib/universities";

export type LookupCollection =
  | "serviceCategories"
  | "universities"
  | "issueTypes"
  | "yearOfStudyOptions"
  | "availabilityDays"
  | "availabilityTimeSlots";

type LookupRecord = {
  name?: string;
  label?: string;
  categoryName?: string;
  universityName?: string;
  issueTypeName?: string;
  yearName?: string;
  dayName?: string;
  timeSlotName?: string;
  active?: boolean;
  status?: string;
};

const lookupDefaults: Record<LookupCollection, readonly string[]> = {
  serviceCategories: MANAGED_SERVICE_CATEGORIES,
  universities: UNIVERSITIES,
  issueTypes: ISSUE_TYPES,
  yearOfStudyOptions: YEAR_OF_STUDY_OPTIONS,
  availabilityDays: AVAILABILITY_DAYS,
  availabilityTimeSlots: AVAILABILITY_TIME_SLOTS,
};

const STATIC_LOOKUP_COLLECTIONS: ReadonlySet<LookupCollection> = new Set([
  "yearOfStudyOptions",
]);

function readLookupName(data: LookupRecord, fallbackId: string) {
  return (
    data.name ||
    data.label ||
    data.categoryName ||
    data.universityName ||
    data.issueTypeName ||
    data.yearName ||
    data.dayName ||
    data.timeSlotName ||
    fallbackId
  ).trim();
}

function isLookupActive(data: LookupRecord) {
  if (data.active === false) return false;
  if (typeof data.status === "string") {
    return data.status.toLowerCase() !== "inactive";
  }
  return true;
}

function uniqueOptions(values: readonly string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function sortLookupOptions(
  collectionName: LookupCollection,
  values: readonly string[],
) {
  const defaultOrder = lookupDefaults[collectionName].map((value) =>
    value.trim().toLowerCase(),
  );
  const orderIndex = new Map(
    defaultOrder.map((value, index) => [value, index]),
  );

  return [...values].sort((left, right) => {
    const leftKey = left.trim().toLowerCase();
    const rightKey = right.trim().toLowerCase();
    const leftIndex = orderIndex.get(leftKey);
    const rightIndex = orderIndex.get(rightKey);

    if (leftIndex !== undefined && rightIndex !== undefined) {
      return leftIndex - rightIndex;
    }
    if (leftIndex !== undefined) {
      return -1;
    }
    if (rightIndex !== undefined) {
      return 1;
    }

    return left.localeCompare(right);
  });
}

export function useLookupOptions(collectionName: LookupCollection) {
  const defaults = lookupDefaults[collectionName];
  const isStaticCollection = STATIC_LOOKUP_COLLECTIONS.has(collectionName);
  const [remoteState, setRemoteState] = useState<{
    collectionName: LookupCollection;
    options: string[];
  } | null>(null);

  useEffect(() => {
    if (isStaticCollection) {
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        const nextOptions = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as LookupRecord;
            const name = isLookupActive(data) ? readLookupName(data, docSnap.id) : "";
            return name;
          })
          .filter(Boolean);

        setRemoteState({
          collectionName,
          options: uniqueOptions(sortLookupOptions(collectionName, nextOptions)),
        });
      },
      (error) => {
        console.error(`Error loading ${collectionName} lookup values:`, error);
        setRemoteState({ collectionName, options: [] });
      },
    );

    return () => unsubscribe();
  }, [collectionName, isStaticCollection]);

  return useMemo(() => {
    if (isStaticCollection) {
      return uniqueOptions(sortLookupOptions(collectionName, defaults));
    }

    const remoteOptions =
      remoteState?.collectionName === collectionName ? remoteState.options : [];

    return uniqueOptions(
      sortLookupOptions(collectionName, remoteOptions),
    );
  }, [collectionName, defaults, isStaticCollection, remoteState]);
}
