'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useGameStore } from '@/store/useGameStore';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthReady } = useGameStore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, listen to their document in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              displayName: data.displayName || firebaseUser.displayName,
              email: data.email || firebaseUser.email,
              photoURL: data.photoURL || firebaseUser.photoURL,
              coins: data.coins || 0,
            });
          } else {
             setUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              coins: 0,
            });
          }
          setAuthReady(true);
        }, (error) => {
           console.error("Error fetching user data:", error);
           setAuthReady(true);
        });

        return () => unsubscribeDoc();
      } else {
        // User is signed out
        setUser(null);
        setAuthReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, [setUser, setAuthReady]);

  return <>{children}</>;
}
