import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { ROUTES } from "@/constants";
import { fetchProjects, fetchCategories, fetchTechnologies } from "@/api/domain";
import type { Project, PortfolioCategory, Technology } from "@/types";

type PortfolioState = "loading" | "ready" | "error";

const PAGE_SIZE = 6;

const Portfolio: React.FC = () => {
  const [state, setState] = useState<PortfolioState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const loadData = useCallback(async (page: number, categoryId: number | null) => {
    try {
      setState("loading");
      const params: Record<string, string | number | boolean> = { page, page_size: PAGE_SIZE };
      if (categoryId !== null) params.category = categoryId;
      const [projectsData, categoriesData, technologiesData] = await Promise.all([
        fetchProjects(params),
        fetchCategories(),
        fetchTechnologies(),
      ]);
      setProjects(projectsData.results);
      setTotalCount(projectsData.count);
      setCategories(categoriesData);
      setTechnologies(technologiesData);
      setCurrentPage(page);
      setState("ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load projects";
      setError(message);
      setState("error");
    }
  }, []);

  useEffect(() => {
    loadData(1, activeCategory);
  }, [loadData, activeCategory]);

  const handleCategoryFilter = (categoryId: number | null) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    loadData(page, activeCategory);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const categoryList = Array.isArray(categories) ? categories : [];
  const technologyMap = new Map(technologies.map((tech) => [tech.id, tech]));

  if (state === "loading" && projects.length === 0) {
    return (
      <div className="min-h-screen bg-[color:var(--surface)] py-24 text-[color:var(--text)]">
        <Container>
          <Skeleton className="mb-8 h-10 w-48 bg-[color:var(--surface-muted)]" />
          <div className="mb-8 flex gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-20 rounded-full bg-[color:var(--surface-muted)]" />)}
          </div>
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-lg bg-[color:var(--surface-muted)] p-6">
                <Skeleton className="mb-4 h-40 w-full rounded bg-[color:var(--surface-muted)]" />
                <Skeleton className="mb-2 h-6 w-3/4 bg-[color:var(--surface-muted)]" />
                <Skeleton className="mb-2 h-4 w-full bg-[color:var(--surface-muted)]" />
                <Skeleton className="h-4 w-2/3 bg-[color:var(--surface-muted)]" />
              </div>
            ))}
          </div>
        </Container>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-[color:var(--surface)] py-24 text-[color:var(--text)]">
        <Container>
          <ErrorState title="Failed to load projects" message={error ?? "Unable to connect to the server."} onRetry={() => loadData(1, activeCategory)} />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--surface)] py-24 text-[color:var(--text)]">
      <Container>
        <h2 className="mb-2 text-4xl font-bold text-green-400">Portfolio</h2>
        <p className="mb-8 text-[color:var(--text-muted)]">A selection of projects I&rsquo;ve built and designed.</p>

        {categoryList.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-3">
            <button onClick={() => handleCategoryFilter(null)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === null ? "bg-green-400 text-gray-900" : "bg-[color:var(--surface-muted)] text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)]"}`}>
              All
            </button>
            {categoryList.map((cat) => (
              <button key={cat.id} onClick={() => handleCategoryFilter(cat.id)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === cat.id ? "bg-green-400 text-gray-900" : "bg-[color:var(--surface-muted)] text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)]"}`}>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {projects.length === 0 ? (
          <EmptyState title="No projects found" description={activeCategory !== null ? "No projects in this category yet." : "No published projects yet. Check back soon."} />
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <div key={project.id} className="flex flex-col rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6 text-center">
                  {project.thumbnail ? <img src={project.thumbnail} alt={project.title} className="mb-4 h-40 w-full rounded object-cover" loading="lazy" /> : <div className="mb-4 flex h-40 w-full items-center justify-center rounded bg-[color:var(--surface-muted)] text-sm text-[color:var(--text-muted)]">{project.short_description?.slice(0, 60) || "No image"}</div>}

                  {project.category && categoryList.some((cat) => cat.id === project.category) && <Badge variant="info" className="mb-2 self-center">{categoryList.find((cat) => cat.id === project.category)?.name}</Badge>}

                  <h3 className="text-xl font-semibold text-green-400">{project.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-[color:var(--text-muted)]">{project.short_description || project.full_description?.slice(0, 120) || ""}</p>

                  {project.technologies.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {project.technologies.map((techId) => {
                        const tech = technologyMap.get(techId);
                        return (
                          <span key={techId} className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-1 text-xs text-[color:var(--text-muted)]">
                            {tech?.icon ? <img src={tech.icon} alt="" className="mr-1 inline h-3.5 w-3.5" /> : null}
                            {tech?.name || `Technology ${techId}`}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 flex justify-center gap-4">
                    {project.live_demo && <a href={project.live_demo} target="_blank" rel="noopener noreferrer" className="text-sm text-green-400 hover:underline">Live Demo</a>}
                    {project.github_url && <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-400 hover:underline">GitHub</a>}
                  </div>

                  <Button className="mt-4" size="sm" onClick={() => { setSelectedProject(project); setIsProjectModalOpen(true); }}>
                    View Case Study
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link to={ROUTES.APPOINTMENT} className="inline-flex items-center justify-center rounded-lg border-2 border-amber-600 px-5 py-3 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-600 hover:text-white">
                Book Similar Project
              </Link>
            </div>

            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </Container>

      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title={selectedProject?.title || "Project Details"} size="lg">
        {selectedProject && (
          <div className="space-y-5">
            {selectedProject.thumbnail && <img src={selectedProject.thumbnail} alt={selectedProject.title} className="h-64 w-full rounded-lg object-cover" />}
            <p className="text-[color:var(--text-muted)]">{selectedProject.full_description}</p>
            <div>
              <h4 className="mb-2 font-semibold text-green-400">Technologies</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProject.technologies.map((techId) => {
                  const tech = technologyMap.get(techId);
                  return (
                    <span key={techId} className="rounded-full border border-[color:var(--border)] px-3 py-1 text-sm text-[color:var(--text-muted)]">
                      {tech?.icon ? <img src={tech.icon} alt="" className="mr-2 inline h-4 w-4" /> : null}
                      {tech?.name || `Technology ${techId}`}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {selectedProject.github_url && <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-amber-600 hover:underline">GitHub</a>}
              {selectedProject.live_demo && <a href={selectedProject.live_demo} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-amber-600 hover:underline">Live Demo</a>}
            </div>
            <Link to={ROUTES.APPOINTMENT} className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700">
              Book Similar Project
            </Link>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Portfolio;