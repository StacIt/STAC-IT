import * as React from "react";
import { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    Alert,
    useColorScheme,
    Image,
    TouchableHighlight,
} from "react-native";
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithCredential,
    getAuth,
} from "@react-native-firebase/auth";
import {
    setDoc,
    doc,
    collection,
    getDoc,
    getFirestore,
} from "@react-native-firebase/firestore";
import { router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import {
    AppleAuthenticationButton,
    isAvailableAsync,
    AppleAuthenticationButtonType,
    AppleAuthenticationButtonStyle,
} from "expo-apple-authentication";
import { GoogleSigninButton as GoogleAuthButton } from "@react-native-google-signin/google-signin";
import {
    TextInput,
    Button,
    Divider,
    HelperText,
    Text,
    ActivityIndicator,
} from "react-native-paper";
import validate from "validator";

import { StyleProps, useStyles } from "@/styling";
import { doAppleSignIn, doGoogleSignIn } from "@/util";

export default function SignIn() {
    const { styles } = useStyles(styling);
    return (
        <View style={styles.container}>
            <AppleSignInButton />
            <GoogleSignInButton />
            <Button
                mode="outlined"
                onPress={() => {
                    router.navigate("/email");
                }}
                style={{ borderRadius: 5, width: 220 }}
            >
                Continue with Email
            </Button>
        </View>
    );
}

function GoogleSignInButton() {
    const scheme = useColorScheme();

    const img =
        scheme === "dark"
            ? require("%/signin/neutral/ios_neutral_sq_ctn.png")
            : require("%/signin/dark/ios_dark_sq_ctn.png");

    const { width, height } = Image.resolveAssetSource(img);

    return (
        <>
            <TouchableHighlight onPress={doGoogleSignIn}>
                <Image
                    source={img}
                    style={{
                        width: 220,
                        height: Math.floor(220 / (width / height)),
                        resizeMode: "contain",
                    }}
                />
            </TouchableHighlight>
        </>
    );
}

function AppleSignInButton() {
    const scheme = useColorScheme();

    const [available, setAvailable] = useState(false);

    useEffect(() => {
        AppleAuthentication.isAvailableAsync().then(setAvailable);
    }, []);

    const btnColor =
        scheme === "dark"
            ? AppleAuthenticationButtonStyle.WHITE
            : AppleAuthenticationButtonStyle.BLACK;

    const button = (
        <AppleAuthenticationButton
            buttonType={AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={btnColor}
            cornerRadius={5}
            style={{ width: 220, height: 44 }}
            onPress={doAppleSignIn}
        />
    );

    return available ? button : null;
}
function styling({ theme }: StyleProps) {
    const colors = theme.colors;
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            alignItems: "center",
            justifyContent: "center",
            gap: 8 * 2,
        },
    });
}
