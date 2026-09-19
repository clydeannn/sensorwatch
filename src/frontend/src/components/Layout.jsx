import { cn } from "@/lib/utils";
import { Activity, Cpu } from "lucide-react";

/**
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @param {string} [props.lcdLine] Latest LCD echo line mirrored from the physical 16x2 display.
 * @param {boolean} [props.isLive] Whether the live feed is currently connected.
 */
export function Layout({ children, lcdLine, isLive = true }) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card panel-grid">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-primary/30 bg-primary/10 text-primary shadow-inset-soft">
              <Cpu className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-base font-bold tracking-tight text-foreground">
                SensorWatch
              </h1>
              <p className="truncate font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                ESP32 · DHT11 · MQ-2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="lcd-panel hidden min-w-0 flex-1 rounded-sm px-3 py-1.5 text-[11px] sm:block md:min-w-[22rem]"
              data-ocid="header.lcd_echo"
            >
              <span className="truncate">
                {lcdLine ?? "T: --.-C H: --% / G: --- S: -"}
              </span>
            </div>
            <span
              className="flex shrink-0 items-center gap-2 rounded-sm border border-border bg-muted/40 px-2.5 py-1.5"
              data-ocid="header.live_indicator"
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  isLive ? "bg-success status-pulse" : "bg-muted-foreground",
                )}
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {isLive ? "Live" : "Idle"}
              </span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 md:px-6 md:py-6">
        {children}
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3 font-mono text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <span className="flex items-center gap-2">
            <Activity className="size-3" aria-hidden="true" />
            Simulated bench rig · 2s sampling interval
          </span>
          <span>
            © {year}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 transition-smooth hover:underline"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
