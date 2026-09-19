import Common "../types/common";

module {
  public type Timestamp = Common.Timestamp;
  public type SensorStatus = Common.SensorStatus;
  public type OverallStatus = Common.OverallStatus;

  /// Discriminates which threshold band a value is classified against.
  public type SensorKind = {
    #Temperature;
    #Humidity;
    #Gas;
  };

  /// A single simulated sensor sample.
  public type Reading = {
    temperature : Float; // degrees Celsius
    humidity : Float; // percent
    gas : Nat; // raw ADC value
    timestamp : Timestamp;
    temperatureStatus : SensorStatus;
    humidityStatus : SensorStatus;
    gasStatus : SensorStatus;
    overallStatus : OverallStatus;
  };

  /// Predefined per-sensor thresholds used to derive status.
  public type Thresholds = {
    temperatureNormalMin : Float;
    temperatureNormalMax : Float;
    temperatureWarningMin : Float;
    temperatureWarningMax : Float;
    humidityNormalMin : Float;
    humidityNormalMax : Float;
    humidityWarningMin : Float;
    humidityWarningMax : Float;
    gasNormalMax : Nat;
    gasWarningMax : Nat;
    fluctuationDelta : Float;
  };
};
