"use client";

import { useState, useTransition, useRef, useEffect } from "react";

import {
  deleteCategoryAction,
  renameCategoryAction,
  deleteSubCategoryAction,
  renameSubCategoryAction,
} from "@/app/admin/categories/actions";
import type { CategoryRecord } from "@/lib/firebase/categories";

type EditingState =
  | { type: "category"; name: string; value: string }
  | { type: "subcategory"; categoryName: string; sub: string; value: string }
  | null;

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5l2.5 2.5M1.5 11.5l.75-3L9 1.5l2.5 2.5-6.75 6.75-3 .75z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 3.5h10M4.5 3.5V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5M5 6v4M8 6v4M2.5 3.5l.75 8h6.5l.75-8" />
    </svg>
  );
}

function ActionButton({
  onClick,
  title,
  variant,
  disabled,
}: {
  onClick: () => void;
  title: string;
  variant: "edit" | "delete";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded p-1 transition-colors disabled:opacity-40 ${
        variant === "delete"
          ? "text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      }`}
    >
      {variant === "edit" ? <PencilIcon /> : <TrashIcon />}
    </button>
  );
}

function InlineEditInput({
  value,
  onChange,
  onSave,
  onCancel,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        disabled={disabled}
        className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={disabled || !value.trim()}
        className="rounded bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {disabled ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        className="rounded px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-700 disabled:opacity-50 dark:hover:text-zinc-300"
      >
        Cancel
      </button>
    </div>
  );
}

export function CategoryList({ categories }: { categories: CategoryRecord[] }) {
  const [editing, setEditing] = useState<EditingState>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function cancelEdit() {
    setEditing(null);
    setActionError(null);
  }

  function saveEdit() {
    if (!editing || isPending) return;
    const newValue = editing.value.trim();
    if (!newValue) return;

    setActionError(null);

    if (editing.type === "category") {
      if (newValue === editing.name) { cancelEdit(); return; }
      const fd = new FormData();
      fd.set("oldName", editing.name);
      fd.set("newName", newValue);
      startTransition(async () => {
        const result = await renameCategoryAction(fd);
        if (result.ok) { setEditing(null); }
        else { setActionError(result.message ?? "Failed to rename."); }
      });
    } else {
      if (newValue === editing.sub) { cancelEdit(); return; }
      const fd = new FormData();
      fd.set("categoryName", editing.categoryName);
      fd.set("oldName", editing.sub);
      fd.set("newName", newValue);
      startTransition(async () => {
        const result = await renameSubCategoryAction(fd);
        if (result.ok) { setEditing(null); }
        else { setActionError(result.message ?? "Failed to rename."); }
      });
    }
  }

  function handleDeleteCategory(name: string) {
    if (!window.confirm(`Delete category "${name}" and all its subcategories?`)) return;
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const result = await deleteCategoryAction(fd);
      if (!result.ok) setActionError(result.message ?? "Failed to delete.");
    });
  }

  function handleDeleteSubCategory(categoryName: string, sub: string) {
    if (!window.confirm(`Delete subcategory "${sub}"?`)) return;
    const fd = new FormData();
    fd.set("categoryName", categoryName);
    fd.set("subName", sub);
    startTransition(async () => {
      const result = await deleteSubCategoryAction(fd);
      if (!result.ok) setActionError(result.message ?? "Failed to delete.");
    });
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No categories found in{" "}
          <code className="font-mono">CategoryConfig/main</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          {actionError}
        </div>
      )}
      {categories.map((category) => {
        const isEditingThisCategory =
          editing?.type === "category" && editing.name === category.name;

        return (
          <div
            key={category.name}
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            {/* Category header */}
            <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
              {isEditingThisCategory ? (
                <div className="flex flex-1 flex-col gap-1">
                  <InlineEditInput
                    value={editing.value}
                    onChange={(v) => setEditing({ ...editing, value: v })}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    disabled={isPending}
                  />
                </div>
              ) : (
                <>
                  <p className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {category.name}
                  </p>
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {category.subcategories.length}
                  </span>
                  <ActionButton
                    variant="edit"
                    title={`Rename "${category.name}"`}
                    disabled={isPending || editing !== null}
                    onClick={() => {
                      setActionError(null);
                      setEditing({ type: "category", name: category.name, value: category.name });
                    }}
                  />
                  <ActionButton
                    variant="delete"
                    title={`Delete "${category.name}"`}
                    disabled={isPending || editing !== null}
                    onClick={() => handleDeleteCategory(category.name)}
                  />
                </>
              )}
            </div>

            {/* Subcategory list */}
            {category.subcategories.length > 0 ? (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {category.subcategories.map((sub, index) => {
                  const isEditingThisSub =
                    editing?.type === "subcategory" &&
                    editing.categoryName === category.name &&
                    editing.sub === sub;

                  return (
                    <li key={index} className="flex items-center gap-3 px-4 py-2">
                      <span className="w-5 shrink-0 text-right font-mono text-xs text-zinc-400">
                        {index}
                      </span>
                      {isEditingThisSub ? (
                        <div className="flex flex-1 items-center">
                          <InlineEditInput
                            value={editing.value}
                            onChange={(v) => setEditing({ ...editing, value: v })}
                            onSave={saveEdit}
                            onCancel={cancelEdit}
                            disabled={isPending}
                          />
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                            {sub}
                          </span>
                          <ActionButton
                            variant="edit"
                            title={`Rename "${sub}"`}
                            disabled={isPending || editing !== null}
                            onClick={() => {
                              setActionError(null);
                              setEditing({ type: "subcategory", categoryName: category.name, sub, value: sub });
                            }}
                          />
                          <ActionButton
                            variant="delete"
                            title={`Delete "${sub}"`}
                            disabled={isPending || editing !== null}
                            onClick={() => handleDeleteSubCategory(category.name, sub)}
                          />
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-zinc-400">No subcategories.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
