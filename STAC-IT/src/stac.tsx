import * as React from "react";
import { useStac, getStac, StacContext, StacContextValue } from "@/contexts";
import {
    ActivityOptions,
    RefreshAllRequest,
    Itinerary,
    StacRecord,
    StacRecordDb,
    newStacConverter,
} from "@/types";
import {
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    runTransaction,
    limit,
    onSnapshot,
    getDoc,
    query,
    updateDoc,
    DocumentReference,
    CollectionReference,
    where,
} from "@react-native-firebase/firestore";
import { getFunctions, httpsCallable } from "@react-native-firebase/functions";

// exists to keep db state in sync
export class StacState {
    public ref: DocumentReference<StacRecord, StacRecordDb>;
    public constructor(public readonly id: string) {
        this.ref = doc(getFirestore(), "stacks_v2", id).withConverter(
            newStacConverter,
        );
    }
}
