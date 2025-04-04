import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { sendPasswordResetEmail } from '@firebase/auth';
import { NavigationProp } from '@react-navigation/native';

interface ForgetPasswordProps {
    navigation: NavigationProp<any>;
}

const ForgetPassword: React.FC<ForgetPasswordProps> = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0); // Time left for resending the email

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prevTime => prevTime - 1), 1000);
        } else if (timer) {
            clearInterval(timer);
        }
        return () => clearInterval(timer); // Cleanup timer on unmount
    }, [timeLeft]);

    const handlePasswordReset = async () => {
        setLoading(true);
        setResetSent(false);  // Reset the resetSent state when initiating the password reset
        setTimeLeft(60); // Set the timer for 60 seconds after sending the email

        try {
            const auth = FIREBASE_AUTH;
            const formattedEmail = email.trim().toLowerCase();

            await sendPasswordResetEmail(auth, formattedEmail);
            setResetSent(true);
            Alert.alert("Password Reset", "Check your email for a reset link!");
        } catch (error: any) {
            console.log(error);

            if (error.code === 'auth/invalid-email') {
                Alert.alert("Invalid Email", "Please enter a valid email address.");
            } else if (error.code === 'auth/user-disabled') {
                Alert.alert("Account Disabled", "This account has been disabled. Contact support.");
            } else if (error.code === 'auth/user-not-found') {
                Alert.alert("No Account Found", "No account associated with this email.");
            } else {
                Alert.alert("Error", "Something went wrong. Try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Forgot Password</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                autoCapitalize="none"
                keyboardType="email-address"
            />
            {loading ? (
                <ActivityIndicator size="small" color="#6200ea" />
            ) : (
                <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
                    <Text style={styles.buttonText}>Send Reset Link</Text>
                </TouchableOpacity>
            )}
            {resetSent && timeLeft > 0 && (
                <Text style={styles.timer}>Resend link in {timeLeft}s</Text>
            )}
            {resetSent && timeLeft === 0 && (
                <TouchableOpacity
                    style={styles.link}
                    onPress={handlePasswordReset}
                >
                    <Text>Didn't receive the link? Resend here.</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("Login")}>
                <Text>Back to Login</Text>
            </TouchableOpacity>
        </View>
    );
};

export default ForgetPassword;

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        flex: 1,
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
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
    link: {
        marginTop: 20,
        alignItems: "center",
    },
    timer: {
        marginTop: 10,
        textAlign: "center",
        color: "gray",
    },
});
