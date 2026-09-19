import { PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
    return;
  }
  // `[baseline, current]`, the same install contract the hosted deploy uses for
  // a converted project. The upgrade replays the chain from the legacy schema.
  const installed = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BASELINE_WASM });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  actor = installed.actor;
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(actor.getCurrentReading()).resolves.toEqual([]);
  await expect(actor.getRecentReadings(40n)).resolves.toEqual([]);
});

it("exposes the predefined thresholds the UI derives status from", async () => {
  const thresholds = await actor.getThresholds();
  expect(thresholds.temperatureNormalMin).toBeLessThan(thresholds.temperatureNormalMax);
  expect(thresholds.humidityNormalMin).toBeLessThan(thresholds.humidityNormalMax);
  expect(thresholds.gasNormalMax).toBeGreaterThan(0n);
  expect(thresholds.gasWarningMax).toBeGreaterThan(thresholds.gasNormalMax);
  expect(thresholds.fluctuationDelta).toBeGreaterThan(0);
});

it("advances the simulation and persists a reading with per-sensor status", async () => {
  const reading = await actor.advanceSimulation();
  expect(reading.temperature).toBeGreaterThanOrEqual(18);
  expect(reading.temperature).toBeLessThanOrEqual(38);
  expect(reading.humidity).toBeGreaterThanOrEqual(35);
  expect(reading.humidity).toBeLessThanOrEqual(85);
  expect(reading.gas).toBeGreaterThanOrEqual(250n);
  expect(reading.gas).toBeLessThanOrEqual(780n);
  expect(reading.timestamp).toBeGreaterThan(0n);
  for (const status of [
    reading.temperatureStatus,
    reading.humidityStatus,
    reading.gasStatus,
    reading.overallStatus,
  ]) {
    expect(["Stable", "Warning", "Unstable"]).toContain(Object.keys(status)[0]);
  }
});

it("round-trips the current reading through the real canister", async () => {
  const advanced = await actor.advanceSimulation();
  const current = await actor.getCurrentReading();
  expect(current).toHaveLength(1);
  expect(current[0]?.timestamp).toBe(advanced.timestamp);
  expect(current[0]?.temperature).toBe(advanced.temperature);
});

it("returns recent readings newest first and honours the limit", async () => {
  const first = await actor.advanceSimulation();
  const second = await actor.advanceSimulation();
  const recent = await actor.getRecentReadings(2n);
  expect(recent).toHaveLength(2);
  expect(recent[0]?.timestamp).toBe(second.timestamp);
  expect(recent[1]?.timestamp).toBe(first.timestamp);

  const limited = await actor.getRecentReadings(1n);
  expect(limited).toHaveLength(1);
  expect(limited[0]?.timestamp).toBe(second.timestamp);
});

it("serves the API documentation without trapping", async () => {
  await expect(actor.getApiDoc()).resolves.toEqual(expect.any(String));
});
