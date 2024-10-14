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
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { NavigationProp } from '@react-navigation/native';
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "@firebase/auth";

interface LoginProps {
    navigation: NavigationProp<any>;
}

// import these functions from CreateAccount.tsx: validateEmail, validatePassword

const Login: React.FC<LoginProps> = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const auth = FIREBASE_AUTH;

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            setError("Invalid email address");
        } else {
            setError("");
        }
    };
    const validatePassword = (password: string) => {
        const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!regex.test(password)) {
            setError("Password must be at least 8 characters long and contain at least one capital letter, one number, and one special character.");
        } else {
            setError("");
        }
    };

    const handleLogin = async () => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // check if the email is verified
            if (user.emailVerified) {
                navigation.navigate("SignUpQuestions");
            } else {
                Alert.alert("Email not verified", "Please check your email for the verification link.");
            }

        } catch (error) {
            console.log(error);
            Alert.alert("Account not found", "Check email and password again or create a new account");
        }
        setLoading(false);
    };

    const handleSignUp = () => {
        navigation.navigate("CreateAccount");
    };

    const handlePasswordReset = async () => {
        navigation.navigate("ForgetPassword");
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(text) => { setEmail(text); validateEmail(text); }}
                    placeholder="Email"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    autoCapitalize="none"
                    secureTextEntry={true}
                />

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

                        <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
                            <Text style={styles.buttonText}>Forgot password?</Text>
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
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
});
