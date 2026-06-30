import { AppBrand } from "@/core/assets";

type AppDeveloperCreditProps = {
  className?: string;
  compact?: boolean;
};

export function AppDeveloperCredit({ className = "", compact = false }: AppDeveloperCreditProps) {
  return (
    <p
      className={`${compact ? "text-[0.65rem]" : "text-xs"} font-semibold text-muted/85 ${className}`.trim()}
    >
      Developed by {AppBrand.developerName}
    </p>
  );
}
