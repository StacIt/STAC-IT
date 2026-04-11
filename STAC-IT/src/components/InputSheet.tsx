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
import { Alert, StyleSheet, View } from "react-native";
import {
    Button,
    IconButton,
    Portal,
    Text,
    Dialog,
    ActivityIndicator,
} from "react-native-paper";

import { FormData, InputForm } from "@/components/InputForm";
import { useStyles } from "@/styling";
import {
    StacResponse,
    StacRequest,
    NewActivityOptions,
    NewItinerary,
    activityOptionsConv,
} from "@/types";
import { StacOptions } from "@/components/StacOptions";

interface HeaderProps extends BottomSheetHandleProps {
    onSubmit: () => void;
    onDismiss: () => void;
    submitDisabled: boolean;
    submitVisible: boolean;
}

function Header({
    submitDisabled,
    onSubmit,
    onDismiss,
    submitVisible,
    ...props
}: HeaderProps) {
    const { styles } = useStyles(styling);

    const submitBtn = submitVisible ? (
        <Button mode="contained" onPress={onSubmit} disabled={submitDisabled}>
            Save
        </Button>
    ) : null;

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
            <View style={styles.header_right}>{submitBtn}</View>
        </View>
    );
}

async function callBackend(data: FormData): Promise<StacResponse> {
    const { title: _, ...msg } = data;
    return axios
        .post<StacResponse>(
            "https://stac-1061792458880.us-east1.run.app/chatbot_api",
            msg,
            { headers: { "Content-Type": "application/json" } },
        )
        .then((v) => v.data);
}

type InputAction =
    | { type: "submit" }
    | { type: "validate"; value: boolean }
    | { type: "dirty"; value: boolean }
    | { type: "close" }
    | { type: "open" }
    | { type: "preserve" }
    | { type: "select"; selection: NewActivityOptions[] }
    | { type: "receive"; data: NewActivityOptions[] };

type Tail<T extends unknown[]> = T extends [any, ...infer R] ? R : never;

type ConstructorTail<T extends abstract new (...args: any) => any> = Tail<
    ConstructorParameters<T>
>;

abstract class InputState {
    public abstract mode:
        | "closed"
        | "request"
        | "loading"
        | "response"
        | "warning";

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

    isRequesting(): this is RequestState {
        return this.mode === "request";
    }

    isResponse(): this is ResponseState {
        return this.mode === "response";
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

class ResponseState extends InputState {
    mode = "response" as const;

    constructor(
        link: InputState | null,
        public itinerary: NewActivityOptions[],
        public selection: NewActivityOptions[],
    ) {
        super(link);
    }

    handle(action: InputAction) {
        switch (action.type) {
            case "select":
                return this.replace(
                    ResponseState,
                    this.itinerary,
                    action.selection,
                );
            case "close": {
                return new ClosedState(this);
            }
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
            case "receive":
                return this.replace(ResponseState, action.data, []);
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

type State =
    | RequestState
    | ResponseState
    | LoadingState
    | ClosedState
    | WarningState;

function inputReducer(state: State, action: InputAction): State {
    return state.handle(action);
}

export interface InputSheetProps {
    ref?: RefObject<InputSheet | null>;
}

export interface InputSheetMethods {
    open(): void;
    close(): void;
}

export type InputSheet = InputSheetMethods;

// eslint-disable-next-line
export function InputSheet({ ref }: InputSheetProps) {
    const { styles, insets } = useStyles(styling);

    const sheet = useRef<BottomSheetModal>(null);
    const form = useRef<InputForm>(null);

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
        if (state.visible) {
            sheet.current?.present();
        } else {
            sheet.current?.dismiss();
        }
    }, [state.visible]);

    function handleError(e: Error) {
        console.error(e);
    }

    const handleSubmit = async () => {
        dispatch({ type: "submit" });
        await form
            .current!.submit()
            .then(callBackend)
            .then((d) => d.itinerary.activities.map(activityOptionsConv))
            .then((v) => dispatch({ type: "receive", data: v }))
            .catch(handleError);
    };

    const handlePressClose = () => {
        dispatch({ type: "close" });
    };

    const renderHeader = (p: BottomSheetHandleProps) => (
        <Header
            onSubmit={handleSubmit}
            onDismiss={handlePressClose}
            submitDisabled={state.isRequesting() && !state.valid}
            submitVisible={state.isRequesting() || state.isResponse()}
            {...p}
        />
    );

    let content;

    if (state.mode === "loading") {
        content = <ActivityIndicator size={128} />;
    } else if (state.mode === "response") {
        content = (
            <StacOptions
                activities={state.itinerary}
                selection={state.selection}
                setSelection={(v) => dispatch({ type: "select", selection: v })}
            />
        );
    } else {
        content = (
            <InputForm
                ref={form}
                onDirty={() => dispatch({ type: "dirty", value: true })}
                onValidate={(value) => dispatch({ type: "validate", value })}
            />
        );
    }

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
            <View style={styles.container}>
                <BottomSheetModal
                    handleComponent={renderHeader}
                    topInset={insets.top}
                    ref={sheet}
                    enableDynamicSizing={true}
                    snapPoints={["10%", "100%"]}
                    index={1}
                    onDismiss={() => dispatch({ type: "close" })}
                    enablePanDownToClose={state.isRequesting() && !state.dirty}
                >
                    <BottomSheetScrollView style={styles.contentContainer}>
                        {content}
                        <View style={{ height: 8 * 3 }} />
                    </BottomSheetScrollView>
                </BottomSheetModal>
            </View>
        </>
    );
}

const styling = () => {
    return StyleSheet.create({
        container: {},
        contentContainer: {
            paddingHorizontal: 12,
            flexDirection: "column",
            paddingBottom: 16,
            gap: 4,
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
