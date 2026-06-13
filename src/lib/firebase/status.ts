import { isFirebaseAdminConfigured } from "./config";
import { getAdminFirestore } from "./admin";

export type FirestoreStatus =
  | { state: "not_configured" }
  | { state: "connected"; projectId: string; collectionCount: number }
  | { state: "error"; projectId: string; message: string };

export async function getFirestoreStatus(): Promise<FirestoreStatus> {
  if (!isFirebaseAdminConfigured()) {
    return { state: "not_configured" };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID!;

  try {
    const db = getAdminFirestore();
    const collections = await db.listCollections();

    return {
      state: "connected",
      projectId,
      collectionCount: collections.length,
    };
  } catch (error) {
    return {
      state: "error",
      projectId,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
