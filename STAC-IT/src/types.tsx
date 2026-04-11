import {
    Timestamp,
    FirestoreDataConverter,
    DocumentData,
    QueryDocumentSnapshot,
    SnapshotOptions,
} from "@react-native-firebase/firestore";

export interface StrPeriod {
    begin: string;
    end: string;
}

export interface Period {
    begin: Date;
    end: Date;
}

export function fmtPeriod(p: Period): string {
    const begin = `${p.begin.toLocaleTimeString([], { timeStyle: "short" })}`;
    const end = `${p.end.toLocaleTimeString([], { timeStyle: "short" })}`;
    return `${begin} - ${end}`;
}

export interface PeriodDb {
    begin: Timestamp;
    end: Timestamp;
}

function periodToDb(period: Period): PeriodDb {
    return {
        begin: Timestamp.fromDate(period.begin),
        end: Timestamp.fromDate(period.end),
    };
}

function periodFromDb(period: PeriodDb): Period {
    return {
        begin: period.begin.toDate(),
        end: period.end.toDate(),
    };
}

export interface StacRequest {
    city: string;
    state: string;
    activities: string[];
    budget: string;
    period: Period;
    numberOfPeople: string;
    keepOptions: string;
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

export interface ActivityOptionsDb {
    label: string;
    options: Activity[];
    timing: PeriodDb;
}

export interface NewActivityOptions {
    label: string;
    options: Activity[];
    timing: Period;
}

export interface ActivityOptions {
    label: string;
    options: Activity[];
    timing: StrPeriod;
}

export function activityOptionsConv(
    value: ActivityOptions,
): NewActivityOptions {
    return {
        label: value.label,
        options: value.options,
        timing: {
            begin: new Date(value.timing.begin),
            end: new Date(value.timing.end),
        },
    };
}

function activityOptionsToDb(value: NewActivityOptions): ActivityOptionsDb {
    return {
        label: value.label,
        options: value.options,
        timing: periodToDb(value.timing),
    };
}

function activityOptionsFromDb(value: ActivityOptionsDb): NewActivityOptions {
    return {
        label: value.label,
        options: value.options,
        timing: periodFromDb(value.timing),
    };
}

export interface ItineraryDb {
    activities: ActivityOptionsDb[];
}

export interface Itinerary {
    activities: ActivityOptions[];
}

export type NewItinerary2 = NewActivityOptions[];

export interface NewItinerary {
    activities: NewActivityOptions[];
}

function itineraryToDb(value: NewItinerary): ItineraryDb {
    return {
        activities: value.activities.map(activityOptionsToDb),
    };
}

function itineraryFromDb(value: ItineraryDb): NewItinerary {
    return {
        activities: value.activities.map(activityOptionsFromDb),
    };
}

export interface StacResponse {
    request_id: string;
    timestamp: string;
    itinerary: Itinerary;
}

export interface NewStac {
    id: string;
    userId: string;
    sharedWith: string[];
    stacName: string;
    location: string;
    budget: string;
    numberOfPeople: string;
    createdAt: Timestamp;
    itinerary: NewItinerary;
}

export interface NewStacDb {
    id: string;
    userId: string;
    sharedWith: string[];
    stacName: string;
    location: string;
    budget: string;
    numberOfPeople: string;
    createdAt: Timestamp;
    itinerary: ItineraryDb;
}

export function newStacToDb(value: NewStac): NewStacDb {
    return {
        id: value.id,
        userId: value.userId,
        sharedWith: value.sharedWith,
        stacName: value.stacName,
        location: value.location,
        budget: value.budget,
        numberOfPeople: value.numberOfPeople,
        createdAt: value.createdAt,
        itinerary: itineraryToDb(value.itinerary),
    };
}

export function newStacFromDb(value: NewStacDb): NewStac {
    return {
        id: value.id,
        userId: value.userId,
        sharedWith: value.sharedWith,
        stacName: value.stacName,
        location: value.location,
        budget: value.budget,
        numberOfPeople: value.numberOfPeople,
        createdAt: value.createdAt,
        itinerary: itineraryFromDb(value.itinerary),
    };
}

export const newStacConverter: FirestoreDataConverter<NewStac, NewStacDb> = {
    toFirestore(modelObject: NewStac): NewStacDb {
        return newStacToDb(modelObject);
    },

    fromFirestore(
        snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>,
        options?: SnapshotOptions,
    ): NewStac {
        const data = snapshot.data(options) as NewStacDb;
        return newStacFromDb(data);
    },
};

export interface Stac {
    id: string;
    userId: string;
    stacName: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    preferences: string;
    budget: string;
    numberOfPeople: string;
    modelResponse?: string;
    selectedOptions?: { [key: string]: string[] };
    detailedSelectedOptions?: {
        [key: string]: {
            name: string;
            description: string;
            location: string;
        }[];
    };
    preferenceTimings?: {
        [key: string]: {
            begin: string;
            end: string;
        };
    };
}
