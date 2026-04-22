import * as React from "react";
import { useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    getAuth,
    validatePassword,
    sendEmailVerification,
} from "@react-native-firebase/auth";
import {
    setDoc,
    doc,
    collection,
    getDoc,
    getFirestore,
} from "@react-native-firebase/firestore";
import { FirebaseError } from "@firebase/util";
import { registerUserDb } from "@/util";
import {
    Alert,
    KeyboardAvoidingView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import {
    HelperText,
    TextInput,
    ActivityIndicator,
    Text,
    Button,
    Icon,
    useTheme,
} from "react-native-paper";

import validate from "validator";
import { router } from "expo-router";
import { StyleProps, useStyles } from "@/styling";

export default function CreateAccount() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const auth = getAuth();

    const { styles } = useStyles(styling);

    async function doSignUp() {
        setLoading(true);
        validatePassword(auth, password)
            .then((status) => {
                if (!status.isValid) {
                    throw new Error(
                        "password must be at least 8 characters and contain a number",
                    );
                }
            })
            .then(() => createUserWithEmailAndPassword(auth, email, password))
            .then(({ user }) =>
                registerUserDb(
                    user.uid,
                    user.displayName ?? "",
                    user.email ?? "",
                ).then(() => sendEmailVerification(user)),
            )
            .then(() => router.replace("/"))
            .catch((err: FirebaseError | Error) => setError(err.message))
            .finally(() => setLoading(false));
    }

    const createAccBtn = (
        <Button
            mode="contained"
            disabled={!validate.isEmail(email)}
            onPress={doSignUp}
            loading={loading}
        >
            Create account
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
                {createAccBtn}
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
