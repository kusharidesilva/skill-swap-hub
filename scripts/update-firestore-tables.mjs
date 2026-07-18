import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";

const DEFAULT_PROJECT_ID = "skill-swap-hub-eca37";
const ADMIN_EMAIL = "kusharidesilva3@gmail.com";
const REQUIREMENT_SOURCE = "system-requirements-2026-07";
const FIREBASE_CLI_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const args = new Set(process.argv.slice(2));
const applyChanges = args.has("--apply");
const skipUsers = args.has("--skip-users");
const projectArg = process.argv.find((arg) => arg.startsWith("--project="));
const projectId =
  projectArg?.split("=").slice(1).join("=") ||
  process.env.FIREBASE_PROJECT_ID ||
  DEFAULT_PROJECT_ID;

if (!/^[a-z0-9-]+$/.test(projectId)) {
  throw new Error(`Unexpected Firebase project id: ${projectId}`);
}

const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

function getFirebaseCliAuth() {
  const raw = execFileSync(
    process.env.ComSpec || "cmd.exe",
    [
      "/d",
      "/s",
      "/c",
      `npx.cmd firebase-tools login:list --json --project ${projectId}`,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const parsed = JSON.parse(raw);
  const auth = parsed.result?.[0];
  const token = auth?.tokens?.access_token;

  if (!token) {
    throw new Error("Firebase CLI is not logged in. Run `npx firebase-tools login` first.");
  }

  return auth;
}

async function getFirestoreAccessToken() {
  const auth = getFirebaseCliAuth();
  const refreshToken = auth.tokens?.refresh_token;
  const clientId = auth.user?.aud || auth.user?.azp;

  if (!refreshToken || !clientId) return auth.tokens.access_token;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: FIREBASE_CLI_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const bodyText = await response.text();
    console.warn(`Datastore token exchange failed: ${response.status} ${bodyText}`);
    return auth.tokens.access_token;
  }

  const token = await response.json();
  console.warn("Using refreshed Cloud Platform OAuth token.");
  return token.access_token || auth.tokens.access_token;
}

function extractConstArray(filePath, constName) {
  const source = readFileSync(filePath, "utf8");
  const match = source.match(
    new RegExp(`export const ${constName} = \\[([\\s\\S]*?)\\] as const;`),
  );
  if (!match) throw new Error(`Could not find ${constName} in ${filePath}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function extractUniversities(filePath) {
  const source = readFileSync(filePath, "utf8");
  return [...source.matchAll(/^\s*"([^"]+)":\s*\[([^\]]*)\]/gm)].map(
    ([, name, domainBlock]) => ({
      name,
      domains: [...domainBlock.matchAll(/"([^"]+)"/g)].map((item) => item[1]),
    }),
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "item";
}

function documentUrl(collectionPath, documentId) {
  const collection = collectionPath.split("/").map(encodeURIComponent).join("/");
  return `${firestoreBase}/${collection}/${encodeURIComponent(documentId)}`;
}

function collectionUrl(collectionPath, pageToken) {
  const collection = collectionPath.split("/").map(encodeURIComponent).join("/");
  const url = new URL(`${firestoreBase}/${collection}`);
  url.searchParams.set("pageSize", "1000");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  return url;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: "NULL_VALUE" };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, toFirestoreValue(item)]),
      ),
    },
  };
}

function fromFirestoreValue(value) {
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return new Date(value.timestampValue);
  if ("arrayValue" in value) {
    return (value.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ("mapValue" in value) {
    return fromFirestoreFields(value.mapValue.fields || {});
  }
  return null;
}

function toFirestoreFields(data) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(value)]),
  );
}

function fromFirestoreFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]),
  );
}

async function requestFirestore(accessToken, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method || "GET"} ${url} failed: ${response.status} ${body}`);
  }

  return response.status === 204 ? null : response.json();
}

async function upsertDocument(accessToken, collectionPath, documentId, data) {
  if (!applyChanges) return;

  const url = new URL(documentUrl(collectionPath, documentId));
  Object.keys(data).forEach((fieldPath) => {
    if (data[fieldPath] !== undefined) {
      url.searchParams.append("updateMask.fieldPaths", fieldPath);
    }
  });

  await requestFirestore(accessToken, url, {
    method: "PATCH",
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
}

async function listCollection(accessToken, collectionPath) {
  const documents = [];
  let pageToken = "";

  do {
    const result = await requestFirestore(
      accessToken,
      collectionUrl(collectionPath, pageToken),
    );
    documents.push(...(result.documents || []));
    pageToken = result.nextPageToken || "";
  } while (pageToken);

  return documents.map((document) => ({
    id: document.name.split("/").pop(),
    data: fromFirestoreFields(document.fields || {}),
  }));
}

async function seedLookup(accessToken, collectionPath, items, buildExtra = () => ({})) {
  const now = new Date();
  let count = 0;

  for (const [index, item] of items.entries()) {
    const name = typeof item === "string" ? item : item.name;
    const documentId = slugify(name);
    await upsertDocument(accessToken, collectionPath, documentId, {
      name,
      label: name,
      active: true,
      status: "active",
      sortOrder: index + 1,
      source: REQUIREMENT_SOURCE,
      createdAt: now,
      updatedAt: now,
      ...buildExtra(item),
    });
    count += 1;
  }

  return count;
}

function userPatchFor(data) {
  const now = new Date();
  const email = String(data.email || "").trim().toLowerCase();
  const patch = {};

  if (email === ADMIN_EMAIL) {
    return {
      role: "admin",
      accountStatus: "active",
      accountType: data.accountType || "non-student",
      userType: "non_student",
      providerVerificationStatus: "not_required",
      canBuyServices: false,
      canSellServices: false,
      verifiedStudentProvider: false,
      updatedAt: now,
    };
  }

  const looksStudent = Boolean(data.university || data.degree || data.yearOfStudy);
  const accountType = data.accountType || (looksStudent ? "student" : "non-student");

  if (!data.accountType) patch.accountType = accountType;
  if (!data.userType) patch.userType = accountType === "student" ? "student" : "non_student";
  if (!data.favorites) patch.favorites = [];
  if (!data.settings) {
    patch.settings = {
      emailNotifications: true,
      pushNotifications: true,
      profileVisibility: true,
    };
  }

  if (accountType === "non-student") {
    if (!data.role) patch.role = "buyer";
    if (!data.providerVerificationStatus) patch.providerVerificationStatus = "not_required";
    if (!data.accountStatus) patch.accountStatus = "pending_email_verification";
    if (data.accountStatus === "active" || data.emailVerified === true) {
      patch.accountStatus = "active";
      patch.emailVerified = true;
      patch.canBuyServices = true;
    } else if (data.canBuyServices === undefined) {
      patch.canBuyServices = false;
    }
    if (data.canSellServices !== false) patch.canSellServices = false;
    if (data.verifiedStudentProvider !== false) patch.verifiedStudentProvider = false;
  } else {
    const verificationStatus = data.providerVerificationStatus || "pending";
    if (!data.providerVerificationStatus) patch.providerVerificationStatus = verificationStatus;

    if (verificationStatus === "approved") {
      patch.accountStatus = "active";
      patch.canSellServices = true;
      patch.verifiedStudentProvider = true;
    } else if (verificationStatus === "rejected") {
      patch.accountStatus = "active";
      patch.canSellServices = false;
      patch.verifiedStudentProvider = false;
    } else {
      patch.accountStatus = "pending_admin_verification";
      patch.canSellServices = false;
      patch.verifiedStudentProvider = false;
    }

    if (data.canBuyServices === undefined) {
      patch.canBuyServices = data.role === "both";
    }
  }

  if (Object.keys(patch).length > 0) patch.updatedAt = now;
  return patch;
}

function normalizedProviderProfileFor(userId, user) {
  const profile = user.providerProfile;
  if (!profile) return null;

  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const categories = Array.isArray(profile.categories)
    ? profile.categories
    : Array.isArray(profile.servicesOffered)
      ? profile.servicesOffered
      : [];

  return {
    providerId: userId,
    userId,
    name: user.name || "",
    email: user.email || "",
    university: user.university || "",
    degree: user.degree || "",
    yearOfStudy: user.yearOfStudy || "",
    skills,
    servicesOffered: profile.servicesOffered || skills,
    categories,
    availability: profile.availability || [],
    availabilitySlots: profile.availabilitySlots || [],
    bio: profile.bio || "",
    verificationStatus: user.providerVerificationStatus || "pending",
    status: user.canSellServices ? "active" : "pending",
    updatedAt: new Date(),
  };
}

function gigDocumentsFor(userId, user) {
  const profile = user.providerProfile || {};
  const gigs = Array.isArray(profile.gigs) ? profile.gigs : [];
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const images = Array.isArray(profile.gigImages) ? profile.gigImages : [];

  return gigs.map((gig, index) => {
    const title = gig.title || skills[index] || `Service Gig ${index + 1}`;
    const gigId = gig.id || `${userId}-${index}-${slugify(title)}`;
    const category = gig.category || "Other";
    const image = gig.sampleWorkUrl || gig.image || images[index] || "/img/package%201.jpg";

    return {
      gigId,
      userGig: {
        ...gig,
        id: gigId,
        title,
        category,
        image,
        sampleWorkUrl: image,
        status: gig.status || "active",
      },
      document: {
        gigId,
        providerId: userId,
        providerName: user.name || "Provider",
        university: user.university || "",
        degreeName: user.degree || "",
        yearOfStudy: user.yearOfStudy || "",
        categoryId: slugify(category),
        category,
        title,
        description: gig.description || gig.summary || "",
        summary: gig.summary || "",
        price: Number(gig.price || 0),
        currency: "LKR",
        availability: gig.availability || profile.availability || [],
        sampleWorkUrl: image,
        image,
        tags: gig.tags || [category],
        delivery: gig.delivery || "",
        gigStatus: gig.status || "active",
        status: gig.status || "active",
        source: REQUIREMENT_SOURCE,
        updatedAt: new Date(),
      },
    };
  });
}

async function migrateUsers(accessToken) {
  const users = await listCollection(accessToken, "users");
  let patchedUsers = 0;
  let providerProfiles = 0;
  let categories = 0;
  let availability = 0;
  let gigs = 0;

  for (const user of users) {
    const patch = userPatchFor(user.data);
    const gigDocuments = gigDocumentsFor(user.id, user.data);
    const normalizedGigs = gigDocuments.map((entry) => entry.userGig);

    if (normalizedGigs.length > 0) {
      patch.providerProfile = {
        ...(user.data.providerProfile || {}),
        gigs: normalizedGigs,
      };
    }

    if (Object.keys(patch).length > 0) {
      await upsertDocument(accessToken, "users", user.id, patch);
      patchedUsers += 1;
    }

    const providerProfile = normalizedProviderProfileFor(user.id, user.data);
    if (providerProfile) {
      await upsertDocument(accessToken, "providerProfiles", user.id, providerProfile);
      providerProfiles += 1;

      const serviceCategories = [
        ...new Set([
          ...(providerProfile.categories || []),
          ...gigDocuments.map((entry) => entry.document.category),
        ]),
      ].filter(Boolean);

      for (const [index, category] of serviceCategories.entries()) {
        await upsertDocument(
          accessToken,
          "providerServiceCategories",
          `${user.id}_${slugify(category)}`,
          {
            providerId: user.id,
            category,
            categoryId: slugify(category),
            active: true,
            sortOrder: index + 1,
            updatedAt: new Date(),
          },
        );
        categories += 1;
      }

      for (const [index, slot] of (providerProfile.availability || []).entries()) {
        await upsertDocument(
          accessToken,
          "providerAvailability",
          `${user.id}_${slugify(String(slot))}`,
          {
            providerId: user.id,
            slot: String(slot),
            active: true,
            sortOrder: index + 1,
            updatedAt: new Date(),
          },
        );
        availability += 1;
      }
    }

    for (const entry of gigDocuments) {
      await upsertDocument(accessToken, "gigs", entry.gigId, entry.document);
      gigs += 1;
    }
  }

  return { patchedUsers, providerProfiles, categories, availability, gigs };
}

async function verifyLookupCounts(accessToken) {
  const collections = [
    "serviceCategories",
    "universities",
    "issueTypes",
    "availabilityTimeSlots",
  ];

  const counts = {};
  for (const collection of collections) {
    counts[collection] = (await listCollection(accessToken, collection)).length;
  }
  return counts;
}

async function main() {
  const accessToken = await getFirestoreAccessToken();
  const serviceCategories = extractConstArray("src/lib/platform.ts", "SERVICE_CATEGORIES");
  const issueTypes = extractConstArray("src/lib/platform.ts", "ISSUE_TYPES");
  const timeSlots = extractConstArray("src/lib/platform.ts", "AVAILABILITY_TIME_SLOTS");
  const universities = extractUniversities("src/lib/universities.ts");

  const summary = {
    mode: applyChanges ? "applied" : "dry-run",
    projectId,
    lookups: {
      serviceCategories: await seedLookup(accessToken, "serviceCategories", serviceCategories),
      universities: await seedLookup(
        accessToken,
        "universities",
        universities,
        (item) => ({ domains: item.domains }),
      ),
      issueTypes: await seedLookup(accessToken, "issueTypes", issueTypes),
      availabilityTimeSlots: await seedLookup(
        accessToken,
        "availabilityTimeSlots",
        timeSlots,
      ),
    },
    userMigration: skipUsers ? "skipped" : await migrateUsers(accessToken),
    verifiedLiveCounts: await verifyLookupCounts(accessToken),
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!applyChanges) {
    console.log("Dry run only. Re-run with --apply to write these Firestore documents.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
