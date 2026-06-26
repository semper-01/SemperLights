import { cn } from "@/utils/helpers";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  alignment?: "left" | "center";
  className?: string;
}

export function SectionTitle({
  title,
  subtitle,
  alignment = "center",
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "mb-12",
        alignment === "center" && "text-center",
        className
      )}
    >
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          {subtitle}
        </p>
      )}
    </div>
  );
}