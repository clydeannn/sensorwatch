import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Reading, Thresholds } from "@/backend";
import { OverallStatus, SensorStatus } from "@/backend";
import { DashboardPage } from "@/pages/DashboardPage";
import type { SensorReading } from "@/types/sensors";

// --- typed local actor mock -------------------------------------------------
//
// The dashboard talks to the canister through `useActor` from
// `@caffeineai/core-infrastructure`. Mocking that one hook keeps the real
// components, hook, and query wiring under test while replacing only the
// network seam with a typed in-memory actor.

interface FakeActor {
  getCurrentReading: () => Promise<Reading | null>;
  getRecentReadings: (limit: bigint) => Promise<Reading[]>;
  getThresholds: () => Promise<Thresholds>;
  advanceSimulation: () => Promise<Reading>;
}

const thresholds: Thresholds = {
  temperatureNormalMin: 20,
  temperatureNormalMax: 30,
  temperatureWarningMin: 18,
  temperatureWarningMax: 33,
  humidityNormalMin: 45,
  humidityNormalMax: 70,
  humidityWarningMin: 40,
  humidityWarningMax: 78,
  gasNormalMax: 500n,
  gasWarningMax: 650n,
  fluctuationDelta: 2,
};

let actor: FakeActor;
let actorError: Error | null;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: actorError ? null : actor, isFetching: false }),
}));

function makeReading(overrides: Partial<Reading> = {}): Reading {
  return {
    temperature: 24.5,
    humidity: 55,
    gas: 400n,
    timestamp: 1_700_000_000_000_000_000n,
    temperatureStatus: SensorStatus.Stable,
    humidityStatus: SensorStatus.Stable,
    gasStatus: SensorStatus.Stable,
    overallStatus: OverallStatus.Stable,
    ...overrides,
  };
}

/** A reading whose overall status is the worst of its three sensor statuses. */
function readingWith(
  temperatureStatus: SensorStatus,
  gasStatus: SensorStatus,
  humidityStatus: SensorStatus,
  overrides: Partial<Reading> = {},
): Reading {
  const rank = {
    [SensorStatus.Stable]: 0,
    [SensorStatus.Warning]: 1,
    [SensorStatus.Unstable]: 2,
  };
  const worst = [temperatureStatus, gasStatus, humidityStatus].reduce((a, b) =>
    rank[a] >= rank[b] ? a : b,
  );
  const overall =
    worst === SensorStatus.Unstable
      ? OverallStatus.Unstable
      : worst === SensorStatus.Warning
        ? OverallStatus.Warning
        : OverallStatus.Stable;
  return makeReading({
    temperatureStatus,
    gasStatus,
    humidityStatus,
    overallStatus: overall,
    ...overrides,
  });
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<DashboardPage />, { wrapper });
}

beforeEach(() => {
  actorError = null;
  actor = {
    getCurrentReading: vi.fn(async () => makeReading()),
    getRecentReadings: vi.fn(async () => [makeReading()]),
    getThresholds: vi.fn(async () => thresholds),
    advanceSimulation: vi.fn(async () => makeReading()),
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("DashboardPage readouts", () => {
  it("shows temperature, gas, and humidity with units and current values", async () => {
    actor.getCurrentReading = vi.fn(async () =>
      makeReading({ temperature: 26.4, humidity: 61, gas: 512n }),
    );

    renderDashboard();

    const temperature = await screen.findByTestId(
      "dashboard.readout_card.temperature",
    );
    expect(within(temperature).getByText("Temperature")).toBeInTheDocument();
    expect(
      within(temperature).getByTestId("dashboard.readout_value.temperature"),
    ).toHaveTextContent("26.4");
    expect(within(temperature).getByText("°C")).toBeInTheDocument();

    const gas = screen.getByTestId("dashboard.readout_card.gas");
    expect(within(gas).getByText("Gas Level")).toBeInTheDocument();
    expect(
      within(gas).getByTestId("dashboard.readout_value.gas"),
    ).toHaveTextContent("512");
    expect(within(gas).getByText("ADC")).toBeInTheDocument();

    const humidity = screen.getByTestId("dashboard.readout_card.humidity");
    expect(within(humidity).getByText("Humidity")).toBeInTheDocument();
    expect(
      within(humidity).getByTestId("dashboard.readout_value.humidity"),
    ).toHaveTextContent("61");
    expect(within(humidity).getByText("%")).toBeInTheDocument();
  });

  it("renders a per-sensor status badge for each readout", async () => {
    actor.getCurrentReading = vi.fn(async () =>
      readingWith(
        SensorStatus.Warning,
        SensorStatus.Unstable,
        SensorStatus.Stable,
      ),
    );

    renderDashboard();

    const temperature = await screen.findByTestId(
      "dashboard.readout_card.temperature",
    );
    expect(
      within(temperature).getByTestId("status.badge.warning"),
    ).toHaveTextContent("Warning");

    const gas = screen.getByTestId("dashboard.readout_card.gas");
    expect(within(gas).getByTestId("status.badge.unstable")).toHaveTextContent(
      "Unstable",
    );

    const humidity = screen.getByTestId("dashboard.readout_card.humidity");
    expect(
      within(humidity).getByTestId("status.badge.stable"),
    ).toHaveTextContent("Stable");
  });

  it("summarizes the worst sensor status in the overall banner", async () => {
    actor.getCurrentReading = vi.fn(async () =>
      readingWith(
        SensorStatus.Warning,
        SensorStatus.Unstable,
        SensorStatus.Stable,
      ),
    );

    renderDashboard();

    const banner = await screen.findByTestId("dashboard.status_banner");
    expect(
      within(banner).getByText("Overall system status"),
    ).toBeInTheDocument();
    expect(
      within(banner).getByTestId("status.badge.unstable"),
    ).toHaveTextContent("Unstable");
    expect(within(banner).getByText(/Driven by/)).toBeInTheDocument();
  });

  it("shows a Stable banner when every sensor is stable", async () => {
    renderDashboard();

    const banner = await screen.findByTestId("dashboard.status_banner");
    expect(within(banner).getByTestId("status.badge.stable")).toHaveTextContent(
      "Stable",
    );
    expect(
      within(banner).getByText("All channels within normal range"),
    ).toBeInTheDocument();
  });
});

describe("DashboardPage readings log", () => {
  it("lists timestamped entries newest first with a per-row status", async () => {
    const older = readingWith(
      SensorStatus.Stable,
      SensorStatus.Stable,
      SensorStatus.Stable,
      {
        timestamp: 1_700_000_000_000_000_000n,
        temperature: 21.1,
      },
    );
    const newer = readingWith(
      SensorStatus.Unstable,
      SensorStatus.Unstable,
      SensorStatus.Stable,
      {
        timestamp: 1_700_000_010_000_000_000n,
        temperature: 33.9,
      },
    );
    // The backend returns readings newest-first; the log must render that order.
    actor.getRecentReadings = vi.fn(async () => [newer, older]);

    renderDashboard();

    const log = await screen.findByTestId("dashboard.readings_log");
    const rows = within(log).getAllByTestId(/dashboard\.readings_log\.row\./);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("33.9")).toBeInTheDocument();
    expect(
      within(rows[0]).getByTestId("status.badge.unstable"),
    ).toHaveTextContent("Unstable");
    expect(within(rows[1]).getByText("21.1")).toBeInTheDocument();
    expect(
      within(rows[1]).getByTestId("status.badge.stable"),
    ).toHaveTextContent("Stable");
    // Each row carries a clock timestamp, not a placeholder.
    expect(within(rows[0]).queryByText("--:--:--")).not.toBeInTheDocument();
  });

  it("shows an empty state before any readings are recorded", async () => {
    actor.getRecentReadings = vi.fn(async () => []);

    renderDashboard();

    expect(
      await screen.findByTestId("dashboard.readings_log.empty_state"),
    ).toBeInTheDocument();
  });
});

describe("DashboardPage trend chart", () => {
  it("renders the chart once readings exist and reports the sample count", async () => {
    actor.getRecentReadings = vi.fn(async () => [
      makeReading({ timestamp: 1_700_000_010_000_000_000n }),
      makeReading({ timestamp: 1_700_000_000_000_000_000n }),
    ]);

    renderDashboard();

    expect(
      await screen.findByTestId("dashboard.trend_chart"),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 samples/)).toBeInTheDocument();
  });

  it("shows the chart empty state when there is no history", async () => {
    actor.getRecentReadings = vi.fn(async () => []);

    renderDashboard();

    expect(
      await screen.findByTestId("dashboard.trend_chart.empty_state"),
    ).toBeInTheDocument();
  });
});

describe("DashboardPage live updates", () => {
  it("advances the simulation and refreshes readings without user action", async () => {
    vi.useFakeTimers();
    let temperature = 22.0;
    actor.getCurrentReading = vi.fn(async () => makeReading({ temperature }));
    actor.advanceSimulation = vi.fn(async () => {
      temperature += 1.5;
      return makeReading({ temperature });
    });

    renderDashboard();

    // The first readout renders from the initial reading.
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("dashboard.readout_value.temperature"),
      ).toHaveTextContent("22.0");
    });

    // The hook advances the simulation on mount and on every polling interval,
    // with no interaction from the user.
    await vi.waitFor(() => {
      expect(actor.advanceSimulation).toHaveBeenCalled();
    });

    // One polling interval later the readout reflects a newer reading.
    await vi.advanceTimersByTimeAsync(2000);

    await vi.waitFor(() => {
      expect(
        screen.getByTestId("dashboard.readout_value.temperature"),
      ).not.toHaveTextContent("22.0");
    });
  });
});

describe("DashboardPage states and layout", () => {
  it("renders the error state when the live feed fails", async () => {
    actor.getCurrentReading = vi.fn(async () => {
      throw new Error("canister unreachable");
    });

    renderDashboard();

    const errorState = await screen.findByTestId("dashboard.error_state");
    expect(
      within(errorState).getByText("Live feed unavailable"),
    ).toBeInTheDocument();
    expect(
      within(errorState).getByText("canister unreachable"),
    ).toBeInTheDocument();
  });

  it("shows the waiting state before the first reading arrives", async () => {
    actor.getCurrentReading = vi.fn(async () => null);
    actor.getRecentReadings = vi.fn(async () => []);

    renderDashboard();

    expect(
      await screen.findByTestId("dashboard.empty_state"),
    ).toBeInTheDocument();
  });

  it("keeps banner, readouts, chart, and log on one screen", async () => {
    renderDashboard();

    expect(
      await screen.findByTestId("dashboard.status_banner"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.readout_grid")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.trend_panel")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.log_panel")).toBeInTheDocument();
  });

  it("offers no manual entry, upload, or ingest form", async () => {
    renderDashboard();

    await screen.findByTestId("dashboard.status_banner");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /submit|upload|ingest|add reading/i,
      }),
    ).toBeNull();
    expect(document.querySelector("form")).toBeNull();
  });
});

describe("sensor status presentation", () => {
  it("maps each backend status to a distinct label and color class", async () => {
    const { statusPresentation } = await import("@/types/sensors");
    const stable = statusPresentation(SensorStatus.Stable);
    const warning = statusPresentation(SensorStatus.Warning);
    const unstable = statusPresentation(SensorStatus.Unstable);

    expect([stable.label, warning.label, unstable.label]).toEqual([
      "Stable",
      "Warning",
      "Unstable",
    ]);
    expect(
      new Set([stable.badgeClass, warning.badgeClass, unstable.badgeClass])
        .size,
    ).toBe(3);
    expect(
      new Set([stable.textClass, warning.textClass, unstable.textClass]).size,
    ).toBe(3);
  });

  it("ranks the worst status across sensors", async () => {
    const { worstStatus } = await import("@/types/sensors");
    expect(worstStatus([SensorStatus.Stable, SensorStatus.Warning])).toBe(
      OverallStatus.Warning,
    );
    expect(worstStatus([SensorStatus.Warning, SensorStatus.Unstable])).toBe(
      OverallStatus.Unstable,
    );
    expect(worstStatus([SensorStatus.Stable, SensorStatus.Stable])).toBe(
      OverallStatus.Stable,
    );
  });
});

// Keep the imported type referenced so the fixture stays typed against the
// app's own exported shape rather than an inferred literal.
const _typedFixture: SensorReading = {
  temperature: 24.5,
  humidity: 55,
  gas: 400,
  timestamp: 1_700_000_000_000_000_000n,
  temperatureStatus: SensorStatus.Stable,
  humidityStatus: SensorStatus.Stable,
  gasStatus: SensorStatus.Stable,
  overallStatus: OverallStatus.Stable,
};
void _typedFixture;
