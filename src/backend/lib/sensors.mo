import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Types "../types/sensors";

module {
  // Plausible simulation bounds.
  let temperatureFloor : Float = 18.0;
  let temperatureCeiling : Float = 38.0;
  let humidityFloor : Float = 35.0;
  let humidityCeiling : Float = 85.0;
  let gasFloor : Nat = 250;
  let gasCeiling : Nat = 780;

  // Seed for the pseudo-random walk. The generator state is advanced on every
  // step, so successive readings vary even within the same nanosecond.
  let seed : Nat64 = 0x5EED_0F_5EED_0F;

  /// Mutable xorshift64* generator state for the simulated random walk.
  type Prng = { var state : Nat64 };

  /// Initialize the generator from a 64-bit seed (never zero).
  func prngInit(seedValue : Nat64) : Prng {
    { var state = if (seedValue == 0) 0x9E37_79B9_7F4A_7C15 else seedValue };
  };

  /// Advance the generator and return the next 64-bit value.
  func prngNext(random : Prng) : Nat64 {
    var x = random.state;
    x ^= x >> 12;
    x ^= x << 25;
    x ^= x >> 27;
    random.state := x;
    x *% 0x2545_F491_4F6C_DD1D;
  };

  /// Predefined thresholds for the simulated sensors.
  public func thresholds() : Types.Thresholds {
    {
      temperatureNormalMin = 20.0;
      temperatureNormalMax = 30.0;
      temperatureWarningMin = 18.0;
      temperatureWarningMax = 33.0;
      humidityNormalMin = 45.0;
      humidityNormalMax = 70.0;
      humidityWarningMin = 40.0;
      humidityWarningMax = 78.0;
      gasNormalMax = 500;
      gasWarningMax = 650;
      fluctuationDelta = 2.0;
    };
  };

  /// Advance the simulation by one step and return the new reading.
  public func advance(previous : ?Types.Reading) : Types.Reading {
    let random = prngInit(seed +% Time.now().toNat().toNat64());

    let (prevTemperature, prevHumidity, prevGas) = switch (previous) {
      case (?r) (r.temperature, r.humidity, r.gas);
      case null (26.0, 55.0, 400);
    };

    let temperature = clampFloat(
      prevTemperature + walk(random, 0.6, 3.5),
      temperatureFloor,
      temperatureCeiling,
    );
    let humidity = clampFloat(
      prevHumidity + walk(random, 0.8, 4.0),
      humidityFloor,
      humidityCeiling,
    );
    let gas = clampNat(
      prevGas + gasWalk(random),
      gasFloor,
      gasCeiling,
    );

    let temperatureStatus = statusFor(#Temperature, temperature, ?prevTemperature);
    let humidityStatus = statusFor(#Humidity, humidity, ?prevHumidity);
    let gasStatus = statusFor(#Gas, gas.toFloat(), ?prevGas.toFloat());

    {
      temperature;
      humidity;
      gas;
      timestamp = Time.now();
      temperatureStatus;
      humidityStatus;
      gasStatus;
      overallStatus = overall(temperatureStatus, humidityStatus, gasStatus);
    };
  };

  /// Derive a per-sensor status from a value, its own threshold band, and
  /// fluctuation. `kind` selects which sensor's thresholds apply, so gas is
  /// never classified against the temperature bands.
  public func statusFor(kind : Types.SensorKind, value : Float, previous : ?Float) : Types.SensorStatus {
    let t = thresholds();
    let (normalMin, normalMax, warningMin, warningMax) = switch kind {
      case (#Temperature) (
        t.temperatureNormalMin,
        t.temperatureNormalMax,
        t.temperatureWarningMin,
        t.temperatureWarningMax,
      );
      case (#Humidity) (
        t.humidityNormalMin,
        t.humidityNormalMax,
        t.humidityWarningMin,
        t.humidityWarningMax,
      );
      case (#Gas) (0.0, t.gasNormalMax.toFloat(), 0.0, t.gasWarningMax.toFloat());
    };

    let base : Types.SensorStatus = if (value < warningMin or value > warningMax) {
      #Unstable;
    } else if (value < normalMin or value > normalMax) {
      #Warning;
    } else {
      #Stable;
    };

    let fluctuating = switch (previous) {
      case (?p) Float.abs(value - p) > t.fluctuationDelta;
      case null false;
    };

    if (fluctuating) { #Unstable } else { base };
  };

  /// Summarize the worst status across the three sensors.
  public func overall(
    temperature : Types.SensorStatus,
    humidity : Types.SensorStatus,
    gas : Types.SensorStatus,
  ) : Types.OverallStatus {
    let worst = Nat.max(Nat.max(rank(temperature), rank(humidity)), rank(gas));
    if (worst >= 2) { #Unstable } else if (worst >= 1) { #Warning } else { #Stable };
  };

  // --- helpers -------------------------------------------------------------

  func rank(status : Types.SensorStatus) : Nat = switch status {
    case (#Stable) 0;
    case (#Warning) 1;
    case (#Unstable) 2;
  };

  /// Draw a bounded `Nat` in `[0, bound)` from the PRNG state.
  func draw(random : Prng, bound : Nat) : Nat {
    (prngNext(random) % bound.toNat64()).toNat();
  };

  /// One random-walk step: a small jitter, with an occasional larger excursion.
  func walk(random : Prng, jitter : Float, excursion : Float) : Float {
    let step = (draw(random, 2001).toFloat() - 1000.0) / 1000.0 * jitter;
    if (draw(random, 100) < 12) {
      step + (draw(random, 2001).toFloat() - 1000.0) / 1000.0 * excursion;
    } else {
      step;
    };
  };

  /// Gas drifts on a coarser scale than the float sensors.
  func gasWalk(random : Prng) : Int {
    let step = draw(random, 61).toInt() - 30;
    if (draw(random, 100) < 12) {
      step + (draw(random, 161).toInt() - 80);
    } else {
      step;
    };
  };

  func clampFloat(value : Float, low : Float, high : Float) : Float {
    if (value < low) { low } else if (value > high) { high } else { value };
  };

  func clampNat(value : Int, low : Nat, high : Nat) : Nat {
    if (value < low.toInt()) { low } else if (value > high.toInt()) { high } else {
      value.toNat();
    };
  };
};
