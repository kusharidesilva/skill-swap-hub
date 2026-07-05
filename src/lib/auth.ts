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
import { dashboardHref, homeHref, type Role } from "./role-routes";

// This is the shared shape of a user document stored in Firestore.

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
    gigs?: ProviderGig[];
  };
  settings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    profileVisibility: boolean;
  };
  favorites?: Record<string, unknown>[];
}

export interface ProviderGig {
  title: string;
  category: string;
  summary: string;
  description: string;
  delivery: string;
  availability: string[];
  tags: string[];
  image: string;
}

// Creates both the Firebase login and its matching Firestore profile.
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

  // The UID joins the authentication account to the application profile.
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

  // Access remains limited until the student verifies this address.
  await sendEmailVerification(user);

  return user;
}

// A request made as a buyer is what turns a provider account into a dual-role account.
export async function checkBuyerHistory(uid: string): Promise<boolean> {
  const requestsQuery = query(
    collection(db, "requests"),
    where("buyerId", "==", uid),
  );
  const requestsSnap = await getDocs(requestsQuery);
  return !requestsSnap.empty;
}

// Signs the user in and chooses the first screen from their saved role and activity.
export async function loginUser(
  email: string,
  password: string,
): Promise<{
  user: User;
  redirectPath: string;
}> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Authentication stores credentials; the application role lives in Firestore.
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    throw new Error("User profile not found. Please contact support.");
  }

  const profile = userDoc.data() as UserProfile;
  const role = profile.role;

  // A dual-role user with buyer activity returns to the combined dashboard.
  if (role === "both") {
    const hasBuyerHistory = await checkBuyerHistory(user.uid);
    return {
      user,
      redirectPath: hasBuyerHistory
        ? dashboardHref("both")
        : homeHref("provider"),
    };
  }

  return {
    user,
    redirectPath: role === "provider" ? homeHref("provider") : dashboardHref(role),
  };
}

// Adds provider details to an existing account without creating a second user.
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

  // Buyer history preserves both modes; otherwise this becomes provider-only for now.
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

  return hasBuyerHistory ? homeHref("both") : homeHref("provider");
}

// Firebase sends the secure reset link, so no password is handled by this app.
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is currently signed in.");
  await sendEmailVerification(user);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Returns null when authentication exists but its profile document is missing.
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return userDoc.data() as UserProfile;
}
