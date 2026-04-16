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
    ToggleButton,
    Surface,
    Divider,
    ActivityIndicator,
} from "react-native-paper";
import { useStyles, StyleProps } from "@/styling";
import { useFocusEffect } from "@react-navigation/native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { useWindowDimensions } from "react-native";

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

export interface ActivityViewProps {
    data: NewActivityOptions;
    onRefresh: (ao: NewActivityOptions) => void;
    selection: boolean[];
    setSelection: (v: boolean[]) => void;
}

export function ActivityView({
    data,
    selection,
    setSelection,
}: ActivityViewProps) {
    const { width, height } = useWindowDimensions();

    const { styles, theme } = useStyles(styling);

    const carsel = (
        <Carousel
            data={data.options}
            loop={false}
            onConfigurePanGesture={(gestureChain) =>
                gestureChain.activeOffsetX([-10, 10])
            }
            renderItem={({ item, index }) => (
                <ActivityCard
                    data={item}
                    onSelect={(v) => setSelection(selection.with(index, v))}
                />
            )}
            snapEnabled={true}
            style={{
                width: "100%",
                height: 180,
            }}
            mode="parallax"
        />
    );

    return (
        <View style={{ marginBottom: 8 }}>
            <Surface style={styles.header}>
                <Card.Title
                    titleStyle={styles.headerText}
                    titleVariant="headlineSmall"
                    title={data.label}
                    subtitle={fmtPeriod(data.timing)}
                    subtitleStyle={{ color: theme.colors.outline }}
                    subtitleVariant="bodyMedium"
                />
            </Surface>
            {data.options.length === 1 ? (
                <ActivityCard
                    data={data.options[0]}
                    style={{ marginVertical: 8 }}
                />
            ) : (
                carsel
            )}
        </View>
    );
}

export interface ActivityCardProps {
    data: Activity;
    onSelect?: (v: boolean) => void;
    style?: object;
}

export function ActivityCard({ data, onSelect, style }: ActivityCardProps) {
    const [value, setValue] = useState("");

    const { styles } = useStyles(styling);

    const [save, setSave] = useState(false);

    const btn = onSelect ? (
        <Button
            mode={save ? "contained" : "outlined"}
            onPress={() => {
                onSelect(!save);
                setSave(!save);
            }}
            style={{ marginTop: 0 }}
        >
            Save{save ? "d" : ""}
        </Button>
    ) : null;

    const actions = onSelect ? (
        <Card.Actions style={{ justifyContent: "center" }}>{btn}</Card.Actions>
    ) : null;

    return (
        <Card style={[styles.card, style]}>
            <View>
                <Card.Title
                    style={styles.cardHeader}
                    title={data.location.display_name}
                    titleStyle={styles.cardTitle}
                    titleVariant="titleMedium"
                    subtitle={data.location.short_address}
                    subtitleStyle={styles.cardSubtitle}
                />
                <Divider />
                <Card.Content style={styles.cardContent}>
                    <Text
                        style={{ paddingBottom: onSelect ? 0 : 8 }}
                        variant="bodyMedium"
                    >
                        {data.description}
                    </Text>
                </Card.Content>
                {actions}
            </View>
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
            //flex: 1,
        },
        header: {
            margin: 0,
            backgroundColor: theme.colors.elevation.level2,
        },
        headerText: {
            color: theme.colors.outline,
            fontWeight: 500,
        },
        cardHeader: {},
        cardTitle: {},
        cardSubtitle: {
            color: theme.colors.outline,
        },
        card: {
            backgroundColor: theme.colors.elevation.level1,
            //maxHeight: "100%",
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
