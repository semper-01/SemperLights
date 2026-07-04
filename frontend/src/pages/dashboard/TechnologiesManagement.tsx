import { useEffect, useState } from "react";
import type { Technology } from "@/types";
import type { PaginatedResponse } from "@/types";
import {
  listTechnologies,
  createTechnology,
  updateTechnology,
  deleteTechnology,
} from "@/api/dashboard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { slugify } from "@/utils/helpers";


type ApiState = { status: "loading" | "ready" | "error"; error?: string };

type FormState = {
  name: string;
  slug: string;
  website: string;
  iconFile: File | null;
  iconPreview: string;
};

export default function TechnologiesManagement() {
  const [apiState, setApiState] = useState<ApiState>({ status: "loading" });
  const [data, setData] = useState<PaginatedResponse<Technology> | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    website: "",
    iconFile: null,
    iconPreview: "",
  });

  const load = async () => {
    try {
      setApiState({ status: "loading" });
      const resp = await listTechnologies({
        page,
        page_size: pageSize,
        search: search.trim() ? search.trim() : "",
      });
      setData(resp);
      setApiState({ status: "ready" });
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to load technologies" });
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  const openCreate = () => {
    setMode("create");
    setEditId(null);
    setForm({ name: "", slug: "", website: "", iconFile: null, iconPreview: "" });
    setFormOpen(true);
  };

  const openEdit = (tech: Technology) => {
    setMode("edit");
    setEditId(tech.id);
    setForm({
      name: tech.name,
      slug: "",
      website: tech.website,
      iconFile: null,
      iconPreview: tech.icon ?? "",
    });
    setFormOpen(true);
  };

  const onClose = () => {
    setFormOpen(false);
    setEditId(null);
  };

  const onSubmit = async () => {
    const name = form.name.trim();
    if (!name) return;

    const fd = new FormData();
    fd.append("name", name);
    fd.append("website", form.website);

    // backend Technology model may or may not include slug; types in this repo don't expose slug.
    // Only send slug if backend accepts it.
    const slugValue = form.slug.trim() ? form.slug.trim() : slugify(name);
    if (slugValue) {
      fd.append("slug", slugValue);
    }

    if (form.iconFile) {
      fd.append("icon", form.iconFile);
    }

    try {
      if (mode === "create") {
        await createTechnology(fd);
      } else {
        if (editId == null) throw new Error("Missing technology id");
        await updateTechnology(editId, fd);
      }
      onClose();
      await load();
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to save technology" });
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
      await deleteTechnology(selectedId);
      setConfirmOpen(false);
      setSelectedId(null);
      await load();
    } catch {
      // keep state
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technologies</h1>
          <p className="text-sm text-gray-600">Full CRUD with icon upload.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          + New Technology
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technologies..."
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
          <button onClick={() => void load()} className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      )}

      {apiState.status === "ready" && data && (
        <>
          {data.results.length === 0 ? (
            <EmptyState title="No technologies" message="Create technologies to tag projects." actionLabel="New Technology" onAction={openCreate} />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-500">
                      <th className="px-4 py-3">Technology</th>
                      <th className="px-4 py-3">Website</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.results.map((tech) => (
                      <tr key={tech.id} className="text-sm">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {tech.icon ? (
                              <img src={tech.icon} alt={tech.name} className="h-8 w-8 rounded bg-gray-50 object-contain" />
                            ) : (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-xs text-gray-500">—</span>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{tech.name}</div>
                              <div className="text-xs text-gray-500">{tech.icon ? "Icon set" : "No icon"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600">{tech.website || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(tech)}
                              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => requestDelete(tech.id)}
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
        title="Delete technology?"
        message="This will permanently delete the technology." 
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
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{mode === "create" ? "Create Technology" : "Edit Technology"}</h2>
                <p className="mt-1 text-sm text-gray-600">Icon upload is optional.</p>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: f.slug ? f.slug : slugify(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Website</label>
                <input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Icon upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setForm((f) => ({
                      ...f,
                      iconFile: file,
                      iconPreview: file ? URL.createObjectURL(file) : f.iconPreview,
                    }));
                  }}
                  className="mt-1 w-full text-sm"
                />
                {form.iconPreview && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={form.iconPreview} alt="Icon preview" className="h-10 w-10 rounded border border-gray-200 object-contain" />
                    <div className="text-xs text-gray-500">Preview</div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
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

