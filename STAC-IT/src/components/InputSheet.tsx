import {
    BottomSheetHandle,
    BottomSheetHandleProps,
    BottomSheetModal,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import axios from "axios";
import * as React from "react";
import {
    RefObject,
    useReducer,
    useImperativeHandle,
    useRef,
    useState,
    useEffect,
    useEffectEvent,
} from "react";

import {
    collection,
    deleteDoc,
    doc,
    addDoc,
    getDocs,
    query,
    getDoc,
    DocumentReference,
    updateDoc,
    where,
    Timestamp,
    getFirestore,
    orderBy,
    onSnapshot,
} from "@react-native-firebase/firestore";
import { getAuth } from "@react-native-firebase/auth";
import { Alert, StyleSheet, View } from "react-native";
import {
    Button,
    IconButton,
    Portal,
    Text,
    Dialog,
    ActivityIndicator,
} from "react-native-paper";

import {
    connectFunctionsEmulator,
    httpsCallable,
    getFunctions,
} from "@react-native-firebase/functions";
import { getApp } from "@react-native-firebase/app";

import { InputForm } from "@/components/InputForm";
import { useStyles, StyleProps } from "@/styling";
import {
    CreateRequest,
    CreateResponse,
    NewStac,
    NewActivityOptions,
    NewItinerary,
    activityOptionsConv,
    newStacConverter,
} from "@/types";
import { useAuth } from "@/contexts";
import { StacOptions } from "@/components/StacOptions";

interface HeaderProps extends BottomSheetHandleProps {
    onSubmit: () => void;
    onDismiss: () => void;
    submitDisabled: boolean;
}

function Header({
    submitDisabled,
    onSubmit,
    onDismiss,
    ...props
}: HeaderProps) {
    const { styles } = useStyles(styling);

    return (
        <View style={styles.header}>
            <View style={styles.header_left}>
                <IconButton
                    style={{ marginLeft: 0 }}
                    icon="close"
                    onPress={onDismiss}
                />
            </View>
            <View style={styles.header_center}>
                <BottomSheetHandle {...props} />
            </View>
            <View style={styles.header_right}>
                <Button
                    mode="contained"
                    onPress={onSubmit}
                    disabled={submitDisabled}
                >
                    Save
                </Button>
            </View>
        </View>
    );
}

async function callBackend(
    data: CreateRequest,
    token: string,
): Promise<CreateResponse> {
    return axios
        .post<CreateResponse>(
            "https://stac-1061792458880.us-east1.run.app/create",
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            },
        )
        .then((v) => v.data);
}

type InputAction =
    | { type: "submit" }
    | { type: "validate"; value: boolean }
    | { type: "dirty"; value: boolean }
    | { type: "close" }
    | { type: "ack"; value: string }
    | { type: "open" }
    | { type: "preserve" };

type Tail<T extends unknown[]> = T extends [any, ...infer R] ? R : never;

type ConstructorTail<T extends abstract new (...args: any) => any> = Tail<
    ConstructorParameters<T>
>;

abstract class InputState {
    public abstract mode: "closed" | "request" | "loading" | "warning";

    public visible: boolean = false;

    constructor(protected link: InputState | null) {
        if (link) {
            this.visible = link.visible;
        }
    }

    replace<
        T extends new (l: InputState | null, ...args: any) => InstanceType<T>,
    >(other: T, ...args: ConstructorTail<T>) {
        return new other(this.link, ...args);
    }

    pop() {
        if (!this.link) {
            throw new Error("attempted to pop last state in stack");
        }
        return this.link as State;
    }

    abstract handle(action: InputAction): InputState;

    isLoading(): this is LoadingState {
        return this.mode === "loading";
    }

    isWarning(): this is WarningState {
        return this.mode === "warning";
    }

    isRequesting(): this is RequestState {
        return this.mode === "request";
    }

    isClosed(): this is ClosedState {
        return this.mode === "closed";
    }
}

class RequestState extends InputState {
    mode = "request" as const;

    visible = true;

    constructor(
        link: InputState | null,
        public dirty: boolean = false,
        public valid: boolean = false,
    ) {
        super(link);
    }

    handle(action: InputAction) {
        switch (action.type) {
            case "close":
                return this.dirty
                    ? new WarningState(this)
                    : new ClosedState(this);
            case "submit":
                return new LoadingState(this);
            case "dirty":
                return this.replace(RequestState, action.value, this.valid);
            case "validate":
                return this.replace(RequestState, this.dirty, action.value);
        }
        throw new Error("bad state");
    }
}

class ClosedState extends InputState {
    mode = "closed" as const;

    visible = false;

    handle(action: InputAction) {
        switch (action.type) {
            case "open":
                return new RequestState(this);
        }
        return this;
    }
}

class LoadingState extends InputState {
    mode = "loading" as const;

    handle(action: InputAction) {
        switch (action.type) {
            case "ack":
                return new ClosedState(null);
        }
        return this;
    }
}

class WarningState extends InputState {
    mode = "warning" as const;

    handle(action: InputAction) {
        switch (action.type) {
            case "preserve":
                return this.pop();
            case "close":
                return new ClosedState(null);
        }
        throw new Error("bad state");
    }
}

type State = RequestState | LoadingState | ClosedState | WarningState;

function inputReducer(state: State, action: InputAction): State {
    return state.handle(action);
}

export interface InputSheetProps {
    ref?: RefObject<InputSheet | null>;
    onStateChange?: (v: boolean) => void;
}

export interface InputSheetMethods {
    open(): void;
    close(): void;
}

export type InputSheet = InputSheetMethods;

// eslint-disable-next-line
export function InputSheet({ ref, onStateChange }: InputSheetProps) {
    const { styles, insets } = useStyles(styling);

    const sheet = useRef<BottomSheetModal>(null);
    const form = useRef<InputForm>(null);

    const { user } = useAuth();

    const functions = getFunctions();

    const [state, dispatch] = useReducer(
        inputReducer,
        null,
        () => new ClosedState(null),
    );

    useImperativeHandle(
        ref,
        () => ({
            open: () => dispatch({ type: "open" }),
            close: () => dispatch({ type: "close" }),
        }),
        [],
    );
    useEffect(() => {
        onStateChange?.(state.visible);
        if (state.visible) {
            sheet.current?.present();
        } else {
            sheet.current?.dismiss();
        }
    }, [state.visible, onStateChange]);

    function handleError(e: Error) {
        console.error(e);
    }

    async function handleSubmit() {
        dispatch({ type: "submit" });

        const create_stac = httpsCallable(functions, "create_stac");
        const token = await user.getIdToken();

        await form
            .current!.submit()
            .then((data) => {
                console.log(JSON.stringify(data));
                return create_stac(JSON.stringify(data));
            })
            .then((resp) => {
                dispatch({ type: "ack", value: "merp" });
                console.log(`received ack: ${resp.data}`);
            });
    }

    const handlePressClose = () => {
        dispatch({ type: "close" });
    };

    const renderHeader = (p: BottomSheetHandleProps) => (
        <Header
            onSubmit={handleSubmit}
            onDismiss={handlePressClose}
            submitDisabled={state.isRequesting() && !state.valid}
            {...p}
        />
    );

    const loadingWheel = (
        <ActivityIndicator size={128} animating={state.isLoading()} />
    );

    return (
        <>
            <Portal>
                <Dialog
                    visible={state.mode === "warning"}
                    onDismiss={() => dispatch({ type: "close" })}
                >
                    <Dialog.Content>
                        <Text>Discard this stac?</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => dispatch({ type: "preserve" })}>
                            Keep editing
                        </Button>
                        <Button onPress={() => dispatch({ type: "close" })}>
                            Discard
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <View>
                <BottomSheetModal
                    handleComponent={renderHeader}
                    topInset={insets.top}
                    ref={sheet}
                    backgroundStyle={styles.container}
                    enableDynamicSizing={true}
                    keyboardBehavior="interactive"
                    keyboardBlurBehavior="restore"
                    snapPoints={["10%", "100%"]}
                    index={1}
                    onDismiss={() => dispatch({ type: "close" })}
                    enablePanDownToClose={state.isRequesting() && !state.dirty}
                >
                    <BottomSheetScrollView style={styles.contentContainer}>
                        {state.isLoading() ? loadingWheel : null}
                        <InputForm
                            ref={form}
                            onDirty={() =>
                                dispatch({ type: "dirty", value: true })
                            }
                            onValidate={(value) =>
                                dispatch({ type: "validate", value })
                            }
                            visible={!state.isLoading()}
                        />
                        <View style={{ height: 8 * 3 }} />
                    </BottomSheetScrollView>
                </BottomSheetModal>
            </View>
        </>
    );
}

const styling = ({ theme }: StyleProps) => {
    return StyleSheet.create({
        container: {
            backgroundColor: theme.colors.background,
        },
        contentContainer: {
            paddingHorizontal: 12,
            flexDirection: "column",
            paddingBottom: 16,
            gap: 4,
            flex: 1,
        },
        footer: {
            alignSelf: "flex-end",
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 10,
        },
        header_left: {
            flex: 1,
            flexDirection: "row",
            justifyContent: "flex-start",
        },
        header_center: {
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignSelf: "flex-start",
        },
        header_right: {
            flexDirection: "row",
            flex: 1,
            justifyContent: "flex-end",
        },
    });
};
