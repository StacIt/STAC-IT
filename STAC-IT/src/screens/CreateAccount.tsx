import {
    View,
    StyleSheet,
    Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { NavigationProp } from "@react-navigation/native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "@firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ActivityIndicator, Button, Checkbox, Text, TextInput } from "react-native-paper";

interface CreateAccountProps {
    navigation: NavigationProp<any>;
}

const CreateAccount: React.FC<CreateAccountProps> = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const auth = FIREBASE_AUTH;

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prevTime => prevTime - 1), 1000);
        } else if (timer) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [timeLeft]);

    const validateEmail = (value: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(value)) {
            setError("Invalid email address");
        } else {
            setError("");
        }
    };

    const validatePassword = (value: string) => {
        const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!regex.test(value)) {
            setError("Password must be at least 8 characters long and contain at least one capital letter, one number, and one special character.");
        } else {
            setError("");
        }
    };

    const handleSignUp = async () => {
        if (!acceptedTerms) {
            Alert.alert("Terms Required", "You must accept terms and conditions.");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);
            setVerificationSent(true);
            setTimeLeft(60);

            Alert.alert("Verification Sent", "A verification email has been sent to your email address. Please check your inbox!");

            try {
                await setDoc(doc(FIREBASE_DB, "users", user.uid), {
                    email: user.email,
                    acceptedTerms,
                    createdAt: new Date(),
                });
            } catch (firestoreError) {
                console.error("Error adding document to Firestore: ", firestoreError);
                Alert.alert("Error", "Failed to save user data.");
            }
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Sign up failed: " + error);
        }
        setLoading(false);
    };

    const handleResendVerification = async () => {
        if (auth.currentUser && timeLeft === 0) {
            try {
                await sendEmailVerification(auth.currentUser);
                setVerificationSent(true);
                setTimeLeft(60);
                Alert.alert("Verification Sent", "Verification email resent. Please check your inbox.");
            } catch (error) {
                console.log(error);
                Alert.alert("Error", "Failed to resend verification email: " + error);
            }
        } else if (timeLeft > 0) {
            Alert.alert("Please wait", `Please wait ${timeLeft} seconds before trying again.`);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                mode="outlined"
                style={styles.input}
                value={email}
                onChangeText={(text) => { setEmail(text); validateEmail(text); }}
                label="Email"
                autoCapitalize="none"
            />
            <TextInput
                mode="outlined"
                style={styles.input}
                value={password}
                onChangeText={(text) => { setPassword(text); validatePassword(text); }}
                label="Password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
            />

            <Text style={styles.errorText}>{error}</Text>

            {loading ? (
                <ActivityIndicator size="small" color="#000000" />
            ) : (
                <>
                    <View style={styles.checkboxContainer}>
                        <Checkbox
                            status={acceptedTerms ? "checked" : "unchecked"}
                            onPress={() => setAcceptedTerms(!acceptedTerms)}
                        />
                        <Text>I accept the Terms and Conditions</Text>
                    </View>

                    <Button mode="contained" style={styles.button} onPress={handleSignUp}>Sign Up</Button>
                    <Button mode="contained-tonal" style={styles.button} onPress={() => navigation.navigate("Login")}>Account verified? Login here</Button>

                    {verificationSent && timeLeft > 0 && (
                        <Text style={styles.timer}>Resend verification in {timeLeft}s</Text>
                    )}
                    {verificationSent && timeLeft === 0 && (
                        <Button mode="text" onPress={handleResendVerification}>Didn't receive the verification email? Resend here.</Button>
                    )}
                </>
            )}
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
    },
    button: {
        marginVertical: 4,
    },
    checkboxContainer: {
        flexDirection: "row",
        marginVertical: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    timer: {
        marginTop: 10,
        textAlign: "center",
        color: "gray",
    },
    errorText: {
        color: "red",
        marginVertical: 4,
    },
});
