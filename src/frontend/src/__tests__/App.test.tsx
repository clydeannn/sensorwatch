import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { Reading, Thresholds } from "@/backend";
import { OverallStatus, SensorStatus } from "@/backend";

// The default route is the dashboard; the actor seam is mocked so the route
// renders without a canister, exactly as the dashboard suite does.
vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({
    actor: {
      getCurrentReading: async (): Promise<Reading> => ({
        temperature: 24.5,
        humidity: 55,
        gas: 400n,
        timestamp: 1_700_000_000_000_000_000n,
        temperatureStatus: SensorStatus.Stable,
        humidityStatus: SensorStatus.Stable,
        gasStatus: SensorStatus.Stable,
        overallStatus: OverallStatus.Stable,
      }),
      getRecentReadings: async (): Promise<Reading[]> => [],
      getThresholds: async (): Promise<Thresholds> => ({
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
      }),
      advanceSimulation: async (): Promise<Reading> => ({
        temperature: 24.5,
        humidity: 55,
        gas: 400n,
        timestamp: 1_700_000_000_000_000_000n,
        temperatureStatus: SensorStatus.Stable,
        humidityStatus: SensorStatus.Stable,
        gasStatus: SensorStatus.Stable,
        overallStatus: OverallStatus.Stable,
      }),
    },
    isFetching: false,
  }),
}));

beforeEach(() => {
  window.history.pushState({}, "", "/");
});

afterEach(() => {
  vi.useRealTimers();
});

it("renders the dashboard on the default route instead of a blank screen", async () => {
  const { default: App } = await import("@/App");
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );

  expect(await screen.findByTestId("dashboard.page")).toBeInTheDocument();
  expect(
    await screen.findByTestId("dashboard.status_banner"),
  ).toBeInTheDocument();
});
