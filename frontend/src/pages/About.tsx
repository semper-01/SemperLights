import React, { useEffect, useState } from "react";

import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchSiteSettings, fetchCurrentUser } from "@/api/domain";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";
import type { SiteSetting, User } from "@/types";

/**
 * About Semper Lights — public website page.
 *
 * Data sources:
 *   - SiteSetting (core) — site_name, tagline, logo
 *   - User (auth) — founder profile photo, name, bio
 *   - Static content — mission, vision, core values,
 *     expertise, design process, philosophy, why choose
 *
 * Principle: Illuminate → Reveal → Guide
 * Architecture: Authentication belongs exclusively to the Auth module.
 */

type PageState = "loading" | "ready" | "error";

// ─── Static Content (no backend model exists) ───────────────────

const CORE_VALUES = [
  { title: "Clarity", description: "Every interface, interaction, and pixel communicates one thing: this work was made by someone who cares deeply about quality." },
  { title: "Purpose", description: "Semper Lights exists to turn engineering mastery into undeniable proof." },
  { title: "Craftsmanship", description: "Every visual decision adds to the proof of quality or subtracts from it. There is no neutral position." },
  { title: "Integrity", description: "The interface does not overpromise. It lets the work speak for itself." },
  { title: "Curiosity", description: "Every project is an opportunity to learn, refine craft, and create solutions that make a meaningful difference." },
  { title: "Reliability", description: "Systems, products, and experiences must be trustworthy and genuinely useful." },
  { title: "Human-centered Thinking", description: "Technology should never become a barrier between people and their goals." },
  { title: "Continuous Improvement", description: "The pursuit of clarity is never complete. There is always a better way." },
];

const EXPERTISE_AREAS = [
  "Software Engineering",
  "Web Design & Development",
  "UI/UX Design",
  "Brand Identity",
  "Artificial Intelligence",
  "Cybersecurity",
  "Networking",
  "Internet of Things (IoT)",
  "Digital Product Strategy",
];

const DESIGN_PROCESS = [
  { step: "01", title: "Discover", description: "Understand the problem, the user, and the context." },
  { step: "02", title: "Understand", description: "Analyze requirements, constraints, and opportunities." },
  { step: "03", title: "Design", description: "Craft solutions that are clear, purposeful, and beautiful." },
  { step: "04", title: "Build", description: "Develop with precision, reliability, and scalability." },
  { step: "05", title: "Refine", description: "Test, iterate, and polish until every detail serves the whole." },
  { step: "06", title: "Deliver", description: "Launch with confidence and support for the long term." },
];

const WHY_CHOOSE = [
  { title: "Human-centered Solutions", description: "Every product is designed around real people, not technology constraints." },
  { title: "Thoughtful Architecture", description: "Systems are built to scale, adapt, and endure." },
  { title: "Transparent Collaboration", description: "You see the process, the progress, and the reasoning behind every decision." },
  { title: "Reliable Engineering", description: "Code that is tested, documented, and maintainable." },
  { title: "Continuous Improvement", description: "Every project surfaces lessons that make the next one better." },
  { title: "Long-term Partnerships", description: "We build relationships, not just projects." },
];

const About: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSetting | null>(null);
  const [founder, setFounder] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchSiteSettings(), fetchCurrentUser()])
      .then(([siteData, userData]) => {
        if (!cancelled) {
          setSettings(siteData);
          setFounder(userData);
          setPageState("ready");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load data.";
          setPageError(msg);
          setPageState("error");
        }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Loading State ──────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--surface)] text-[color:var(--text)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-[color:var(--surface)] text-[color:var(--text)]">
        <Container className="py-24">
          <ErrorState
            title="Unable to load page"
            message={pageError ?? "Please try again later."}
            onRetry={() => window.location.reload()}
          />
        </Container>
      </div>
    );
  }

  const siteName = settings?.site_name || "Semper Lights";
  const tagline = settings?.tagline || "";
  const founderName = founder ? `${founder.first_name} ${founder.last_name}`.trim() : "Leonce Mushimiyimana";
  const founderBio = founder?.bio || "Leonce is an Information Technology student, software developer, and digital product designer with a growing focus on building meaningful technology that bridges design and engineering. He founded Semper Lights to turn engineering mastery into undeniable proof \u2014 creating digital experiences that are clear, purposeful, and meticulously crafted.";
  const founderImage = founder?.profile_image || founder?.avatar || null;

  return (
    <div className="bg-[color:var(--surface)] text-[color:var(--text)]">

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — Hero
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              About {siteName}
            </h1>
            {tagline ? (
              <p className="text-xl text-[color:var(--text-muted)] leading-relaxed mb-10">{tagline}</p>
            ) : (
              <p className="text-xl text-[color:var(--text-muted)] leading-relaxed mb-10">
                A design and engineering studio dedicated to transforming complexity into clarity.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={ROUTES.PORTFOLIO}>
                <Button size="lg">Explore Our Work</Button>
              </Link>
              <Link to={ROUTES.CONTACT}>
                <Button variant="secondary" size="lg">Let&rsquo;s Talk</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — Our Story
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-[color:var(--border)]">
        <Container>
          <div className="max-w-3xl mx-auto">
            <SectionTitle title="Our Story" subtitle="Why Semper Lights exists" alignment="left" />
            <div className="space-y-6 text-[color:var(--text-muted)] leading-relaxed text-lg">
              <p>
                {siteName} was founded on a simple conviction: great software should feel
                inevitable. Not because it is flashy or opinionated, but because it is clear,
                purposeful, and meticulously crafted.
              </p>
              <p>
                {siteName} exists to turn engineering mastery into undeniable proof. Every
                interface, every interaction, and every pixel communicates one thing: this work
                was made by someone who cares deeply about quality &mdash; and always will.
              </p>
              <p>
                The name {siteName} &mdash; Latin for &ldquo;always lights&rdquo; &mdash; reflects our commitment to
                illuminating complexity, revealing clarity, and guiding users toward their goals
                without friction. We believe that technology should never become a barrier between
                people and their aspirations.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — Mission & Vision
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-[color:var(--border)]">
        <Container>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-[color:var(--surface-muted)] rounded-xl p-8 border border-[color:var(--border)]">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-400 mb-3">Our Mission</h3>
              <p className="text-[color:var(--text-muted)] leading-relaxed">
                Transform complexity into clarity through design, engineering and learning.
              </p>
            </div>
            <div className="bg-[color:var(--surface-muted)] rounded-xl p-8 border border-[color:var(--border)]">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-400 mb-3">Our Vision</h3>
              <p className="text-[color:var(--text-muted)] leading-relaxed">
                To become a globally recognized studio known for timeless, human-centered and technically excellent digital products.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — Core Values
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-[color:var(--border)]">
        <Container>
          <SectionTitle title="Core Values" subtitle="The principles that guide every decision" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mt-10">
            {CORE_VALUES.map((value) => (
              <div key={value.title} className="bg-[color:var(--surface-muted)] rounded-xl p-6 border border-[color:var(--border)]">
                <h3 className="text-green-400 font-semibold mb-2">{value.title}</h3>
                <p className="text-[color:var(--text-muted)] text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — Meet the Founder
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-[color:var(--border)]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <SectionTitle title="Meet the Founder" subtitle="The person behind Semper Lights" alignment="left" />
            <div className="flex flex-col md:flex-row gap-10 items-start mt-10">
              {/* Profile photo */}
              <div className="flex-shrink-0">
                {founderImage ? (
                  <img src={founderImage} alt={`${founderName} profile`} className="w-40 h-40 rounded-full object-cover border-2 border-[color:var(--border)]" />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-[color:var(--surface-muted)] border-2 border-[color:var(--border)] flex items-center justify-center text-[color:var(--text-muted)] text-sm">
                    {founderName.charAt(0)}
                  </div>
                )}
              </div>
              {/* Bio */}
              <div className="space-y-4 text-[color:var(--text-muted)] leading-relaxed">
                <h3 className="text-2xl font-semibold text-[color:var(--text)]">{founderName}</h3>
                <Badge variant="default" className="bg-green-500/20 text-green-400 border border-green-500/30">
                  Founder & Software Engineer
                </Badge>
                <p className="mt-4">{founderBio}</p>
                <p>
                  With expertise spanning software engineering, web development, UI/UX design, and an expanding
                  curiosity for artificial intelligence, cybersecurity, networking, and the Internet of Things,
                  he brings both depth and breadth to every project. His approach combines technical rigor
                  with a human-centered philosophy, ensuring that every solution serves real people &mdash; not just
                  technology requirements.
                </p>
                <p>
                  He believes that technology should never become a barrier between people and their goals.
                  His work is driven by the pursuit of clarity &mdash; designing systems, products, and experiences
                  that are not only functional, but understandable, trustworthy, and genuinely useful.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6 — Areas of Expertise
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-[color:var(--border)]">
        <Container>
          <SectionTitle title="Areas of Expertise" subtitle="Where we deliver" />
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mt-10">
            {EXPERTISE_AREAS.map((area) => (
              <Badge
                key={area}
                variant="default"
                className="bg-[color:var(--surface-muted)] text-[color:var(--text)] dark:text-[color:var(--text)] border border-[color:var(--border)] px-4 py-2 text-sm"
              >
                {area}
              </Badge>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 7 — Design Process
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-[color:var(--border)]">
        <Container>
          <SectionTitle title="Our Design Process" subtitle="Illuminate &middot; Reveal &middot; Guide" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4 max-w-5xl mx-auto mt-10">
            {DESIGN_PROCESS.map((phase, index) => (
              <div key={phase.title} className="bg-[color:var(--surface-muted)] rounded-xl p-5 border border-[color:var(--border)] text-center relative">
                {index < DESIGN_PROCESS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] text-xl z-10">
                    &rarr;
                  </div>
                )}
                <div className="w-10 h-10 mx-auto rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center mb-3 text-sm">
                  {phase.step}
                </div>
                <h3 className="text-green-400 font-semibold mb-1 text-sm">{phase.title}</h3>
                <p className="text-[color:var(--text-muted)] text-xs leading-relaxed">{phase.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 8 — Personal Philosophy
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-[color:var(--border)]">
        <Container>
          <div className="max-w-3xl mx-auto">
            <SectionTitle title="Personal Philosophy" subtitle="What drives the work" alignment="left" />
            <blockquote className="bg-[color:var(--surface-muted)] rounded-xl p-8 md:p-12 border border-[color:var(--border)] mt-10">
              <svg className="w-8 h-8 text-green-400/40 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-lg md:text-xl text-[color:var(--text)] leading-relaxed italic">
                &ldquo;I believe technology should never become a barrier between people and their goals.
                My work is driven by the pursuit of clarity &mdash; designing systems, products, and experiences
                that are not only functional, but understandable, trustworthy, and genuinely useful.
                Every project is an opportunity to learn, refine my craft, and create solutions that make
                a meaningful difference.&rdquo;
              </p>
              <div className="mt-6 pt-6 border-t border-[color:var(--border)]">
                <p className="text-green-400 font-semibold">{founderName}</p>
                <p className="text-[color:var(--text-muted)] text-sm">Founder, {siteName}</p>
              </div>
            </blockquote>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 9 — Why Choose Semper Lights
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-[color:var(--border)]">
        <Container>
          <SectionTitle title="Why Choose Semper Lights" subtitle="What sets us apart" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mt-10">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="bg-[color:var(--surface-muted)] rounded-xl p-6 border border-[color:var(--border)]">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-green-400 font-semibold mb-2">{item.title}</h3>
                <p className="text-[color:var(--text-muted)] text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 10 — Final Call to Action
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 border-t border-[color:var(--border)] text-center">
        <Container>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">
              Let&rsquo;s Build Something Meaningful Together
            </h2>
            <p className="text-[color:var(--text-muted)] text-lg leading-relaxed mb-10">
              Whether you&rsquo;re launching a new idea, modernizing an existing product, or exploring
              what&rsquo;s possible with technology, {siteName} is ready to help transform complexity
              into clarity.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={ROUTES.PORTFOLIO}>
                <Button size="lg">View Portfolio</Button>
              </Link>
              <Link to={ROUTES.APPOINTMENT}>
                <Button variant="secondary" size="lg">Book Consultation</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default About;