import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import {
    Animated,
    StyleSheet,
    View,
    useAnimatedValue,
    StyleProp,
    ViewProps,
} from "react-native";
import {
    arrayUnion,
    arrayRemove,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
    query,
    getDoc,
    updateDoc,
    where,
    runTransaction,
    documentId,
} from "@react-native-firebase/firestore";
import {
    ActivityIndicator,
    Card,
    Portal,
    Button,
    Badge,
    IconButton,
    Icon,
    TouchableRipple,
    List,
    Snackbar,
    Avatar,
    Text,
    Surface,
    Tooltip,
} from "react-native-paper";
import { useHeaderHeight } from "@react-navigation/elements";

import { ActivityView } from "@/components/Activity";
import { StacContext, useStac, useAuth } from "@/contexts";
import { StyleProps, useStyles, withOpacity } from "@/styling";
import {
    ActivityOptions,
    Itinerary,
    StacRecord,
    newStacConverter,
} from "@/types";

function initials(str: string) {
    return str
        .trim()
        .split(/\s+/)
        .map((word: string) => word[0].toUpperCase())
        .join("");
}

export interface StacHeaderProps {
    children?: React.ReactNode;
    scrollY: Animated.Value;
}

export function StacHeader({ children, scrollY }: StacHeaderProps) {
    const { data, ref } = useStac();
    const { styles, theme } = useStyles(styling);
    const { user } = useAuth();

    const headerHeight = useHeaderHeight();

    const headerScaleY = scrollY.interpolate({
        inputRange: [-headerHeight, 0],
        outputRange: [2, 1],
        extrapolateLeft: "extend",
        extrapolateRight: "clamp",
    });

    const headerTranslateY = scrollY.interpolate({
        inputRange: [-1, 0],
        outputRange: [-0.5, 0],
        extrapolateLeft: "extend",
        extrapolateRight: "clamp",
    });

    const dateopts = {
        weekday: "long",
        month: "long",
        day: "numeric",
    } as const;
    const datestr = data?.period.begin.toLocaleDateString("en-US", dateopts);

    const [sharedUsers, setSharedUsers] = useState<
        { uid: string; name: string }[]
    >([]);
    const [isOpen, setIsOpen] = useState(false);
    const [ownerName, setOwnerName] = useState("");

    useEffect(() => {
        const userdb = collection(getFirestore(), "users");
        async function getOwner() {
            if (!data) {
                return;
            }
            if (data.owner !== user.uid) {
                const ownerDoc = await getDoc(doc(userdb, data.owner));
                const name =
                    (ownerDoc.exists() && ownerDoc.data().fullName) ??
                    "unknown";
                setOwnerName(name);
            } else {
                setOwnerName("you");
            }
        }
        async function getShared() {
            let i = 0;
            if (!data || data.shared_with.length === 0) {
                setSharedUsers([]);
                setIsOpen(false);
                return;
            }
            const q = query(
                userdb,
                where(documentId(), "in", data.shared_with),
            );
            const shared_users = await getDocs(q);

            const shared_udata = shared_users.docs.map((u) => {
                const name = (u.data().fullName ?? "") as string;
                return { uid: u.id, name: name };
            });
            setSharedUsers(shared_udata);
        }
        getShared();
        getOwner();
    }, [data, user.uid]);

    const chevronRotV = useAnimatedValue(0);

    const drawerHeightV = useAnimatedValue(0);
    const drawerHeight = useAnimatedValue(0);

    const chevronRot = chevronRotV.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    useEffect(() => {
        const btn = Animated.spring(chevronRotV, {
            toValue: isOpen ? 1 : 0,
            useNativeDriver: true,
        });

        const slide = Animated.spring(drawerHeight, {
            toValue: isOpen ? drawerHeightV : 0,
            useNativeDriver: false,
        });

        Animated.parallel([btn, slide]).start();
    }, [isOpen, chevronRotV, drawerHeight, drawerHeightV]);

    const isOwner = data?.owner === user.uid;

    const [editShare, setEditShare] = useState(false);

    const chevron = (
        <IconButton
            icon="chevron-down"
            style={[styles.chevron, { transform: [{ rotate: chevronRot }] }]}
            onPress={() => {
                setIsOpen((v) => !v);
                setEditShare(false);
            }}
        />
    );

    async function removeShare(uid: string) {
        await updateDoc(ref, { shared_with: arrayRemove(uid) });
    }

    const has_shared = sharedUsers.length > 0;

    const editBtn = <IconButton icon="pencil-outline" />;

    const avatars = sharedUsers.map(({ uid, name }, index) => {
        const delbtn = editShare ? (
            <IconButton
                icon="close"
                animated={true}
                size={8 * 2}
                mode="contained"
                onPress={() => {
                    removeShare(uid);
                }}
                style={{
                    height: 8 * 2.5,
                    width: 8 * 2.5,
                    position: "absolute",
                    top: -8 * 1.5,
                    left: 8 * 2.5,
                }}
            />
        ) : null;
        return (
            <View key={index}>
                <Tooltip title={name}>
                    <Avatar.Text
                        key={index}
                        label={initials(name)}
                        size={8 * 5}
                    />
                </Tooltip>
                {delbtn}
            </View>
        );
    });

    const sharedTray = (
        <View style={{ flexDirection: "row" }}>
            <View style={styles.sharedContainer}>
                <View style={styles.sharedAvatars}>{avatars}</View>
            </View>
            <View style={styles.sharedEditContainer}>
                <IconButton
                    animated={true}
                    icon={editShare ? "pencil-off-outline" : "pencil-outline"}
                    size={8 * 4}
                    onPress={() => setEditShare((v) => !v)}
                />
            </View>
        </View>
    );

    const drawer = (
        <Animated.View
            style={{ overflow: "hidden", width: "100%", height: drawerHeight }}
        >
            <Surface
                onLayout={Animated.event(
                    [{ nativeEvent: { layout: { height: drawerHeightV } } }],
                    { useNativeDriver: false },
                )}
                style={styles.drawerContainer}
                elevation={3}
            >
                <Surface style={styles.sharedTextContainer} elevation={3}>
                    <Text variant="labelMedium" style={styles.sharedWithText}>
                        {has_shared ? "Shared with:" : "Shared with no one"}
                    </Text>
                </Surface>
                {has_shared ? sharedTray : <View style={{ height: 4 }} />}
                <Surface style={styles.sharedTextContainer} elevation={3}>
                    <Text variant="labelMedium" style={styles.sharedWithText}>
                        {`Created by ${ownerName}`}
                    </Text>
                </Surface>
            </Surface>
        </Animated.View>
    );

    return (
        <>
            <Surface style={styles.listHeader} elevation={2} mode="elevated">
                <Animated.View
                    style={[
                        styles.listHeader,
                        { height: headerHeight },
                        {
                            transform: [
                                { translateY: headerTranslateY },
                                { scaleY: headerScaleY },
                            ],
                        },
                    ]}
                />
                <Card.Title
                    titleStyle={styles.listHeaderText}
                    titleVariant="headlineMedium"
                    title={datestr}
                    subtitle={data?.location}
                    subtitleStyle={styles.headerSub}
                    right={() => chevron}
                />
                {drawer}
            </Surface>
        </>
    );
}

function styling({ theme }: StyleProps) {
    return StyleSheet.create({
        container: {
            backgroundColor: theme.colors.background,
        },
        listContainer: {
            flex: 1,
        },
        drawerContainer: {
            backgroundColor: theme.colors.inversePrimary,
            width: "100%",
            display: "flex",
            position: "absolute",
        },
        sharedAvatars: {
            flexDirection: "row",
            gap: 8,
        },
        sharedContainer: {
            margin: 8,
            padding: 8,
            backgroundColor: withOpacity(theme.colors.surface, 0.15),
            borderRadius: theme.roundness * 3,
            alignSelf: "flex-start",
        },
        sharedTextContainer: {
            paddingHorizontal: 8,
            //backgroundColor: withOpacity(theme.colors.elevation.level4, 0.5),
            backgroundColor: theme.colors.inversePrimary,
        },
        sharedWithText: {
            alignSelf: "flex-start",
            color: theme.colors.onPrimaryContainer,
            paddingVertical: 4,
            paddingHorizontal: 8,
        },
        sharedEditContainer: {
            flex: 1,
            flexDirection: "row-reverse",
            alignItems: "center",
        },
        listHeader: {
            //margin: 0,
            backgroundColor: theme.colors.primaryContainer,
        },
        chevron: {},
        listHeaderText: {
            color: theme.colors.onPrimaryContainer,
            fontWeight: 500,
        },
        headerSub: {
            color: theme.colors.onPrimaryContainer,
        },
    });
}
