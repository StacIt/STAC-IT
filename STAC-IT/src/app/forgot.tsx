import { getAuth, sendPasswordResetEmail } from "@react-native-firebase/auth";
import { NavigationProp } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, SafeAreaView, StyleSheet } from "react-native";
import {
    ActivityIndicator,
    Button,
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";
import { router } from "expo-router";

export default function ForgetPassword() {
    const theme = useTheme();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0); // Time left for resending the email

    const auth = getAuth();

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [timeLeft]);

    const handlePasswordReset = async () => {
        setLoading(true);
        setResetSent(false); // Reset the resetSent state when initiating the password reset
        setTimeLeft(60); // Set the timer for 60 seconds after sending the email

        try {
            const formattedEmail = email.trim().toLowerCase();
            await sendPasswordResetEmail(auth, formattedEmail);

            setResetSent(true);
            Alert.alert("Password Reset", "Check your email for a reset link!");
        } catch (error: any) {
            if (error.code === "auth/invalid-email") {
                Alert.alert(
                    "Invalid Email",
                    "Please enter a valid email address.",
                );
            } else if (error.code === "auth/user-disabled") {
                Alert.alert(
                    "Account Disabled",
                    "This account has been disabled.",
                );
            } else if (error.code === "auth/user-not-found") {
                Alert.alert(
                    "No Account Found",
                    "No account associated with this email.",
                );
            } else {
                Alert.alert("Error", "Something went wrong. Try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <Text
                variant="headlineMedium"
                style={[styles.title, { color: theme.colors.onBackground }]}
            >
                Forgot Password
            </Text>

            <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
            />

            {loading ? (
                <ActivityIndicator
                    animating
                    color={theme.colors.primary}
                    style={styles.loader}
                />
            ) : (
                <Button
                    mode="contained"
                    onPress={handlePasswordReset}
                    style={styles.button}
                    contentStyle={{ paddingVertical: 6 }}
                >
                    Send Reset Link
                </Button>
            )}

            {resetSent && timeLeft > 0 && (
                <Text
                    style={[
                        styles.timer,
                        { color: theme.colors.onSurfaceVariant },
                    ]}
                >
                    Resend link in {timeLeft}s
                </Text>
            )}

            {resetSent && timeLeft === 0 && (
                <Button
                    mode="text"
                    onPress={handlePasswordReset}
                    style={styles.link}
                >
                    Didn't receive the link? Resend here.
                </Button>
            )}

            <Button
                mode="text"
                onPress={() => router.navigate("/login")}
                style={styles.link}
            >
                Back to Login
            </Button>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    title: {
        textAlign: "center",
        marginBottom: 24,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
    },
    loader: {
        marginTop: 16,
    },
    link: {
        marginTop: 16,
    },
    timer: {
        marginTop: 12,
        textAlign: "center",
    },
});