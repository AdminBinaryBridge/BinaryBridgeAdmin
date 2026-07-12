import { FieldValue } from "firebase-admin/firestore";

import { getAdminFirestore } from "./admin";
import { isFirebaseAdminConfigured } from "./config";

const CATEGORIES_COLLECTION = "CategoryConfig";
const CATEGORIES_DOC = "main";

export type CategoryRecord = {
  name: string;
  subcategories: string[];
};

export type CategoriesResult =
  | { ok: true; categories: CategoryRecord[] }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

export type MutationResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

export async function addCategory(name: string): Promise<MutationResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const ref = getAdminFirestore()
      .collection(CATEGORIES_COLLECTION)
      .doc(CATEGORIES_DOC);

    const doc = await ref.get();
    if (doc.exists && name in (doc.data() ?? {})) {
      return { ok: false, reason: "error", message: "Category already exists." };
    }

    await ref.set({ [name]: [] }, { merge: true });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function addSubCategory(
  categoryName: string,
  subCategoryName: string,
): Promise<MutationResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const ref = getAdminFirestore()
      .collection(CATEGORIES_COLLECTION)
      .doc(CATEGORIES_DOC);

    const doc = await ref.get();
    const data = doc.data() ?? {};

    if (!(categoryName in data)) {
      return { ok: false, reason: "error", message: "Category does not exist." };
    }

    const existing: string[] = Array.isArray(data[categoryName])
      ? (data[categoryName] as string[])
      : [];

    const duplicate = existing.some(
      (s) => s.trim().toLowerCase() === subCategoryName.trim().toLowerCase(),
    );
    if (duplicate) {
      return { ok: false, reason: "error", message: `"${subCategoryName}" already exists in ${categoryName}.` };
    }

    await ref.update({ [categoryName]: FieldValue.arrayUnion(subCategoryName) });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function renameCategory(
  oldName: string,
  newName: string,
): Promise<MutationResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const db = getAdminFirestore();
    const ref = db.collection(CATEGORIES_COLLECTION).doc(CATEGORIES_DOC);

    await db.runTransaction(async (t) => {
      const doc = await t.get(ref);
      const data = doc.data() ?? {};

      if (!(oldName in data)) {
        throw new Error("Category does not exist.");
      }
      if (newName in data) {
        throw new Error(`"${newName}" already exists.`);
      }

      t.update(ref, {
        [oldName]: FieldValue.delete(),
        [newName]: data[oldName],
      });
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteCategory(name: string): Promise<MutationResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    await getAdminFirestore()
      .collection(CATEGORIES_COLLECTION)
      .doc(CATEGORIES_DOC)
      .update({ [name]: FieldValue.delete() });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function renameSubCategory(
  categoryName: string,
  oldName: string,
  newName: string,
): Promise<MutationResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const db = getAdminFirestore();
    const ref = db.collection(CATEGORIES_COLLECTION).doc(CATEGORIES_DOC);

    await db.runTransaction(async (t) => {
      const doc = await t.get(ref);
      const data = doc.data() ?? {};

      if (!(categoryName in data)) {
        throw new Error("Category does not exist.");
      }

      const arr: string[] = Array.isArray(data[categoryName])
        ? (data[categoryName] as string[])
        : [];

      const duplicate = arr.some(
        (s) => s.trim().toLowerCase() === newName.trim().toLowerCase() && s !== oldName,
      );
      if (duplicate) {
        throw new Error(`"${newName}" already exists in ${categoryName}.`);
      }

      t.update(ref, { [categoryName]: arr.map((s) => (s === oldName ? newName : s)) });
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteSubCategory(
  categoryName: string,
  subName: string,
): Promise<MutationResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    await getAdminFirestore()
      .collection(CATEGORIES_COLLECTION)
      .doc(CATEGORIES_DOC)
      .update({ [categoryName]: FieldValue.arrayRemove(subName) });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteCategories(names: string[]): Promise<MutationResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }
  if (names.length === 0) return { ok: true };

  try {
    const update: Record<string, FirebaseFirestore.FieldValue> = {};
    for (const name of names) update[name] = FieldValue.delete();

    await getAdminFirestore()
      .collection(CATEGORIES_COLLECTION)
      .doc(CATEGORIES_DOC)
      .update(update);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// itemsByCategory: category name -> list of subcategory names to remove from it.
export async function deleteSubCategories(
  itemsByCategory: Record<string, string[]>,
): Promise<MutationResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const entries = Object.entries(itemsByCategory).filter(([, subs]) => subs.length > 0);
  if (entries.length === 0) return { ok: true };

  try {
    const update: Record<string, FirebaseFirestore.FieldValue> = {};
    for (const [categoryName, subs] of entries) {
      update[categoryName] = FieldValue.arrayRemove(...subs);
    }

    await getAdminFirestore()
      .collection(CATEGORIES_COLLECTION)
      .doc(CATEGORIES_DOC)
      .update(update);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getCategories(): Promise<CategoriesResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const doc = await getAdminFirestore()
      .collection(CATEGORIES_COLLECTION)
      .doc(CATEGORIES_DOC)
      .get();

    if (!doc.exists) {
      return { ok: true, categories: [] };
    }

    const data = doc.data() ?? {};

    const categories: CategoryRecord[] = Object.entries(data)
      .map(([name, value]) => ({
        name,
        subcategories: Array.isArray(value)
          ? value.filter((v): v is string => typeof v === "string")
          : [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { ok: true, categories };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
