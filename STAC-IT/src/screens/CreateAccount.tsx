import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { NavigationProp } from "@react-navigation/native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "@firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { platformColors } from '../theme/platformColors';

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

    const ShowIcon = <Ionicons name="eye" size={24} color={platformColors.black} />;
    const HideIcon = <Ionicons name="eye-off" size={24} color={platformColors.black} />;

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => { setEmail(text); validateEmail(text); }}
                placeholder="Email"
                autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={(text) => { setPassword(text); validatePassword(text); }}
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

            <Text style={{ color: platformColors.danger }}>{error}</Text>

            {loading ? (
                <ActivityIndicator size="small" color={platformColors.black} />
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
                        <Text style={{ color: platformColors.white }}>Sign Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={handleAlreadyHaveAccount}>
                        <Text style={{ color: platformColors.white }}>Account verified? Login here</Text>
                    </TouchableOpacity>

                    {/* Resend Verification Email Button */}
                    {verificationSent && timeLeft > 0 && (
                        <Text style={styles.timer}>Resend verification in {timeLeft}s</Text>
                    )}
                    {verificationSent && timeLeft === 0 && (
                        <TouchableOpacity
                            style={styles.link}
                            onPress={handleResendVerification}
                        >
                            <Text>Didn't receive the verification email? Resend here.</Text>
                        </TouchableOpacity>
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
        color: platformColors.textSecondary,
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
});
