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

//import { FIREBASE_DB, FIREBASE_AUTH } from "../../FirebaseConfig";
//import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useStyles, StyleProps } from "../theme/theming";
import { ActivityOptions, Activity, Place, StrPeriod } from "../types";

function fmtDateStr(ds: string): string {
    const d: Date = new Date(ds);
    return d.toLocaleTimeString([], { timeStyle: "short" });
}

function fmtStrPeriod(p: StrPeriod): string {
    return `${fmtDateStr(p.begin)} - ${fmtDateStr(p.end)}`;
}

export interface StacOptionsProps {
    activities: ActivityOptions[];
}

const StacOptions: React.FC<StacOptionsProps> = ({ activities }) => {
    const acts = activities.map((act) => (
        <StacActivityOption key={act.label} actopt={act} />
    ));
    return <List.AccordionGroup>{acts}</List.AccordionGroup>;
};

export interface StacActivityOptionProps {
    actopt: ActivityOptions;
}

const StacActivityOption: React.FC<StacActivityOptionProps> = ({ actopt }) => {
    const [selection, setSelection] = useState("");
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
                {fmtStrPeriod(actopt.timing)}
            </Text>
        </View>
    );
    const opts = actopt.options.map((act: Activity, index) => {
        return (
            <View>
                <StacActivity
                    key={act.name}
                    activity={act}
                    onPress={setSelection}
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
                onValueChange={(newv) => setSelection(newv)}
                value={selection}
            >
                {opts}
            </RadioButton.Group>
        </List.Accordion>
    );
};

export interface StacActivityProps {
    activity: Activity;
    onPress: (s: string) => void;
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
