import React, { createContext, useEffect, useState, useContext } from "react";

import {
    getAuth,
    onAuthStateChanged,
    FirebaseAuthTypes,
} from "@react-native-firebase/auth";

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
