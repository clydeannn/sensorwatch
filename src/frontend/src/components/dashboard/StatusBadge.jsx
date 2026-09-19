import { cn } from "@/lib/utils";
import { statusPresentation } from "@/types/sensors";

/**
 * Color-coded Stable / Warning / Unstable badge shared by the readout cards,
 * the overall banner, and the readings log.
 */
export function StatusBadge({ status, size = "sm", className }) {
  const presentation = statusPresentation(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border font-mono font-semibold uppercase tracking-[0.14em]",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        presentation.badgeClass,
        className,
      )}
      data-ocid={`status.badge.${presentation.label.toLowerCase()}`}
    >
      <span
        className={cn("size-1.5 rounded-full", presentation.dotClass)}
        aria-hidden="true"
      />
      {presentation.label}
    </span>
  );
}
