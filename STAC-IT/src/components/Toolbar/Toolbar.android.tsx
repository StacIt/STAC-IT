import * as React from "react";
import { useRef, useState } from "react";
import { useRouter, Stack } from "expo-router";
import { getFirestore } from "@react-native-firebase/firestore";
import { signOut, getAuth } from "@react-native-firebase/auth";
import { StyleSheet, View } from "react-native";
import { FAB, Portal, ActivityIndicator } from "react-native-paper";
import { useIsFocused } from "@react-navigation/native";

import { InputSheet } from "@/components/InputSheet";
import { StacLiveList } from "@/components/StacList";

import { useAuth } from "@/contexts";
import { StyleProps, useStyles } from "@/styling";

import {
    ToolbarProps,
    ToolbarHomeProps,
    ToolbarStacViewProps,
} from "@/components/Toolbar";

export namespace Toolbar {
    export function StacView({
        onShare,
        onDelete,
        onRefresh,
        canRefresh,
        refreshing,
        canSave,
        onSave,
    }: ToolbarStacViewProps) {
        const { styles, theme } = useStyles(styling);
        const [saving, setSaving] = useState(false);
        const [fab, setFab] = useState(false);
        const savebtn = canSave
            ? {
                  icon: "save",
                  label: "Save",
                  onPress: () => {
                      setSaving(true);
                      onSave().finally(() => setSaving(false));
                  },
              }
            : null;
        const refreshBtn = canRefresh
            ? {
                  icon: "refresh",
                  label: "Refresh",
                  onPress: () => {
                      onRefresh();
                  },
              }
            : null;

        const actions = [
            {
                icon: "delete",
                label: "Delete",
                onPress: () => onDelete(),
                style: {
                    backgroundColor: theme.colors.tertiaryContainer,
                },
            },
            { icon: "share", label: "Share", onPress: onShare },
        ];

        const loadingFab = (
            <FAB
                style={styles.loadingfab}
                icon="plus"
                loading={true}
                visible={refreshing}
            />
        );
        const groupFab = (
            <FAB.Group
                style={styles.fab}
                icon={fab ? "close" : "plus"}
                open={fab}
                visible={!refreshing}
                onStateChange={({ open }) => setFab(open)}
                actions={actions}
            />
        );
        return <Portal>{refreshing ? loadingFab : groupFab}</Portal>;
    }

    export function Home({ onPress }: ToolbarHomeProps) {
        const { styles } = useStyles(styling);
        const isFocused = useIsFocused();

        const homefab = (
            <Portal>
                <FAB
                    style={styles.loadingfab}
                    icon="plus"
                    onPress={onPress}
                    visible={isFocused}
                />
            </Portal>
        );

        return homefab;
    }
}
const styling = ({ theme, insets }: StyleProps) => {
    return StyleSheet.create({
        container: {
            backgroundColor: theme.colors.background,
        },
        listContainer: {
            flex: 1,
        },
        listHeader: {
            //margin: 0,
            backgroundColor: theme.colors.primaryContainer,
        },
        listHeaderText: {
            color: theme.colors.onPrimaryContainer,
            fontWeight: 500,
        },
        headerSub: {
            color: theme.colors.onPrimaryContainer,
        },
        loadingfab: {
            position: "absolute",
            right: 8 * 3,
            bottom: 8 * 3 + 4,
        },
        fab: {
            position: "absolute",
            right: 8,
            bottom: -(8 * 3),
        },
        homeFab: {
            position: "absolute",
            margin: 8 * 3,
            right: 0,
            bottom: 0,
        },
    });
};
