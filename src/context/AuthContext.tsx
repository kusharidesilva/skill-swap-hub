"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, type UserProfile } from "@/lib/auth";

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  // Refreshes role or profile changes without making the user sign in again.
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase restores the session first, then we load the matching Firestore profile.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Features such as provider registration call this after updating the profile.
  const refreshProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
  }, []);

  // One provider gives every client page the same live authentication state.
  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
