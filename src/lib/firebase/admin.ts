import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

import { getFirebaseAdminEnv } from "./config";

const globalForFirebase = globalThis as typeof globalThis & {
  firebaseAdminApp?: App;
  firebaseAdminDb?: Firestore;
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
