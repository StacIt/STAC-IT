
export interface StrPeriod {
    begin: string;
    end: string;
}

export interface Period {
    begin: Date;
    end: Date;
}

export interface StacRequest {
    city: string;
    state: string;
    activities: string[];
    budget: string;
    period: Period;
    numberOfPeople: string;
    keepOptions?: string;
}

export interface Place {
    name: string;
    display_name: string;
    short_address: string;
}

export interface Activity {
    name: string;
    description: string;
    location: Place;
}

export interface ActivityOptions {
    label: string;
    options: Activity[];
    timing: StrPeriod;
}

export interface Itinerary {
    activities: ActivityOptions[];
}

export interface StacResponse {
  request_id: string;
  timestamp: string;
  itinerary: Itinerary;
}

export interface Stac {
    id: string
    userId: string
    stacName: string
    date: string
    startTime: string
    endTime: string
    location: string
    preferences: string
    budget: string
    numberOfPeople: string
    modelResponse?: string
    selectedOptions?: { [key: string]: string[] }
    detailedSelectedOptions?: {
        [key: string]: Array<{
            name: string
            description: string
            location: string
        }>
    }
    preferenceTimings?: {
        [key: string]: {
            begin: string
            end: string
        }
    }
}
