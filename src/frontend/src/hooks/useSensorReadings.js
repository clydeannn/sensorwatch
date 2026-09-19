import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/** How many readings the bounded recent window keeps. */
export const HISTORY_LIMIT = 40;

/** Polling cadence for the live display, in milliseconds. */
export const POLL_INTERVAL_MS = 2000;

function toSensorReading(reading) {
  return {
    temperature: reading.temperature,
    humidity: reading.humidity,
    gas: Number(reading.gas),
    timestamp: reading.timestamp,
    temperatureStatus: reading.temperatureStatus,
    humidityStatus: reading.humidityStatus,
    gasStatus: reading.gasStatus,
    overallStatus: reading.overallStatus,
  };
}

function toSensorThresholds(thresholds) {
  return {
    temperatureNormalMin: thresholds.temperatureNormalMin,
    temperatureNormalMax: thresholds.temperatureNormalMax,
    temperatureWarningMin: thresholds.temperatureWarningMin,
    temperatureWarningMax: thresholds.temperatureWarningMax,
    humidityNormalMin: thresholds.humidityNormalMin,
    humidityNormalMax: thresholds.humidityNormalMax,
    humidityWarningMin: thresholds.humidityWarningMin,
    humidityWarningMax: thresholds.humidityWarningMax,
    gasNormalMax: Number(thresholds.gasNormalMax),
    gasWarningMax: Number(thresholds.gasWarningMax),
    fluctuationDelta: thresholds.fluctuationDelta,
  };
}

/**
 * Live sensor feed: advances the backend simulation on a short interval and
 * exposes the current reading, bounded history, and thresholds.
 */
export function useSensorReadings() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const advancingRef = useRef(false);

  const currentQuery = useQuery({
    queryKey: ["sensor", "current"],
    queryFn: async () => {
      if (!actor) return null;
      const reading = await actor.getCurrentReading();
      return reading ? toSensorReading(reading) : null;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const historyQuery = useQuery({
    queryKey: ["sensor", "history"],
    queryFn: async () => {
      if (!actor) return [];
      const readings = await actor.getRecentReadings(BigInt(HISTORY_LIMIT));
      return readings.map(toSensorReading);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const thresholdsQuery = useQuery({
    queryKey: ["sensor", "thresholds"],
    queryFn: async () => {
      if (!actor) return null;
      const thresholds = await actor.getThresholds();
      return toSensorThresholds(thresholds);
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Drive the simulation forward, then refresh the displayed readings.
  useEffect(() => {
    if (!actor || isFetching) return;

    let cancelled = false;

    const tick = async () => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      try {
        await actor.advanceSimulation();
        if (cancelled) return;
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["sensor", "current"] }),
          queryClient.invalidateQueries({ queryKey: ["sensor", "history"] }),
        ]);
      } catch {
        // Transient simulation errors surface through the query error state.
      } finally {
        advancingRef.current = false;
      }
    };

    void tick();
    const interval = window.setInterval(() => void tick(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [actor, isFetching, queryClient]);

  const current = currentQuery.data ?? null;
  const history = historyQuery.data ?? [];

  return {
    current,
    history,
    thresholds: thresholdsQuery.data ?? null,
    isLoading:
      currentQuery.isLoading ||
      historyQuery.isLoading ||
      thresholdsQuery.isLoading,
    isError: currentQuery.isError || historyQuery.isError,
    error: currentQuery.error ?? historyQuery.error ?? null,
    lastUpdated: current?.timestamp ?? null,
  };
}
