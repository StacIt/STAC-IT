import React, {
    createContext,
    useMemo,
    useContext,
    useEffect,
    useCallback,
    useState,
    useEffectEvent,
} from "react";

import { StacRecord, StacRecordDb, newStacConverter } from "@/types";
import {
    FirebaseAuthTypes,
    getAuth,
    onAuthStateChanged,
} from "@react-native-firebase/auth";
import {
    DocumentReference,
    DocumentSnapshot,
    QueryDocumentSnapshot,
    CollectionReference,
    doc,
    onSnapshot,
    getDoc,
    getFirestore,
    collection,
} from "@react-native-firebase/firestore";

export type AuthState =
    | { status: "loading"; user: null }
    | { status: "signedIn"; user: FirebaseAuthTypes.User }
    | { status: "signedOut"; user: null };

export const AuthContext = createContext<AuthState | null>(null);

export interface AppContextProps {
    children?: React.ReactNode;
}

export function AppContext({ children }: AppContextProps) {
    const [state, setState] = useState<AuthState>({
        status: "loading",
        user: null,
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
            setState(
                user
                    ? { status: "signedIn", user: user }
                    : { status: "signedOut", user: null },
            );
        });
        return unsubscribe;
    }, []);

    return (
        <>
            <AuthContext value={state}>{children}</AuthContext>
        </>
    );
}

export function useAuthState() {
    const ctx = useContext(AuthContext);
    if (ctx === null) {
        throw new Error("useAuthState must be called inside AppContext");
    }
    return ctx;
}

export function useIsSignedIn() {
    return useAuthState().status === "signedIn";
}

export function useIsSignedOut() {
    return useAuthState().status === "signedOut";
}

export function useIsAuthReady() {
    return useAuthState().status !== "loading";
}

export function useAuth() {
    const ctx = useAuthState();
    if (ctx.status !== "signedIn") {
        throw new Error("useAuth called from unauthenticated context");
    }
    return ctx;
}

export function getStac(id: string) {
    const db = collection(getFirestore(), "stacks_v2").withConverter(
        newStacConverter,
    );
    return doc(db, id);
}

export type StacContextValue = {
    id: string;
    data?: StacRecord;
    ref: DocumentReference<StacRecord, StacRecordDb>;
};

export const StacContext = createContext<StacContextValue | null>(null);

export function useStac() {
    const ctx = useContext(StacContext);
    if (!ctx) {
        throw new Error("useStac called without context");
    }
    return ctx;
}
