import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Alert,
} from "react-native";

import React, { useState } from "react";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { NavigationProp } from '@react-navigation/native';
import {
    signInWithEmailAndPassword,
} from "@firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ActivityIndicator, Button, Text, TextInput } from "react-native-paper";

interface LoginProps {
    navigation: NavigationProp<any>;
}

const Login: React.FC<LoginProps> = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const auth = FIREBASE_AUTH;

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            setError("Invalid email address");
        } else {
            setError("");
        }
    };

    const checkUserData = async (userId: string) => {
        const userRef = doc(FIREBASE_DB, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            return userData.fullName && userData.birthDate;
        }
        return false;
    };

    const handleLogin = async () => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user.emailVerified) {
                const hasCompletedSignUp = await checkUserData(user.uid);
                if (hasCompletedSignUp) {
                    navigation.navigate("MainTabs");
                } else {
                    navigation.navigate("SignUpQuestions");
                }
            } else {
                Alert.alert("Email not verified", "Please check your email for the verification link.");
            }

        } catch (error: any) {
            console.log("Firebase Login Error:", error.message);
            Alert.alert("Login Failed", "Password or email is incorrect.");
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
                <TextInput
                    mode="outlined"
                    style={styles.input}
                    value={email}
                    label="Email"
                    onChangeText={setEmail}
                    onEndEditing={() => { validateEmail(email) }}
                    autoCapitalize="none"
                    autoComplete="email"
                    inputMode="email"
                />

                <TextInput
                    mode="outlined"
                    style={styles.input}
                    value={password}
                    label="Password"
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                />

                <Text style={styles.errorText}>{error}</Text>

                {loading ? (
                    <ActivityIndicator size="small" color="#000000" />
                ) : (
                    <>
                        <Button mode="contained" style={styles.button} onPress={handleLogin}>Login</Button>
                        <Button mode="contained-tonal" style={styles.button} onPress={() => navigation.navigate("CreateAccount")}>New to STAC-IT? Create account</Button>
                        <Button mode="text" style={styles.infoButton} onPress={() => navigation.navigate("ForgetPassword")}>Forgot password?</Button>
                    </>
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        flex: 1,
        justifyContent: "center",
    },
    input: {
        marginVertical: 4,
    },
    button: {
        marginVertical: 4,
    },
    infoButton: {
        marginVertical: 4,
        alignSelf: "center",
    },
    errorText: {
        color: "red",
        marginVertical: 4,
    },
});
