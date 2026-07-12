import { getAdminFirestore } from "./admin";
import { isFirebaseAdminConfigured } from "./config";

const VISITS_COLLECTION = "SiteVisits";

export type SiteVisitStats = {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
};

export type SiteVisitStatsResult =
  | { ok: true; stats: SiteVisitStats }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

function startOfDay(daysAgo: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function countSince(since: Date): Promise<number> {
  const snapshot = await getAdminFirestore()
    .collection(VISITS_COLLECTION)
    .where("createdAt", ">=", since)
    .count()
    .get();

  return snapshot.data().count;
}

export async function getSiteVisitStats(): Promise<SiteVisitStatsResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const collection = getAdminFirestore().collection(VISITS_COLLECTION);

    const [totalSnapshot, today, last7Days, last30Days] = await Promise.all([
      collection.count().get(),
      countSince(startOfDay(0)),
      countSince(startOfDay(6)),
      countSince(startOfDay(29)),
    ]);

    return {
      ok: true,
      stats: {
        total: totalSnapshot.data().count,
        today,
        last7Days,
        last30Days,
      },
    };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
