import type React from "react";
import { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
    Button,
    Card,
    Divider,
    List,
    Text,
    RadioButton,
    Icon,
    useTheme,
} from "react-native-paper";

import {
    getFirestore,
    doc,
    setDoc,
    Timestamp,
} from "@react-native-firebase/firestore";
import { useStyles, StyleProps } from "../theme/theming";
import {
    Period,
    PeriodDb,
    ActivityOptionsDb,
    NewActivityOptions,
    NewItinerary,
    ItineraryDb,
    ActivityOptions,
    Activity,
    Place,
    NewStac,
    StrPeriod,
    fmtPeriod,
    NewStacDb,
    newStacConverter,
    NewItinerary2,
} from "../types";

function fmtDateStr(ds: string): string {
    const d: Date = new Date(ds);
    return d.toLocaleTimeString([], { timeStyle: "short" });
}

function fmtStrPeriod(p: StrPeriod): string {
    return `${fmtDateStr(p.begin)} - ${fmtDateStr(p.end)}`;
}

export interface StacOptionsProps {
    activities: NewActivityOptions[];
    selection: NewActivityOptions[];
    setSelection: (v: NewItinerary2) => void;
}

const StacOptions: React.FC<StacOptionsProps> = ({
    activities,
    selection,
    setSelection,
}) => {
    const acts = activities.map((act, idx) => (
        <StacActivityOption
            key={act.label}
            actopt={act}
            setValue={(v) => setSelection(selection.with(idx, v))}
        />
    ));
    return <List.AccordionGroup>{acts}</List.AccordionGroup>;
};

export interface StacActivityOptionProps {
    actopt: NewActivityOptions;
    setValue: (v: NewActivityOptions) => void;
}

const StacActivityOption: React.FC<StacActivityOptionProps> = ({
    actopt,
    setValue,
}) => {
    const [selection, setSelection] = useState("");
    const updateActivity = (act: string) => {
        setSelection(act);
        setValue({
            ...actopt,
            options: [actopt.options.find((a) => a.name == act)!],
        });
    };

    const theme = useTheme();
    const description = () => (
        <View
            style={{
                flexDirection: "row",
                gap: 4,
                alignItems: "center",
            }}
        >
            <Icon
                source="clock-outline"
                size={theme.fonts.bodyMedium.fontSize}
                color={theme.colors.outline}
            />
            <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                {fmtPeriod(actopt.timing)}
            </Text>
        </View>
    );
    const opts = actopt.options.map((act: Activity) => {
        return (
            <View>
                <StacActivity
                    key={act.name}
                    activity={act}
                    onPress={updateActivity}
                />
            </View>
        );
    });
    return (
        <List.Accordion
            id={actopt.label}
            title={actopt.label}
            titleStyle={[{ ...theme.fonts.titleLarge }, { fontWeight: 600 }]}
            description={description()}
        >
            <RadioButton.Group
                onValueChange={(newv) => updateActivity(newv)}
                value={selection}
            >
                {opts}
            </RadioButton.Group>
        </List.Accordion>
    );
};

export interface StacActivityProps {
    activity: Activity;
    onPress: (a: string) => void;
}

const StacActivity: React.FC<StacActivityProps> = ({ activity, onPress }) => {
    const theme = useTheme();
    const radiob = (props: any) => (
        <View style={{ justifyContent: "flex-start" }}>
            <RadioButton.Android {...props} value={activity.name} />
        </View>
    );

    const description = () => (
        <View
            style={{
                flexDirection: "row",
                gap: 4,
                alignItems: "center",
            }}
        >
            <Icon
                source="map-marker"
                size={theme.fonts.bodyMedium.fontSize}
                color={theme.colors.outline}
            />
            <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                {activity.location.short_address}
            </Text>
        </View>
    );

    const content = () => (
        <View style={{ marginLeft: 18, marginBottom: 10 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                {activity.description}
            </Text>
        </View>
    );

    return (
        <View>
            <List.Item
                title={activity.location.display_name}
                titleStyle={{ marginBottom: 2, fontWeight: 500 }}
                description={description}
                style={{ paddingVertical: -10 }}
                left={radiob}
                onPress={() => onPress(activity.name)}
            />
            {content()}
        </View>
    );
};

export { StacOptions, StacActivity, StacActivityOption };
