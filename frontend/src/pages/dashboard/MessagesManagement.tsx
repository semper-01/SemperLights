import { useEffect, useMemo, useState } from "react";
import type { ContactMessageResponse } from "@/types";
import type { PaginatedResponse } from "@/types";

import {
  listContactMessages,
  getContactMessage,
  deleteContactMessage,
  markContactMessageRead,
} from "@/api/dashboard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ApiState = { status: "loading" | "ready" | "error"; error?: string };

type ReadFilter = "all" | "unread";

function formatRead(isRead: boolean) {
  return isRead ? "read" : "unread";
}

function safeString(v: unknown) {
  return typeof v === "string" ? v : String(v ?? "");
}

export default function MessagesManagement() {
  const [apiState, setApiState] = useState<ApiState>({ status: "loading" });
  const [data, setData] = useState<PaginatedResponse<ContactMessageResponse> | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setQuerySearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);


  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewMessage, setViewMessage] = useState<ContactMessageResponse | null>(null);

  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const load = async () => {
    try {
      setApiState({ status: "loading" });
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: pageSize,
      };
      if (querySearch.trim()) params.search = querySearch.trim();
      if (readFilter === "unread") params.is_read = false;

      const resp = await listContactMessages(params);
      setData(resp);
      setApiState({ status: "ready" });
      setSelected({});
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to load messages" });
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, querySearch, readFilter]);

  const toggleSelected = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[Number(k)]).map((k) => Number(k)), [selected]);

  const openDeleteOne = (id: number) => {
    setSelectedId(id);
    setConfirmOpen(true);
  };

  const openView = async (id: number) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const msg = await getContactMessage(id);
      setViewMessage(msg);
    } finally {
      setViewLoading(false);
    }
  };

  const onConfirmDelete = async () => {
    if (selectedId == null) return;
    try {
      setConfirmLoading(true);
      await deleteContactMessage(selectedId);
      setConfirmOpen(false);
      setSelectedId(null);
      await load();
    } catch (e) {
      // keep modal open; error surfaced in apiState reload path
    } finally {
      setConfirmLoading(false);
    }
  };

  const onToggleRead = async (msg: ContactMessageResponse) => {
    try {
      await markContactMessageRead(msg.id, !msg.is_read);
      await load();
    } catch {
      // silent
    }
  };

  const bulkDeleteEnabled = selectedIds.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-sm text-gray-600">View, mark read/unread, and delete messages.</p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={!bulkDeleteEnabled}
            onClick={() => {
              // minimal bulk delete: delete sequentially
              (async () => {
                try {
                  for (const id of selectedIds) {
                    await deleteContactMessage(id);
                  }
                  await load();
                } catch {
                  // ignore
                }
              })();
            }}
            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Delete selected ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as ReadFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread only</option>
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
            <EmptyState
              title="No messages"
              message="There are no contact messages to display."
              actionLabel="Retry"
              onAction={() => void load()}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-500">
                      <th className="px-4 py-3">Select</th>
                      <th className="px-4 py-3">Message</th>
                      <th className="px-4 py-3">From</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.results.map((m) => (
                      <tr key={m.id} className="text-sm">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={Boolean(selected[m.id])}
                            onChange={() => toggleSelected(m.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            className="text-left font-medium text-amber-800 hover:text-amber-900"
                            onClick={() => void openView(m.id)}
                          >
                            {m.subject}
                          </button>
                        </td>
                        <td className="px-4 py-3">{m.email}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={formatRead(m.is_read)} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => void onToggleRead(m)}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              {m.is_read ? "Mark unread" : "Mark read"}
                            </button>
                            <button
                              onClick={() => openDeleteOne(m.id)}
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
        title="Delete message?"
        message="This will permanently delete the contact message."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={confirmLoading}
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedId(null);
        }}
        onConfirm={() => void onConfirmDelete()}
      />

      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Message details</h2>
                <p className="mt-1 text-sm text-gray-600">{viewLoading ? "Loading..." : viewMessage?.subject}</p>
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
                <div className="h-4 w-full rounded bg-gray-100" />
              </div>
            ) : viewMessage ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={formatRead(viewMessage.is_read)} />
                  <span className="text-sm text-gray-600">From: {viewMessage.email}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Name</div>
                  <div className="text-sm text-gray-700">{safeString(viewMessage.name)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Message</div>
                  <div className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                    {viewMessage.message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 text-sm text-gray-600">No message selected.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

