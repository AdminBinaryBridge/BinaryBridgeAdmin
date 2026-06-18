"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import {
  addCategory,
  addSubCategory,
  renameCategory,
  deleteCategory,
  renameSubCategory,
  deleteSubCategory,
} from "@/lib/firebase/categories";

async function requireSession() {
  const session = await getSession();
  if (!session) return { ok: false as const, reason: "error" as const, message: "Unauthorized." };
  return null;
}

export async function addCategoryAction(formData: FormData) {
  const unauth = await requireSession();
  if (unauth) return unauth;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false as const, reason: "error" as const, message: "Category name is required." };

  const result = await addCategory(name);
  if (result.ok) revalidatePath("/admin/categories");
  return result;
}

export async function addSubCategoryAction(formData: FormData) {
  const unauth = await requireSession();
  if (unauth) return unauth;

  const categoryName = String(formData.get("categoryName") ?? "").trim();
  const subCategoryName = String(formData.get("subCategoryName") ?? "").trim();

  if (!categoryName) return { ok: false as const, reason: "error" as const, message: "Please select a category." };
  if (!subCategoryName) return { ok: false as const, reason: "error" as const, message: "Subcategory name is required." };

  const result = await addSubCategory(categoryName, subCategoryName);
  if (result.ok) revalidatePath("/admin/categories");
  return result;
}

export async function renameCategoryAction(formData: FormData) {
  const unauth = await requireSession();
  if (unauth) return unauth;

  const oldName = String(formData.get("oldName") ?? "").trim();
  const newName = String(formData.get("newName") ?? "").trim();

  if (!oldName || !newName) return { ok: false as const, reason: "error" as const, message: "Name is required." };

  const result = await renameCategory(oldName, newName);
  if (result.ok) revalidatePath("/admin/categories");
  return result;
}

export async function deleteCategoryAction(formData: FormData) {
  const unauth = await requireSession();
  if (unauth) return unauth;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false as const, reason: "error" as const, message: "Name is required." };

  const result = await deleteCategory(name);
  if (result.ok) revalidatePath("/admin/categories");
  return result;
}

export async function renameSubCategoryAction(formData: FormData) {
  const unauth = await requireSession();
  if (unauth) return unauth;

  const categoryName = String(formData.get("categoryName") ?? "").trim();
  const oldName = String(formData.get("oldName") ?? "").trim();
  const newName = String(formData.get("newName") ?? "").trim();

  if (!categoryName || !oldName || !newName) return { ok: false as const, reason: "error" as const, message: "All fields are required." };

  const result = await renameSubCategory(categoryName, oldName, newName);
  if (result.ok) revalidatePath("/admin/categories");
  return result;
}

export async function deleteSubCategoryAction(formData: FormData) {
  const unauth = await requireSession();
  if (unauth) return unauth;

  const categoryName = String(formData.get("categoryName") ?? "").trim();
  const subName = String(formData.get("subName") ?? "").trim();

  if (!categoryName || !subName) return { ok: false as const, reason: "error" as const, message: "All fields are required." };

  const result = await deleteSubCategory(categoryName, subName);
  if (result.ok) revalidatePath("/admin/categories");
  return result;
}
