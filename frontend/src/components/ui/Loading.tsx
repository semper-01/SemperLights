import { cn } from "@/utils/helpers";
import { Spinner } from "./Spinner";

interface LoadingProps {
  fullPage?: boolean;
  text?: string;
  className?: string;
}

export function Loading({ fullPage = false, text = "Loading...", className }: LoadingProps) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
        <Spinner size="lg" />
        {text && <p className="mt-4 text-sm text-gray-500">{text}</p>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <Spinner size="md" />
      {text && <p className="mt-3 text-sm text-gray-500">{text}</p>}
    </div>
  );
}

export function LoadingScreen() {
  return <Loading fullPage />;
}