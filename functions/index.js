"use strict";

const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");

initializeApp();

const db = getFirestore();
const DAY_MS = 24 * 60 * 60 * 1000;
const DONE_REMINDER_MS = 5 * DAY_MS;
const REVIEW_REMINDER_MS = 2 * DAY_MS;
const REVIEW_WARNING_MS = 2 * DAY_MS;
const REVIEW_SUSPENSION_MS = 2 * DAY_MS;

const REQUEST_COLLECTIONS = [
  {
    name: "requests",
    statusField: "status",
    buyerIdField: "buyerId",
    titleField: "title",
  },
  {
    name: "directServiceRequests",
    statusField: "requestStatus",
    buyerIdField: "buyerUserId",
    titleField: "serviceTitle",
  },
];

exports.enforceRequestReviewDeadlines = onSchedule(
  {
    schedule: "every 1 hours",
    timeZone: "Asia/Colombo",
    region: "asia-south1",
    timeoutSeconds: 540,
    memory: "256MiB",
  },
  async () => {
    const snapshots = await Promise.all(
      REQUEST_COLLECTIONS.map((config) =>
        db
          .collection(config.name)
          .where(config.statusField, "in", [
            "working",
            "accepted",
            "in_progress",
            "done",
            "review_pending",
            "completed",
          ])
          .get(),
      ),
    );

    let checked = 0;
    for (let index = 0; index < REQUEST_COLLECTIONS.length; index += 1) {
      const config = REQUEST_COLLECTIONS[index];
      for (const requestSnapshot of snapshots[index].docs) {
        checked += 1;
        await processRequest(config, requestSnapshot);
      }
    }

    logger.info("Request compliance audit completed", { checked });
  },
);

async function processRequest(config, requestSnapshot) {
  const request = requestSnapshot.data();
  const status = normalizeStatus(request[config.statusField] || request.status);
  const requestTitle = request[config.titleField] || "your skill exchange";
  const buyerId = request[config.buyerIdField] || request.buyerId || "";
  const providerId = request.providerId || "";

  if (["working", "accepted", "in_progress"].includes(status)) {
    await handleProviderDoneReminder({
      config,
      requestSnapshot,
      request,
      requestTitle,
      providerId,
    });
    return;
  }

  if (status === "done" && !request.review) {
    await handleReviewDeadline({
      config,
      requestSnapshot,
      request,
      requestTitle,
      userId: buyerId,
      counterpartName: request.providerName || "your provider",
      role: "buyer",
      baseTime: toMillis(request.deliveredAt || request.updatedAt || request.createdAt),
    });
    return;
  }

  if (
    ["review_pending", "completed"].includes(status) &&
    request.review &&
    !request.providerReview
  ) {
    await handleReviewDeadline({
      config,
      requestSnapshot,
      request,
      requestTitle,
      userId: providerId,
      counterpartName: request.buyerName || "your buyer",
      role: "provider",
      baseTime: toMillis(request.buyerReviewedAt || request.updatedAt || request.createdAt),
    });
  }
}

async function handleProviderDoneReminder({
  config,
  requestSnapshot,
  request,
  requestTitle,
  providerId,
}) {
  if (!providerId || providerId === "general" || request.providerDoneReminderSentAt) {
    return;
  }

  const acceptedAt = toMillis(request.acceptedAt || request.updatedAt || request.createdAt);
  if (!acceptedAt || Date.now() - acceptedAt < DONE_REMINDER_MS) return;

  await writeReminder({
    requestRef: requestSnapshot.ref,
    markerField: "providerDoneReminderSentAt",
    notificationId: notificationId(
      "provider_done_reminder",
      config.name,
      requestSnapshot.id,
      providerId,
    ),
    notification: {
      userId: providerId,
      title: "Mark service as done",
      description: `If you have finished "${requestTitle}", please mark it as done.`,
      type: "request",
      icon: "request",
      tone: "indigo",
      href: "/incoming-requests",
      destination: "/incoming-requests",
      metadata: {
        kind: "provider_done_reminder",
        requestId: requestSnapshot.id,
        sourceCollection: config.name,
      },
    },
  });
}

async function handleReviewDeadline({
  config,
  requestSnapshot,
  request,
  requestTitle,
  userId,
  counterpartName,
  role,
  baseTime,
}) {
  if (!userId || !baseTime) return;

  const prefix = role === "buyer" ? "buyerReview" : "providerReview";
  const reminderField = `${prefix}ReminderSentAt`;
  const warningField = `${prefix}WarningSentAt`;
  const suspendedField = `${prefix}SuspendedAt`;
  const reminderTime = toMillis(request[reminderField]);
  const warningTime = toMillis(request[warningField]);
  const now = Date.now();
  const href = role === "buyer" ? "/request-service" : "/incoming-requests";

  if (warningTime && now - warningTime >= REVIEW_SUSPENSION_MS) {
    await suspendForMissingReview({
      config,
      requestSnapshot,
      requestTitle,
      userId,
      counterpartName,
      role,
      suspendedField,
      href,
    });
    return;
  }

  if (reminderTime && !warningTime && now - reminderTime >= REVIEW_WARNING_MS) {
    await writeReminder({
      requestRef: requestSnapshot.ref,
      markerField: warningField,
      notificationId: notificationId(
        `${prefix}_warning`,
        config.name,
        requestSnapshot.id,
        userId,
      ),
      notification: {
        userId,
        title: "Final review warning",
        description: `Rate and review ${counterpartName} for "${requestTitle}" within 2 days or your account will be suspended.`,
        type: "system",
        icon: "alert-triangle",
        tone: "red",
        href,
        destination: href,
        metadata: {
          kind: "review_compliance_warning",
          requestId: requestSnapshot.id,
          sourceCollection: config.name,
          reviewRole: role,
        },
      },
    });
    return;
  }

  if (!reminderTime && now - baseTime >= REVIEW_REMINDER_MS) {
    await writeReminder({
      requestRef: requestSnapshot.ref,
      markerField: reminderField,
      notificationId: notificationId(
        `${prefix}_reminder`,
        config.name,
        requestSnapshot.id,
        userId,
      ),
      notification: {
        userId,
        title: "Rating and review required",
        description: `The work for "${requestTitle}" is complete. Please rate and review ${counterpartName}.`,
        type: "review",
        icon: "review",
        tone: "indigo",
        href,
        destination: href,
        metadata: {
          kind: "review_compliance",
          requestId: requestSnapshot.id,
          sourceCollection: config.name,
          reviewRole: role,
        },
      },
    });
  }
}

async function writeReminder({ requestRef, markerField, notificationId, notification }) {
  const markerSnapshot = await requestRef.get();
  if (!markerSnapshot.exists || markerSnapshot.get(markerField)) return;

  const batch = db.batch();
  batch.set(db.collection("notifications").doc(notificationId), {
    ...notification,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(requestRef, {
    [markerField]: FieldValue.serverTimestamp(),
  });
  await batch.commit();
}

async function suspendForMissingReview({
  config,
  requestSnapshot,
  requestTitle,
  userId,
  counterpartName,
  role,
  suspendedField,
  href,
}) {
  const userRef = db.collection("users").doc(userId);
  const notificationRef = db
    .collection("notifications")
    .doc(notificationId("review_suspension", config.name, requestSnapshot.id, userId));

  await db.runTransaction(async (transaction) => {
    const [userSnapshot, latestRequestSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(requestSnapshot.ref),
    ]);

    if (!userSnapshot.exists || userSnapshot.get("accountStatus") === "suspended") return;
    if (!latestRequestSnapshot.exists || latestRequestSnapshot.get(suspendedField)) return;

    const suspensionReason = `Your account was suspended because you did not rate and review ${counterpartName} for "${requestTitle}" after the final warning.`;
    transaction.update(userRef, {
      accountStatus: "suspended",
      suspensionCode: "review_overdue",
      suspensionTitle: "Account suspended for missing rating and review",
      suspensionReason,
      suspensionRequestId: requestSnapshot.id,
      suspendedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(requestSnapshot.ref, {
      [suspendedField]: FieldValue.serverTimestamp(),
    });
    transaction.set(notificationRef, {
      userId,
      title: "Account suspended",
      description: suspensionReason,
      type: "system",
      icon: "alert-triangle",
      tone: "red",
      href,
      destination: href,
      metadata: {
        kind: "review_suspension",
        requestId: requestSnapshot.id,
        sourceCollection: config.name,
        reviewRole: role,
      },
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

function notificationId(kind, collectionName, requestId, userId) {
  return `${kind}__${collectionName}__${requestId}__${userId}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return new Date(value).getTime() || 0;
}
