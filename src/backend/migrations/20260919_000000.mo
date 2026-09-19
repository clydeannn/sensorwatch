import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type Reading = {
    temperature : Float;
    humidity : Float;
    gas : Nat;
    timestamp : Int;
    temperatureStatus : { #Stable; #Warning; #Unstable };
    humidityStatus : { #Stable; #Warning; #Unstable };
    gasStatus : { #Stable; #Warning; #Unstable };
    overallStatus : { #Stable; #Warning; #Unstable };
  };

  type NewActor = {
    accessControlState : AccessControlState;
    history : List.List<Reading>;
  };

  public func migration(_old : {}) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      history = List.empty();
    };
  };
};
