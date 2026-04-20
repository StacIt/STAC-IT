import { ActivityView } from "@/components/Activity";
import { useStac, getStac, StacContext, StacContextValue } from "@/contexts";
import { StyleProps, useStyles } from "@/styling";
import {
    ActivityOptions,
    RefreshAllRequest,
    Itinerary,
    StacRecord,
    newStacConverter,
} from "@/types";
import {
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
    getDoc,
    query,
    updateDoc,
    where,
} from "@react-native-firebase/firestore";
import { getFunctions, httpsCallable } from "@react-native-firebase/functions";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import {
    Animated,
    StyleSheet,
    View,
    useAnimatedValue,
    useWindowDimensions,
} from "react-native";
import {
    ActivityIndicator,
    Card,
    FAB,
    Avatar,
    Portal,
    TouchableRipple,
    List,
    Snackbar,
    Surface,
} from "react-native-paper";

import { presentContactPickerAsync } from "expo-contacts";

import { StacHeader } from "@/components/StacHeader";

export default function Stac() {
    const { styles, theme, insets } = useStyles(styling);
    const { width, height } = useWindowDimensions();

    const router = useRouter();
    const nav = useNavigation();

    const { stacid }: { stacid: string } = useLocalSearchParams();
    const [selection, setSelection] = useState<boolean[][]>([[]]);
    const [avatars, setAvatars] = useState<React.ReactElement[]>([]);

    const stacRef = useMemo(() => {
        return getStac(stacid);
    }, [stacid]);

    const [ctx, setCtx] = useState<StacContextValue>({
        id: stacid,
        ref: stacRef,
    });
    useEffect(() => {
        const unsubscribe = onSnapshot(stacRef, (snap) => {
            if (!snap.exists()) {
                setCtx({ id: snap.id, data: undefined, ref: snap.ref });
                return;
            }
            const data = snap.data();
            nav.setOptions({ title: data.title });
            const sel = snap.data().itinerary?.activities.map((a) => {
                return Array<boolean>(a.options.length).fill(false);
            });
            if (sel) {
                setSelection(sel);
            }
            setCtx({ id: snap.id, data, ref: snap.ref });
        });

        return unsubscribe;
    }, [stacRef, nav, setCtx, setAvatars]);

    const [snack, setSnack] = useState("");

    const [fab, setFab] = useState(false);
    const isFocused = useIsFocused();

    const scrollY = useAnimatedValue(0);

    if (!ctx || ctx.data?.status === "pending" || !ctx.data?.itinerary) {
        return <ActivityIndicator size={128} />;
    }

    async function onShare() {
        const contact = await presentContactPickerAsync();
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
                await updateDoc(stacRef, {
                    shared_with: arrayUnion(share_to),
                });
                setSnack(`Shared with ${contact.firstName}`);
            }
        }
    }

    async function onDelete() {
        await deleteDoc(stacRef);
        router.back();
    }

    async function onRefreshAll() {
        const refresh_all_stac = httpsCallable(
            getFunctions(),
            "refresh_all_stac",
        );
        const request: RefreshAllRequest = { doc_id: stacRef.id };

        await refresh_all_stac(JSON.stringify(request)).catch(console.error);
    }

    const actions = [
        {
            icon: "delete",
            label: "Delete",
            onPress: () => onDelete(),
            style: {
                backgroundColor: theme.colors.tertiaryContainer,
            },
        },
        { icon: "share", label: "Share", onPress: onShare },
        {
            icon: "refresh",
            label: "Refresh",
            onPress: onRefreshAll,
        },
    ];

    return (
        <StacContext value={ctx}>
            <Animated.FlatList
                data={ctx.data?.itinerary.activities}
                stickyHeaderIndices={[0]}
                stickyHeaderHiddenOnScroll={true}
                style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true },
                )}
                renderItem={({ item, index }) => (
                    <ActivityView
                        data={item}
                        index={index}
                        selection={selection[index]}
                        setSelection={(v) =>
                            setSelection(selection.with(index, v))
                        }
                        onRefresh={() => {}}
                    />
                )}
                ListHeaderComponent={() => <StacHeader scrollY={scrollY} />}
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
                    visible={isFocused}
                    onStateChange={({ open }) => setFab(open)}
                    actions={actions}
                />
            </Portal>
        </StacContext>
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
            //margin: 0,
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
