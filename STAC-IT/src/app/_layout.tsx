import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as React from "react";
import { StatusBar, View } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider, useTheme } from "react-native-paper";
import { BlurView } from "expo-blur";

import { Stack } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { setReactNativeAsyncStorage } from "@react-native-firebase/app";
import { en, registerTranslation } from "react-native-paper-dates";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.background },
                headerTitleStyle: {
                    color: theme.colors.onBackground,
                },
                contentStyle: { backgroundColor: theme.colors.background },
                animation: "default",
                headerBackButtonDisplayMode: "generic",
            }}
        >
            <Stack.Protected guard={!!isauth}>
                <Stack.Screen name="(app)/index" options={{ title: "Stacs" }} />
                <Stack.Screen
                    name="(app)/stacs/[stacid]"
                    options={({ route }) => {
                        const font = theme.fonts.headlineSmall;
                        const { title } = route.params as { title: string };
                        return {
                            contentStyle: {
                                backgroundColor: theme.colors.background,
                            },
                            headerTitle: title,
                            headerTitleStyle: {
                                ...font,
                                fontWeight: 500,
                                color: theme.colors.onPrimaryContainer,
                            },
                            headerStyle: {
                                backgroundColor: "transparent",
                            },
                            headerTransparent: true,
                        };
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
