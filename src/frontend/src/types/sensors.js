import { OverallStatus, SensorStatus } from "@/backend";

export { OverallStatus, SensorStatus };

/**
 * A single simulated reading from the ESP32 rig.
 * @typedef {object} SensorReading
 * @property {number} temperature
 * @property {number} humidity
 * @property {number} gas
 * @property {bigint} timestamp
 * @property {SensorStatus} temperatureStatus
 * @property {SensorStatus} humidityStatus
 * @property {SensorStatus} gasStatus
 * @property {OverallStatus} overallStatus
 */

/**
 * Thresholds used by the backend to derive each sensor's status.
 * @typedef {object} SensorThresholds
 * @property {number} temperatureNormalMin
 * @property {number} temperatureNormalMax
 * @property {number} temperatureWarningMin
 * @property {number} temperatureWarningMax
 * @property {number} humidityNormalMin
 * @property {number} humidityNormalMax
 * @property {number} humidityWarningMin
 * @property {number} humidityWarningMax
 * @property {number} gasNormalMax
 * @property {number} gasWarningMax
 * @property {number} fluctuationDelta
 */

/**
 * @typedef {"temperature" | "humidity" | "gas"} SensorKey
 */

/**
 * Any status value the UI renders. `SensorStatus` and `OverallStatus` are
 * distinct backend enums with identical variants, so presentation helpers
 * accept either.
 * @typedef {SensorStatus | OverallStatus} AnyStatus
 */

/**
 * @typedef {object} StatusPresentation
 * @property {string} label Human label shown on the badge.
 * @property {string} badgeClass Semantic Tailwind classes for a badge surface.
 * @property {string} dotClass Semantic Tailwind classes for a solid status dot.
 * @property {string} accentClass Semantic Tailwind classes for a 3px status accent border.
 * @property {string} textClass Semantic Tailwind classes for status-colored text.
 */

const STATUS_PRESENTATION = {
  [SensorStatus.Stable]: {
    label: "Stable",
    badgeClass: "bg-success/15 text-success border-success/30",
    dotClass: "bg-success",
    accentClass: "border-l-success",
    textClass: "text-success",
  },
  [SensorStatus.Warning]: {
    label: "Warning",
    badgeClass: "bg-warning/15 text-warning border-warning/30",
    dotClass: "bg-warning",
    accentClass: "border-l-warning",
    textClass: "text-warning",
  },
  [SensorStatus.Unstable]: {
    label: "Unstable",
    badgeClass: "bg-unstable/15 text-unstable border-unstable/30",
    dotClass: "bg-unstable",
    accentClass: "border-l-unstable",
    textClass: "text-unstable",
  },
};

/** Map a backend status enum to its label and semantic color classes. */
export function statusPresentation(status) {
  return (
    STATUS_PRESENTATION[status] ?? STATUS_PRESENTATION[SensorStatus.Stable]
  );
}

/** Rank statuses so the worst one can summarize the whole rig. */
const STATUS_RANK = {
  [SensorStatus.Stable]: 0,
  [SensorStatus.Warning]: 1,
  [SensorStatus.Unstable]: 2,
};

/** The worst status across the supplied sensors. */
export function worstStatus(statuses) {
  let worst = SensorStatus.Stable;
  for (const status of statuses) {
    if (STATUS_RANK[status] > STATUS_RANK[worst]) {
      worst = status;
    }
  }
  return worst;
}

/** Convert a Motoko nanosecond timestamp into a JS Date. */
export function timestampToDate(timestamp) {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Short clock label for the readings log, e.g. "14:03:27". */
export function formatClock(timestamp) {
  const date = timestampToDate(timestamp);
  if (!date) return "--:--:--";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Full timestamp label for the "last updated" readout. */
export function formatFullTime(timestamp) {
  const date = timestampToDate(timestamp);
  if (!date) return "No reading yet";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
