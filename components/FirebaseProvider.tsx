'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useGameStore } from '@/store/useGameStore';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthReady } = useGameStore();
  const [error, setError] = useState<Error | null>(null);

  if (error) throw error;

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
            setAuthReady(true);
          } else {
             // Create the user profile since it doesn't exist yet
             import('firebase/firestore').then(({ setDoc, serverTimestamp }) => {
               setDoc(userRef, {
                 uid: firebaseUser.uid,
                 displayName: firebaseUser.displayName || 'Player',
                 email: firebaseUser.email || null,
                 photoURL: firebaseUser.photoURL || null,
                 coins: 1000, // Initial coins
                 createdAt: serverTimestamp()
               }).catch(e => console.error("Error creating user profile", e));
             });
          }
        }, (err: any) => {
           if (err.code === 'permission-denied' && !auth.currentUser) {
             // Ignore error caused by signing out before unsubscribe
             return;
           }
           try {
             handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
           } catch (e) {
             setError(e as Error);
           }
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
