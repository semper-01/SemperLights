import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";

export default function NotFound() {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700">Page Not Found</h2>
        <p className="mt-2 text-gray-500">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to={ROUTES.HOME} className="mt-8">
          <Button>Go Home</Button>
        </Link>
      </div>
    </Container>
  );
}