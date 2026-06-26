import { Outlet } from "react-router-dom";
import { Container } from "@/components/ui/Container";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Container narrow>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Semper Lights</h1>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <Outlet />
        </div>
      </Container>
    </div>
  );
}