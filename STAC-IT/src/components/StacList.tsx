import * as React from "react";
import { useCallback, useRef, useState, useEffect } from "react";

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    getFirestore,
    orderBy,
    onSnapshot,
} from "@react-native-firebase/firestore";
import { getAuth } from "@react-native-firebase/auth";
import {
    Alert,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    SectionList,
    View,
    useWindowDimensions,
} from "react-native";
import {
    Card,
    Text,
    Snackbar,
    Avatar,
    Surface,
    Divider,
    ActivityIndicator,
} from "react-native-paper";
import { useStyles, StyleProps } from "@/styling";
import { useAuth } from "@/contexts";
import { NewStac, newStacConverter } from "../types";

export interface StacLiveListProps {
    onPress: (id: string, title: string) => void;
}

export function StacLiveList({ onPress }: StacLiveListProps) {
    const { user } = useAuth();

    const { styles } = useStyles(styling);

    const [userStacs, setUserStacs] = useState<[string, NewStac][]>([]);
    const [pastUserStacs, setPastUserStacs] = useState<[string, NewStac][]>([]);
    const [sharedStacs, setSharedStacs] = useState<[string, NewStac][]>([]);
    const [pendingStacs, setPendingStacs] = useState<[string, NewStac][]>([]);

    useEffect(() => {
        const db = collection(getFirestore(), "stacks_v2").withConverter(
            newStacConverter,
        );
        const ownq = query(
            db,
            where("owner", "==", user.uid),
            where("status", "==", "ready"),
        );

        const unsub = onSnapshot(ownq, (snap) => {
            const ndata = snap.docs
                .map((doc): [string, NewStac] => [doc.id, doc.data()])
                .sort(([i, a], [j, b]) => {
                    return a.period.begin.getTime() - b.period.end.getTime();
                });
            setUserStacs(
                ndata.filter(
                    ([id, stac]) => stac.period.end.getTime() >= Date.now(),
                ),
            );
            setPastUserStacs(
                ndata.filter(
                    ([id, stac]) => stac.period.end.getTime() < Date.now(),
                ),
            );
        });
        return unsub;
    }, [user]);

    useEffect(() => {
        const db = collection(getFirestore(), "stacks_v2").withConverter(
            newStacConverter,
        );
        const ownq = query(
            db,
            where("owner", "==", user.uid),
            where("status", "==", "pending"),
        );

        const unsub = onSnapshot(ownq, (snap) => {
            const ndata = snap.docs.map((doc): [string, NewStac] => [
                doc.id,
                doc.data(),
            ]);
            setPendingStacs(ndata);
        });
        return unsub;
    }, [user]);

    useEffect(() => {
        const db = collection(getFirestore(), "stacks_v2").withConverter(
            newStacConverter,
        );
        const shareq = query(
            db,
            where("shared_with", "array-contains", user.uid),
            where("status", "==", "ready"),
        );

        const unsub = onSnapshot(shareq, (snap) => {
            const ndata = snap.docs
                .map((doc): [string, NewStac] => [doc.id, doc.data()])
                .sort(([i, a], [j, b]) => {
                    return a.period.begin.getTime() - b.period.end.getTime();
                });
            setSharedStacs(ndata);
        });
        return unsub;
    }, [user]);

    const data = [
        { title: "Pending", data: pendingStacs },
        { title: "Current", data: userStacs },
        { title: "Past", data: pastUserStacs },
        { title: "Shared with me", data: sharedStacs },
    ];

    function renderHeader(title: string, data: [string, NewStac][]) {
        if (data.length > 0) {
            return (
                <Surface style={styles.header}>
                    <Card.Title
                        titleStyle={styles.headerText}
                        titleVariant="headlineMedium"
                        title={title}
                    />
                </Surface>
            );
        } else {
            return null;
        }
    }

    return (
        <SectionList
            sections={data}
            renderItem={({ item: [id, data] }) => {
                return (
                    <StacSummaryCard
                        stac={data}
                        onPress={() =>
                            data.status === "pending"
                                ? null
                                : onPress(id, data.title)
                        }
                    />
                );
            }}
            renderSectionHeader={({ section: { title, data } }) =>
                renderHeader(title, data)
            }
            SectionSeparatorComponent={Divider}
        />
    );
}

interface SummaryCardProps {
    stac: NewStac;
    onPress: () => void;
}

export function StacSummaryCard({ stac, onPress }: SummaryCardProps) {
    const { styles, theme } = useStyles(styling);

    const { fontScale } = useWindowDimensions();

    const month = stac.period.begin.toLocaleString("default", {
        month: "short",
    });
    const day = stac.period.begin.getDate();

    const ico = ({ size }: { size: number }) => {
        return (
            <View
                style={{
                    padding: 0,
                    margin: 0,
                    gap: 0,
                    rowGap: 0,
                }}
            >
                <Text
                    variant="labelSmall"
                    style={{
                        marginTop: 3,
                        padding: 0,
                        textAlign: "center",
                        color: theme.colors.onPrimary,
                        fontSize: size / 2 + 4,
                        borderWidth: 0,
                    }}
                >
                    {month}
                </Text>
                <Text
                    variant="labelSmall"
                    style={{
                        marginTop: -4,
                        borderWidth: 0,
                        padding: 0,
                        textAlign: "center",
                        color: theme.colors.onPrimary,
                        fontSize: size / 2 + 1,
                    }}
                >
                    {day}
                </Text>
            </View>
        );
    };

    const mkavatar = (props: object) => <Avatar.Icon {...props} icon={ico} />;

    const spinner = (props: { size: number }) => (
        <ActivityIndicator
            size={props.size * 1.5}
            animating={stac.status === "pending"}
        />
    );

    return (
        <View style={styles.container}>
            <Card style={styles.card} onPress={onPress}>
                <Card.Title
                    titleVariant="titleLarge"
                    title={stac.title}
                    titleStyle={styles.title}
                    subtitleStyle={styles.subtitle}
                    subtitleVariant="bodyMedium"
                    subtitle={stac.location}
                    left={mkavatar}
                    right={spinner}
                    rightStyle={styles.spinnerContainer}
                    style={styles.titleContainer}
                />
            </Card>
        </View>
    );
}

const styling = ({ theme }: StyleProps) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-between",
        },
        titleContainer: {
            paddingHorizontal: 16,
        },
        header: {
            flex: 1,
            margin: 0,
            backgroundColor: theme.colors.surface,
        },
        headerText: {
            color: theme.colors.outline,
            fontWeight: 500,
        },
        card: {
            flex: 1,
            backgroundColor: theme.colors.primaryContainer,
            margin: 8,
        },
        spinnerContainer: {},
        title: {
            color: theme.colors.onSecondaryContainer,
            fontWeight: 400,
        },
        subtitle: {
            color: theme.colors.onSecondaryContainer,
        },
        section: {
            marginVertical: 10,
        },
        listTitle: {
            // TODO
            color: theme.colors.outline,
            fontWeight: 500,
            marginBottom: 10,
        },
        noStacsText: {
            textAlign: "center",
            color: theme.colors.outline,
            marginTop: 10,
            fontStyle: "italic",
        },
    });
};
