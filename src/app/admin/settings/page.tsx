import type { Metadata } from "next";

import {
  getFirebaseAdminConfigStatus,
  isFirebaseClientConfigured,
} from "@/lib/firebase/config";
import { getFirestoreStatus } from "@/lib/firebase/status";

export const metadata: Metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          : "inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      }
    >
      {label}
    </span>
  );
}

export default async function AdminSettingsPage() {
  const adminStatus = getFirebaseAdminConfigStatus();
  const clientConfigured = isFirebaseClientConfigured();
  const firestoreStatus = await getFirestoreStatus();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Settings
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Firebase connection status and setup instructions.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Connection status
        </h3>
        <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Firebase Web SDK
            </span>
            <StatusBadge
              ok={clientConfigured}
              label={clientConfigured ? "Configured" : "Missing"}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Firebase Admin SDK
            </span>
            <StatusBadge
              ok={adminStatus.configured}
              label={
                adminStatus.configured
                  ? `Configured (${adminStatus.source})`
                  : "Not configured"
              }
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Firestore
            </span>
            <StatusBadge
              ok={firestoreStatus.state === "connected"}
              label={
                firestoreStatus.state === "connected"
                  ? "Connected"
                  : firestoreStatus.state === "error"
                    ? "Error"
                    : "Not connected"
              }
            />
          </div>
        </div>
        {firestoreStatus.state === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {firestoreStatus.message}
          </p>
        )}
      </section>

      {!adminStatus.configured && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Set up Firebase Admin (required for Firestore)
          </h3>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Easiest option: save the service account JSON file
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Open{" "}
                <a
                  href="https://console.firebase.google.com/project/binarybridge-a87e6/settings/serviceaccounts/adminsdk"
                  className="text-blue-600 underline dark:text-blue-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Firebase → Project settings → Service accounts
                </a>
              </li>
              <li>Click <strong>Generate new private key</strong></li>
              <li>
                Save the downloaded file in the project root. Either name works:
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <code className="rounded bg-zinc-200 px-1 font-mono text-xs dark:bg-zinc-800">
                      firebase-service-account.json
                    </code>
                  </li>
                  <li>
                    Firebase&apos;s default name, e.g.{" "}
                    <code className="rounded bg-zinc-200 px-1 font-mono text-xs dark:bg-zinc-800">
                      *-firebase-adminsdk-*.json
                    </code>
                  </li>
                </ul>
              </li>
              <li>
                Restart the dev server:{" "}
                <code className="rounded bg-zinc-200 px-1 font-mono text-xs dark:bg-zinc-800">
                  npm run dev
                </code>
              </li>
            </ol>
            <p className="mt-4 font-medium text-zinc-900 dark:text-zinc-100">
              Alternative: add to <code className="font-mono text-xs">.env.local</code>
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-zinc-200 p-3 font-mono text-xs dark:bg-zinc-800">
{`FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@binarybridge-a87e6.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`}
            </pre>
            <p className="mt-3 text-xs text-zinc-500">
              Copy <code className="font-mono">client_email</code> and{" "}
              <code className="font-mono">private_key</code> from the downloaded
              JSON. Never commit this file or key.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
