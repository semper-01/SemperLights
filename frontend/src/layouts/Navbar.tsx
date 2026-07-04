import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants";
import { Container } from "@/components/ui/Container";
import { useTheme } from "@/contexts/ThemeContext";

const navLinks = [
  { label: "Home", href: ROUTES.HOME },
  { label: "About", href: ROUTES.ABOUT },
  { label: "Portfolio", href: ROUTES.PORTFOLIO },
  { label: "Services", href: ROUTES.SERVICES },
  { label: "Contact", href: ROUTES.CONTACT },
  { label: "Login", href: ROUTES.LOGIN },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between gap-3">
          <Link to={ROUTES.HOME} className="text-xl font-bold text-[#111827]">
            Semper Lights
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              className="rounded-full border border-[#e5e7eb] p-2 text-[#6b7280] transition-colors hover:text-amber-600"
            >
              {theme === "light" ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m9-6.5 1.4-1.4M9.6 14.4l-1.4 1.4m8.8-8.8-1.4 1.4M9.6 9.6 8.2 8.2m4.8 8.8 1.4-1.4M12 8.5A3.5 3.5 0 1 0 15.5 12 3.5 3.5 0 0 0 12 8.5Z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              aria-label="Toggle navigation"
              className="rounded-full border border-[#e5e7eb] p-2 text-[#6b7280] transition-colors hover:text-amber-600 md:hidden"
              onClick={() => setIsMenuOpen((value) => !value)}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>

            <nav className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-[#6b7280] transition-colors hover:text-amber-600"
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
        </div>

        {isMenuOpen && (
          <nav className="border-t border-[#e5e7eb] bg-[#ffffff] py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-[#6b7280] transition-colors hover:text-amber-600"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to={ROUTES.APPOINTMENT}
                className="mt-2 inline-flex w-fit rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                Book Now
              </Link>
            </div>
          </nav>
        )}
      </Container>
    </header>
  );
}