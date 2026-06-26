import { Outlet, Link } from "react-router-dom";
import { ROUTES } from "@/constants";

const sidebarLinks = [
  { label: "Dashboard", href: ROUTES.DASHBOARD },
  { label: "Appointments", href: `${ROUTES.DASHBOARD}/appointments` },
  { label: "Portfolio", href: `${ROUTES.DASHBOARD}/portfolio` },
  { label: "Messages", href: `${ROUTES.DASHBOARD}/messages` },
  { label: "Settings", href: `${ROUTES.DASHBOARD}/settings` },
];

export function DashboardLayout() {
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