import { View, StyleSheet, Alert} from "react-native";
import{ TextInput, Button, Text, Checkbox, ActivityIndicator} from "react-native-paper";
import React, { useState, useEffect } from "react";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { NavigationProp } from "@react-navigation/native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "@firebase/auth";
import { doc, setDoc } from "firebase/firestore";

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
    const [verificationSent, setVerificationSent] = useState(false); // Track if the verification email was sent
    const [timeLeft, setTimeLeft] = useState(0); // Timer for resending the verification email

    const auth = FIREBASE_AUTH;

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prevTime => prevTime - 1), 1000);
        } else if (timer) {
            clearInterval(timer);
        }
        return () => clearInterval(timer); // Cleanup timer on unmount
    }, [timeLeft]);

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

    const handleSignUp = async () => {
        if (!acceptedTerms) {
            alert("You must accept terms and conditions.");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Send verification email
            await sendEmailVerification(user);
            setVerificationSent(true); // Mark verification as sent
            setTimeLeft(60); // Set the timer for 60 seconds before allowing resend

            // Show an alert indicating that the verification email has been sent
            Alert.alert("Verification Sent", "A verification email has been sent to your email address. Please check your inbox!");

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
        } catch (error) {
            console.log(error);
            alert("Sign up failed: " + error);
        }
        setLoading(false);
    };

    const handleResendVerification = async () => {
        if (auth.currentUser && timeLeft === 0) {
            try {
                await sendEmailVerification(auth.currentUser);
                setVerificationSent(true);
                setTimeLeft(60); // Reset timer after resend
                alert("Verification email resent. Please check your inbox.");
            } catch (error) {
                console.log(error);
                alert("Failed to resend verification email: " + error);
            }
        } else if (timeLeft > 0) {
            alert(`Please wait ${timeLeft} seconds before trying again.`);
        }
    };

    const handleAlreadyHaveAccount = () => {
        navigation.navigate("Login");
    };


    return (
        <View style={styles.container}>
            <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={(text) => { setEmail(text); validateEmail(text); }}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                error={!!error && email.length > 0}
            />
            <TextInput
                mode="outlined"
                label="Password"
                value={password}
                onChangeText={(text) => { setPassword(text); validatePassword(text); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={styles.input}
                error={!!error && password.length > 0}
                right={
                    <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                    />
            }
            />


            {loading ? (
                <ActivityIndicator animating={true} style={styles.loader} />
            ) : (
                <>
                    <View style={styles.checkboxRow}>
                        <Checkbox.Android
                            status={acceptedTerms ? 'checked' : 'unchecked'}
                            onPress={() => setAcceptedTerms(!acceptedTerms)}
                        />
                        <Text variant="bodyMedium" onPress={() => setAcceptedTerms(!acceptedTerms)}>
                            I accept the <Text style={styles.linkText}>Terms and Conditions</Text>
                        </Text>
                    </View>
                    <Button
                        mode="contained"
                        onPress={handleSignUp}
                        style={styles.button}
                    >
                        Sign Up
                    </Button>
                    <Button
                        mode="text"
                        onPress={handleAlreadyHaveAccount}
                        style={styles.button}
                    >
                        Account verified? Login here
                    </Button>

                    {verificationSent && (
                        <View style={styles.resendContainer}>
                            {timeLeft > 0 ? (
                                <Text variant="bodySmall">Resend verification in {timeLeft}s</Text>
                            ) : (
                                <Button mode="outlined" compact onPress={handleResendVerification}>
                                    Resend Email
                                </Button>
                            )}
                        </View>
                    )}
                </>
            )}
        </View>
    );
};

export default CreateAccount;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        flex: 1,
        justifyContent: "center",
    },
    input: {
        marginBottom: 12
    },
    button: {
        marginVertical: 8,
        paddingVertical: 4,

    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    linkText: {
            textDecorationLine: 'underline',
            color: '#2196F3',
    },
    loader: {
        marginVertical: 20,
    },
    resendContainer: {
        alignItems: "center",
        marginTop: 10,
    },
});
