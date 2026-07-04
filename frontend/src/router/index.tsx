import { Routes, Route } from "react-router-dom";
import { ROUTES } from "@/constants";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Portfolio from "@/pages/Portfolio";
import Services from "@/pages/Services";
import Contact from "@/pages/Contact";
import Appointment from "@/pages/Appointment";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

// Dashboard CMS pages
import PortfolioManagement from "@/pages/dashboard/PortfolioManagement";
import ServicesManagement from "@/pages/dashboard/ServicesManagement";
import MessagesManagement from "@/pages/dashboard/MessagesManagement";
import AppointmentsManagement from "@/pages/dashboard/AppointmentsManagement";
import CategoriesManagement from "@/pages/dashboard/CategoriesManagement";
import TechnologiesManagement from "@/pages/dashboard/TechnologiesManagement";
import SiteSettingsManagement from "@/pages/dashboard/SiteSettingsManagement";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>

        <Route index element={<Home />} />
        <Route path={ROUTES.ABOUT} element={<About />} />
        <Route path={ROUTES.PORTFOLIO} element={<Portfolio />} />
        <Route path={ROUTES.SERVICES} element={<Services />} />
        <Route path={ROUTES.CONTACT} element={<Contact />} />
        <Route path={ROUTES.APPOINTMENT} element={<Appointment />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={`${ROUTES.DASHBOARD}/portfolio`} element={<PortfolioManagement />} />
          <Route path={`${ROUTES.DASHBOARD}/services`} element={<ServicesManagement />} />
          <Route path={`${ROUTES.DASHBOARD}/messages`} element={<MessagesManagement />} />
          <Route path={`${ROUTES.DASHBOARD}/appointments`} element={<AppointmentsManagement />} />
          <Route path={`${ROUTES.DASHBOARD}/categories`} element={<CategoriesManagement />} />
          <Route path={`${ROUTES.DASHBOARD}/technologies`} element={<TechnologiesManagement />} />
          <Route path={`${ROUTES.DASHBOARD}/settings`} element={<SiteSettingsManagement />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}