import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type PropagateUserProfileOptions = {
  uid: string;
  name: string;
  profileImageUrl?: string;
};

type PendingUpdate = {
  ref: DocumentReference;
  data: Record<string, unknown>;
};

function mergePendingUpdate(
  updates: Map<string, PendingUpdate>,
  ref: DocumentReference,
  data: Record<string, unknown>,
) {
  const existing = updates.get(ref.path);
  if (existing) {
    existing.data = {
      ...existing.data,
      ...data,
    };
    return;
  }

  updates.set(ref.path, { ref, data });
}

async function addQueryUpdates(
  updates: Map<string, PendingUpdate>,
  collectionName: string,
  field: string,
  value: string,
  mapData: (data: Record<string, unknown>) => Record<string, unknown>,
) {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where(field, "==", value)),
  );

  snapshot.forEach((entry) => {
    mergePendingUpdate(
      updates,
      doc(db, collectionName, entry.id),
      mapData(entry.data() as Record<string, unknown>),
    );
  });
}

async function commitPendingUpdates(updates: Map<string, PendingUpdate>) {
  const pending = Array.from(updates.values());

  for (let index = 0; index < pending.length; index += 400) {
    const batch = writeBatch(db);
    const slice = pending.slice(index, index + 400);

    slice.forEach(({ ref, data }) => {
      batch.update(ref, data);
    });

    await batch.commit();
  }
}

export async function propagateUserProfileReferences({
  uid,
  name,
  profileImageUrl = "",
}: PropagateUserProfileOptions) {
  const trimmedName = name.trim();
  const nextProfileImageUrl = profileImageUrl.trim();
  const updates = new Map<string, PendingUpdate>();

  await Promise.all([
    addQueryUpdates(updates, "requests", "buyerId", uid, () => ({
      buyerName: trimmedName,
    })),
    addQueryUpdates(updates, "requests", "providerId", uid, () => ({
      providerName: trimmedName,
    })),
    addQueryUpdates(updates, "directServiceRequests", "buyerUserId", uid, () => ({
      buyerName: trimmedName,
    })),
    addQueryUpdates(updates, "directServiceRequests", "providerId", uid, () => ({
      providerName: trimmedName,
    })),
    addQueryUpdates(updates, "serviceOrders", "buyerUserId", uid, () => ({
      buyerName: trimmedName,
    })),
    addQueryUpdates(updates, "serviceOrders", "providerId", uid, () => ({
      providerName: trimmedName,
    })),
    addQueryUpdates(updates, "gigs", "providerId", uid, () => ({
      providerName: trimmedName,
      providerImage: nextProfileImageUrl,
    })),
    addQueryUpdates(updates, "reports", "reporterId", uid, () => ({
      reporterName: trimmedName,
    })),
    addQueryUpdates(updates, "reports", "targetUserId", uid, () => ({
      targetUserName: trimmedName,
      reportedUserName: trimmedName,
    })),
    addQueryUpdates(updates, "reports", "reportedUserId", uid, () => ({
      targetUserName: trimmedName,
      reportedUserName: trimmedName,
    })),
  ]);

  const chatSnapshot = await getDocs(
    query(collection(db, "chats"), where("participants", "array-contains", uid)),
  );

  const messageUpdateJobs = chatSnapshot.docs.map(async (chatEntry) => {
    const chatData = chatEntry.data() as Record<string, unknown>;
    const participantRoles =
      typeof chatData.participantRoles === "object" && chatData.participantRoles
        ? (chatData.participantRoles as Record<string, unknown>)
        : {};
    const roleForUser = participantRoles[uid];
    const chatUpdate: Record<string, unknown> = {
      [`participantNames.${uid}`]: trimmedName,
    };

    if (
      roleForUser === "provider" &&
      typeof chatData.serviceContext === "object" &&
      chatData.serviceContext
    ) {
      chatUpdate["serviceContext.providerName"] = trimmedName;
    }

    mergePendingUpdate(updates, doc(db, "chats", chatEntry.id), chatUpdate);

    const messagesSnapshot = await getDocs(
      query(
        collection(db, `chats/${chatEntry.id}/messages`),
        where("senderId", "==", uid),
      ),
    );

    messagesSnapshot.forEach((messageEntry) => {
      mergePendingUpdate(
        updates,
        doc(db, `chats/${chatEntry.id}/messages`, messageEntry.id),
        { senderName: trimmedName },
      );
    });
  });

  await Promise.all(messageUpdateJobs);
  await commitPendingUpdates(updates);
}
