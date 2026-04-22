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

import { ToolbarProps, ToolbarHomeProps } from "@/components/Toolbar";

export module Toolbar {
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
                    <Stack.Toolbar.Button icon="square.and.pencil" />
                </Stack.Toolbar>
            </>
        );
    }
}
