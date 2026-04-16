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
    limit,
    query,
    arrayUnion,
    getDoc,
    DocumentReference,
    updateDoc,
    where,
    Timestamp,
    getFirestore,
    orderBy,
    onSnapshot,
} from "@react-native-firebase/firestore";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import {
    StyleSheet,
    View,
    ScrollView,
    FlatList,
    useWindowDimensions,
} from "react-native";
import {
    Button,
    FAB,
    Snackbar,
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
import { ActivityView, ActivityCard } from "@/components/Activity";

import { presentContactPickerAsync } from "expo-contacts";

export default function Stac() {
    const { styles, theme } = useStyles(styling);
    const { width, height } = useWindowDimensions();

    const router = useRouter();
    const { stacid }: { stacid: string } = useLocalSearchParams();

    const [data, setData] = useState<NewStac | null>(null);

    const [selection, setSelection] = useState<boolean[][]>([[]]);

    const [snack, setSnack] = useState("");

    const [fab, setFab] = useState(false);

    useEffect(() => {
        const db = collection(getFirestore(), "stacks_v2").withConverter(
            newStacConverter,
        );
        const docRef = doc(db, stacid);

        const unsub = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                setData(snap.data());
                const sel = snap.data().itinerary?.activities.map((a) => {
                    return Array<boolean>(a.options.length).fill(false);
                });
                if (sel) {
                    setSelection(sel);
                }
            }
        });

        return unsub;
    }, [stacid]);

    if (!data || data.status === "pending" || !data.itinerary) {
        return <ActivityIndicator size={128} />;
    }

    function renderHeader() {
        if (!data) {
            return null;
        }
        const options = {
            weekday: "long",
            month: "long",
            day: "numeric",
        } as const;
        const datestr = data.period.begin.toLocaleDateString("en-US", options);
        return (
            <Surface style={styles.listHeader} elevation={4}>
                <Card.Title
                    titleStyle={styles.listHeaderText}
                    titleVariant="headlineMedium"
                    title={datestr}
                    subtitle={data.location}
                    subtitleStyle={styles.headerSub}
                />
            </Surface>
        );
    }

    async function onShare() {
        const contact = await presentContactPickerAsync();
        const stacdb = collection(getFirestore(), "stacks_v2").withConverter(
            newStacConverter,
        );
        const docRef = doc(stacdb, stacid);
        const userdb = collection(getFirestore(), "users");
        if (contact && contact.emails && contact.emails.length > 0) {
            let q;
            if (contact.emails.length === 1 && contact.emails[0].email) {
                q = query(
                    userdb,
                    where("email", "==", contact.emails[0].email),
                );
            } else {
                const candidates = contact.emails.flatMap((v) => v.email ?? []);
                q = query(userdb, where("email", "in", candidates));
            }
            q = query(q, limit(1));

            const resp = await getDocs(q);
            for (const u of resp.docs) {
                const share_to = u.id;
                await updateDoc(docRef, {
                    shared_with: arrayUnion(share_to),
                });
                setSnack(`shared with ${contact.firstName}`);
            }
        }
    }

    async function onDelete() {
        const db = collection(getFirestore(), "stacks_v2").withConverter(
            newStacConverter,
        );
        const docRef = doc(db, stacid);
        await deleteDoc(docRef);
        router.back();
    }

    function onRefresh() {}

    async function onSave() {
        if (
            !data ||
            !data.itinerary ||
            data.itinerary.activities.length === 0
        ) {
            return;
        }
        const acts = data.itinerary.activities;
        console.log(selection);
        const keep: NewActivityOptions[] = acts.map((ao, i) => {
            return {
                ...ao,
                options: ao.options.filter((opt, j) => selection[i][j]),
            };
        });
        const newitin: NewItinerary = { activities: keep };
        const db = collection(getFirestore(), "stacks_v2").withConverter(
            newStacConverter,
        );
        const docRef = doc(db, stacid);
        await updateDoc(docRef, { itinerary: newitin });
    }
    const cansave = selection.every((v) => v.includes(true));
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {renderHeader()}
            <FlatList
                data={data.itinerary.activities}
                renderItem={({ item, index }) => (
                    <ActivityView
                        data={item}
                        selection={selection[index]}
                        setSelection={(v) =>
                            setSelection(selection.with(index, v))
                        }
                        onRefresh={() => {}}
                    />
                )}
                ListFooterComponent={<View style={{ height: 200 }} />}
            />
            <Portal>
                <Snackbar visible={!!snack} onDismiss={() => setSnack("")}>
                    {snack}
                </Snackbar>
                <FAB.Group
                    style={styles.fab}
                    icon={fab ? "close" : "plus"}
                    open={fab}
                    visible={true}
                    onStateChange={({ open }) => setFab(open)}
                    actions={[
                        {
                            icon: "delete",
                            label: "Delete",
                            onPress: onDelete,
                            style: {
                                backgroundColor: theme.colors.tertiaryContainer,
                            },
                        },
                        { icon: "share", label: "Share", onPress: onShare },
                        {
                            icon: "refresh",
                            label: "Refresh",
                            onPress: onRefresh,
                        },
                        {
                            icon: "content-save",
                            label: "Save",
                            onPress: onSave,
                            color: !cansave
                                ? theme.colors.onSurfaceDisabled
                                : undefined,
                            style: {
                                backgroundColor: cansave
                                    ? undefined
                                    : theme.colors.surfaceDisabled,
                            },
                        },
                    ]}
                />
            </Portal>
        </View>
    );
}

const styling = ({ theme, insets }: StyleProps) => {
    return StyleSheet.create({
        container: {
            backgroundColor: theme.colors.background,
        },
        listContainer: {
            flex: 1,
        },
        listHeader: {
            margin: 0,
            backgroundColor: theme.colors.primaryContainer,
        },
        listHeaderText: {
            color: theme.colors.onPrimaryContainer,
            fontWeight: 500,
        },
        headerSub: {
            color: theme.colors.onPrimaryContainer,
        },
        fab: {
            position: "absolute",
            right: 8,
            bottom: -(8 * 3),
        },
        scrollView: {
            flex: 1,
        },
        scrollViewContent: {
            flex: 1,
        },
    });
};
