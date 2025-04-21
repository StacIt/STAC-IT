import {
    View,
    Text,
    TextInput,
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

    const ShowIcon = <Ionicons name="eye" size={24} color="black" />;
    const HideIcon = <Ionicons name="eye-off" size={24} color="black" />;

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
                <TextInput
                    style={[styles.input, { marginVertical: 4 }]}
                    value={email}
                    onChangeText={(text) => { setEmail(text); validateEmail(text); }}
                    placeholder="Email"
                    autoCapitalize="none"
                />
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        autoCapitalize="none"
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                        style={styles.visibilityToggle}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? HideIcon : ShowIcon}
                    </TouchableOpacity>
                </View>

                <Text style={{ color: "red" }}>{error}</Text>

                {loading ? (
                    <ActivityIndicator size="small" color="#000000" />
                ) : (
                    <>
                        <TouchableOpacity style={styles.button} onPress={handleLogin}>
                            <Text style={styles.buttonText}>Login</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                            <Text style={styles.buttonText}>New to STAC-IT? Create account</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.infobutton} onPress={handlePasswordReset}>
                            <Text style={styles.infobuttonText}>Forgot password?</Text>
                        </TouchableOpacity>
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
        height: 50,
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
        backgroundColor: "#fff",
    },
    button: {
        marginVertical: 4,
        alignItems: "center",
        backgroundColor: "#6200ea",
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
        borderColor: 'gray',
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
    infobuttonText: {
        color: "gray",
        fontWeight: "bold",
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
        borderWidth: 1,
        borderRadius: 4,
        backgroundColor: "#fff",
    },
    passwordInput: {
        flex: 1,
        height: 50,
        padding: 10,
    },
    visibilityToggle: {
        padding: 10,
    },
});