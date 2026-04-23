import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as React from "react";
import { StatusBar, View, useColorScheme } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
    Provider as PaperProvider,
    useTheme,
    adaptNavigationTheme,
} from "react-native-paper";
import {
    ThemeProvider,
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";

import { Stack } from "expo-router";

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setReactNativeAsyncStorage } from "@react-native-firebase/app";
import { en, registerTranslation } from "react-native-paper-dates";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppContext, useIsSignedIn } from "@/contexts";

registerTranslation("en", en);

setReactNativeAsyncStorage(AsyncStorage);

GoogleSignin.configure({
    webClientId:
        "1061792458880-6dcmnuea98o206hc7bi87dqem3o4ud1d.apps.googleusercontent.com",
});

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

const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
});

function RootNavigator() {
    const isauth = useIsSignedIn();

    const colorScheme = useColorScheme();

    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : LightTheme}>
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
                    <Stack.Screen
                        name="(app)/index"
                        options={{ title: "Stacs" }}
                    />
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
                    <Stack.Screen
                        name="signin"
                        options={{ title: "Sign in" }}
                    />
                    <Stack.Screen
                        name="signup"
                        options={{ title: "Sign up" }}
                    />
                    <Stack.Screen
                        name="email"
                        options={{ title: "Sign in with email" }}
                    />
                    <Stack.Screen
                        name="pwreset"
                        options={{ title: "Reset password" }}
                    />
                </Stack.Protected>
            </Stack>
        </ThemeProvider>
    );
}
