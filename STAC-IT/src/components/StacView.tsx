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
    BottomSheetHandle,
    BottomSheetHandleProps,
    BottomSheetModal,
    BottomSheetView,
    BottomSheetScrollView,
    BottomSheetSectionList,
    useBottomSheetScrollableCreator,
} from "@gorhom/bottom-sheet";
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
import { StyleSheet, View, ScrollView, SectionList } from "react-native";
import {
    Button,
    IconButton,
    SegmentedButtons,
    Card,
    Portal,
    Text,
    Dialog,
    Surface,
    Divider,
    ActivityIndicator,
} from "react-native-paper";
import { useStyles, StyleProps } from "@/styling";
import { useFocusEffect } from "@react-navigation/native";
import {
    CreateRequest,
    CreateResponse,
    NewStac,
    NewActivityOptions,
    Activity,
    Period,
    NewItinerary,
    activityOptionsConv,
    fmtPeriod,
    newStacConverter,
} from "@/types";
import { useAuth } from "@/contexts";
import { StacOptions } from "@/components/StacOptions";

interface HeaderProps extends BottomSheetHandleProps {
    onSave: () => void;
    onEdit: () => void;
    onDismiss: () => void;
    saveDisabled: boolean;
}

function Header({
    saveDisabled,
    onSave,
    onEdit,
    onDismiss,
    ...props
}: HeaderProps) {
    const { styles } = useStyles(styling);

    return (
        <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
                <IconButton
                    style={{ marginLeft: 0 }}
                    icon="close"
                    onPress={onDismiss}
                />
            </View>
            <View style={styles.sheetHeaderCenter}>
                <BottomSheetHandle {...props} />
            </View>
            <View style={styles.sheetHeaderRight}>
                <Button
                    mode="contained"
                    onPress={onSave}
                    disabled={saveDisabled}
                >
                    Save
                </Button>
            </View>
        </View>
    );
}

type StacAction =
    | { type: "close" }
    | { type: "edit" }
    | { type: "show" }
    | { type: "preserve" }
    | { type: "submit" }
    | { type: "dirty"; value: boolean }
    | { type: "ack"; value: string };

type Tail<T extends unknown[]> = T extends [any, ...infer R] ? R : never;

type ConstructorTail<T extends abstract new (...args: any) => any> = Tail<
    ConstructorParameters<T>
>;
abstract class StacState {
    public abstract mode: string;

    public visible: boolean = false;

    constructor(protected link: StacState | null) {
        if (link) {
            this.visible = link.visible;
        }
    }

    replace<
        T extends new (l: StacState | null, ...args: any) => InstanceType<T>,
    >(other: T, ...args: ConstructorTail<T>) {
        return new other(this.link, ...args);
    }

    pop() {
        if (!this.link) {
            throw new Error("attempted to pop last state in stack");
        }
        return this.link as State;
    }

    abstract handle(action: StacAction): StacState;

    is<T extends new (...args: any) => StacState>(
        cls: T,
    ): this is InstanceType<T> {
        return this instanceof cls;
    }

    isEditing(): this is EditState {
        return this.mode === "editing";
    }

    isShowing(): this is ShowState {
        return this.mode === "showing";
    }

    isLoading(): this is LoadingState {
        return this.mode === "loading";
    }
}

class ClosedState extends StacState {
    mode = "closed" as const;
    visible = false;

    handle(action: StacAction) {
        switch (action.type) {
            case "show":
                return new ShowState(this);
        }
        return this;
    }
}
class ShowState extends StacState {
    mode = "showing";
    visible = true;

    handle(action: StacAction): StacState {
        switch (action.type) {
            case "close":
                return new ClosedState(null);
            case "edit":
                return new ClosedState(null);
        }
        return this;
    }
}

class EditState extends ShowState {
    mode = "editing" as const;
    visible = true;

    constructor(
        link: StacState | null,
        public selection: NewActivityOptions[],
        public dirty: boolean = false,
    ) {
        super(link);
    }

    handle(action: StacAction) {
        switch (action.type) {
            case "submit":
                return new LoadingState(this);
            case "close":
                return new ClosedState(this);
        }
        return this;
    }
}
class LoadingState extends StacState {
    mode = "loading" as const;
    visible = true;

    handle(action: StacAction) {
        switch (action.type) {
            case "ack":
                return new ClosedState(this);
        }
        return this;
    }
}
class WarningState extends StacState {
    mode = "warning" as const;
    visible = true;

    handle(action: StacAction): State {
        switch (action.type) {
            case "preserve":
                return this.pop();
            case "close":
                return new ClosedState(null);
        }
        throw new Error("bad state");
    }
}

type State = ShowState | EditState | LoadingState | ClosedState | WarningState;

function stateReducer(state: State, action: StacAction): State {
    return state.handle(action) as State;
}

export interface StacSheetProps {
    ref?: RefObject<StacSheet | null>;
    data: NewStac | null;
}

export interface StacSheetMethods {
    open(): void;
    close(): void;
}

export type StacSheet = StacSheetMethods;

// eslint-disable-next-line
export function StacSheet({ ref, data }: StacSheetProps) {
    const { styles, insets } = useStyles(styling);

    const sheet = useRef<BottomSheetModal>(null);

    const [state, dispatch] = useReducer(
        stateReducer,
        null,
        () => new ClosedState(null),
    );

    useImperativeHandle(
        ref,
        () => ({
            open: () => dispatch({ type: "show" }),
            close: () => dispatch({ type: "close" }),
        }),
        [],
    );

    function renderHeader(p: BottomSheetHandleProps) {
        return (
            <Header
                onSave={() => {}}
                onEdit={() => {}}
                onDismiss={() => dispatch({ type: "close" })}
                saveDisabled={true}
                {...p}
            />
        );
    }

    useEffect(() => {
        if (state.visible) {
            sheet.current?.present();
        } else {
            sheet.current?.dismiss();
        }
    }, [state.visible]);

    const loadingWheel = (
        <ActivityIndicator size={128} animating={state.isLoading()} />
    );

    return (
        <>
            <View style={styles.container}>
                <BottomSheetModal
                    handleComponent={renderHeader}
                    topInset={insets.top}
                    ref={sheet}
                    enableDynamicSizing={true}
                    snapPoints={["10%", "100%"]}
                    index={1}
                    onDismiss={() => dispatch({ type: "close" })}
                    enablePanDownToClose={true}
                >
                    {data ? <StacView data={data} /> : null}
                </BottomSheetModal>
            </View>
        </>
    );
}

export interface StacViewProps {
    data: NewStac;
}

export function StacView({ data }: StacViewProps) {
    const { styles } = useStyles(styling);

    const bscroll = useBottomSheetScrollableCreator();

    if (!data.itinerary) {
        throw new Error("empty itinerary");
    }
    const items = data.itinerary.activities.map(({ options, ...rest }) => {
        return { data: options, ...rest };
    });

    function renderHeader(label: string, timing: Period, data: any[]) {
        return (
            <Surface style={styles.listHeader}>
                <Card.Title
                    titleStyle={styles.listHeaderText}
                    titleVariant="headlineMedium"
                    title={label}
                    subtitle={fmtPeriod(timing)}
                />
            </Surface>
        );
    }

    return (
        <>
            <SectionList
                //focusHook={useFocusEffect}
                contentContainerStyle={styles.contentContainer}
                sections={items}
                renderItem={({ item }) => {
                    return <ActivityCard data={item} />;
                }}
                renderSectionHeader={({ section: { label, timing, data } }) => {
                    return renderHeader(label, timing, data);
                }}
                renderScrollComponent={bscroll}
            />
        </>
    );
}

interface ActivityCardProps {
    data: Activity;
}

function ActivityCard({ data }: ActivityCardProps) {
    const [value, setValue] = useState("");

    const { styles } = useStyles(styling);

    return (
        <Card style={styles.card}>
            <Card.Title
                style={styles.cardHeader}
                title={data.location.display_name}
                titleStyle={styles.cardTitle}
                titleVariant="titleMedium"
                subtitle={data.location.short_address}
                subtitleStyle={styles.cardSubtitle}
            />
            <Divider />
            <Card.Content>
                <View style={styles.cardContent}>
                    <Text>{data.description}</Text>
                </View>
            </Card.Content>
            <Card.Actions>
                <SegmentedButtons
                    value={value}
                    onValueChange={setValue}
                    buttons={[
                        { value: "keep", label: "Keep" },
                        { value: "discard", label: "Discard" },
                    ]}
                />
            </Card.Actions>
        </Card>
    );
}

function styling({ theme }: StyleProps) {
    return StyleSheet.create({
        container: {
            flex: 1,
        },
        contentContainer: {
            flex: 1,
            gap: 8,
        },
        cardContent: {
            marginTop: 8,
        },
        cardHeader: {},
        cardTitle: {},
        cardSubtitle: {
            color: theme.colors.outline,
        },
        card: {
            marginHorizontal: 8,
            backgroundColor: theme.colors.elevation.level1,
        },
        listHeader: {
            flex: 1,
            margin: 0,
            backgroundColor: theme.colors.surface,
        },
        listHeaderText: {
            color: theme.colors.outline,
            fontWeight: 500,
        },
        sheetHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 10,
            backgroundColor: theme.colors.surface,
        },
        sheetHeaderLeft: {
            flex: 1,
            flexDirection: "row",
            justifyContent: "flex-start",
        },
        sheetHeaderCenter: {
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignSelf: "flex-start",
        },
        sheetHeaderRight: {
            flexDirection: "row",
            flex: 1,
            justifyContent: "flex-end",
        },
    });
}
