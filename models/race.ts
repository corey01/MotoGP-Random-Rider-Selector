export interface Race {
  name: string;
  country: string;
  url: string;
  status: string;
  date_start: string;
  date_end: string;
  circuit: {
    circuitName: string;
    circuitCountry: string;
    city: string;
    length: {
      miles: number;
      kilometers: number;
    };
    simpleCircuitPath: string;
    fullCircuitPath: string;
  };
  broadcasts: Broadcast[];
}

export interface Season {
  past: Race[];
  current: Race[];
  future: Race[];
}

interface Broadcast {
  date_end: string;
  date_start: string;
  eventName: string;
  kind: string;
  name: string;
  status: string;
  type: string;
}
