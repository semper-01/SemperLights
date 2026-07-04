import React, { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchSiteSettings, submitContactMessage } from "@/api/domain";
import type { SiteSetting } from "@/types";

type PageState = "loading" | "form" | "error" | "success";

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

function validateEmail(value: string): string | undefined {
  if (!value) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
  return undefined;
}

function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} is required.`;
  return undefined;
}

const Contact: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSetting | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Load site settings ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetchSiteSettings()
      .then((data) => {
        if (!cancelled) {
          setSettings(data);
          setPageState("form");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load contact information.";
          setPageError(msg);
          setPageState("error");
        }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Validation ────────────────────────────────────────────────
  function validate(): FormErrors {
    return {
      name: validateRequired(form.name, "Name"),
      email: validateEmail(form.email),
      subject: validateRequired(form.subject, "Subject"),
      message: validateRequired(form.message, "Message"),
    };
  }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      await submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setPageState("success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  // ── Loading State ──────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--surface)] text-[color:var(--text)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Error State (site settings load failure) ───────────────────
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-[color:var(--surface)] text-[color:var(--text)]">
        <Container className="py-24">
          <ErrorState
            title="Unable to load contact page"
            message={pageError ?? "Please try again later."}
            onRetry={() => window.location.reload()}
          />
        </Container>
      </div>
    );
  }

  // ── Success State ──────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="bg-[color:var(--surface)] text-[color:var(--text)] py-24 min-h-screen">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Message Sent</h1>
            <p className="text-[color:var(--text-muted)] text-lg leading-relaxed">
              Thank you for contacting {settings?.site_name || "Semper Lights"}.
              Your message has been received successfully. We&rsquo;ll review your
              information and respond as soon as possible.
            </p>
            <p className="text-[color:var(--text-muted)] mt-6">
              In the meantime, feel free to explore our{" "}
              <a href="/portfolio" className="text-green-400 hover:underline">
                portfolio
              </a>{" "}
              or learn more about our{" "}
              <a href="/services" className="text-green-400 hover:underline">
                services
              </a>.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  // ── Form State ─────────────────────────────────────────────────
  return (
    <div className="bg-[color:var(--surface)] text-[color:var(--text)] py-24 min-h-screen">
      <Container>
        <div className="grid md:grid-cols-5 gap-12">

          {/* ── Left: Contact Information ──────────────────────────── */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-green-400 mb-2">Let&rsquo;s Start a Conversation</h1>
              <p className="text-[color:var(--text-muted)] mt-4 leading-relaxed">
                Whether you have an idea, a challenge, or a question, we&rsquo;d love to
                hear from you. Tell us about your project and we&rsquo;ll respond as soon
                as possible.
              </p>
            </div>

            <div className="space-y-5">
              {settings?.email && (
                <div>
                  <p className="text-sm text-[color:var(--text-muted)] uppercase tracking-wider">Email</p>
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-[color:var(--text)] hover:text-green-400 transition-colors"
                  >
                    {settings.email}
                  </a>
                </div>
              )}
              {settings?.phone && (
                <div>
                  <p className="text-sm text-[color:var(--text-muted)] uppercase tracking-wider">Phone</p>
                  <a
                    href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                    className="text-[color:var(--text)] hover:text-green-400 transition-colors"
                  >
                    {settings.phone}
                  </a>
                </div>
              )}
              {settings?.location && (
                <div>
                  <p className="text-sm text-[color:var(--text-muted)] uppercase tracking-wider">Location</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(settings.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--text)] hover:text-green-400 transition-colors"
                  >
                    {settings.location}
                  </a>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-4">
              {settings?.linkedin && (
                <a href={settings.linkedin} target="_blank" rel="noopener noreferrer"
                   className="text-sm text-green-400 hover:underline">LinkedIn</a>
              )}
              {settings?.github && (
                <a href={settings.github} target="_blank" rel="noopener noreferrer"
                   className="text-sm text-green-400 hover:underline">GitHub</a>
              )}
              {settings?.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer"
                   className="text-sm text-green-400 hover:underline">Instagram</a>
              )}
              {settings?.x && (
                <a href={settings.x} target="_blank" rel="noopener noreferrer"
                   className="text-sm text-green-400 hover:underline">X</a>
              )}
              {settings?.youtube && (
                <a href={settings.youtube} target="_blank" rel="noopener noreferrer"
                   className="text-sm text-green-400 hover:underline">YouTube</a>
              )}
            </div>
          </div>

          {/* ── Right: Contact Form ──────────────────────────────── */}
          <div className="md:col-span-3">
            <div className="bg-[color:var(--surface-muted)] rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>

              {serverError && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <Input
                  label="Name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  error={errors.email}
                />
                <Input
                  label="Subject"
                  placeholder="What would you like to discuss?"
                  value={form.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  error={errors.subject}
                />
                <Textarea
                  label="Message"
                  placeholder="Describe your project, challenge, or question..."
                  rows={5}
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  error={errors.message}
                />
                <Button
                  type="submit"
                  size="lg"
                  isFullWidth
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Contact;