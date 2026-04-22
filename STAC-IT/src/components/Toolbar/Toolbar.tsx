import * as React from "react";
import { StyleSheet, View } from "react-native";
import { FAB, Portal } from "react-native-paper";
import { useIsFocused } from "@react-navigation/native";
import { StyleProps, useStyles } from "@/styling";

export function Toolbar() {
    const { styles } = useStyles(styling);

    const isFocused = useIsFocused();

    return (
        <>
            <Portal>
                <FAB
                    icon="pencil-outline"
                    style={styles.fab}
                    visible={isFocused && fab}
                    onPress={() => {
                        setFab(false);
                        inputRef.current?.open();
                    }}
                />
            </Portal>
        </>
    );
}
const styling = ({ theme, insets }: StyleProps) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        listContainer: {
            flex: 1,
        },
        fab: {
            position: "absolute",
            margin: 8 * 3,
            right: 0,
            bottom: 0,
        },
        scrollView: {
            flex: 1,
        },
        scrollViewContent: {
            padding: 20,
            paddingBottom: 100,
        },
    });
};
