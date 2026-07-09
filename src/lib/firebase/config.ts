import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

type AdminCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

export type FirebaseAdminConfigStatus =
  | { configured: true; source: "env" | "json" | "file" }
  | { configured: false; missing: string[] };

function mapServiceAccount(
  parsed: ServiceAccountJson,
): AdminCredentials | null {
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    return null;
  }

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key,
  };
}

const SERVICE_ACCOUNT_FILENAME = "firebase-service-account.json";

function getDefaultServiceAccountPath(): string {
  return join(
    /* turbopackIgnore: true */ process.cwd(),
    SERVICE_ACCOUNT_FILENAME,
  );
}

function resolveServiceAccountPaths(): string[] {
  const paths: string[] = [];

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    paths.push(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  }

  paths.push(getDefaultServiceAccountPath());

  try {
    const cwd = /* turbopackIgnore: true */ process.cwd();
    const adminSdkFiles = readdirSync(cwd).filter(
      (name) => name.includes("firebase-adminsdk") && name.endsWith(".json"),
    );

    for (const name of adminSdkFiles) {
      paths.push(join(cwd, name));
    }
  } catch {
    // ignore unreadable project root
  }

  return [...new Set(paths)];
}

function loadServiceAccountFromFile(): AdminCredentials | null {
  for (const filePath of resolveServiceAccountPaths()) {
    if (!existsSync(filePath)) {
      continue;
    }

    try {
      const parsed = JSON.parse(
        readFileSync(filePath, "utf8"),
      ) as ServiceAccountJson;
      const creds = mapServiceAccount(parsed);
      if (creds) {
        return creds;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function projectIdFromClientEmail(clientEmail: string): string | null {
  const match = clientEmail.match(/@(.+)\.iam\.gserviceaccount\.com$/);
  return match?.[1] ?? null;
}

function loadAdminCredentials():
  | (AdminCredentials & { source: "env" | "json" | "file" })
  | null {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    try {
      const creds = mapServiceAccount(JSON.parse(jsonEnv) as ServiceAccountJson);
      if (creds) {
        return { ...creds, source: "json" };
      }
    } catch {
      // fall through to other credential sources
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId: projectIdFromClientEmail(clientEmail) ?? projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
      source: "env",
    };
  }

  const fileCreds = loadServiceAccountFromFile();
  if (fileCreds) {
    return { ...fileCreds, source: "file" };
  }

  return null;
}

export function getFirebaseAdminConfigStatus(): FirebaseAdminConfigStatus {
  const creds = loadAdminCredentials();
  if (creds) {
    return { configured: true, source: creds.source };
  }

  const missing: string[] = [];

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      missing.push("FIREBASE_CLIENT_EMAIL");
    }
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      missing.push("FIREBASE_PRIVATE_KEY");
    }
  }

  const hasServiceAccountFile = resolveServiceAccountPaths().some((filePath) =>
    existsSync(filePath),
  );

  if (
    missing.length > 0 &&
    !process.env.FIREBASE_SERVICE_ACCOUNT_JSON &&
    !hasServiceAccountFile
  ) {
    missing.push(
      "service account JSON (firebase-service-account.json or *-firebase-adminsdk-*.json)",
    );
  }

  return { configured: false, missing };
}

export function isFirebaseAdminConfigured(): boolean {
  return loadAdminCredentials() !== null;
}

export { isFirebaseClientConfigured, getFirebaseClientConfig } from "./client-config";

export function getFirebaseAdminEnv() {
  const creds = loadAdminCredentials();

  if (!creds) {
    throw new Error(
      "Firebase Admin is not configured. Add service account credentials via FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, FIREBASE_SERVICE_ACCOUNT_JSON, or firebase-service-account.json in the project root.",
    );
  }

  return {
    projectId: creds.projectId,
    clientEmail: creds.clientEmail,
    privateKey: creds.privateKey,
  };
}
