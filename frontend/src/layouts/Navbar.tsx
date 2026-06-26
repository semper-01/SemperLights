import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";
import { Container } from "@/components/ui/Container";

const navLinks = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Portfolio", href: ROUTES.PORTFOLIO },
  { label: "Services", href: ROUTES.SERVICES },
  { label: "Blog", href: ROUTES.BLOG },
  { label: "Contact", href: ROUTES.CONTACT },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link to={ROUTES.HOME} className="text-xl font-bold text-gray-900">
            Semper Lights
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-amber-600"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to={ROUTES.APPOINTMENT}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              Book Now
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
}