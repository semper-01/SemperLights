import { useEffect, useMemo, useState } from "react";
import type { Project, PortfolioCategory, Technology } from "@/types";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  publishProject,
  unpublishProject,
  featureProject,
  listCategories,
  listTechnologies,
  getProject,
} from "@/api/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

function buildSlug(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function PortfolioManagement() {
  type PageState = "loading" | "ready" | "error";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");

  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);

  const categoryById = useMemo(() => new Map<number, PortfolioCategory>(categories.map((c) => [c.id, c])), [categories]);
  const techById = useMemo(() => new Map<number, Technology>(technologies.map((t) => [t.id, t])), [technologies]);

  // delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

  // details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<Project | null>(null);

  // form modal (create/edit)
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    short_description: "",
    full_description: "",
    live_demo: "",
    github_url: "",
    category: 0 as number,
    technologies: [] as number[],
    featured: false,
    status: "draft" as Project["status"],
    thumbnail: null as File | null,
    cover_image: null as File | null,
  });

  const techOptions = useMemo(
    () => technologies.map((t) => ({ label: t.name, value: t.id })),
    [technologies]
  );

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.name, value: c.id })),
    [categories]
  );

  const reload = async (page = currentPage) => {
    setPageState("loading");
    setErrorMsg("");
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: pageSize,
      };

      if (search.trim()) params.search = search.trim();
      if (categoryFilter !== "all") params.category = categoryFilter;

      const resp = await listProjects(params);
      setProjects(resp.results);
      setCount(resp.count);
      setPageState("ready");
    } catch (e) {
      setPageState("error");
      setErrorMsg(e instanceof Error ? e.message : "Failed to load projects");
    }
  };

  const loadLookups = async () => {
    const [cats, techs] = await Promise.all([
      listCategories({ page_size: 1000 }),
      listTechnologies({ page_size: 1000 }),
    ]);
    setCategories(cats.results);
    setTechnologies(techs.results);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPageState("loading");
      try {
        await loadLookups();
        if (!cancelled) await reload(1);
      } catch (e) {
        if (!cancelled) {
          setPageState("error");
          setErrorMsg(e instanceof Error ? e.message : "Failed to load dashboard data");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setFormError("");
    setSuccessMsg("");
    setForm({
      title: "",
      slug: "",
      short_description: "",
      full_description: "",
      live_demo: "",
      github_url: "",
      category: categories[0]?.id ?? 0,
      technologies: [],
      featured: false,
      status: "draft",
      thumbnail: null,
      cover_image: null,
    });
    setFormOpen(true);
  };

  const openEdit = async (id: number) => {
    setFormError("");
    setSuccessMsg("");
    setFormMode("edit");
    setEditingId(id);

    const p = await getProject(id);
    setForm({
      title: p.title,
      slug: p.slug,
      short_description: p.short_description,
      full_description: p.full_description,
      live_demo: p.live_demo,
      github_url: p.github_url,
      category: p.category,
      technologies: p.technologies,
      featured: p.featured,
      status: p.status,
      thumbnail: null,
      cover_image: null,
    });

    setFormOpen(true);
  };

  const openDetails = async (id: number) => {
    setDetailsLoading(true);
    setDetailsOpen(true);
    try {
      const p = await getProject(id);
      setDetails(p);
    } finally {
      setDetailsLoading(false);
    }
  };

  const submitForm = async () => {
    setFormLoading(true);
    setFormError("");
    try {
      const payload = new FormData();

      const slug = form.slug.trim() || buildSlug(form.title);

      payload.append("title", form.title);
      payload.append("slug", slug);
      payload.append("short_description", form.short_description);
      payload.append("full_description", form.full_description);
      payload.append("live_demo", form.live_demo);
      payload.append("github_url", form.github_url);
      payload.append("category", String(form.category));
      payload.append("featured", form.featured ? "true" : "false");
      payload.append("status", form.status);

      // ManyToMany: send as array entries
      for (const techId of form.technologies) {
        payload.append("technologies", String(techId));
      }

      if (form.thumbnail) payload.append("thumbnail", form.thumbnail);
      if (form.cover_image) payload.append("cover_image", form.cover_image);

      let saved: Project;
      if (formMode === "create") {
        saved = await createProject(payload);
      } else {
        if (!editingId) throw new Error("Missing project id");
        saved = await updateProject(editingId, payload);
      }

      setSuccessMsg(`Saved "${saved.title}" successfully.`);
      setFormOpen(false);
      await reload(1);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save project");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    setProjectToDelete(id);
    setConfirmOpen(true);
  };

  const runDelete = async () => {
    if (!projectToDelete) return;
    setConfirmLoading(true);
    try {
      await deleteProject(projectToDelete);
      setConfirmOpen(false);
      setProjectToDelete(null);
      await reload(currentPage);
    } catch (e) {
      // keep modal open on failure
    } finally {
      setConfirmLoading(false);
    }
  };

  const togglePublished = async (p: Project) => {
    // status: draft/published
    try {
      if (p.status === "published") {
        const updated = await unpublishProject(p.id);
        setProjects((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const updated = await publishProject(p.id);
        setProjects((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
    } catch {
      // no-op (error state handled per-page on reload)
    }
  };

  const toggleFeatured = async (p: Project) => {
    try {
      if (!p.featured) {
        const updated = await featureProject(p.id);
        setProjects((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        // backend has no unfeature action; simplest is to update featured=false+published status via updateProject.
        await updateProject(p.id, { featured: false });
        setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, featured: false } : x)));
      }
    } catch {
      // no-op
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage projects like a production CMS.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={openCreate}>Create Project</Button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Title, description..."
        />
        <Select
          label="Category"
          options={[{ label: "All", value: "all" as any }, ...categoryOptions]}
          value={categoryFilter as any}
          onChange={(e) => setCategoryFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
        />
        <div className="flex items-end">
          <Button
            variant="secondary"
            onClick={() => {
              setCurrentPage(1);
              reload(1);
            }}
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Content */}
      {pageState === "loading" && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" variant="rectangular" />
        </div>
      )}

      {pageState === "error" && (
        <ErrorState
          title="Failed to load projects"
          message={errorMsg}
          onRetry={() => {
            loadLookups().then(() => reload(1));
          }}
        />
      )}

      {pageState === "ready" && (
        <>
          {projects.length === 0 ? (
            <EmptyState
              title="No projects"
              message="Try adjusting filters or create a new project."
              actionLabel="Create Project"
              onAction={openCreate}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-[900px] w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-700">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Technologies</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Featured</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {projects.map((p) => {
                    const cat = categoryById.get(p.category);
                    const techNames = p.technologies
                      .map((id) => techById.get(id)?.name)
                      .filter(Boolean) as string[];

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/40">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{p.title}</div>
                          <div className="mt-1 text-xs text-gray-500 truncate max-w-[240px]">{p.short_description}</div>
                        </td>
                        <td className="px-4 py-3">{cat?.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {techNames.length === 0 ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              techNames.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">{t}</span>)
                            )}
                            {techNames.length > 3 && <span className="text-xs text-gray-500">+{techNames.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.status} variant={p.status === "published" ? "published" : "draft"} />
                        </td>
                        <td className="px-4 py-3">
<StatusBadge status={p.featured ? "featured" : "not featured"} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => openDetails(p.id)}>
                              Details
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEdit(p.id)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => togglePublished(p)}>
                              {p.status === "published" ? "Unpublish" : "Publish"}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => toggleFeatured(p)}>
                              {p.featured ? "Unfeature" : "Feature"}
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => confirmDelete(p.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Showing page {currentPage} of {totalPages}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => {
                setCurrentPage(p);
                reload(p);
              }}
            />
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete project?"
        message="This action cannot be undone. The project will be removed from the CMS."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={confirmLoading}
        onCancel={() => {
          setConfirmOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={runDelete}
      />

      {/* Project details */}
      <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Project Details" size="lg">
        {detailsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : details ? (
          <div className="space-y-4">
            <div>
              <div className="text-xl font-semibold text-gray-900">{details.title}</div>
              <div className="mt-1 text-xs text-gray-500">Slug: {details.slug}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={details.status} variant={details.status === "published" ? "published" : "draft"} />
<StatusBadge status={details.featured ? "featured" : "not featured"} />
              <span className="text-xs text-gray-600">Category: {categoryById.get(details.category)?.name ?? "—"}</span>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-900">Short Description</div>
              <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{details.short_description}</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-900">Full Description</div>
              <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{details.full_description}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-gray-900">Live Demo</div>
                <div className="mt-1 text-sm text-gray-700 break-all">{details.live_demo || "—"}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">GitHub</div>
                <div className="mt-1 text-sm text-gray-700 break-all">{details.github_url || "—"}</div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="No details" message="Project could not be loaded." />
        )}
      </Modal>

      {/* Create/Edit form */}
      <Modal
        isOpen={formOpen}
        onClose={() => {
          if (!formLoading) setFormOpen(false);
        }}
        title={formMode === "create" ? "Create Project" : "Edit Project"}
        size="lg"
      >
        <div className="space-y-4">
          {formError && <ErrorState title="Save failed" message={formError} onRetry={submitForm} />}
          {successMsg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMsg}</div>}

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: prev.slug.trim() ? prev.slug : buildSlug(title),
                }));
              }}
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="auto-generated"
            />
          </div>

          <Textarea
            label="Short Description"
            value={form.short_description}
            onChange={(e) => setForm((prev) => ({ ...prev, short_description: e.target.value }))}
            rows={3}
          />

          <Textarea
            label="Full Description"
            value={form.full_description}
            onChange={(e) => setForm((prev) => ({ ...prev, full_description: e.target.value }))}
            rows={6}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Category"
              value={categoryById.get(form.category)?.name ?? ""}
              disabled
            />
            <Select
              label="Category (select)"
              options={categoryOptions}
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">Technologies</label>
            <div className="grid gap-2 md:grid-cols-2">
              {techOptions.length === 0 ? (
                <div className="text-sm text-gray-500">No technologies available.</div>
              ) : (
                techOptions.map((opt) => {
                  const selected = form.technologies.includes(opt.value as number);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const id = opt.value as number;
                        setForm((prev) => {
                          const next = selected
                            ? prev.technologies.filter((x) => x !== id)
                            : [...prev.technologies, id];
                          return { ...prev, technologies: next };
                        });
                      }}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selected
                          ? "border-amber-300 bg-amber-50 text-amber-900"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Status"
              options={[
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
                { label: "Archived", value: "archived" },
              ]}
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Project["status"] }))}
            />

            <Select
              label="Featured"
              options={[
                { label: "Not featured", value: "false" },
                { label: "Featured", value: "true" },
              ]}
              value={String(form.featured)}
              onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.value === "true" }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Live Demo URL"
              value={form.live_demo}
              onChange={(e) => setForm((prev) => ({ ...prev, live_demo: e.target.value }))}
            />
            <Input
              label="GitHub URL"
              value={form.github_url}
              onChange={(e) => setForm((prev) => ({ ...prev, github_url: e.target.value }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Thumbnail (image)"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setForm((prev) => ({ ...prev, thumbnail: f }));
              }}
            />
            <Input
              label="Cover image (image)"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setForm((prev) => ({ ...prev, cover_image: f }));
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={submitForm} isLoading={formLoading}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

