module {
  /// Nanosecond timestamp (as returned by `Time.now()`).
  public type Timestamp = Int;

  /// Per-sensor status derived from thresholds and fluctuation.
  public type SensorStatus = {
    #Stable;
    #Warning;
    #Unstable;
  };

  /// Overall system status: the worst current status across all sensors.
  public type OverallStatus = {
    #Stable;
    #Warning;
    #Unstable;
  };
};
