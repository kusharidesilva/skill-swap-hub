import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut as firebaseSignOut,
  updateEmail,
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
import { ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import {
  dashboardHref,
  homeHref,
  type Role,
  type UserRole,
} from "./role-routes";
import {
  ALLOWED_STUDENT_PROOF_MIME_TYPES,
  isAllowedStudentProofFile,
  STUDENT_PROOF_EXTENSIONS,
  type AccountStatus,
  type AccountType,
  type AvailabilitySlot,
  type ProviderVerificationStatus,
  type ServiceCategory,
  type StudentProofType,
  isPendingAdminVerificationStatus,
} from "./platform";

const STUDENT_PROOF_CONTENT_TYPES: Record<
  (typeof STUDENT_PROOF_EXTENSIONS)[number],
  string
> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

// This is the shared shape of a user document stored in Firestore.
export interface StudentProofDocument {
  fileName: string;
  fileType: StudentProofType;
  contentType: string;
  size: number;
  storagePath: string;
  downloadUrl?: string;
  uploadedAt: Date | null;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  university: string;
  degree: string;
  yearOfStudy: string;
  role: UserRole;
  accountType?: AccountType;
  userType?: "student" | "non_student";
  accountStatus?: AccountStatus;
  providerVerificationStatus?: ProviderVerificationStatus;
  canBuyServices?: boolean;
  canSellServices?: boolean;
  verifiedStudentProvider?: boolean;
  studentProof?: StudentProofDocument;
  adminNote?: string;
  emailVerified: boolean;
  createdAt: Date | null;
  updatedAt?: Date | null;
  neededSkills?: string[];
  providerProfile?: {
    skills: string[];
    servicesOffered?: string[];
    categories?: ServiceCategory[];
    proficiency: string;
    availability: string[];
    availabilitySlots?: AvailabilitySlot[];
    bio: string;
    sampleWorkImages?: string[];
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
  price?: number | string;
  delivery: string;
  availability: string[];
  tags: string[];
  image: string;
  images?: string[];
  id?: string;
  sampleWorkUrl?: string;
  status?: "active" | "inactive" | "removed";
}

export type RegisterUserData =
  | {
      accountType: "non-student";
      name: string;
      email: string;
      password: string;
      phoneNumber?: string;
    }
  | {
      accountType: "student";
      name: string;
      email: string;
      password: string;
      phoneNumber?: string;
      university: string;
      degree: string;
      yearOfStudy: string;
      proofType: StudentProofType;
      proofFile: File;
    };

export const AUTHORIZED_ADMIN_EMAILS = ["kusharidesilva3@gmail.com"] as const;

export function accountNeedsEmailVerification(accountType?: AccountType) {
  return accountType !== "student";
}

export function isAuthorizedAdminEmail(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();
  return Boolean(
    normalizedEmail &&
    AUTHORIZED_ADMIN_EMAILS.some(
      (authorizedEmail) => authorizedEmail.toLowerCase() === normalizedEmail,
    ),
  );
}

async function ensureAuthorizedAdminProfile(
  user: User,
  existingProfile?: UserProfile | null,
) {
  const normalizedEmail = user.email?.trim().toLowerCase();
  const isExistingAdmin = existingProfile?.role === "admin";

  if (!isExistingAdmin && !isAuthorizedAdminEmail(normalizedEmail)) {
    throw new Error("This account is not authorized for admin access.");
  }

  const userRef = doc(db, "users", user.uid);
  const isNewProfile = !existingProfile;

  await setDoc(
    userRef,
    {
      uid: user.uid,
      name: existingProfile?.name || user.displayName || "System Administrator",
      email: normalizedEmail,
      university: existingProfile?.university || "",
      degree: existingProfile?.degree || "",
      yearOfStudy: existingProfile?.yearOfStudy || "",
      role: "admin",
      accountType: existingProfile?.accountType || "non-student",
      userType: existingProfile?.userType || "non_student",
      accountStatus: "active",
      providerVerificationStatus: "not_required",
      canBuyServices: false,
      canSellServices: false,
      verifiedStudentProvider: false,
      emailVerified: user.emailVerified,
      settings: existingProfile?.settings || {
        emailNotifications: true,
        pushNotifications: true,
        profileVisibility: false,
      },
      favorites: existingProfile?.favorites || [],
      updatedAt: serverTimestamp(),
      ...(isNewProfile ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true },
  );

  const refreshedProfile = await getUserProfile(user.uid);
  if (!refreshedProfile) {
    throw new Error("Admin profile could not be created.");
  }

  return refreshedProfile;
}

function safeStorageFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function resolveStudentProofContentType(file: File) {
  if (
    file.type &&
    (ALLOWED_STUDENT_PROOF_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtension = STUDENT_PROOF_EXTENSIONS.find(
    (item) => item === extension,
  );

  return (
    (allowedExtension && STUDENT_PROOF_CONTENT_TYPES[allowedExtension]) ||
    "application/octet-stream"
  );
}

async function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out. Please try again.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function uploadStudentProof(
  userId: string,
  file: File,
  proofType: StudentProofType,
) {
  if (!isAllowedStudentProofFile(file)) {
    throw new Error(
      "Student proof must be PDF, DOC, DOCX, PNG, JPG, or JPEG and under 2 MB.",
    );
  }

  const storagePath = `student-proofs/${userId}/${Date.now()}-${safeStorageFileName(file.name)}`;
  const proofRef = ref(storage, storagePath);
  const contentType = resolveStudentProofContentType(file);

  await uploadBytes(proofRef, file, {
    contentType,
    customMetadata: {
      proofType,
      userId,
    },
  });

  return {
    fileName: file.name,
    fileType: proofType,
    contentType,
    size: file.size,
    storagePath,
    uploadedAt: serverTimestamp(),
  };
}

function isEmailAlreadyInUseError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return message.includes("email-already-in-use");
}

async function createOrResumeRegistrationUser(data: RegisterUserData) {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password,
    );

    return {
      user: credential.user,
      canCleanupAuthUser: true,
    };
  } catch (error) {
    if (!isEmailAlreadyInUseError(error)) {
      throw error;
    }

    let credential: Awaited<ReturnType<typeof signInWithEmailAndPassword>>;

    try {
      credential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
    } catch {
      throw error;
    }

    const existingProfile = await getUserProfile(credential.user.uid);
    if (existingProfile) {
      throw error;
    }

    return {
      user: credential.user,
      canCleanupAuthUser: true,
    };
  }
}

// Creates the Firebase login, main user record, and student approval request when needed.
export async function registerUser(data: RegisterUserData): Promise<User> {
  const { user, canCleanupAuthUser } = await createOrResumeRegistrationUser(data);
  await user.getIdToken(true);

  try {
    const isStudent = data.accountType === "student";
    const studentProof = isStudent
      ? await uploadStudentProof(user.uid, data.proofFile, data.proofType)
      : null;

    await runWithTimeout(
      setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber || "",
        university: isStudent ? data.university : "",
        degree: isStudent ? data.degree : "",
        yearOfStudy: isStudent ? data.yearOfStudy : "",
        role: isStudent ? "provider" : "buyer",
        accountType: data.accountType,
        userType: isStudent ? "student" : "non_student",
        accountStatus: isStudent
          ? "pending_admin_verification"
          : "pending_email_verification",
        providerVerificationStatus: isStudent ? "pending" : "not_required",
        canBuyServices: false,
        canSellServices: false,
        verifiedStudentProvider: false,
        studentProof,
        emailVerified: false,
        settings: {
          emailNotifications: true,
          pushNotifications: true,
          profileVisibility: true,
        },
        favorites: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      10000,
      "Account profile setup",
    );

    if (isStudent && studentProof) {
      await runWithTimeout(
        setDoc(doc(db, "providerVerifications", user.uid), {
          userId: user.uid,
          studentName: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber || "",
          university: data.university,
          degree: data.degree,
          yearOfStudy: data.yearOfStudy,
          proof: studentProof,
          status: "pending",
          adminNote: "",
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        10000,
        "Verification request setup",
      );
    }

    if (accountNeedsEmailVerification(data.accountType)) {
      await sendEmailVerification(user);
    }
  } catch (error) {
    if (canCleanupAuthUser) {
      try {
        await deleteUser(user);
      } catch {
        // Best-effort cleanup for partially created auth accounts.
      }
    }

    throw error;
  }

  return user;
}

// Kept for older imports; new registration should call registerUser directly.
export async function registerBuyer(data: {
  name: string;
  email: string;
  password: string;
  university?: string;
  degree?: string;
  yearOfStudy?: string;
}): Promise<User> {
  return registerUser({
    accountType: "non-student",
    name: data.name,
    email: data.email,
    password: data.password,
  });
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
  profile: UserProfile;
  redirectPath: string;
}> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Authentication stores credentials; the application role lives in Firestore.
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    throw new Error("User profile not found. Please contact support.");
  }

  let profile = userDoc.data() as UserProfile;

  if (
    accountNeedsEmailVerification(profile.accountType) &&
    user.emailVerified
  ) {
    const updates: Partial<UserProfile> = {
      emailVerified: true,
      accountStatus: "active",
      canBuyServices: true,
    };

    await updateDoc(doc(db, "users", user.uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    profile = {
      ...profile,
      ...updates,
    };
  }

  const redirectPath = await getPostLoginRedirect(profile, user.uid);

  return {
    user,
    profile,
    redirectPath,
  };
}

// Admin login is intentionally stricter than normal login: Firebase proves the
// password, then Firestore decides whether the account may enter /admin.
export async function loginAdmin(
  email: string,
  password: string,
): Promise<{
  user: User;
  profile: UserProfile;
}> {
  let user: User;

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    user = credential.user;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";

    if (
      message.includes("user-not-found") ||
      message.includes("invalid-credential") ||
      message.includes("wrong-password")
    ) {
      try {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        user = credential.user;
      } catch (createError: unknown) {
        const createMessage =
          createError instanceof Error ? createError.message : "";
        if (createMessage.includes("email-already-in-use")) {
          throw error;
        }
        throw createError;
      }
    } else {
      throw error;
    }
  }

  const profile = await getUserProfile(user.uid);

  const nextProfile =
    !profile ||
    profile.role !== "admin" ||
    user.email?.trim().toLowerCase() !== profile.email?.trim().toLowerCase()
      ? await ensureAuthorizedAdminProfile(user, profile)
      : profile;

  if (nextProfile.role !== "admin") {
    await firebaseSignOut(auth);
    throw new Error("This account is not authorized for admin access.");
  }

  if (nextProfile.accountStatus === "suspended") {
    await firebaseSignOut(auth);
    throw new Error("This admin account is suspended.");
  }

  return { user, profile: nextProfile };
}

export async function getPostLoginRedirect(
  profile: UserProfile,
  uid: string,
): Promise<string> {
  if (profile.accountStatus === "suspended") {
    throw new Error("This account is suspended. Please contact support.");
  }

  if (profile.role === "admin") {
    return "/admin";
  }

  if (
    isPendingAdminVerificationStatus(profile.accountStatus) ||
    profile.providerVerificationStatus === "pending"
  ) {
    return "/pending-verification";
  }

  if (profile.role === "both") {
    const hasBuyerHistory = await checkBuyerHistory(uid);
    return hasBuyerHistory ? dashboardHref("both") : homeHref("provider");
  }

  return profile.role === "provider"
    ? homeHref("provider")
    : dashboardHref(profile.role as Role);
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

  const currentProfile = userDoc.data() as UserProfile;
  const alreadyProvider =
    currentProfile.role === "provider" ||
    currentProfile.role === "both" ||
    currentProfile.providerVerificationStatus === "approved";

  if (!alreadyProvider) {
    if (currentProfile.accountType === "non-student") {
      throw new Error(
        "Only verified university students can become providers.",
      );
    }

    throw new Error(
      "Your student provider verification is still waiting for admin approval.",
    );
  }

  // Buyer history preserves both modes; otherwise this becomes provider-only for now.
  const hasBuyerHistory = await checkBuyerHistory(uid);
  const newRole = hasBuyerHistory ? "both" : "provider";

  await updateDoc(userRef, {
    role: newRole,
    accountStatus: "active",
    providerVerificationStatus: "approved",
    canSellServices: true,
    verifiedStudentProvider: true,
    university: providerData.university,
    degree: providerData.degree,
    yearOfStudy: providerData.yearOfStudy,
    providerProfile: {
      skills: providerData.skills,
      categories: providerData.skills,
      proficiency: providerData.proficiency,
      availability: providerData.availability,
      bio: providerData.bio,
    },
    updatedAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "providerProfiles", uid),
    {
      providerId: uid,
      userId: uid,
      university: providerData.university,
      degreeName: providerData.degree,
      yearOfStudy: providerData.yearOfStudy,
      providerBio: providerData.bio,
      serviceCategories: providerData.skills,
      availability: providerData.availability,
      providerStatus: "approved",
      averageRating: 0,
      totalReviews: 0,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

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

export async function changeSignedInEmail(
  currentPassword: string,
  newEmail: string,
): Promise<void> {
  const user = auth.currentUser;

  if (!user?.email) {
    throw new Error("No user is currently signed in.");
  }

  const trimmedEmail = newEmail.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error("Enter the new email address first.");
  }

  if (trimmedEmail === user.email.trim().toLowerCase()) {
    throw new Error("Enter a different email address.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updateEmail(user, trimmedEmail);
  await sendEmailVerification(user);
}

export async function activateVerifiedEmailUser(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    emailVerified: true,
    accountStatus: "active",
    canBuyServices: true,
    updatedAt: serverTimestamp(),
  });
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
