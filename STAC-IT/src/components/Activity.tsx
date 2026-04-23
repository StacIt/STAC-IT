import { StyleProps, useStyles } from "@/styling";
import { getFirestore, runTransaction } from "@react-native-firebase/firestore";
import * as React from "react";
import { useEffect, useEffectEvent, useState } from "react";
import {
    Animated,
    FlatList,
    StyleSheet,
    View,
    useAnimatedValue,
    useWindowDimensions,
} from "react-native";
import { getFunctions, httpsCallable } from "@react-native-firebase/functions";
import {
    Card,
    IconButton,
    Surface,
    Text,
    ActivityIndicator,
} from "react-native-paper";
import { SymbolView } from "expo-symbols";

import { useStac } from "@/contexts";
import { Activity, ActivityOptions, fmtPeriod, RefreshRequest } from "@/types";

export interface ActivityViewProps {
    data: ActivityOptions;
    index: number;
    onRefresh: (ao: ActivityOptions) => void;
    selection: boolean[];
    setSelection: (v: boolean[]) => void;
}

export function ActivityView({
    data,
    selection,
    index,
    setSelection,
}: ActivityViewProps) {
    const { width, height } = useWindowDimensions();

    const { styles, theme } = useStyles(styling);

    const { data: stac, ref: stacRef } = useStac();

    const plural = data.options.length > 1;

    const isRefreshing =
        stac?.itinerary?.activities[index].tag === "refreshing";

    async function doSelect(actidx: number, value: boolean) {
        try {
            return runTransaction(getFirestore(), async (tx) => {
                const thisDoc = await tx.get(stacRef);

                if (!thisDoc.exists()) return;

                const acts = thisDoc.data().itinerary?.activities;
                if (!acts || acts.length === 0) return;

                acts[index].options[actidx].tag = value ? "marked" : "";

                tx.update(stacRef, { itinerary: { activities: acts } });
            });
        } catch (e) {
            console.error("transaction failed: ", e);
        }
    }

    async function doDelete(actidx: number) {
        try {
            return runTransaction(getFirestore(), async (tx) => {
                const thisDoc = await tx.get(stacRef);

                if (!thisDoc.exists()) return;

                const acts = thisDoc.data().itinerary?.activities;
                if (!acts || acts.length === 0) return;

                acts[index].options[actidx].tag = "exclude";

                tx.update(stacRef, { itinerary: { activities: acts } });
            });
        } catch (e) {
            console.error("transaction failed: ", e);
        }
    }

    async function markExcluded(optidx: number) {
        try {
            return runTransaction(getFirestore(), async (tx) => {
                const thisDoc = await tx.get(stacRef);

                if (!thisDoc.exists()) return;

                const acts = thisDoc.data().itinerary?.activities;
                if (!acts || acts.length === 0) return;

                for (const act of acts[optidx].options) {
                    if (act.tag !== "marked") {
                        act.tag = "exclude";
                    }
                }
                acts[optidx].tag = "refreshing";

                tx.update(stacRef, { itinerary: { activities: acts } });
            });
        } catch (e) {
            console.error("transaction failed: ", e);
        }
    }

    async function doRefresh(index: number) {
        const refresh_stac = httpsCallable(getFunctions(), "refresh_stac");
        const request: RefreshRequest = { doc_id: stacRef.id, index };

        await markExcluded(index);

        await refresh_stac(JSON.stringify(request)).catch(console.error);
    }

    const filtered_data = data.options.flatMap((value, index) => {
        if (value.tag === "exclude") {
            return [];
        } else {
            return { value, index };
        }
    });

    const slides = (
        <FlatList
            data={filtered_data}
            horizontal={true}
            renderItem={({ item: { value, index } }) => {
                return (
                    <View style={{ width, justifyContent: "center" }}>
                        <ActivityCard
                            data={value}
                            canSelect={plural}
                            onSelect={(v) => doSelect(index, v)}
                            canDelete={plural}
                            onDelete={() => doDelete(index)}
                            style={{ margin: 8 }}
                        />
                    </View>
                );
            }}
            decelerationRate="fast"
            disableIntervalMomentum={true}
            pagingEnabled={true}
        />
    );

    const refreshControl = (
        <IconButton
            icon="refresh"
            onPress={() => {
                doRefresh(index);
            }}
            loading={isRefreshing}
        />
    );

    return (
        <View>
            <Surface style={styles.header}>
                <Card.Title
                    titleStyle={styles.headerText}
                    titleVariant="headlineSmall"
                    title={data.label}
                    subtitle={fmtPeriod(data.timing)}
                    subtitleStyle={{ color: theme.colors.outline }}
                    subtitleVariant="bodyMedium"
                    right={() => refreshControl}
                />
            </Surface>
            {slides}
        </View>
    );
}

export interface ActivityCardProps {
    data: Activity;
    onSelect: (v: boolean) => Promise<any>;
    onDelete: () => Promise<any>;
    canDelete: boolean;
    canSelect: boolean;
    style?: object;
}

export function ActivityCard({
    data,
    onSelect,
    onDelete,
    canSelect,
    canDelete,
    style,
}: ActivityCardProps) {
    const [value, setValue] = useState("");

    const {
        styles,
        theme: { colors },
    } = useStyles(styling);

    const delWidth = useAnimatedValue(40);

    const hideDelete = useEffectEvent(() => {
        Animated.timing(delWidth, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start(({ finished }) => {});
    });

    const showDelete = useEffectEvent(() => {
        Animated.timing(delWidth, {
            toValue: 40,
            duration: 300,
            useNativeDriver: false,
        }).start(({ finished }) => {});
    });

    const stac = useStac();

    const [save, setSave] = useState(false);

    const commonprops = {
        style: styles.cardButton,
    } as const;

    const [delState, setDelState] = useState(false);

    const [delLoading, setDelLoading] = useState(false);

    const markState = data.tag === "marked";
    const delDisabled = !canDelete || markState;

    useEffect(() => {
        if (delDisabled) {
            hideDelete();
        } else {
            showDelete();
        }
    }, [delDisabled]);

    const buttons = (
        <View style={styles.cardButtonContainer}>
            {canDelete ? (
                <IconButton
                    icon={delState ? "delete" : "close"}
                    iconColor={delState ? colors.tertiary : undefined}
                    selected={delState}
                    disabled={delDisabled}
                    loading={delLoading}
                    style={{ margin: 4, width: delWidth }}
                    containerColor={
                        delState ? colors.tertiaryContainer : undefined
                    }
                    animated={true}
                    onPress={() => {
                        if (delState) {
                            setDelLoading(true);
                            onDelete().then(() => setDelLoading(false));
                        } else {
                            setDelState(!delState);
                        }
                    }}
                />
            ) : null}
            {canSelect ? (
                <IconButton
                    icon={markState ? "bookmark" : "bookmark-outline"}
                    iconColor={markState ? colors.primary : undefined}
                    {...commonprops}
                    animated={false}
                    onPress={() => {
                        setDelState(false);
                        onSelect(!markState);
                    }}
                />
            ) : null}
        </View>
    );

    useEffect(() => {
        if (!delState) return;

        const undo = setTimeout(() => setDelState(false), 2000);
        return () => clearTimeout(undo);
    }, [delState]);

    if (data.tag === "exclude") {
        return null;
    }
    return (
        <Card style={[styles.card, style]}>
            <View style={styles.cardTitleContainer}>
                <Card.Title
                    style={styles.cardHeader}
                    title={data.location.display_name}
                    titleStyle={styles.cardTitle}
                    titleVariant="titleMedium"
                    subtitle={data.location.short_address}
                    subtitleStyle={styles.cardSubtitle}
                />
                {buttons}
            </View>

            <Card.Content style={styles.cardContent}>
                <Text style={styles.cardBodyText} variant="bodyMedium">
                    {data.description}
                </Text>
            </Card.Content>
        </Card>
    );
}

function styling({ theme }: StyleProps) {
    const colors = theme.colors;
    return StyleSheet.create({
        container: {
            flex: 1,
        },
        contentContainer: {
            flex: 1,
            gap: 8,
        },
        card: {
            backgroundColor: colors.elevation.level1,
            //maxHeight: "100%",
        },
        cardTitleContainer: {
            flex: 1,
            flexDirection: "row",
        },
        cardTitleTextBox: {
            flex: 1,
        },
        cardButton: { margin: 4 },
        cardButtonContainer: {
            flex: 1,
            flexDirection: "row-reverse",
            alignItems: "flex-start",
            alignSelf: "flex-start",
            justifyContent: "flex-start",
        },
        cardContent: {
            backgroundColor: colors.elevation.level3,
            borderRadius: theme.roundness * 3,
            margin: 8,
            padding: 8,
            marginTop: 0,
        },
        cardBodyText: {},
        header: {
            margin: 0,
            backgroundColor: colors.secondaryContainer,
        },
        headerText: {
            color: colors.onSecondaryContainer,
            fontWeight: 500,
        },
        cardHeader: { flex: 3 },
        cardTitle: {},
        cardSubtitle: {
            color: colors.outline,
        },
        listHeader: {
            flex: 1,
            margin: 0,
            backgroundColor: colors.primaryContainer,
        },
        listHeaderText: {
            color: colors.outline,
            fontWeight: 500,
        },
        sheetHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 10,
            backgroundColor: colors.surface,
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
