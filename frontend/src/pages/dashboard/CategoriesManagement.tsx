import { useEffect, useState } from "react";


import type { PortfolioCategory } from "@/types";
import type { PaginatedResponse } from "@/types";
import { slugify } from "@/utils/helpers";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/api/dashboard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";


type ApiState = { status: "loading" | "ready" | "error"; error?: string };

type FormState = {
  name: string;
  slug: string;
  description: string;
};

export default function CategoriesManagement() {
  const [apiState, setApiState] = useState<ApiState>({ status: "loading" });
  const [data, setData] = useState<PaginatedResponse<PortfolioCategory> | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>({ name: "", slug: "", description: "" });

  const load = async () => {
    try {
      setApiState({ status: "loading" });
      const resp = await listCategories({
        page,
        page_size: pageSize,
        search: search.trim() ? search.trim() : "",
      });

      setData(resp);
      setApiState({ status: "ready" });
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to load categories" });
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  const openCreate = () => {
    setFormMode("create");
    setEditId(null);
    setForm({ name: "", slug: "", description: "" });
    setFormOpen(true);
  };

  const openEdit = (cat: PortfolioCategory) => {
    setFormMode("edit");
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description });
    setFormOpen(true);
  };

  const onCloseForm = () => {
    setFormOpen(false);
    setEditId(null);
  };

  const onSubmit = async () => {
    const name = form.name.trim();
    if (!name) return;

    const payload = {
      name,
      slug: form.slug.trim() ? form.slug.trim() : slugify(name),
      description: form.description,
    };

    try {
      if (formMode === "create") {
        await createCategory(payload);
      } else {
        if (editId == null) throw new Error("Missing category id");
        await updateCategory(editId, payload);
      }
      onCloseForm();
      await load();
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to save category" });
    }
  };

  const requestDelete = (id: number) => {
    setSelectedId(id);
    setConfirmOpen(true);
  };

  const onDelete = async () => {
    if (selectedId == null) return;
    try {
      setConfirmLoading(true);
      await deleteCategory(selectedId);
      setConfirmOpen(false);
      setSelectedId(null);
      await load();
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to delete category" });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-600">Full CRUD with slug generation.</p>
        </div>
        <div>
          <button
            onClick={openCreate}
            className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            + New Category
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {apiState.status === "loading" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
      )}

      {apiState.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-sm font-medium text-red-700">{apiState.error ?? "Error"}</div>
          <button
            onClick={() => void load()}
            className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {apiState.status === "ready" && data && (
        <>
          {data.results.length === 0 ? (
            <EmptyState title="No categories" message="Create a category to organize your portfolio." actionLabel="New Category" onAction={openCreate} />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-500">
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.results.map((cat) => (
                      <tr key={cat.id} className="text-sm">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{cat.name}</div>
                          <div className="text-xs text-gray-500">{cat.description ? cat.description : "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600">/{cat.slug}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(cat)}
                              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => requestDelete(cat.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.count)} of {data.count}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page * pageSize >= data.count}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete category?"
        message="This will permanently delete the category." 
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={confirmLoading}
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedId(null);
        }}
        onConfirm={() => void onDelete()}
      />

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseForm} />
          <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{formMode === "create" ? "Create Category" : "Edit Category"}</h2>
                <p className="mt-1 text-sm text-gray-600">Slug auto-generated from name if left empty.</p>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={onCloseForm} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug ? f.slug : slugify(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onCloseForm}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={() => void onSubmit()} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

