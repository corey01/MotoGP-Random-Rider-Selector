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
}

export interface Season {
  past: Race[];
  current: Race[];
  future: Race[];
}
