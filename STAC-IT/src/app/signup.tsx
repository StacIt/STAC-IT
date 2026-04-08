import {
    createUserWithEmailAndPassword,
    getAuth,
    sendEmailVerification,
} from "@react-native-firebase/auth";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Icon, useTheme } from "react-native-paper";
import validate from "validator";
import { router } from "expo-router";

export default function CreateAccount() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false); // Track if the verification email was sent
    const [timeLeft, setTimeLeft] = useState(0); // Timer for resending the verification email

    const theme = useTheme();
    const auth = getAuth();

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (timeLeft > 0) {
            timer = setInterval(
                () => setTimeLeft((prevTime) => prevTime - 1),
                1000,
            );
        } else if (timer) {
            clearInterval(timer);
        }
        return () => clearInterval(timer); // Cleanup timer on unmount
    }, [timeLeft]);

    const validateEmail = (email: string) => {
        if (!validate.isEmail(email)) {
            setError("Invalid email address");
        } else {
            setError("");
        }
    };

    const validatePassword = (password: string) => {
        const regex =
            /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!regex.test(password)) {
            setError(
                "Password must be at least 8 characters long and contain at least one capital letter, one number, and one special character.",
            );
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
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password,
            );
            const user = userCredential.user;

            // Send verification email
            await sendEmailVerification(user);
            setVerificationSent(true); // Mark verification as sent
            setTimeLeft(60); // Set the timer for 60 seconds before allowing resend

            // Show an alert indicating that the verification email has been sent
            Alert.alert(
                "Verification Sent",
                "A verification email has been sent to your email address. Please check your inbox!",
            );
        } catch (error) {
            console.log(error);
            alert("Sign up failed: " + error);
        }
        setLoading(false);
        router.replace("/");
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
        router.navigate("/login");
    };

    const ShowIcon = <Icon source="eye" size={24} />;
    const HideIcon = <Icon source="eye-off" size={24} />;

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    validateEmail(text);
                }}
                placeholder="Email"
                autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        validatePassword(text);
                    }}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    style={styles.visibilityToggle}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? HideIcon : ShowIcon}
                </TouchableOpacity>
            </View>

            <Text style={{ color: theme.colors.error }}>{error}</Text>

            {loading ? (
                <ActivityIndicator size="small" />
            ) : (
                <>
                    <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                            onPress={() => setAcceptedTerms(!acceptedTerms)}
                            style={styles.checkbox}
                        >
                            {acceptedTerms ? (
                                <Text style={styles.checked}>✔️</Text>
                            ) : (
                                <Text style={styles.unchecked}>⬜️</Text>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.label}>
                            I accept the{" "}
                            <Text style={styles.link}>
                                Terms and Conditions
                            </Text>
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSignUp}
                    >
                        <Text style={{ color: "white" }}>Sign Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleAlreadyHaveAccount}
                    >
                        <Text style={{ color: "white" }}>
                            Account verified? Login here
                        </Text>
                    </TouchableOpacity>

                    {/* Resend Verification Email Button */}
                    {verificationSent && timeLeft > 0 && (
                        <Text style={styles.timer}>
                            Resend verification in {timeLeft}s
                        </Text>
                    )}
                    {verificationSent && timeLeft === 0 && (
                        <TouchableOpacity
                            style={styles.link}
                            onPress={handleResendVerification}
                        >
                            <Text>
                                Didn't receive the verification email? Resend
                                here.
                            </Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
}

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
        backgroundColor: "white",
    },
    button: {
        marginVertical: 4,
        alignItems: "center",
        backgroundColor: "purple",
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
        marginTop: 20,
        alignItems: "center",
    },
    timer: {
        marginTop: 10,
        textAlign: "center",
        //color: platformColors.textSecondary,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 4,
        borderWidth: 1,
        borderRadius: 4,
        //backgroundColor: platformColors.white,
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
