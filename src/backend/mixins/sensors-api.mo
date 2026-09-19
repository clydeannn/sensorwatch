import List "mo:core/List";
import Types "../types/sensors";
import SensorsLib "../lib/sensors";

mixin (history : List.List<Types.Reading>) {
  /// Bounded recent-readings window retained for the trend chart and log.
  transient let maxHistory : Nat = 60;

  /// Current reading, or null before the first simulation step.
  public query func getCurrentReading() : async ?Types.Reading {
    history.last();
  };

  /// Bounded recent readings, newest first.
  public query func getRecentReadings(limit : Nat) : async [Types.Reading] {
    let size = history.size();
    let count = if (limit < size) { limit } else { size };
    let newestFirst = history.reverse();
    let recent = List.empty<Types.Reading>();
    var i = 0;
    while (i < count) {
      recent.add(newestFirst.at(i));
      i += 1;
    };
    recent.toArray();
  };

  /// Predefined thresholds used to derive status.
  public query func getThresholds() : async Types.Thresholds {
    SensorsLib.thresholds();
  };

  /// Advance the simulation by one step and persist the new reading.
  public func advanceSimulation() : async Types.Reading {
    let previous = history.last();
    let reading = SensorsLib.advance(previous);
    history.add(reading);
    while (history.size() > maxHistory) {
      ignore history.removeLast();
    };
    reading;
  };
};
