/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, signInWithGoogle, logout, db, handleFirestoreError, OperationType } from "./firebase";
import { Power } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggled, setToggled] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const statusRef = doc(db, "system", "status");
    const unsubscribeDb = onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        setToggled(snapshot.data().toggled === true);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "system/status");
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDb();
    };
  }, []);

  const isAuthorized = user?.email === "aelbshlawy13@gmail.com";

  const handleToggle = async () => {
    if (!isAuthorized) return;
    const newState = !toggled;
    setToggled(newState); // Optimistic UI update
    
    try {
      await setDoc(doc(db, "system", "status"), { toggled: newState });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "system/status");
      // Revert optimistic update on failure
      setToggled(!newState);
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center justify-center p-8 font-sans">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        {loading ? (
          <div className="w-24 h-10 bg-neutral-800 animate-pulse rounded-md" />
        ) : user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">{user.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm font-medium rounded-md transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="px-4 py-2 bg-white text-black hover:bg-neutral-200 text-sm font-medium rounded-md transition-colors"
          >
            Sign in with Google
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-12 max-w-md w-full">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 via-white to-zinc-500 animate-text-gradient select-none drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
          Platinum
        </h1>

        <div className="flex flex-col items-center gap-6 p-8 bg-neutral-800/50 rounded-3xl w-full border border-neutral-800">
          <div className="flex items-center justify-between w-full">
            <span className="text-lg font-medium text-neutral-300">
              System Status
            </span>
            <span
              className={`text-sm font-mono px-3 py-1 rounded-full ${
                toggled
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {toggled ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          
          {isAuthorized && (
            <button
              onClick={handleToggle}
              className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-500 mt-4 ${
                toggled
                  ? "bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] text-emerald-950"
                  : "bg-neutral-800 text-neutral-500 hover:bg-neutral-700 shadow-xl"
              }`}
            >
              <Power className={`w-10 h-10 transition-transform duration-500 ${toggled ? "scale-110" : ""}`} />
            </button>
          )}
        </div>

        <p className="text-center text-sm font-medium text-neutral-500 max-w-sm">
          System state is actively maintained and regulated by authorized personnel.
        </p>
      </div>

      <div className="absolute bottom-6 text-neutral-600 text-xs font-mono">
        &copy; {new Date().getFullYear()} EditorAI.
      </div>
    </div>
  );
}
