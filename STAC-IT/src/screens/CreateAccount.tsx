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
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from "@firebase/auth";

import { doc, setDoc } from "firebase/firestore";
import { FIREBASE_DB } from "../../FirebaseConfig";


interface CreateAccountProps {
    navigation: NavigationProp<any>;
}

const CreateAccount: React.FC<CreateAccountProps> = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const auth = FIREBASE_AUTH;
    const validatePassword = (password: string) => {
        const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/;
        return regex.test(password);
    };
    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSignUp = async () => {
        if (!acceptedTerms) {
            alert("You must accept terms and conditions.");
            return;
        }
        if (!validateEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }
        if (!validatePassword(password)) {
            alert("Password must be at least 8 characters long and contain at least one capital letter, one number, and one special character.");
            return;
        }
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Send verification email
            await sendEmailVerification(user);
            alert("Check your email for a verification link. If it doesn't arrive in 5 minutes, check your spam folder.");

            // Save user data to Firestore
            try {
                await setDoc(doc(FIREBASE_DB, "users", user.uid), {
                    email: user.email,
                    acceptedTerms: acceptedTerms,
                    createdAt: new Date(),
                });
                
            } catch (firestoreError) {
                console.error("Error adding document to Firestore: ", firestoreError);
                alert("Failed to save user data.");
            }

            countdownToLogin();
        } catch (error) {
            console.log(error);
            alert("Sign up failed: " + error);
        }
        setLoading(false);
    };

    const countdownToLogin = () => {
        navigation.navigate("Login");
    };

    const handleAlreadyHaveAccount = () => {
        navigation.navigate("Login");
    };

    const handleResendVerification = async () => {
        if (auth.currentUser) {
            try {
                await sendEmailVerification(auth.currentUser);
                alert("Verification email resent. Please check your inbox.");
            } catch (error) {
                console.log(error);
                alert("Failed to resend verification email: " + error);
            }
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
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

                {loading ? (
                    <ActivityIndicator size="small" color="#000000" />
                ) : (
                    <>
                        <View style={styles.checkboxContainer}>
                            <TouchableOpacity onPress={() => setAcceptedTerms(!acceptedTerms)} style={styles.checkbox}>
                                {acceptedTerms ? <Text style={styles.checked}>✔️</Text> : <Text style={styles.unchecked}>⬜️</Text>}
                            </TouchableOpacity>
                            <Text style={styles.label}>
                                I accept the <Text style={styles.link}>Terms and Conditions</Text>
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                            <Text style={{ color: "white" }}>Sign Up</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button} onPress={handleAlreadyHaveAccount}>
                            <Text style={{ color: "white" }}>Already have an Account? Log In</Text>
                        </TouchableOpacity>

                        {/* Resend Verification Email Button */}
                        <TouchableOpacity style={styles.button} onPress={handleResendVerification}>
                            <Text style={{ color: "white" }}>Resend Verification Email</Text>
                        </TouchableOpacity>

                    </>
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

export default CreateAccount;

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
    checkboxContainer: {
        flexDirection: "row",
        marginVertical: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    checkbox: {
        marginRight: 10,
    },
    checked: {
        fontSize: 18,
    },
    unchecked: {
        fontSize: 18,
    },
    label: {
        fontSize: 14,
    },
    link: {
        color: "#6200ea",
        textDecorationLine: "underline",
    },
});
