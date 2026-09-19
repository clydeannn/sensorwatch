import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatClock, statusPresentation } from "@/types/sensors";

/**
 * Scrollable, bounded log of the most recent readings, newest first, with each
 * sensor value and its status color coding.
 */
export function ReadingsLog({ history }) {
  // The backend already returns readings newest-first, so render as-is.
  const rows = history;

  if (rows.length === 0) {
    return (
      <div
        className="flex h-40 items-center justify-center rounded-md border border-dashed border-border bg-muted/20"
        data-ocid="dashboard.readings_log.empty_state"
      >
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
          No readings recorded yet
        </p>
      </div>
    );
  }

  return (
    <div
      className="scrollbar-thin max-h-[22rem] overflow-y-auto rounded-md border border-border"
      data-ocid="dashboard.readings_log"
    >
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="hover:bg-card">
            <TableHead className="font-mono text-[10px] uppercase tracking-[0.14em]">
              Time
            </TableHead>
            <TableHead className="text-right font-mono text-[10px] uppercase tracking-[0.14em]">
              Temp °C
            </TableHead>
            <TableHead className="text-right font-mono text-[10px] uppercase tracking-[0.14em]">
              Hum %
            </TableHead>
            <TableHead className="text-right font-mono text-[10px] uppercase tracking-[0.14em]">
              Gas ADC
            </TableHead>
            <TableHead className="text-right font-mono text-[10px] uppercase tracking-[0.14em]">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((reading, index) => {
            const presentation = statusPresentation(reading.overallStatus);
            return (
              <TableRow
                key={reading.timestamp.toString()}
                className={cn("border-l-2", presentation.accentClass)}
                data-ocid={`dashboard.readings_log.row.${index + 1}`}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatClock(reading.timestamp)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                  {reading.temperature.toFixed(1)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                  {reading.humidity.toFixed(0)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums text-foreground">
                  {reading.gas}
                </TableCell>
                <TableCell className="text-right">
                  <StatusBadge status={reading.overallStatus} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
