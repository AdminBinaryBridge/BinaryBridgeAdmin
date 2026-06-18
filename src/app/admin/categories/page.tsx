import type { Metadata } from "next";
import Link from "next/link";

import { AddCategoryForm } from "@/components/admin/add-category-form";
import { CategoryList } from "@/components/admin/category-list";
import { getCategories } from "@/lib/firebase/categories";

export const metadata: Metadata = {
  title: "Categories",
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const result = await getCategories();

  if (result.ok === false && result.reason === "not_configured") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Categories
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Firestore is not configured yet.
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Add your Firebase Admin credentials, then restart the dev server. See{" "}
          <Link href="/admin/settings" className="underline">
            Settings
          </Link>
          .
        </div>
      </div>
    );
  }

  if (result.ok === false) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Categories
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Could not load categories from Firestore.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          {result.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Categories
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {result.categories.length} categor{result.categories.length === 1 ? "y" : "ies"}{" "}
          ·{" "}
          {result.categories.reduce((sum, c) => sum + c.subcategories.length, 0)} subcategories
          {" "}from Firestore.
        </p>
      </div>
      <AddCategoryForm categories={result.categories} />
      <CategoryList categories={result.categories} />
    </div>
  );
}
