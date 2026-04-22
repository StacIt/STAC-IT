import { getAuth, sendPasswordResetEmail } from "@react-native-firebase/auth";
import React, { useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    View,
    KeyboardAvoidingView,
} from "react-native";
import {
    ActivityIndicator,
    Button,
    Text,
    TextInput,
    useTheme,
    Portal,
    Snackbar,
} from "react-native-paper";
import { router } from "expo-router";
import validate from "validator";

import { useStyles, StyleProps } from "@/styling";

export default function ForgetPassword() {
    const theme = useTheme();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const [snack, setSnack] = useState("");
    const [error, setError] = useState("");

    const { styles } = useStyles(styling);

    async function doPasswordReset() {
        setLoading(true);
        return sendPasswordResetEmail(getAuth(), email)
            .then(() => {
                setEmail("");
                setSnack("Password reset email sent");
            })
            .catch((err: Error) => setError(err.message))
            .finally(() => {
                setLoading(false);
            });
    }

    const sendBtn = (
        <Button
            mode="contained"
            onPress={doPasswordReset}
            loading={loading}
            disabled={!validate.isEmail(email)}
        >
            Send password reset email
        </Button>
    );

    return (
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
            <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            {sendBtn}
            <Portal>
                <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
                    <Snackbar
                        style={styles.snackErr}
                        visible={error.length > 0}
                        onDismiss={() => setError("")}
                        onIconPress={() => setError("")}
                    >
                        <Text style={{ color: theme.colors.onError }}>
                            {error}
                        </Text>
                    </Snackbar>
                    <Snackbar
                        style={styles.snackMsg}
                        action={{
                            label: "Sign in",
                            onPress: () => router.dismissTo("/email"),
                        }}
                        visible={snack.length > 0}
                        onDismiss={() => setSnack("")}
                    >
                        {snack}
                    </Snackbar>
                </KeyboardAvoidingView>
            </Portal>
        </KeyboardAvoidingView>
    );
}

function styling({ theme, insets }: StyleProps) {
    return StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 8 * 3,
            gap: 8 * 2,
        },
        snackMsg: {
            marginHorizontal: 8 * 2,
        },
        snackErr: {
            backgroundColor: theme.colors.error,
        },
    });
}