import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import type { User } from "firebase/auth";

import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
} from "../lib/firebase";

interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && db) {
        try {
          const docRef = doc(db, "profiles", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile({
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfile({
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("EMAIL SIGNIN ERROR (RAW):", err);
      console.error("code:", err?.code);
      console.error("message:", err?.message);
      throw err;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    if (!auth || !db) throw new Error("Firebase not configured");

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(result.user, { displayName });

      await setDoc(doc(db, "profiles", result.user.uid), {
        displayName,
        email: result.user.email,
        photoURL: result.user.photoURL ?? null,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("SIGNUP ERROR (RAW):", err);
      console.error("code:", err?.code);
      console.error("message:", err?.message);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    if (!auth || !db || !googleProvider)
      throw new Error("Firebase not configured");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("AUTH OK:", result.user.uid);

      const docRef = doc(db, "profiles", result.user.uid);

      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error("GOOGLE SIGNIN ERROR:", err);
      console.error("code:", err?.code);
      console.error("message:", err?.message);
      throw err;
    }
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase not configured");
    await signOut(auth);
  };

  const value = {
    user,
    profile,
    loading,
    isConfigured: isFirebaseConfigured,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
