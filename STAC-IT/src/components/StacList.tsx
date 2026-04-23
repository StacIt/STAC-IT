import * as React from "react";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts";
import { StyleProps, useStyles } from "@/styling";
import {
    collection,
    getFirestore,
    onSnapshot,
    query,
    where,
} from "@react-native-firebase/firestore";
import {
    SectionList,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";
import {
    ActivityIndicator,
    Avatar,
    Card,
    Divider,
    Surface,
    Text,
} from "react-native-paper";
import { StacRecord, newStacConverter } from "../types";
import { SymbolView } from "expo-symbols";

export interface StacLiveListProps {
    onPress: (id: string, title: string) => void;
}

export function StacLiveList({ onPress }: StacLiveListProps) {
    const { user } = useAuth();

    const { styles } = useStyles(styling);

    const [userStacs, setUserStacs] = useState<[string, StacRecord][]>([]);
    const [pastUserStacs, setPastUserStacs] = useState<[string, StacRecord][]>(
        [],
    );
    const [sharedStacs, setSharedStacs] = useState<[string, StacRecord][]>([]);
    const [pendingStacs, setPendingStacs] = useState<[string, StacRecord][]>(
        [],
    );

    useEffect(() => {
        const db = collection(getFirestore(), "stacks_v2").withConverter(
            newStacConverter,
        );
        const ownq = query(
            db,
            where("owner", "==", user.uid),
            where("status", "in", ["ready", "refreshing"]),
        );

        const unsub = onSnapshot(ownq, (snap) => {
            const ndata = snap.docs
                .map((doc): [string, StacRecord] => [doc.id, doc.data()])
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
            const ndata = snap.docs.map((doc): [string, StacRecord] => [
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
            where("status", "in", ["ready", "refreshing"]),
        );

        const unsub = onSnapshot(shareq, (snap) => {
            console.log(snap.docs);
            const ndata = snap.docs
                .map((doc): [string, StacRecord] => [doc.id, doc.data()])
                .sort(([i, a], [j, b]) => {
                    return a.period.begin.getTime() - b.period.end.getTime();
                });
            setSharedStacs(ndata);
        });
        return unsub;
    }, [user]);

    let data = [
        { title: "Pending", data: pendingStacs },
        { title: "Current", data: userStacs },
        { title: "Past", data: pastUserStacs },
        { title: "Shared with me", data: sharedStacs },
    ];

    data = data.filter((row) => row.data.length > 0);

    function renderHeader(title: string, data: [string, StacRecord][]) {
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

    function renderEmpty() {
        return (
            <Surface style={styles.header}>
                <Card.Title
                    titleStyle={styles.headerText}
                    titleVariant="headlineMedium"
                    title="No stacs yet"
                />
            </Surface>
        );
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
            ListEmptyComponent={renderEmpty}
        />
    );
}

interface SummaryCardProps {
    stac: StacRecord;
    onPress: () => void;
}

export function StacSummaryCard({ stac, onPress }: SummaryCardProps) {
    const { styles, theme } = useStyles(styling);

    const { fontScale } = useWindowDimensions();

    const month = stac.period.begin.toLocaleString("default", {
        month: "short",
    });
    const day = stac.period.begin.getDate();
    const symname = `${day}.calendar`;

    function mksymbol({ size }: { size: number }) {
        return (
            <SymbolView
                name={symname as any}
                size={size}
                style={{ bottom: -4 }}
            />
        );
    }

    const ico = ({ size }: { size: number }) => {
        return (
            <View
                style={{
                    padding: 0,
                    margin: 0,
                    gap: 0,
                    flex: 1,
                    rowGap: 0,
                    justifyContent: "center",
                    flexDirection: "column",
                }}
            >
                <Text
                    variant="labelSmall"
                    style={{
                        top: 2,
                        padding: 0,
                        textAlign: "center",
                        color: theme.colors.onPrimaryContainer,
                        fontSize: size / 2.75,
                    }}
                >
                    {month}
                </Text>
                <SymbolView
                    name={symname as any}
                    size={size}
                    style={{ bottom: -2 }}
                    type="hierarchical"
                    tintColor={theme.colors.tertiary}
                />
            </View>
        );
    };

    const spinner = (props: { size: number }) => (
        <ActivityIndicator
            size={props.size * 1.5}
            animating={
                stac.status === "pending" || stac.status === "refreshing"
            }
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
                    left={ico}
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
