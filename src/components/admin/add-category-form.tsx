"use client";

import { useState, useTransition } from "react";

import { addCategoryAction, addSubCategoryAction } from "@/app/admin/categories/actions";
import type { CategoryRecord } from "@/lib/firebase/categories";

type Props = {
  categories: CategoryRecord[];
};

type Feedback = { type: "success" | "error"; message: string } | null;

export function AddCategoryForm({ categories }: Props) {
  const [tab, setTab] = useState<"category" | "subcategory">("category");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [categoryName, setCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");

  const categoryNames = categories.map((c) => c.name);

  const duplicateCategoryError =
    categoryName.trim() &&
    categoryNames.some(
      (n) => n.trim().toLowerCase() === categoryName.trim().toLowerCase(),
    )
      ? `"${categoryName.trim()}" already exists.`
      : null;

  const selectedSubcategories =
    categories.find((c) => c.name === selectedCategory)?.subcategories ?? [];

  const duplicateSubError =
    subCategoryName.trim() && selectedCategory
      ? selectedSubcategories.some(
          (s) => s.trim().toLowerCase() === subCategoryName.trim().toLowerCase(),
        )
        ? `"${subCategoryName.trim()}" already exists in ${selectedCategory}.`
        : null
      : null;

  const duplicateError =
    tab === "category" ? duplicateCategoryError : duplicateSubError;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Add category</h3>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {(["category", "subcategory"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setFeedback(null); }}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (duplicateError) return;
          setFeedback(null);
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            const result =
              tab === "category"
                ? await addCategoryAction(formData)
                : await addSubCategoryAction(formData);
            if (result.ok) {
              setFeedback({ type: "success", message: tab === "category" ? "Category added." : "Subcategory added." });
              setCategoryName("");
              setSubCategoryName("");
            } else {
              setFeedback({ type: "error", message: result.message ?? "Something went wrong." });
            }
          });
        }}
        className="space-y-4 p-4"
      >
        {tab === "category" ? (
          <div className="space-y-1.5">
            <label
              htmlFor="cat-name"
              className="text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Category name
            </label>
            <input
              id="cat-name"
              name="name"
              type="text"
              value={categoryName}
              onChange={(e) => { setCategoryName(e.target.value); setFeedback(null); }}
              placeholder="e.g. Technology"
              required
              disabled={isPending}
              className={`w-full rounded-md border px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50 dark:bg-zinc-950 dark:text-zinc-50 ${
                duplicateCategoryError
                  ? "border-red-400 dark:border-red-600"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            />
            {duplicateCategoryError && (
              <p className="text-xs text-red-600 dark:text-red-400">{duplicateCategoryError}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="parent-category"
                className="text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Parent category
              </label>
              <select
                id="parent-category"
                name="categoryName"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setSubCategoryName(""); setFeedback(null); }}
                required
                disabled={isPending}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="">Select a category…</option>
                {categoryNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="sub-name"
                className="text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Subcategory name
              </label>
              <input
                id="sub-name"
                name="subCategoryName"
                type="text"
                value={subCategoryName}
                onChange={(e) => { setSubCategoryName(e.target.value); setFeedback(null); }}
                placeholder="e.g. Mobile"
                required
                disabled={isPending}
                className={`w-full rounded-md border px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50 dark:bg-zinc-950 dark:text-zinc-50 ${
                  duplicateSubError
                    ? "border-red-400 dark:border-red-600"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              />
              {duplicateSubError && (
                <p className="text-xs text-red-600 dark:text-red-400">{duplicateSubError}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !!duplicateError}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending ? "Saving…" : tab === "category" ? "Add category" : "Add subcategory"}
          </button>
        </div>

        {feedback && (
          <div
            className={
              feedback.type === "success"
                ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
                : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
            }
          >
            {feedback.message}
          </div>
        )}
      </form>
    </section>
  );
}
