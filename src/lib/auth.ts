import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Role } from "./role-routes";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  university: string;
  degree: string;
  yearOfStudy: string;
  role: Role;
  emailVerified: boolean;
  createdAt: Date | null;
  neededSkills?: string[];
  providerProfile?: {
    skills: string[];
    proficiency: string;
    availability: string[];
    bio: string;
    gigImages?: string[];
  };
  settings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    profileVisibility: boolean;
  };
  favorites?: Record<string, unknown>[];
}

// ─── Register Buyer ───────────────────────────────────────────────────────────

export async function registerBuyer(data: {
  name: string;
  email: string;
  password: string;
  university: string;
  degree: string;
  yearOfStudy: string;
}): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password,
  );

  const user = credential.user;

  // Save user profile to Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name: data.name,
    email: data.email,
    university: data.university,
    degree: data.degree,
    yearOfStudy: data.yearOfStudy,
    role: "buyer",
    emailVerified: false,
    createdAt: serverTimestamp(),
  });

  // Send email verification
  await sendEmailVerification(user);

  return user;
}

// ─── Check Buyer History ──────────────────────────────────────────────────────

/**
 * Checks Firestore to see if the user has any active/completed service requests
 * as a buyer.
 */
export async function checkBuyerHistory(uid: string): Promise<boolean> {
  const requestsQuery = query(
    collection(db, "requests"),
    where("buyerId", "==", uid),
  );
  const requestsSnap = await getDocs(requestsQuery);
  return !requestsSnap.empty;
}

// ─── Login with Smart Redirect ────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string,
): Promise<{
  user: User;
  redirectPath: string;
}> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Fetch user profile from Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    throw new Error("User profile not found. Please contact support.");
  }

  const profile = userDoc.data() as UserProfile;
  const role = profile.role;

  if (role === "both") {
    const hasBuyerHistory = await checkBuyerHistory(user.uid);
    return {
      user,
      redirectPath: hasBuyerHistory ? "/home/both" : "/home/provider",
    };
  }

  return { user, redirectPath: `/home/${role}` };
}

// ─── Upgrade Buyer → Provider ─────────────────────────────────────────────────

export async function upgradeToProvider(
  uid: string,
  providerData: {
    university: string;
    degree: string;
    yearOfStudy: string;
    skills: string[];
    proficiency: string;
    availability: string[];
    bio: string;
  },
): Promise<string> {
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error("User not found.");
  }

  // Only grant "both" role if the user has actual buyer request history.
  // Without history they stay as "provider" so the navbar/shell renders
  // the correct provider-only UI. The role is upgraded to "both"
  // automatically when they submit their first buyer request.
  const hasBuyerHistory = await checkBuyerHistory(uid);
  const newRole = hasBuyerHistory ? "both" : "provider";

  await updateDoc(userRef, {
    role: newRole,
    university: providerData.university,
    degree: providerData.degree,
    yearOfStudy: providerData.yearOfStudy,
    providerProfile: {
      skills: providerData.skills,
      proficiency: providerData.proficiency,
      availability: providerData.availability,
      bio: providerData.bio,
    },
  });

  return hasBuyerHistory ? "/home/both" : "/home/provider";
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ─── Resend Email Verification ────────────────────────────────────────────────

export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is currently signed in.");
  await sendEmailVerification(user);
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ─── Get Current User Profile ─────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return userDoc.data() as UserProfile;
}
