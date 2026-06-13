import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

import { getFirebaseClientConfig } from "./config";

const globalForFirebase = globalThis as typeof globalThis & {
  firebaseClientApp?: FirebaseApp;
  firebaseClientDb?: Firestore;
};

function getClientApp(): FirebaseApp {
  if (globalForFirebase.firebaseClientApp) {
    return globalForFirebase.firebaseClientApp;
  }

  const app = getApps().length
    ? getApp()
    : initializeApp(getFirebaseClientConfig());

  globalForFirebase.firebaseClientApp = app;
  return app;
}

export function getClientFirestore(): Firestore {
  if (!globalForFirebase.firebaseClientDb) {
    globalForFirebase.firebaseClientDb = getFirestore(getClientApp());
  }

  return globalForFirebase.firebaseClientDb;
}
