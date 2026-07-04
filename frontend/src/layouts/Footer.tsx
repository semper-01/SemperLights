import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";
import { Container } from "@/components/ui/Container";
import { fetchServices, fetchSiteSettings } from "@/api/domain";
import type { Service, SiteSetting } from "@/types";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<SiteSetting | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchSiteSettings(), fetchServices()])
      .then(([siteData, servicesData]) => {
        if (!cancelled) {
          setSettings(siteData);
          setServices(servicesData.slice(0, 4));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSettings(null);
          setServices([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const socialLinks = [
    { label: "LinkedIn", url: settings?.linkedin },
    { label: "GitHub", url: settings?.github },
    { label: "Instagram", url: settings?.instagram },
    { label: "X", url: settings?.x },
    { label: "YouTube", url: settings?.youtube },
  ].filter((link): link is { label: string; url: string } => Boolean(link.url));

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <Container>
        <div className="py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-900">{settings?.site_name || "Semper Lights"}</h3>
              <p className="text-sm text-gray-600">
                {settings?.footer_text || "Design-led digital experiences crafted with clarity, purpose, and care."}
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Quick Links
              </h4>
              <ul className="space-y-2">
                <li><Link to={ROUTES.ABOUT} className="text-sm text-gray-600 transition-colors hover:text-amber-600">About</Link></li>
                <li><Link to={ROUTES.PORTFOLIO} className="text-sm text-gray-600 transition-colors hover:text-amber-600">Portfolio</Link></li>
                <li><Link to={ROUTES.SERVICES} className="text-sm text-gray-600 transition-colors hover:text-amber-600">Services</Link></li>
                <li><Link to={ROUTES.CONTACT} className="text-sm text-gray-600 transition-colors hover:text-amber-600">Contact</Link></li>
                <li><Link to={ROUTES.APPOINTMENT} className="text-sm text-gray-600 transition-colors hover:text-amber-600">Book Appointment</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Services
              </h4>
              <ul className="space-y-2">
                {services.length > 0 ? services.map((service) => (
                  <li key={service.id}><span className="text-sm text-gray-600">{service.title}</span></li>
                )) : (
                  <>
                    <li><span className="text-sm text-gray-600">Web Development</span></li>
                    <li><span className="text-sm text-gray-600">UI / UX Design</span></li>
                    <li><span className="text-sm text-gray-600">Digital Strategy</span></li>
                    <li><span className="text-sm text-gray-600">Brand Systems</span></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Contact
              </h4>
              <ul className="space-y-2">
                {settings?.email && <li><a href={`mailto:${settings.email}`} className="text-sm text-gray-600 transition-colors hover:text-amber-600">{settings.email}</a></li>}
                {settings?.phone && <li><a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="text-sm text-gray-600 transition-colors hover:text-amber-600">{settings.phone}</a></li>}
                {settings?.location && <li><span className="text-sm text-gray-600">{settings.location}</span></li>}
              </ul>
              {socialLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {socialLinks.map((link) => (
                    <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="text-sm text-gray-600 transition-colors hover:text-amber-600">
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 py-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {currentYear} {settings?.site_name || "Semper Lights"}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}