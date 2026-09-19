import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Reading {
    gas: bigint;
    temperature: number;
    humidityStatus: SensorStatus;
    gasStatus: SensorStatus;
    humidity: number;
    timestamp: Timestamp;
    temperatureStatus: SensorStatus;
    overallStatus: OverallStatus;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Thresholds {
    gasWarningMax: bigint;
    fluctuationDelta: number;
    humidityNormalMax: number;
    humidityNormalMin: number;
    temperatureWarningMax: number;
    temperatureWarningMin: number;
    temperatureNormalMax: number;
    temperatureNormalMin: number;
    humidityWarningMax: number;
    humidityWarningMin: number;
    gasNormalMax: bigint;
}
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum OverallStatus {
    Stable = "Stable",
    Warning = "Warning",
    Unstable = "Unstable"
}
export enum SensorStatus {
    Stable = "Stable",
    Warning = "Warning",
    Unstable = "Unstable"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Advance the simulation by one step and persist the new reading.
     */
    advanceSimulation(): Promise<Reading>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Static Markdown description of this backend's public API.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Current reading, or null before the first simulation step.
     */
    getCurrentReading(): Promise<Reading | null>;
    /**
     * / Bounded recent readings, newest first.
     */
    getRecentReadings(limit: bigint): Promise<Array<Reading>>;
    /**
     * / Predefined thresholds used to derive status.
     */
    getThresholds(): Promise<Thresholds>;
    isCallerAdmin(): Promise<boolean>;
    schema(): Promise<string>;
}
