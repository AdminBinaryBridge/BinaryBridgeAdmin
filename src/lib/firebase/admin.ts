import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getDatabase, type Database } from "firebase-admin/database";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

import { getFirebaseAdminEnv } from "./config";

const globalForFirebase = globalThis as typeof globalThis & {
  firebaseAdminApp?: App;
  firebaseAdminDb?: Firestore;
  firebaseAdminRtdb?: Database;
};

function getAdminApp(): App {
  if (globalForFirebase.firebaseAdminApp) {
    return globalForFirebase.firebaseAdminApp;
  }

  const existing = getApps()[0];
  if (existing) {
    globalForFirebase.firebaseAdminApp = existing;
    return existing;
  }

  const env = getFirebaseAdminEnv();
  const app = initializeApp({
    credential: cert({
      projectId: env.projectId,
      clientEmail: env.clientEmail,
      privateKey: env.privateKey,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  globalForFirebase.firebaseAdminApp = app;
  return app;
}

export function getAdminFirestore(): Firestore {
  if (!globalForFirebase.firebaseAdminDb) {
    globalForFirebase.firebaseAdminDb = getFirestore(getAdminApp());
  }

  return globalForFirebase.firebaseAdminDb;
}

export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDatabase(): Database {
  if (!globalForFirebase.firebaseAdminRtdb) {
    globalForFirebase.firebaseAdminRtdb = getDatabase(getAdminApp());
  }

  return globalForFirebase.firebaseAdminRtdb;
}
