import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { Stack } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { setReactNativeAsyncStorage } from "@react-native-firebase/app";
import { en, registerTranslation } from "react-native-paper-dates";

import { AppContext, useIsSignedIn } from "@/contexts";

registerTranslation("en", en);

setReactNativeAsyncStorage(AsyncStorage);

export default function App() {
    return (
        <GestureHandlerRootView>
            <PaperProvider>
                <BottomSheetModalProvider>
                    <AppContext>
                        <RootNavigator />
                    </AppContext>
                </BottomSheetModalProvider>
            </PaperProvider>
        </GestureHandlerRootView>
    );
}

function RootNavigator() {
    const isauth = useIsSignedIn();

    return (
        <Stack>
            <Stack.Protected guard={!!isauth}>
                <Stack.Screen name="(app)/index" options={{ title: "Stacs" }} />
                <Stack.Screen
                    name="(app)/stacs/[stacid]"
                    options={({ route }) => {
                        return route.params as { title: string };
                    }}
                />
            </Stack.Protected>
            <Stack.Protected guard={!isauth}>
                <Stack.Screen name="login" options={{ title: "Login" }} />
                <Stack.Screen name="signup" options={{ title: "Sign up" }} />
                <Stack.Screen
                    name="forgot"
                    options={{ title: "Forgot password" }}
                />
            </Stack.Protected>
        </Stack>
    );
}
