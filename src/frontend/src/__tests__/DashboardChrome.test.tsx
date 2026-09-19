import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Layout } from "@/components/Layout";
import { formatClock, formatFullTime, timestampToDate } from "@/types/sensors";

// Characterization baseline for dashboard chrome and timestamp formatting.
// These are observable behaviors the TypeScript-to-JavaScript conversion must
// preserve; they are deliberately independent of file extensions.

afterEach(() => {
  cleanup();
});

describe("timestamp formatting", () => {
  // 2023-11-14T22:13:20Z, expressed in the nanosecond shape the backend sends.
  const timestamp = 1_700_000_000_000_000_000n;

  it("converts a nanosecond timestamp into a real Date", () => {
    const date = timestampToDate(timestamp);
    expect(date).toBeInstanceOf(Date);
    expect(date?.getTime()).toBe(1_700_000_000_000);
  });

  it("formats a clock label as HH:MM:SS", () => {
    expect(formatClock(timestamp)).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("formats a full timestamp with a month, day, and time", () => {
    const formatted = formatFullTime(timestamp);
    expect(formatted).not.toBe("No reading yet");
    expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(formatted).toMatch(/[A-Za-z]{3}/);
  });

  it("falls back to placeholders for an out-of-range timestamp", () => {
    // Beyond the Date range (|ms| > 8.64e15), so the conversion yields an
    // invalid Date and the helpers must degrade to a label rather than throw.
    const invalid = 9_000_000_000_000_000_000_000_000n;
    expect(timestampToDate(invalid)).toBeNull();
    expect(formatClock(invalid)).toBe("--:--:--");
    expect(formatFullTime(invalid)).toBe("No reading yet");
  });
});

describe("Layout chrome", () => {
  it("echoes the LCD line and shows the live indicator when live", () => {
    render(
      <Layout lcdLine="T: 24.5C H: 55% / G: 400 S: 1" isLive>
        <p>dashboard body</p>
      </Layout>,
    );

    expect(screen.getByTestId("header.lcd_echo")).toHaveTextContent(
      "T: 24.5C H: 55% / G: 400 S: 1",
    );
    expect(screen.getByTestId("header.live_indicator")).toHaveTextContent(
      "Live",
    );
    expect(screen.getByText("dashboard body")).toBeInTheDocument();
  });

  it("shows the idle indicator and a placeholder LCD line when not live", () => {
    render(
      <Layout isLive={false}>
        <p>dashboard body</p>
      </Layout>,
    );

    expect(screen.getByTestId("header.live_indicator")).toHaveTextContent(
      "Idle",
    );
    expect(screen.getByTestId("header.lcd_echo")).toHaveTextContent(
      "T: --.-C H: --% / G: --- S: -",
    );
  });
});
