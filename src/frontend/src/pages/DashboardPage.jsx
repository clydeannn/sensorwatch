import { Layout } from "@/components/Layout";
import { OverallStatusBanner } from "@/components/dashboard/OverallStatusBanner";
import { ReadingsLog } from "@/components/dashboard/ReadingsLog";
import { SensorReadoutCard } from "@/components/dashboard/SensorReadoutCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { useSensorReadings } from "@/hooks/useSensorReadings";
import { cn } from "@/lib/utils";
import {
  SensorStatus,
  formatFullTime,
  statusPresentation,
} from "@/types/sensors";
import {
  AlertTriangle,
  Droplets,
  Flame,
  RefreshCw,
  Thermometer,
} from "lucide-react";

/** LCD status code mirrored from the physical 16x2 display. */
const LCD_STATUS_CODE = {
  [SensorStatus.Stable]: "1",
  [SensorStatus.Warning]: "2",
  [SensorStatus.Unstable]: "3",
};

function buildLcdLine(reading) {
  return `T: ${reading.temperature.toFixed(1)}C H: ${reading.humidity.toFixed(0)}% / G: ${reading.gas} S: ${LCD_STATUS_CODE[String(reading.overallStatus)] ?? "-"}`;
}

/** Names of the sensors currently at or above the overall status. */
function describeStatus(reading) {
  const overall = String(reading.overallStatus);
  const offenders = [];
  if (String(reading.temperatureStatus) === overall) {
    offenders.push("temperature");
  }
  if (String(reading.gasStatus) === overall) {
    offenders.push("gas");
  }
  if (String(reading.humidityStatus) === overall) {
    offenders.push("humidity");
  }

  if (overall === String(SensorStatus.Stable)) {
    return "All channels within normal range";
  }
  return `Driven by ${offenders.join(" · ")}`;
}

function LoadingState() {
  const skeletonIds = ["banner", "temp", "gas", "hum", "chart", "log"];
  return (
    <div className="space-y-4" data-ocid="dashboard.loading_state">
      {skeletonIds.map((id) => (
        <div
          key={id}
          className="h-24 animate-pulse rounded-md border border-border bg-muted/30"
        />
      ))}
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-md border border-unstable/40 bg-unstable/10 p-8 text-center"
      data-ocid="dashboard.error_state"
    >
      <AlertTriangle className="size-8 text-unstable" aria-hidden="true" />
      <p className="font-display text-lg font-bold text-foreground">
        Live feed unavailable
      </p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <RefreshCw className="size-3" aria-hidden="true" />
        Retrying automatically every 2s
      </p>
    </div>
  );
}

/**
 * Single-screen monitoring dashboard: overall status banner, three large
 * readout cards, live trend chart, and a timestamped readings log.
 */
export function DashboardPage() {
  const { current, history, isLoading, isError, error, lastUpdated } =
    useSensorReadings();

  const lcdLine = current ? buildLcdLine(current) : undefined;

  return (
    <Layout lcdLine={lcdLine} isLive={!isError}>
      <div className="space-y-4 md:space-y-5" data-ocid="dashboard.page">
        {isError ? (
          <ErrorState
            message={
              error?.message ??
              "The bench rig stopped responding. Check the connection and try again."
            }
          />
        ) : isLoading && !current ? (
          <LoadingState />
        ) : current ? (
          <>
            <OverallStatusBanner
              status={current.overallStatus}
              detail={describeStatus(current)}
              isLive
            />

            <section
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              data-ocid="dashboard.readout_grid"
            >
              <SensorReadoutCard
                label="Temperature"
                sensor="DHT11"
                value={current.temperature.toFixed(1)}
                unit="°C"
                status={current.temperatureStatus}
                icon={Thermometer}
                emphasis="primary"
                ocid="temperature"
              />
              <SensorReadoutCard
                label="Gas Level"
                sensor="MQ-2"
                value={String(current.gas)}
                unit="ADC"
                note="Raw analog channel"
                status={current.gasStatus}
                icon={Flame}
                emphasis="primary"
                ocid="gas"
              />
              <SensorReadoutCard
                label="Humidity"
                sensor="DHT11"
                value={current.humidity.toFixed(0)}
                unit="%"
                status={current.humidityStatus}
                icon={Droplets}
                emphasis="secondary"
                ocid="humidity"
              />
            </section>

            <section
              className="rounded-md border border-border bg-card p-4 shadow-inset-soft md:p-5"
              data-ocid="dashboard.trend_panel"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-bold tracking-tight text-foreground">
                    Live trend
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Recent monitoring window · {history.length} samples
                  </p>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Last updated{" "}
                  <span className="text-foreground">
                    {lastUpdated ? formatFullTime(lastUpdated) : "—"}
                  </span>
                </p>
              </div>
              <TrendChart history={history} />
            </section>

            <section
              className="rounded-md border border-border bg-card p-4 shadow-inset-soft md:p-5"
              data-ocid="dashboard.log_panel"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-bold tracking-tight text-foreground">
                    Recent readings
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Newest first · bounded to {history.length} entries
                  </p>
                </div>
                <span
                  className={cn(
                    "font-mono text-[11px]",
                    statusPresentation(current.overallStatus).textClass,
                  )}
                >
                  {statusPresentation(current.overallStatus).label}
                </span>
              </div>
              <ReadingsLog history={history} />
            </section>
          </>
        ) : (
          <div
            className="flex h-64 items-center justify-center rounded-md border border-dashed border-border bg-muted/20"
            data-ocid="dashboard.empty_state"
          >
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Waiting for the first reading…
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
