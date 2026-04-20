import {
    DocumentData,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp,
} from "@react-native-firebase/firestore";

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

export interface CreateRequest {
    title: string;
    city: string;
    state: string;
    activities: string[];
    budget: string;
    period: Period;
    n_people: string;
}

export interface RefreshRequest {
    doc_id: string;
    index: number;
}

export interface CreateResponse {
    doc_id: string;
}

export interface Place {
    name: string;
    display_name: string;
    short_address: string;
}

export interface Activity {
    name: string;
    description: string;
    tag?: string;
    location: Place;
}

export interface ActivityOptionsDb {
    label: string;
    options: Activity[];
    timing: PeriodDb;
}

export interface ActivityOptions {
    label: string;
    options: Activity[];
    timing: Period;
}

function activityOptionsToDb(value: ActivityOptions): ActivityOptionsDb {
    return {
        label: value.label,
        options: value.options,
        timing: periodToDb(value.timing),
    };
}

function activityOptionsFromDb(value: ActivityOptionsDb): ActivityOptions {
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

function itineraryToDb(value: Itinerary | null): ItineraryDb | null {
    if (value) {
        return { activities: value.activities.map(activityOptionsToDb) };
    } else {
        return null;
    }
}

function itineraryFromDb(value: ItineraryDb | null): Itinerary | null {
    if (value) {
        return { activities: value.activities.map(activityOptionsFromDb) };
    } else {
        return null;
    }
}

export interface StacRecord {
    owner: string;
    shared_with: string[];
    title: string;
    location: string;
    period: Period;
    budget: string;
    n_people: string;
    created_at: Timestamp;
    status: "pending" | "ready";
    itinerary: Itinerary | null;
}

export interface StacRecordDb {
    owner: string;
    shared_with: string[];
    title: string;
    location: string;
    period: PeriodDb;
    budget: string;
    n_people: string;
    created_at: Timestamp;
    status: "pending" | "ready";
    itinerary: ItineraryDb | null;
}

export function newStacToDb(value: StacRecord): StacRecordDb {
    return {
        owner: value.owner,
        shared_with: value.shared_with,
        title: value.title,
        location: value.location,
        period: periodToDb(value.period),
        budget: value.budget,
        n_people: value.n_people,
        created_at: value.created_at,
        status: value.status,
        itinerary: itineraryToDb(value.itinerary),
    };
}

export function newStacFromDb(value: StacRecordDb): StacRecord {
    return {
        owner: value.owner,
        shared_with: value.shared_with,
        title: value.title,
        location: value.location,
        period: periodFromDb(value.period),
        budget: value.budget,
        n_people: value.n_people,
        created_at: value.created_at,
        status: value.status,
        itinerary: itineraryFromDb(value.itinerary),
    };
}

export const newStacConverter: FirestoreDataConverter<
    StacRecord,
    StacRecordDb
> = {
    toFirestore(modelObject: StacRecord): StacRecordDb {
        return newStacToDb(modelObject);
    },

    fromFirestore(
        snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>,
        options?: SnapshotOptions,
    ): StacRecord {
        const data = snapshot.data(options) as StacRecordDb;
        return newStacFromDb(data);
    },
};
