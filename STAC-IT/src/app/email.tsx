import { View, StyleSheet, KeyboardAvoidingView } from "react-native";

import * as React from "react";
import { useState } from "react";
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    getAuth,
    FirebaseAuthTypes,
    validatePassword,
} from "@react-native-firebase/auth";
import { FirebaseError } from "@firebase/util";
import {
    doc,
    collection,
    getDoc,
    getFirestore,
} from "@react-native-firebase/firestore";
import { SymbolView } from "expo-symbols";
import { router } from "expo-router";
import { TextInput, Button, Divider, HelperText } from "react-native-paper";
import validate from "validator";

import { StyleProps, useStyles } from "@/styling";

export default function EmailSignIn() {
    const { styles } = useStyles(styling);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    async function doSignIn() {
        setLoading(true);
        signInWithEmailAndPassword(getAuth(), email, password)
            .catch((err: FirebaseError) => {
                setError(err.message);
                console.log("Firebase Login Error:", error);
            })
            .then(() => router.replace("/"))
            .finally(() => setLoading(false));
    }

    const signInBtn = (
        <Button
            mode="contained"
            disabled={!validate.isEmail(email)}
            onPress={doSignIn}
            loading={loading}
        >
            Sign in
        </Button>
    );
    const signUpBtn = (
        <Button mode="outlined" onPress={() => router.navigate("/signup")}>
            Sign up
        </Button>
    );
    const resetPasswordBtn = (
        <Button mode="text" onPress={() => router.navigate("/pwreset")}>
            Reset password
        </Button>
    );
    const helptext =
        error.length > 0 ? <HelperText type="error">{error}</HelperText> : null;

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior="padding"
                style={styles.primeContainer}
            >
                <TextInput
                    mode={"outlined"}
                    label={"Email"}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize={"none"}
                    autoComplete={"email"}
                    //error={error != ""}
                    inputMode={"email"}
                    autoCorrect={false}
                />
                <TextInput
                    value={password}
                    mode={"outlined"}
                    onChangeText={setPassword}
                    label={"Password"}
                    autoCapitalize={"none"}
                    secureTextEntry={!showPassword}
                    autoComplete={"current-password"}
                    right=<TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                    />
                />
                {helptext}
                {signInBtn}
                {signUpBtn}
                {resetPasswordBtn}
            </KeyboardAvoidingView>
        </View>
    );
}

function styling({ theme }: StyleProps) {
    return StyleSheet.create({
        container: {
            flex: 1,
            marginHorizontal: 8 * 2,
        },
        primeContainer: {
            flex: 1,
            justifyContent: "center",
            gap: 8,
        },
    });
}