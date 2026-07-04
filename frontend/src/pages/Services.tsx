import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchServices } from "@/api/domain";
import { ROUTES } from "@/constants";
import type { Service } from "@/types";

type ServicesState = "loading" | "ready" | "error";

const Services: React.FC = () => {
  const [state, setState] = useState<ServicesState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const data = await fetchServices();
        if (!cancelled) {
          setServices(data);
          setState("ready");
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load services";
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

  if (state === "loading") {
    return (
      <div className="bg-[color:var(--surface)] text-[color:var(--text)] py-24">
        <Container>
          <Skeleton className="mb-8 h-10 w-48 bg-[color:var(--surface-muted)]" />
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg bg-[color:var(--surface-muted)] p-6 text-center">
                <Skeleton className="mb-4 h-32 w-full rounded bg-[color:var(--surface-muted)]" />
                <Skeleton className="mx-auto mb-2 h-6 w-3/4 bg-[color:var(--surface-muted)]" />
                <Skeleton className="h-4 w-full bg-[color:var(--surface-muted)]" />
              </div>
            ))}
          </div>
        </Container>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="bg-[color:var(--surface)] py-24 min-h-screen text-[color:var(--text)]">
        <Container>
          <ErrorState
            title="Failed to load services"
            message={error ?? "Unable to connect to the server."}
            onRetry={() => {
              setState("loading");
              setError(null);
              window.location.reload();
            }}
          />
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-[color:var(--surface)] py-24 text-[color:var(--text)]">
      <Container>
        <div className="mb-8 max-w-3xl">
          <h2 className="mb-3 text-4xl font-bold text-green-400">Services</h2>
          <p className="text-[color:var(--text-muted)]">
            A concise view of the services available for new projects, product launches and ongoing support.
          </p>
        </div>

        {services.length === 0 ? (
          <EmptyState
            title="No services available"
            description="There are no active services to display at this time. Check back soon."
          />
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <div key={service.id} className="flex flex-col rounded-lg bg-[color:var(--surface-muted)] p-6 text-center">
                  {service.icon ? (
                    <img src={service.icon} alt={service.title} className="mb-4 h-32 w-full rounded object-contain" />
                  ) : (
                    <div className="mb-4 h-32 w-full rounded bg-[color:var(--surface-muted)]" />
                  )}

                  <h3 className="text-xl font-semibold text-green-400">{service.title}</h3>
                  <p className="mt-2 flex-1 text-[color:var(--text-muted)]">{service.description}</p>

                  {service.starting_price && (
                    <p className="mt-4 text-sm text-green-400">Starting at {service.starting_price} FRW</p>
                  )}

                  {service.estimated_duration && (
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">Estimated duration: {service.estimated_duration}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link to={ROUTES.APPOINTMENT}>
                <Button>Book a Consultation</Button>
              </Link>
            </div>
          </>
        )}
      </Container>
    </div>
  );
};

export default Services;