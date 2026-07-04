import { useEffect, useMemo, useState } from "react";
import type { AppointmentResponse } from "@/types";
import type { PaginatedResponse } from "@/types";

import {
  listAppointments,
  getAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  updateAppointmentNotes,
} from "@/api/dashboard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ApiState = { status: "loading" | "ready" | "error"; error?: string };

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

function safeString(v: unknown) {
  return typeof v === "string" ? v : String(v ?? "");
}

export default function AppointmentsManagement() {
  const [apiState, setApiState] = useState<ApiState>({ status: "loading" });
  const [data, setData] = useState<PaginatedResponse<AppointmentResponse> | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQuerySearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewAppointment, setViewAppointment] = useState<AppointmentResponse | null>(null);

  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = async () => {
    try {
      setApiState({ status: "loading" });
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: pageSize,
      };

      if (querySearch.trim()) params.search = querySearch.trim();
      if (statusFilter !== "all") params.status = statusFilter;

      const resp = await listAppointments(params);
      setData(resp);
      setApiState({ status: "ready" });
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to load appointments" });
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, querySearch, statusFilter]);

  const openDelete = (id: number) => {
    setSelectedId(id);
    setConfirmOpen(true);
  };

  const onDelete = async () => {
    if (selectedId == null) return;
    try {
      setConfirmLoading(true);
      await deleteAppointment(selectedId);
      setConfirmOpen(false);
      setSelectedId(null);
      await load();
    } catch {
      // keep modal open
    } finally {
      setConfirmLoading(false);
    }
  };

  const openView = async (id: number) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const appt = await getAppointment(id);
      setViewAppointment(appt);
      setNotesDraft(appt.notes ?? "");
    } finally {
      setViewLoading(false);
    }
  };

  const changeStatus = async (next: AppointmentStatus) => {
    if (!viewAppointment) return;
    try {
      setApiState({ status: "loading" });
      const updated = await updateAppointmentStatus(viewAppointment.id, next);
      setViewAppointment(updated);
      setNotesDraft(updated.notes ?? "");
      await load();
      setApiState({ status: "ready" });
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to update status" });
    }
  };

  const saveNotes = async () => {
    if (!viewAppointment) return;
    try {
      setSavingNotes(true);
      const updated = await updateAppointmentNotes(viewAppointment.id, notesDraft);
      setViewAppointment(updated);
      await load();
    } catch {
      // keep draft
    } finally {
      setSavingNotes(false);
    }
  };

  const statuses: { value: AppointmentStatus; label: string }[] = useMemo(
    () => [
      { value: "pending", label: "Pending" },
      { value: "confirmed", label: "Confirmed" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-600">Update status and manage internal notes.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search appointments..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | AppointmentStatus)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
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
            <EmptyState title="No appointments" message="No appointments match your filters." actionLabel="Retry" onAction={() => void load()} />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-500">
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.results.map((a) => (
                      <tr key={a.id} className="text-sm">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{a.full_name}</div>
                          <div className="text-xs text-gray-500">{a.email}</div>
                        </td>
                        <td className="px-4 py-3">{a.service}</td>
                        <td className="px-4 py-3">{a.preferred_date}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => void openView(a.id)}
                              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                            >
                              View
                            </button>
                            <button
                              onClick={() => openDelete(a.id)}
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
        title="Delete appointment?"
        message="This will permanently delete the appointment." 
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

      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewOpen(false)} />
          <div className="relative z-10 w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Appointment details</h2>
                <p className="mt-1 text-sm text-gray-600">{viewLoading ? "Loading..." : viewAppointment?.full_name}</p>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setViewOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            {viewLoading ? (
              <div className="mt-5 space-y-3 animate-pulse">
                <div className="h-6 w-2/3 rounded bg-gray-100" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-full rounded bg-gray-100" />
              </div>
            ) : viewAppointment ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={viewAppointment.status} />
                    <span className="text-sm text-gray-600">{viewAppointment.preferred_date}</span>
                    <span className="text-sm text-gray-600">{viewAppointment.preferred_time ?? "—"}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-900">Client</div>
                  <div className="mt-1 text-sm text-gray-700">{viewAppointment.full_name}</div>
                  <div className="mt-1 text-sm text-gray-500">{viewAppointment.email}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-900">Contact</div>
                  <div className="mt-1 text-sm text-gray-700">{viewAppointment.phone}</div>
                  <div className="mt-1 text-sm text-gray-500">Company: {safeString(viewAppointment.company)}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-900">Budget</div>
                  <div className="mt-1 text-sm text-gray-700">{safeString(viewAppointment.budget_range)}</div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">Summary</div>
                  <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                    {safeString(viewAppointment.project_summary)}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">Update status</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statuses.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => void changeStatus(s.value)}
                        disabled={viewAppointment.status === s.value}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-50"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm font-medium text-gray-900">Internal admin notes</div>
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setNotesDraft(viewAppointment.notes ?? "");
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      type="button"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => void saveNotes()}
                      disabled={savingNotes}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                      type="button"
                    >
                      {savingNotes ? "Saving..." : "Save notes"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 text-sm text-gray-600">No appointment selected.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

