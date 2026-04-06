import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
    Provider as PaperProvider,
    ActivityIndicator,
} from "react-native-paper";

import { Stack } from "expo-router";

import {
    createStaticNavigation,
    StaticParamList,
    useNavigation,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { setReactNativeAsyncStorage } from "@react-native-firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    AppContext,
    useIsSignedIn,
    useIsSignedOut,
    useIsAuthReady,
} from "@/contexts";

import { en, registerTranslation } from "react-native-paper-dates";

registerTranslation("en", en);

setReactNativeAsyncStorage(AsyncStorage);

export default function App() {
    return (
        <GestureHandlerRootView>
            <PaperProvider>
                <AppContext>
                    <RootNavigator />
                </AppContext>
            </PaperProvider>
        </GestureHandlerRootView>
    );
}

function RootNavigator() {
    const isauth = useIsSignedIn();

    return (
        <Stack>
            <Stack.Protected guard={!!isauth}>
                <Stack.Screen name="(app)/index" />
            </Stack.Protected>
            <Stack.Protected guard={!isauth}>
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="forgot" />
            </Stack.Protected>
        </Stack>
    );
}
