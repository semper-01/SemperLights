import React, { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchServices, createAppointment } from "@/api/domain";
import type { Service } from "@/types";
import type { SelectOption } from "@/types";

type PageState = "loading" | "form" | "error" | "success";

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  service?: string;
  preferred_date?: string;
  budget_range?: string;
  project_summary?: string;
}

const BUDGET_OPTIONS: SelectOption[] = [
  { label: "Under $500", value: "UNDER_500" },
  { label: "$500 – $2,000", value: "500_TO_2000" },
  { label: "$2,000 – $5,000", value: "2000_TO_5000" },
  { label: "Over $5,000", value: "OVER_5000" },
];

/** Return today's date as YYYY-MM-DD for the min attribute. */
function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
  
}

const Appointment: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    preferred_date: "",
    preferred_time: "",
    budget_range: "",
    project_summary: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Load services ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetchServices()
      .then((data) => {
        if (!cancelled) {
          setServices(data);
          setPageState("form");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load services.";
          setPageError(msg);
          setPageState("error");
        }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Validation ────────────────────────────────────────────────
  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required.";
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (!form.service) errs.service = "Please select a service.";
    if (!form.preferred_date) errs.preferred_date = "Please select a preferred date.";
    if (!form.budget_range) errs.budget_range = "Please select a budget range.";
    return errs;
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
      await createAppointment({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        service: Number(form.service),
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time || undefined,
        budget_range: form.budget_range,
        project_summary: form.project_summary.trim() || undefined,
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
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  // ── Build service options ─────────────────────────────────────
  const serviceOptions: SelectOption[] = services.map((s) => ({
    label: s.title,
    value: String(s.id),
  }));

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
            title="Unable to load booking page"
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
            <h1 className="text-3xl font-bold mb-4">Request Received</h1>
            <p className="text-[color:var(--text-muted)] text-lg leading-relaxed">
              Thank you for booking a consultation. Your request has been received
              successfully. We&rsquo;ll review your information and contact you to
              confirm your appointment.
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
        <div className="max-w-3xl mx-auto">

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-green-400 mb-4">Book a Consultation</h1>
            <p className="text-[color:var(--text-muted)] leading-relaxed">
              Ready to start your next project? Book a free consultation and let&rsquo;s
              discuss how we can bring your vision to life.
            </p>
          </div>

          {/* ── Steps Overview ──────────────────────────────────────── */}
          <div className="grid sm:grid-cols-4 gap-4 mb-12">
            {[
              { step: "1", title: "Choose a Service" },
              { step: "2", title: "Select Date & Time" },
              { step: "3", title: "Project Details" },
              { step: "4", title: "We Confirm" },
            ].map((item) => (
              <div key={item.step} className="bg-[color:var(--surface-muted)] rounded-lg p-4 text-center">
                <div className="w-8 h-8 mx-auto rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center mb-2">
                  {item.step}
                </div>
                <p className="text-sm text-[color:var(--text-muted)]">{item.title}</p>
              </div>
            ))}
          </div>

          {/* ── Form ────────────────────────────────────────────────── */}
          <div className="bg-[color:var(--surface-muted)] rounded-xl p-8">
            {serverError && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Full Name"
                  placeholder="Your full name"
                  value={form.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  error={errors.full_name}
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
                  label="Phone"
                  placeholder="+250 XXX XXX XXX"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  helperText="Optional"
                />
                <Input
                  label="Company"
                  placeholder="Your company name"
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  helperText="Optional"
                />
              </div>

              <Select
                label="Service"
                placeholder="Select a service"
                options={serviceOptions}
                value={form.service}
                onChange={(e) => handleChange("service", e.target.value)}
                error={errors.service}
              />

              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Preferred Date"
                  type="date"
                  min={todayISO()}
                  value={form.preferred_date}
                  onChange={(e) => handleChange("preferred_date", e.target.value)}
                  error={errors.preferred_date}
                />
                <Input
                  label="Preferred Time"
                  type="time"
                  value={form.preferred_time}
                  onChange={(e) => handleChange("preferred_time", e.target.value)}
                  helperText="Optional"
                />
              </div>

              <Select
                label="Budget Range"
                placeholder="Select your budget range"
                options={BUDGET_OPTIONS}
                value={form.budget_range}
                onChange={(e) => handleChange("budget_range", e.target.value)}
                error={errors.budget_range}
              />

              <Textarea
                label="Project Summary"
                placeholder="Briefly describe what you're hoping to build..."
                rows={4}
                value={form.project_summary}
                onChange={(e) => handleChange("project_summary", e.target.value)}
              />

              <p className="text-sm text-[color:var(--text-muted)]">
                Once submitted, Semper Lights will review your request and contact you
                to confirm your appointment.
              </p>

              <Button
                type="submit"
                size="lg"
                isFullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Request Consultation"}
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Appointment;