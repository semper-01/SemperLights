import { useEffect, useState } from "react";

import type { Service } from "@/types";


import {
  listServices,
  createService,
  updateService,
  deleteService,
  activateService,
  deactivateService,
} from "@/api/dashboard";
import type { PaginatedResponse } from "@/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ApiState = { status: "loading" | "ready" | "error"; error?: string };

function slugifyFallback(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ServicesManagement() {
  const [apiState, setApiState] = useState<ApiState>({ status: "loading" });
  const [data, setData] = useState<PaginatedResponse<Service> | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);


  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    starting_price: "",
    estimated_duration: "",
    is_active: true,
    iconFile: null as File | null,
    iconPreview: "" as string,
  });



  const load = async () => {
    try {
      setApiState({ status: "loading" });
      const response = await listServices({
        page,
        page_size: pageSize,
        search: debouncedSearch.trim() ? debouncedSearch.trim() : "",
      });
      setData(response);
      setApiState({ status: "ready" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load services";
      setApiState({ status: "error", error: message });
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch]);

  const openCreate = () => {
    setFormMode("create");
    setSelectedId(null);
    setForm({
      title: "",
      slug: "",
      description: "",
      starting_price: "",
      estimated_duration: "",
      is_active: true,
      iconFile: null,
      iconPreview: "",
    });
    setFormOpen(true);
  };

  const openEdit = (service: Service) => {
    setFormMode("edit");
    setSelectedId(service.id);
    setForm({
      title: service.title,
      slug: service.slug,
      description: service.description,
      starting_price: service.starting_price,
      estimated_duration: service.estimated_duration,
      is_active: service.is_active,
      iconFile: null,
      iconPreview: service.icon ? service.icon : "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelectedId(null);
  };

  const onSubmit = async () => {
    if (!form.title.trim()) {
      setCategoryError("Title is required");
      return;
    }

    setCategoryError(null);
    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      const slugValue = form.slug?.trim() ? form.slug.trim() : slugifyFallback(form.title);
      payload.append("slug", slugValue);
      payload.append("description", form.description);
      payload.append("starting_price", form.starting_price);
      payload.append("estimated_duration", form.estimated_duration);
      payload.append("is_active", form.is_active ? "true" : "false");

      if (form.iconFile) {
        payload.append("icon", form.iconFile);
      }

      if (formMode === "create") {
        await createService(payload);
      } else {
        if (selectedId == null) throw new Error("Missing service id");
        await updateService(selectedId, payload);
      }

      closeForm();
      await load();
    } catch (e) {
      setCategoryError(e instanceof Error ? e.message : "Failed to save service");
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
      await deleteService(selectedId);
      setConfirmOpen(false);
      setSelectedId(null);
      await load();
    } catch (e) {
      // Keep modal open on error
      setCategoryError(e instanceof Error ? e.message : "Failed to delete service");
    } finally {
      setConfirmLoading(false);
    }
  };

  const onToggleActive = async (service: Service) => {
    try {
      setApiState({ status: "loading" });
      if (service.is_active) {
        await deactivateService(service.id);
      } else {
        await activateService(service.id);
      }
      await load();
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to update service" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          <p className="text-sm text-gray-600">Create, edit, activate/deactivate services.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            + New Service
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
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
            <EmptyState title="No services found" message="Create your first service to enable booking." actionLabel="New Service" onAction={openCreate} />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-500">
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.results.map((s) => (
                      <tr key={s.id} className="text-sm">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{s.title}</div>
                          <div className="text-xs text-gray-500">/{s.slug}</div>
                        </td>
                        <td className="px-4 py-3">{s.starting_price}</td>
                        <td className="px-4 py-3">{s.estimated_duration || "—"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={s.is_active ? "active" : "inactive"} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => onToggleActive(s)}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              {s.is_active ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => openEdit(s)}
                              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => requestDelete(s.id)}
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

          {categoryError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {categoryError}
            </div>
          )}
        </>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete service?"
        message="This will permanently delete the service." 
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

      {/* Create/Edit modal (minimal, no redesign) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm} />
          <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {formMode === "create" ? "Create Service" : "Edit Service"}
                </h2>
                <p className="mt-1 text-sm text-gray-600">Slug is auto-generated from title if left empty.</p>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={closeForm} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: f.slug || slugifyFallback(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-sm font-medium text-gray-700">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-sm font-medium text-gray-700">Duration</label>
                <input
                  value={form.estimated_duration}
                  onChange={(e) => setForm((f) => ({ ...f, estimated_duration: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="text-sm font-medium text-gray-700">Starting Price</label>
                <input
                  value={form.starting_price}
                  onChange={(e) => setForm((f) => ({ ...f, starting_price: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={form.is_active ? "active" : "inactive"}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === "active" }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={5}
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
                    setForm((f) => ({ ...f, iconFile: file, iconPreview: file ? URL.createObjectURL(file) : "" }));
                  }}
                  className="mt-1 w-full text-sm"
                />
                {form.iconPreview && (
                  <div className="mt-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                    <img src={form.iconPreview} alt="Icon preview" className="h-12 w-12 rounded-lg border border-gray-200 object-cover" />
                    <div className="text-xs text-gray-500">Preview</div>
                  </div>
                )}
              </div>
            </div>

            {categoryError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{categoryError}</div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeForm}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void onSubmit()}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

