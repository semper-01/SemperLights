import { Outlet } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-12">
        <Container narrow>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Semper Lights</h1>
            <p className="mt-2 text-sm text-gray-500">Administrator access portal</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <Outlet />
          </div>
        </Container>
      </div>
      <Footer />
    </div>
  );
}