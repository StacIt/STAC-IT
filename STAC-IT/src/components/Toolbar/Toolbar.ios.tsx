import * as React from "react";
import { useRef, useState } from "react";
import { useRouter, Stack } from "expo-router";
import { getFirestore } from "@react-native-firebase/firestore";
import { signOut, getAuth } from "@react-native-firebase/auth";
import { StyleSheet, View } from "react-native";
import { FAB, Portal } from "react-native-paper";
import { useIsFocused } from "@react-navigation/native";

import { InputSheet } from "@/components/InputSheet";
import { StacLiveList } from "@/components/StacList";

import { useAuth } from "@/contexts";
import { StyleProps, useStyles } from "@/styling";

import { Host, ProgressView } from "@expo/ui/swift-ui";
import { progressViewStyle } from "@expo/ui/swift-ui/modifiers";

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
        const [saving, setSaving] = useState(false);
        const savebtn = (
            <>
                <Stack.Toolbar.Spacer />
                <Stack.Toolbar.Button
                    icon="checkmark"
                    selected={saving}
                    onPress={() => {
                        setSaving(true);
                        onSave().finally(() => setSaving(false));
                    }}
                />
            </>
        );
        const spinner = (
            <Stack.Toolbar.View>
                <Host style={{ flex: 1 }}>
                    <ProgressView modifiers={[progressViewStyle("circular")]} />
                </Host>
            </Stack.Toolbar.View>
        );
        const refreshBtn = canRefresh ? (
            <Stack.Toolbar.Button
                icon="arrow.clockwise"
                selected={refreshing}
                onPress={() => onRefresh()}
            />
        ) : null;
        return (
            <>
                <Stack.Toolbar placement="right">
                    <Stack.Toolbar.Menu icon="ellipsis">
                        <Stack.Toolbar.MenuAction
                            icon="trash"
                            destructive
                            onPress={onDelete}
                        >
                            Delete
                        </Stack.Toolbar.MenuAction>
                    </Stack.Toolbar.Menu>
                </Stack.Toolbar>
                <Stack.Toolbar>
                    <Stack.Toolbar.Button
                        icon="square.and.arrow.up"
                        onPress={() => onShare()}
                    />
                    <Stack.Toolbar.Spacer />
                    {refreshing ? spinner : refreshBtn}
                    {canSave ? savebtn : null}
                </Stack.Toolbar>
            </>
        );
    }

    export function Home({ onPress }: ToolbarHomeProps) {
        return (
            <>
                <Stack.Toolbar placement="right">
                    <Stack.Toolbar.Menu icon="ellipsis">
                        <Stack.Toolbar.MenuAction
                            icon="rectangle.portrait.and.arrow.right"
                            onPress={() => signOut(getAuth())}
                        >
                            Sign Out
                        </Stack.Toolbar.MenuAction>
                    </Stack.Toolbar.Menu>
                </Stack.Toolbar>
                <Stack.Toolbar>
                    <Stack.Toolbar.Spacer />
                    <Stack.Toolbar.Button
                        icon="square.and.pencil"
                        onPress={onPress}
                    />
                </Stack.Toolbar>
            </>
        );
    }
}
