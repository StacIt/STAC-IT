import type React from "react";
import {
    useState,
} from "react";
import {
    View,
    StyleSheet,
    ScrollView,
} from "react-native";
import {
    Card,
    Text,
    useTheme,
    MD3Theme,
} from "react-native-paper";
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context'
import { Stac } from "../types";
import { useStyles, StyleFn } from "../theme/theming";

interface SummaryCardProps {
    stac: Stac,
    onPress: (s: Stac) => void,
}

const StacSummaryCard: React.FC<SummaryCardProps> = ({ stac, onPress }) => {
    const [styles] = useStyles(styling);

    return (
        <View key={stac.id} style={styles.container}>
        <Card
            style={styles.card}
            onPress={() => onPress(stac)}
        >
            <Card.Title
                titleVariant="titleLarge"
                title={stac.stacName}
                titleStyle={styles.title}
                subtitleStyle={styles.subtitle}
                subtitleVariant="labelMedium"
                subtitle={new Date(stac.date).toLocaleDateString()}
            />
        </Card>
        </View>
    )
}

interface StacListProps {
    stacs: Stac[],
    title: string,
    onItemPress: (s: Stac) => void,
}

const StacList: React.FC<StacListProps> = ({ stacs, title, onItemPress }) => {
    const [styles] = useStyles(styling)
    return (
        <View style={styles.section}>
            <Text style={styles.listTitle}>{title}</Text>
            {stacs.length === 0 ?
                // TODO: styling
                (<Text style={styles.noStacsText}>
                    No {title.toLowerCase()} available
                </Text>) :
                (stacs.map((stac) => (
                    <StacSummaryCard stac={stac} onPress={onItemPress}/>
                )))
            }
        </View>
    )
}

export { StacSummaryCard, StacList }

const styling = (theme: MD3Theme, insets: EdgeInsets) => {
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
            marginBottom: 10,
        },
        noStacsText: {
            textAlign: "center",
            color: theme.colors.outline,
            marginTop: 10,
            fontStyle: "italic",
        },
    })
};
