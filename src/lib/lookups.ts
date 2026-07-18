"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AVAILABILITY_TIME_SLOTS,
  ISSUE_TYPES,
  SERVICE_CATEGORIES,
  YEAR_OF_STUDY_OPTIONS,
} from "@/lib/platform";
import { UNIVERSITIES } from "@/lib/universities";

export type LookupCollection =
  | "serviceCategories"
  | "universities"
  | "issueTypes"
  | "yearOfStudyOptions"
  | "availabilityTimeSlots";

type LookupRecord = {
  name?: string;
  label?: string;
  categoryName?: string;
  universityName?: string;
  issueTypeName?: string;
  yearName?: string;
  timeSlotName?: string;
  active?: boolean;
  status?: string;
};

const lookupDefaults: Record<LookupCollection, readonly string[]> = {
  serviceCategories: SERVICE_CATEGORIES,
  universities: UNIVERSITIES,
  issueTypes: ISSUE_TYPES,
  yearOfStudyOptions: YEAR_OF_STUDY_OPTIONS,
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
            return isLookupActive(data) ? readLookupName(data, docSnap.id) : "";
          })
          .filter(Boolean)
          .sort((left, right) => left.localeCompare(right));

        setRemoteState({
          collectionName,
          options: uniqueOptions(nextOptions),
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
    const remoteOptions =
      remoteState?.collectionName === collectionName ? remoteState.options : [];

    return uniqueOptions(
      isStaticCollection ? defaults : remoteOptions.length ? remoteOptions : defaults,
    );
  }, [collectionName, defaults, isStaticCollection, remoteState]);
}
