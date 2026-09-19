import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Reading, Thresholds } from "@/backend";
import { OverallStatus, SensorStatus } from "@/backend";
import { HISTORY_LIMIT, useSensorReadings } from "@/hooks/useSensorReadings";

// Coverage for the TypeScript-to-JavaScript conversion itself: the application
// source is plain JavaScript, the generated bindgen artifacts stay TypeScript,
// the HTML entry point loads the JavaScript entry, and the JavaScript hook still
// calls the same backend methods with the same arguments and data mapping.

// Vitest runs with the frontend package as its working directory, so the
// source root is resolved from there rather than from `import.meta.url`, which
// is not a `file:` URL under the Vite transform.
const frontendRoot = process.cwd();
const sourceRoot = resolve(frontendRoot, "src");

/** Directories under `src/` that are not application source. */
const NON_APPLICATION_DIRECTORIES = new Set(["__tests__", "declarations"]);
/** Generated bindgen artifacts that must remain TypeScript. */
const GENERATED_TYPESCRIPT_FILES = new Set(["backend.ts", "backend.d.ts"]);

function walk(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (NON_APPLICATION_DIRECTORIES.has(entry.name)) continue;
      found.push(...walk(entryPath));
      continue;
    }
    found.push(entryPath);
  }
  return found;
}

/** Script extensions that count as application source. */
const SCRIPT_EXTENSIONS = /\.(js|jsx|ts|tsx|mjs|cjs)$/;

/** Application source files: script files under `src/` except tests and bindgen. */
function applicationSourceFiles(): string[] {
  return walk(sourceRoot).filter((filePath) => {
    const name = filePath.slice(filePath.lastIndexOf("/") + 1);
    if (!SCRIPT_EXTENSIONS.test(name)) return false;
    if (GENERATED_TYPESCRIPT_FILES.has(name)) return false;
    if (name.endsWith(".d.ts")) return false;
    return true;
  });
}

/** Remove comments and string literals so syntax scans do not read prose. */
function stripCommentsAndStrings(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

/** TypeScript-only constructs that must not appear in JavaScript source. */
const TYPESCRIPT_ONLY_SYNTAX: Array<{ label: string; pattern: RegExp }> = [
  { label: "import type", pattern: /\bimport\s+type\b/ },
  { label: "export type", pattern: /\bexport\s+type\b/ },
  { label: "interface declaration", pattern: /\binterface\s+[A-Za-z_$]/ },
  { label: "satisfies operator", pattern: /\bsatisfies\s/ },
  { label: "as const assertion", pattern: /\bas\s+const\b/ },
];

describe("JavaScript conversion", () => {
  it("keeps every application source file as .js or .jsx", () => {
    const files = applicationSourceFiles();
    expect(files.length).toBeGreaterThan(0);

    const offenders = files.filter((filePath) => !/\.(js|jsx)$/.test(filePath));
    expect(offenders.map((filePath) => relative(sourceRoot, filePath))).toEqual(
      [],
    );
  });

  it("leaves no TypeScript-only syntax in application source", () => {
    const offenders: string[] = [];
    for (const filePath of applicationSourceFiles()) {
      const code = stripCommentsAndStrings(readFileSync(filePath, "utf8"));
      for (const { label, pattern } of TYPESCRIPT_ONLY_SYNTAX) {
        if (pattern.test(code)) {
          offenders.push(`${relative(sourceRoot, filePath)}: ${label}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the generated bindgen artifacts as TypeScript", () => {
    for (const artifact of [
      "backend.ts",
      "backend.d.ts",
      "declarations/backend.did.d.ts",
      "declarations/backend.did.js",
    ]) {
      expect(statSync(join(sourceRoot, artifact)).isFile()).toBe(true);
    }
  });

  it("loads the JavaScript entry point from index.html", () => {
    const html = readFileSync(join(frontendRoot, "index.html"), "utf8");
    expect(html).toContain('src="./src/main.jsx"');
    expect(html).not.toContain("main.tsx");
  });
});

// --- backend consumer contract ---------------------------------------------
//
// The hook is the only place the JavaScript app touches the generated actor.
// Mocking `useActor` keeps the real hook and query wiring under test while
// replacing the network seam, so the call arguments and the bigint-to-number
// mapping are asserted directly.

const mocks = vi.hoisted(() => ({
  actor: {
    getCurrentReading: vi.fn(),
    getRecentReadings: vi.fn(),
    getThresholds: vi.fn(),
    advanceSimulation: vi.fn(),
  },
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mocks.actor, isFetching: false }),
}));

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

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  mocks.actor.getCurrentReading.mockReset().mockResolvedValue(makeReading());
  mocks.actor.getRecentReadings.mockReset().mockResolvedValue([makeReading()]);
  mocks.actor.getThresholds.mockReset().mockResolvedValue(thresholds);
  mocks.actor.advanceSimulation.mockReset().mockResolvedValue(makeReading());
});

describe("backend consumer contract", () => {
  it("calls the same backend methods with the same arguments", async () => {
    const { result } = renderHook(() => useSensorReadings(), { wrapper });

    await waitFor(() => expect(result.current.current).not.toBeNull());

    expect(mocks.actor.getCurrentReading).toHaveBeenCalledWith();
    expect(mocks.actor.getRecentReadings).toHaveBeenCalledWith(
      BigInt(HISTORY_LIMIT),
    );
    expect(mocks.actor.getThresholds).toHaveBeenCalledWith();
    await waitFor(() =>
      expect(mocks.actor.advanceSimulation).toHaveBeenCalledWith(),
    );
  });

  it("maps the bigint gas reading and thresholds to numbers", async () => {
    const { result } = renderHook(() => useSensorReadings(), { wrapper });

    await waitFor(() => expect(result.current.current).not.toBeNull());

    expect(result.current.current?.gas).toBe(400);
    expect(typeof result.current.current?.gas).toBe("number");
    expect(result.current.thresholds?.gasNormalMax).toBe(500);
    expect(typeof result.current.thresholds?.gasNormalMax).toBe("number");
    expect(result.current.thresholds?.gasWarningMax).toBe(650);
  });
});
