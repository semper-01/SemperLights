import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { ROUTES } from "@/constants";
import {
  fetchCurrentUser,
  fetchSiteSettings,
  fetchFeaturedProjects,
  fetchServices,
  fetchTechnologies,
} from "@/api/domain";
import type { SiteSetting, Project, Service, Technology, User } from "@/types";

type HomeState = "loading" | "ready" | "error";

const Home: React.FC = () => {
  const [state, setState] = useState<HomeState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSetting | null>(null);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [founderProfile, setFounderProfile] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [siteData, featuredData, servicesData, userData, technologyData] = await Promise.all([
          fetchSiteSettings(),
          fetchFeaturedProjects(),
          fetchServices(),
          fetchCurrentUser(),
          fetchTechnologies(),
        ]);
        if (!cancelled) {
          setSettings(siteData);
          setFeaturedProjects(featuredData);
          setServices(servicesData);
          setFounderProfile(userData);
          setTechnologies(technologyData);
          setState("ready");
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load data";
          setError(message);
          setState("error");
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const cvUrl = new URL("../RESUME_SEMPER.pdf", import.meta.url).href;
  const servicesToShow = services.slice(0, 3);
  const projectsToShow = featuredProjects.slice(0, 3);
  const technologyMap = new Map(technologies.map((tech) => [tech.id, tech]));

  if (state === "loading") {
    return (
      <div className="flex w-full flex-col bg-[color:var(--surface)] text-[color:var(--text)]">
        <section className="py-24">
          <Container>
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="space-y-6">
                <Skeleton className="h-12 w-3/4 bg-[color:var(--surface-muted)]" />
                <Skeleton className="h-6 w-1/2 bg-[color:var(--surface-muted)]" />
                <Skeleton className="h-4 w-full bg-[color:var(--surface-muted)]" />
                <Skeleton className="h-4 w-5/6 bg-[color:var(--surface-muted)]" />
              </div>
              <div className="rounded-xl bg-[color:var(--surface-muted)] p-8">
                <Skeleton className="mx-auto h-32 w-32 rounded-full bg-[color:var(--surface-muted)]" />
                <Skeleton className="mx-auto mt-4 h-6 w-1/2 bg-[color:var(--surface-muted)]" />
                <Skeleton className="mx-auto mt-4 h-4 w-3/4 bg-[color:var(--surface-muted)]" />
              </div>
            </div>
          </Container>
        </section>
        <section className="border-t border-[color:var(--border)] py-20">
          <Container>
            <Skeleton className="mx-auto h-8 w-48 bg-[color:var(--surface-muted)]" />
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg bg-[color:var(--surface-muted)] p-6">
                  <Skeleton className="mx-auto h-6 w-3/4 bg-[color:var(--surface-muted)]" />
                  <Skeleton className="mt-4 h-4 w-full bg-[color:var(--surface-muted)]" />
                </div>
              ))}
            </div>
          </Container>
        </section>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen w-full flex-col bg-[color:var(--surface)] text-[color:var(--text)]">
        <div className="flex flex-1 items-center justify-center">
          <ErrorState
            title="Failed to load content"
            message={error ?? "Unable to connect to the server. Please try again later."}
            onRetry={() => {
              setState("loading");
              setError(null);
              window.location.reload();
            }}
          />
        </div>
      </div>
    );
  }

  const siteName = settings?.site_name ?? "Semper Lights";
  const tagline = settings?.tagline ?? "";
  const founderName = founderProfile ? `${founderProfile.first_name} ${founderProfile.last_name}`.trim() : "Leonce Mushimiyimana";
  const founderBio = founderProfile?.bio || "Leonce is a software developer and digital product designer building clear, purposeful experiences with a strong focus on craftsmanship and impact.";
  const founderImage = founderProfile?.profile_image || founderProfile?.avatar || settings?.logo || null;
  const socialLinks: { label: string; url: string }[] = [];
  if (settings?.linkedin) socialLinks.push({ label: "LinkedIn", url: settings.linkedin });
  if (settings?.github) socialLinks.push({ label: "GitHub", url: settings.github });
  if (settings?.instagram) socialLinks.push({ label: "Instagram", url: settings.instagram });
  if (settings?.x) socialLinks.push({ label: "X", url: settings.x });
  if (settings?.youtube) socialLinks.push({ label: "YouTube", url: settings.youtube });

  return (
    <div className="flex w-full flex-col bg-[color:var(--surface)] text-[color:var(--text)]">
      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-6 text-left">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{siteName}</h1>
              {tagline && <h2 className="text-lg font-semibold text-green-400 sm:text-xl">{tagline}</h2>}
              <p className="text-lg leading-relaxed text-[color:var(--text-muted)]">
                Building digital experiences that create clarity, momentum and trust.
              </p>
              <p className="max-w-xl text-[color:var(--text-muted)]">
                I design and build thoughtful digital products rooted in strategy, usability and reliable engineering.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link to={ROUTES.PORTFOLIO}>
                  <Button>View My Work</Button>
                </Link>
                <Button variant="secondary" onClick={() => window.open(cvUrl, "_blank", "noopener,noreferrer")}>Download CV</Button>
              </div>
              {socialLinks.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-4 text-green-400">
                  {socialLinks.map((link) => (
                    <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.label} className="transition-colors hover:text-green-300">
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-8 text-center shadow-sm">
              {founderImage ? (
                <img src={founderImage} alt={`${founderName} profile`} className="mx-auto h-32 w-32 rounded-full object-cover" />
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-[color:var(--surface-muted)] text-2xl font-semibold text-[color:var(--text)]">
                  {founderName.charAt(0)}
                </div>
              )}
              <h3 className="mt-4 text-2xl font-semibold">{founderName}</h3>
              <p className="mt-2 text-[color:var(--text-muted)]">{founderBio}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-6">
                <div>
                  <p className="font-bold text-green-400">3+</p>
                  <p className="text-sm text-[color:var(--text-muted)]">Years Experience</p>
                </div>
                <div>
                  <p className="font-bold text-green-400">{featuredProjects.length}+</p>
                  <p className="text-sm text-[color:var(--text-muted)]">Projects Completed</p>
                </div>
                <div>
                  <p className="font-bold text-green-400">10+</p>
                  <p className="text-sm text-[color:var(--text-muted)]">Happy Clients</p>
                </div>
              </div>
              <Link to={ROUTES.ABOUT}>
                <Button className="mt-6">More About Me</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-[color:var(--border)] py-20">
        <Container>
          <SectionTitle title="What I Do" subtitle="Focused services for modern digital work" />
          {servicesToShow.length > 0 ? (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {servicesToShow.map((service) => (
                <div key={service.id} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6 text-center">
                  {service.icon && <img src={service.icon} alt={service.title} className="mx-auto mb-4 h-16 w-16 object-contain" />}
                  <h3 className="mb-2 font-semibold text-green-400">{service.title}</h3>
                  <p className="text-[color:var(--text-muted)]">{service.description}</p>
                  {service.starting_price && <p className="mt-3 text-sm text-green-400">Starting at {service.starting_price} FRW</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6"><h3 className="mb-2 font-semibold text-green-400">Web Development</h3><p className="text-[color:var(--text-muted)]">Building fast, responsive and scalable websites.</p></div>
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6"><h3 className="mb-2 font-semibold text-green-400">UI / UX Design</h3><p className="text-[color:var(--text-muted)]">Designing intuitive interfaces that users love.</p></div>
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6"><h3 className="mb-2 font-semibold text-green-400">Digital Strategy</h3><p className="text-[color:var(--text-muted)]">Crafting clear product direction and meaningful experiences.</p></div>
            </div>
          )}
          <div className="mt-10 text-center">
            <Link to={ROUTES.SERVICES}>
              <Button>Explore All Services</Button>
            </Link>
          </div>
        </Container>
      </section>

      <section className="border-t border-[color:var(--border)] py-20">
        <Container>
          <SectionTitle title="Featured Projects" subtitle="A closer look at recent work" />
          {projectsToShow.length > 0 ? (
            <div className="mt-10 grid gap-8 lg:grid-cols-3">
              {projectsToShow.map((project) => (
                <div key={project.id} className="flex flex-col rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6">
                  {project.thumbnail ? <img src={project.thumbnail} alt={project.title} className="mb-4 h-48 w-full rounded object-cover" /> : <div className="mb-4 h-48 w-full rounded bg-[color:var(--surface-muted)]" />}
                  <h3 className="text-xl font-semibold text-green-400">{project.title}</h3>
                  <p className="mt-2 flex-1 text-[color:var(--text-muted)]">{project.short_description || project.full_description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.technologies.slice(0, 4).map((techId) => {
                      const tech = technologyMap.get(techId);
                      return (
                        <span key={techId} className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs text-[color:var(--text-muted)]">
                          {tech?.name || `Technology ${techId}`}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button size="sm" onClick={() => { setSelectedProject(project); setIsProjectModalOpen(true); }}>View Details</Button>
                    <Link to={ROUTES.APPOINTMENT}>
                      <Button variant="secondary" size="sm">Book This Project</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-8 text-center">
              <h3 className="text-2xl font-semibold text-green-400">Featured Project</h3>
              <p className="mt-2 text-[color:var(--text-muted)]">No featured project is available yet. Check back soon.</p>
            </div>
          )}
        </Container>
      </section>

      <section className="border-t border-[color:var(--border)] py-24 text-center">
        <Container>
          <h2 className="mb-6 text-3xl font-semibold">Let&rsquo;s build something meaningful together.</h2>
          <p className="mx-auto mb-8 max-w-2xl text-[color:var(--text-muted)]">I&rsquo;m currently available for new projects, collaborations and thoughtful product refinements.</p>
          <Link to={ROUTES.APPOINTMENT}>
            <Button>Start a Project</Button>
          </Link>
        </Container>
      </section>

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
                      {tech?.icon ? <img src={tech.icon} alt="" className="mr-2 inline-flex h-4 w-4" /> : null}
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
              Book This Project
            </Link>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;