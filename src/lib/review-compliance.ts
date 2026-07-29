import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import { ADMIN_CONTACT_EMAIL, queueEmail, toMillis } from "@/lib/moderation";
import { scopedHref, type Role } from "@/lib/role-routes";

type ComplianceUser = {
  uid: string;
  name?: string;
  email?: string;
  role?: string;
  accountStatus?: string;
};

type ReviewRequestRecord = {
  id: string;
  title?: string;
  buyerId?: string;
  buyerName?: string;
  providerId?: string;
  providerName?: string;
  status?: string;
  review?: { rating?: number; comment?: string };
  providerReview?: { rating?: number; comment?: string };
  updatedAt?: { toMillis?: () => number; toDate?: () => Date };
  createdAt?: { toMillis?: () => number; toDate?: () => Date };
  deliveredAt?: { toMillis?: () => number; toDate?: () => Date };
  buyerReviewedAt?: { toMillis?: () => number; toDate?: () => Date };
  buyerReviewReminderSentAt?: { toMillis?: () => number; toDate?: () => Date };
  providerReviewReminderSentAt?: { toMillis?: () => number; toDate?: () => Date };
  buyerReviewSuspendedAt?: { toMillis?: () => number; toDate?: () => Date };
  providerReviewSuspendedAt?: { toMillis?: () => number; toDate?: () => Date };
};

const REVIEW_REMINDER_MS = 5 * 24 * 60 * 60 * 1000;
const REVIEW_SUSPENSION_MS = 15 * 24 * 60 * 60 * 1000;

export async function runReviewComplianceAuditForUser(user: ComplianceUser) {
  if (!user.uid || user.accountStatus === "suspended") {
    return;
  }

  const [buyerRequestsSnapshot, providerRequestsSnapshot] = await Promise.all([
    getDocs(query(collection(db, "requests"), where("buyerId", "==", user.uid))),
    getDocs(query(collection(db, "requests"), where("providerId", "==", user.uid))),
  ]);

  const seenIds = new Set<string>();
  const requests = [...buyerRequestsSnapshot.docs, ...providerRequestsSnapshot.docs]
    .filter((docSnap) => {
      if (seenIds.has(docSnap.id)) return false;
      seenIds.add(docSnap.id);
      return true;
    })
    .map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<ReviewRequestRecord, "id">),
    }));

  for (const request of requests) {
    if (request.buyerId === user.uid) {
      const result = await handleBuyerReviewCompliance(user, request);
      if (result === "suspended") return;
    }

    if (request.providerId === user.uid) {
      const result = await handleProviderReviewCompliance(user, request);
      if (result === "suspended") return;
    }
  }
}

async function handleBuyerReviewCompliance(user: ComplianceUser, request: ReviewRequestRecord) {
  const normalizedStatus = (request.status || "").trim().toLowerCase();
  const missingBuyerReview = normalizedStatus === "done" && !request.review;

  if (!missingBuyerReview) return "ok";

  const baseTime =
    toMillis(request.deliveredAt) ||
    toMillis(request.updatedAt) ||
    toMillis(request.createdAt);
  if (!baseTime) return "ok";

  const now = Date.now();
  const requestRef = doc(db, "requests", request.id);
  const reportTitle = request.title || "your completed skill exchange";
  const dashboardRole = resolveRole(user.role);
  const reminderHref = scopedHref("/request-service", dashboardRole);
  const msSinceBase = now - baseTime;

  if (msSinceBase >= REVIEW_SUSPENSION_MS && !toMillis(request.buyerReviewSuspendedAt)) {
    await suspendForMissingReview({
      user,
      requestId: request.id,
      requestTitle: reportTitle,
      requestRef,
      reminderField: "buyerReviewSuspendedAt",
      counterpartName: request.providerName || "the provider",
      reviewRoleLabel: "buyer",
    });
    return "suspended";
  }

  if (msSinceBase >= REVIEW_REMINDER_MS && !toMillis(request.buyerReviewReminderSentAt)) {
    const partnerName = request.providerName || "your provider";
    const description = `You still need to rate and review ${partnerName} for ${reportTitle}. Complete it within 10 more days to avoid account suspension.`;

    await createNotification({
      userId: user.uid,
      title: "Rating and review required",
      description,
      type: "review",
      icon: "review",
      tone: "indigo",
      href: reminderHref,
      destination: reminderHref,
      metadata: {
        kind: "review_compliance",
        requestId: request.id,
        requestTitle: reportTitle,
        reviewRole: "buyer",
      },
    });

    if (user.email) {
      await queueEmail({
        to: user.email,
        subject: "Reminder: submit your rating and review",
        text: [
          `Hi ${user.name || "there"},`,
          "",
          `You have not yet submitted your rating and review for ${partnerName} in ${reportTitle}.`,
          "Please complete it within the next 10 days to avoid account suspension.",
          "",
          `Open Skill Swap Hub: ${reminderHref}`,
          "",
          `Support: ${ADMIN_CONTACT_EMAIL}`,
        ].join("\n"),
        html: `<div style="font-family: Arial, sans-serif; line-height:1.6; color:#0f172a;">
          <h2 style="color:#1d4ed8;">Rating and review required</h2>
          <p>You have not yet submitted your rating and review for <strong>${escapeHtml(partnerName)}</strong> in <strong>${escapeHtml(reportTitle)}</strong>.</p>
          <p>Please complete it within the next <strong>10 days</strong> to avoid account suspension.</p>
          <p><a href="http://localhost:3000${reminderHref}" style="color:#1d4ed8;font-weight:700;">Open Skill Swap Hub</a></p>
          <p>Support: <a href="mailto:${ADMIN_CONTACT_EMAIL}">${ADMIN_CONTACT_EMAIL}</a></p>
        </div>`,
        metadata: {
          type: "review_reminder",
          requestId: request.id,
          userId: user.uid,
        },
      });
    }

    await updateDoc(requestRef, {
      buyerReviewReminderSentAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return "ok";
}

async function handleProviderReviewCompliance(user: ComplianceUser, request: ReviewRequestRecord) {
  const normalizedStatus = (request.status || "").trim().toLowerCase();
  const missingProviderReview =
    (normalizedStatus === "review_pending" ||
      (normalizedStatus === "completed" && Boolean(request.review))) &&
    !request.providerReview;

  if (!missingProviderReview || !request.review) return "ok";

  const baseTime =
    toMillis(request.buyerReviewedAt) ||
    toMillis(request.updatedAt) ||
    toMillis(request.createdAt);
  if (!baseTime) return "ok";

  const now = Date.now();
  const requestRef = doc(db, "requests", request.id);
  const requestTitle = request.title || "your completed skill exchange";
  const dashboardRole = resolveRole(user.role);
  const reminderHref = scopedHref("/incoming-requests", dashboardRole === "buyer" ? "provider" : dashboardRole);
  const msSinceBase = now - baseTime;

  if (msSinceBase >= REVIEW_SUSPENSION_MS && !toMillis(request.providerReviewSuspendedAt)) {
    await suspendForMissingReview({
      user,
      requestId: request.id,
      requestTitle,
      requestRef,
      reminderField: "providerReviewSuspendedAt",
      counterpartName: request.buyerName || "the buyer",
      reviewRoleLabel: "provider",
    });
    return "suspended";
  }

  if (msSinceBase >= REVIEW_REMINDER_MS && !toMillis(request.providerReviewReminderSentAt)) {
    const partnerName = request.buyerName || "your buyer";
    const description = `You still need to rate and review ${partnerName} for ${requestTitle}. Complete it within 10 more days to avoid account suspension.`;

    await createNotification({
      userId: user.uid,
      title: "Rating and review required",
      description,
      type: "review",
      icon: "review",
      tone: "indigo",
      href: reminderHref,
      destination: reminderHref,
      metadata: {
        kind: "review_compliance",
        requestId: request.id,
        requestTitle,
        reviewRole: "provider",
      },
    });

    if (user.email) {
      await queueEmail({
        to: user.email,
        subject: "Reminder: submit your rating and review",
        text: [
          `Hi ${user.name || "there"},`,
          "",
          `You have not yet submitted your rating and review for ${partnerName} in ${requestTitle}.`,
          "Please complete it within the next 10 days to avoid account suspension.",
          "",
          `Open Skill Swap Hub: ${reminderHref}`,
          "",
          `Support: ${ADMIN_CONTACT_EMAIL}`,
        ].join("\n"),
        html: `<div style="font-family: Arial, sans-serif; line-height:1.6; color:#0f172a;">
          <h2 style="color:#1d4ed8;">Rating and review required</h2>
          <p>You have not yet submitted your rating and review for <strong>${escapeHtml(partnerName)}</strong> in <strong>${escapeHtml(requestTitle)}</strong>.</p>
          <p>Please complete it within the next <strong>10 days</strong> to avoid account suspension.</p>
          <p><a href="http://localhost:3000${reminderHref}" style="color:#1d4ed8;font-weight:700;">Open Skill Swap Hub</a></p>
          <p>Support: <a href="mailto:${ADMIN_CONTACT_EMAIL}">${ADMIN_CONTACT_EMAIL}</a></p>
        </div>`,
        metadata: {
          type: "review_reminder",
          requestId: request.id,
          userId: user.uid,
        },
      });
    }

    await updateDoc(requestRef, {
      providerReviewReminderSentAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return "ok";
}

async function suspendForMissingReview(params: {
  user: ComplianceUser;
  requestId: string;
  requestTitle: string;
  requestRef: ReturnType<typeof doc>;
  reminderField: "buyerReviewSuspendedAt" | "providerReviewSuspendedAt";
  counterpartName: string;
  reviewRoleLabel: "buyer" | "provider";
}) {
  const suspensionReason = `Your account was suspended because you did not submit the required rating and review for ${params.counterpartName} in ${params.requestTitle} within 15 days.`;
  const userRef = doc(db, "users", params.user.uid);
  const dashboardRole = resolveRole(params.user.role);
  const href =
    params.reviewRoleLabel === "buyer"
      ? scopedHref("/request-service", dashboardRole)
      : scopedHref("/incoming-requests", dashboardRole === "buyer" ? "provider" : dashboardRole);

  await updateDoc(userRef, {
    accountStatus: "suspended",
    suspensionCode: "review_overdue",
    suspensionTitle: "Account suspended for missing rating and review",
    suspensionReason,
    suspensionRequestId: params.requestId,
    suspendedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(params.requestRef, {
    [params.reminderField]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    userId: params.user.uid,
    title: "Account suspended",
    description: `${suspensionReason} Contact ${ADMIN_CONTACT_EMAIL} if you need help.`,
    type: "system",
    icon: "alert-triangle",
    tone: "red",
    href,
    destination: href,
    metadata: {
      kind: "review_suspension",
      requestId: params.requestId,
      requestTitle: params.requestTitle,
    },
  });

  if (params.user.email) {
    await queueEmail({
      to: params.user.email,
      subject: "Your account has been suspended",
      text: [
        `Hi ${params.user.name || "there"},`,
        "",
        suspensionReason,
        "",
        `Support: ${ADMIN_CONTACT_EMAIL}`,
      ].join("\n"),
      html: `<div style="font-family: Arial, sans-serif; line-height:1.6; color:#0f172a;">
        <h2 style="color:#dc2626;">Account suspended</h2>
        <p>${escapeHtml(suspensionReason)}</p>
        <p>Support: <a href="mailto:${ADMIN_CONTACT_EMAIL}">${ADMIN_CONTACT_EMAIL}</a></p>
      </div>`,
      metadata: {
        type: "review_suspension",
        requestId: params.requestId,
        userId: params.user.uid,
      },
    });
  }
}

function resolveRole(role?: string): Role {
  return role === "provider" || role === "both" ? role : "buyer";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

