import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  description: string;
  type: "request" | "message" | "review" | "system" | "match";
  icon: string;
  tone: "blue" | "emerald" | "green" | "teal" | "indigo" | "red";
}

// All features use this helper so notifications share the same Firestore shape.
export async function createNotification(params: CreateNotificationParams) {
  try {
    await addDoc(collection(db, "notifications"), {
      ...params,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // A notification failure should not cancel the user's main action.
    console.error("Error creating notification:", err);
  }
}
