import List "mo:core/List";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import FloatValue "mo:caffeineai-oql/FloatValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import Types "types/sensors";
import SensorsApi "mixins/sensors-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let history : List.List<Types.Reading>;

  func statusText(status : Types.SensorStatus) : Text = switch status {
    case (#Stable) "Stable";
    case (#Warning) "Warning";
    case (#Unstable) "Unstable";
  };

  include MixinAuthorization(accessControlState, null);
  include SensorsApi(history);
  include ApiDocMixin();
  include Expose({
    entities = [
      history
        .toEntityManual("reading", "Reading", "timestamp")
        .payload("temperature", func (r : Types.Reading) : Float = r.temperature)
        .payload("humidity", func (r : Types.Reading) : Float = r.humidity)
        .payload("gas", func (r : Types.Reading) : Nat = r.gas)
        .payload("timestamp", func (r : Types.Reading) : Int = r.timestamp)
        .payload("temperatureStatus", func (r : Types.Reading) : Text = statusText(r.temperatureStatus))
        .payload("humidityStatus", func (r : Types.Reading) : Text = statusText(r.humidityStatus))
        .payload("gasStatus", func (r : Types.Reading) : Text = statusText(r.gasStatus))
        .payload("overallStatus", func (r : Types.Reading) : Text = statusText(r.overallStatus))
        .sample({
          temperature = 0.0;
          humidity = 0.0;
          gas = 0;
          timestamp = 0;
          temperatureStatus = #Stable;
          humidityStatus = #Stable;
          gasStatus = #Stable;
          overallStatus = #Stable;
        })
        .public_()
        .build()
    ];
  });
};
