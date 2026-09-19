import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { cn } from "@/lib/utils";
import { statusPresentation } from "@/types/sensors";
import { Activity, ShieldAlert, ShieldCheck } from "lucide-react";

const STATUS_ICON = {
  Stable: ShieldCheck,
  Warning: ShieldAlert,
  Unstable: ShieldAlert,
};

/**
 * Top-of-page summary of the worst current status across every sensor, with a
 * pulsing indicator and the shared green / amber / red color coding.
 */
export function OverallStatusBanner({ status, detail, isLive }) {
  const presentation = statusPresentation(status);
  const Icon = STATUS_ICON[presentation.label];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-md border border-border border-l-4 bg-card p-4 shadow-inset-soft md:p-5",
        presentation.accentClass,
      )}
      data-ocid="dashboard.status_banner"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-sm border",
              presentation.badgeClass,
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Overall system status
            </p>
            <p
              className={cn(
                "font-display text-2xl font-bold tracking-tight md:text-3xl",
                presentation.textClass,
              )}
            >
              {presentation.label}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <StatusBadge status={status} size="md" />
          <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isLive ? "bg-success status-pulse" : "bg-muted-foreground",
              )}
              aria-hidden="true"
            />
            <Activity className="size-3" aria-hidden="true" />
            <span className="truncate">{detail}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
