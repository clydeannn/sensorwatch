import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { cn } from "@/lib/utils";

/**
 * Large glanceable instrument readout for a single sensor channel.
 */
export function SensorReadoutCard({
  label,
  sensor,
  value,
  unit,
  note,
  status,
  icon: Icon,
  emphasis = "primary",
  ocid,
}) {
  const isPrimary = emphasis === "primary";

  return (
    <article
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-md border border-border bg-card shadow-inset-soft",
        isPrimary ? "p-4 md:p-5" : "p-4",
      )}
      data-ocid={`dashboard.readout_card.${ocid}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 text-muted-foreground",
              isPrimary ? "size-8" : "size-7",
            )}
          >
            <Icon
              className={isPrimary ? "size-4" : "size-3.5"}
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate font-display font-bold tracking-tight text-foreground",
                isPrimary ? "text-sm" : "text-xs",
              )}
            >
              {label}
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {sensor}
            </p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span
          className={cn(
            "readout text-foreground",
            isPrimary ? "text-5xl md:text-6xl" : "text-4xl",
          )}
          data-ocid={`dashboard.readout_value.${ocid}`}
        >
          {value}
        </span>
        <span
          className={cn(
            "font-mono font-semibold text-muted-foreground",
            isPrimary ? "text-lg" : "text-base",
          )}
        >
          {unit}
        </span>
      </div>

      {note ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {note}
        </p>
      ) : null}
    </article>
  );
}
