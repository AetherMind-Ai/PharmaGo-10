import React, { createContext, useContext, ReactNode } from 'react';
import { app, db, auth } from '../firebaseConfig'; // Import auth
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth'; // Import Auth type

interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth; // Add auth to interface
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  return (
    <FirebaseContext.Provider value={{ app, db, auth }}> {/* Provide auth */}
      {children}
    </FirebaseContext.Provider>
  );
};
