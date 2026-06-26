import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <Container>
        <div className="py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-900">Semper Lights</h3>
              <p className="text-sm text-gray-600">
                Professional photography services capturing life's most precious moments.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Quick Links
              </h4>
              <ul className="space-y-2">
                <li><Link to={ROUTES.PORTFOLIO} className="text-sm text-gray-600 hover:text-amber-600 transition-colors">Portfolio</Link></li>
                <li><Link to={ROUTES.SERVICES} className="text-sm text-gray-600 hover:text-amber-600 transition-colors">Services</Link></li>
                <li><Link to={ROUTES.BLOG} className="text-sm text-gray-600 hover:text-amber-600 transition-colors">Blog</Link></li>
                <li><Link to={ROUTES.CONTACT} className="text-sm text-gray-600 hover:text-amber-600 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Services
              </h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-gray-600">Wedding Photography</span></li>
                <li><span className="text-sm text-gray-600">Portrait Sessions</span></li>
                <li><span className="text-sm text-gray-600">Event Coverage</span></li>
                <li><span className="text-sm text-gray-600">Commercial</span></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Contact
              </h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-gray-600">info@semperlights.com</span></li>
                <li><span className="text-sm text-gray-600">+1 (555) 123-4567</span></li>
                <li><span className="text-sm text-gray-600">Kigali, Rwanda</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 py-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {currentYear} Semper Lights. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}