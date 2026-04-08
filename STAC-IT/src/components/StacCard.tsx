import type React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Card, MD3Theme, Text, Avatar, useTheme } from "react-native-paper";
import { EdgeInsets } from "react-native-safe-area-context";
import { useStyles, StyleProps } from "@/styling";
import { Stac } from "../types";

interface SummaryCardProps {
    stac: Stac;
    onPress: (s: Stac) => void;
}

const StacSummaryCard: React.FC<SummaryCardProps> = ({ stac, onPress }) => {
    const { styles, theme } = useStyles(styling);

    const { fontScale } = useWindowDimensions();

    const dateobj = new Date(stac.date);
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
                    title={stac.stacName}
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

interface StacListProps {
    stacs: Stac[];
    title: string;
    onItemPress: (s: Stac) => void;
}

const StacList: React.FC<StacListProps> = ({ stacs, title, onItemPress }) => {
    const { styles } = useStyles(styling);

    const slist =
        stacs.length === 0 ? (
            <Text variant="bodySmall" style={styles.noStacsText}>
                No {title.toLowerCase()}s available
            </Text>
        ) : (
            stacs.map((stac) => (
                <StacSummaryCard
                    key={stac.id}
                    stac={stac}
                    onPress={onItemPress}
                />
            ))
        );

    return (
        <View style={styles.section}>
            <Text variant="headlineMedium" style={styles.listTitle}>
                {title}
            </Text>
            {slist}
        </View>
    );
};

export { StacList, StacSummaryCard };

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
