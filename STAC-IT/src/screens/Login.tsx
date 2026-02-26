import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Alert,
} from "react-native";

import React, { useState } from "react";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { NavigationProp } from '@react-navigation/native';
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "@firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons';
import { platformColors } from '../theme/platformColors';

import { TextInput, Button, Divider, HelperText } from "react-native-paper"

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

    const handleSignUp = () => {
        navigation.navigate("CreateAccount");
    };

    const handlePasswordReset = async () => {
        navigation.navigate("ForgetPassword");
    };

    const ShowIcon = <Ionicons name="eye" size={24} color={platformColors.black} />;
    const HideIcon = <Ionicons name="eye-off" size={24} color={platformColors.black} />;

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
            <View style={{gap: 10}}>
                <TextInput
                    //style={{ marginVertical: 4 }}
                    label="Email"
                    value={email}
                    onChangeText={(text) => { setEmail(text) }}
                    onEndEditing={() => { validateEmail(email) }}
                    autoCapitalize="none"
                    autoComplete={"email"}
                    error={error != ""}
                    inputMode={"email"}
                    autoCorrect={false}
                />
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    label="Password"
                    autoCapitalize="none"
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    right=<TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                        />
                />
            </View>
            <HelperText type="error" visible={error != ""} padding="normal">
            {error}
            </HelperText>

            {loading ? (
                <ActivityIndicator size="small" color={platformColors.black} />
            ) : (
                <View style={{gap: 6}}>
                    <Button mode="contained" onPress={handleLogin}>
                    Login
                    </Button>

                    <Button mode="contained-tonal" onPress={handleSignUp}>
                    Create account
                    </Button>

                    <Button mode="outlined" onPress={handlePasswordReset}>
                    Forgot password?
                    </Button>
                </View>
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
        height: 50,
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
        backgroundColor: platformColors.white,
    },
    button: {
        marginVertical: 4,
        alignItems: "center",
        backgroundColor: platformColors.accent,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    infobutton: {
        marginVertical: 4,
        backgroundColor: 'transparent',
        paddingVertical: 5,
        alignItems: 'center',
        borderRadius: 5,
        paddingHorizontal: 10,
        borderColor: platformColors.textSecondary,
    },
    buttonText: {
        color: platformColors.white,
        fontWeight: "bold",
    },
    infobuttonText: {
        color: platformColors.textSecondary,
        fontWeight: "bold",
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
        borderWidth: 1,
        borderRadius: 4,
        backgroundColor: platformColors.white,
    },
    passwordInput: {
        flex: 1,
        height: 50,
        padding: 10,
    },
    visibilityToggle: {
        padding: 10,
    },
})