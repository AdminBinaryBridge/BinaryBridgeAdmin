import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getFirestore, type Firestore } from "firebase/firestore";

import { getFirebaseClientConfig } from "./client-config";

const globalForFirebase = globalThis as typeof globalThis & {
  firebaseClientApp?: FirebaseApp;
  firebaseClientDb?: Firestore;
  firebaseClientAuth?: Auth;
  firebaseClientRtdb?: Database;
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

export function getClientAuth(): Auth {
  if (!globalForFirebase.firebaseClientAuth) {
    globalForFirebase.firebaseClientAuth = getAuth(getClientApp());
  }

  return globalForFirebase.firebaseClientAuth;
}

export function getClientDatabase(): Database {
  if (!globalForFirebase.firebaseClientRtdb) {
    globalForFirebase.firebaseClientRtdb = getDatabase(getClientApp());
  }

  return globalForFirebase.firebaseClientRtdb;
}
