import { Outlet, Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/api/auth";

const sidebarLinks = [
  { label: "Dashboard", href: ROUTES.DASHBOARD },
  { label: "Appointments", href: `${ROUTES.DASHBOARD}/appointments` },
  { label: "Portfolio", href: `${ROUTES.DASHBOARD}/portfolio` },
  { label: "Services", href: `${ROUTES.DASHBOARD}/services` },
  { label: "Messages", href: `${ROUTES.DASHBOARD}/messages` },
  { label: "Categories", href: `${ROUTES.DASHBOARD}/categories` },
  { label: "Technologies", href: `${ROUTES.DASHBOARD}/technologies` },
  { label: "Settings", href: `${ROUTES.DASHBOARD}/settings` },
];


export function DashboardLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toggleTheme } = useTheme();



  const handleLogout = async () => {
    await logoutUser();
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 border-r border-gray-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <Link to={ROUTES.HOME} className="text-lg font-bold text-gray-900">
            Semper Lights
          </Link>
        </div>
        <nav className="px-4 py-4">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="flex h-16 items-center justify-end px-6">
            <div className="flex items-center gap-4">
              <Link
                to={ROUTES.HOME}
                className="text-sm text-gray-600 hover:text-amber-600 transition-colors"
              >
                View Site
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="rounded-full border border-gray-200 p-2 text-gray-600 transition-colors hover:text-amber-600"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                  />
                </svg>
              </button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}