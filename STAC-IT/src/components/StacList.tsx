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
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { Card, MD3Theme, Text, Avatar } from "react-native-paper";
import { EdgeInsets } from "react-native-safe-area-context";
import { useStyles, StyleProps } from "@/styling";
import { useAuth } from "@/contexts";
import { NewStac, newStacConverter } from "../types";

export function StacLiveList() {
    const { user } = useAuth();

    const [userStacs, setUserStacs] = useState<[string, NewStac][]>([]);
    const [pastUserStacs, setPastUserStacs] = useState<[string, NewStac][]>([]);
    const [sharedStacs, setSharedStacs] = useState<[string, NewStac][]>([]);

    useEffect(() => {
        const db = collection(getFirestore(), "stacks_v2").withConverter(
            newStacConverter,
        );
        const ownq = query(db, where("owner", "==", user.uid));

        const unsub = onSnapshot(ownq, (snap) => {
            const ndata = snap.docs
                .map((doc): [string, NewStac] => [doc.id, doc.data()])
                .sort(([i, a], [j, b]) => {
                    return a.start_time.getTime() - b.end_time.getTime();
                });
            const idx = ndata.findIndex(
                ([id, s]) =>
                    s.itinerary.activities[0].timing.begin.getTime() >
                    Date.now(),
            );
            setUserStacs(ndata.slice(0, idx));
            setPastUserStacs(ndata.slice(idx));
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
        );

        const unsub = onSnapshot(shareq, (snap) => {
            const ndata = snap.docs
                .map((doc): [string, NewStac] => [doc.id, doc.data()])
                .sort(([i, a], [j, b]) => {
                    return a.start_time.getTime() - b.end_time.getTime();
                });
            setSharedStacs(ndata);
        });
        return unsub;
    }, [user]);

    const data = [
        { title: "current", data: userStacs },
        { title: "past", data: pastUserStacs },
        { title: "shared", data: sharedStacs },
    ];

    return (
        <SectionList
            sections={data}
            renderItem={({ item }) => {
                return <StacSummaryCard stac={item[1]} onPress={() => {}} />;
            }}
        />
    );
}

interface SummaryCardProps {
    stac: NewStac;
    onPress: (s: NewStac) => void;
}

const StacSummaryCard: React.FC<SummaryCardProps> = ({ stac, onPress }) => {
    const { styles, theme } = useStyles(styling);

    const { fontScale } = useWindowDimensions();

    const dateobj = new Date(stac.start_time);
    const month = dateobj.toLocaleString("default", {
        month: "short",
    });
    const day = dateobj.getDate();

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

    return (
        <View style={styles.container}>
            <Card style={styles.card} onPress={() => onPress(stac)}>
                <Card.Title
                    titleVariant="titleLarge"
                    title={stac.title}
                    titleStyle={styles.title}
                    subtitleStyle={styles.subtitle}
                    subtitleVariant="bodyMedium"
                    subtitle={stac.location}
                    left={mkavatar}
                />
            </Card>
        </View>
    );
};

const styling = ({ theme }: StyleProps) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 10,
        },
        card: {
            flex: 1,
            backgroundColor: theme.colors.secondaryContainer,
        },
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
