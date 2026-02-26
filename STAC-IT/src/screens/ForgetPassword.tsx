import {
    View,
    StyleSheet,
    Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { sendPasswordResetEmail } from '@firebase/auth';
import { NavigationProp } from '@react-navigation/native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';

interface ForgetPasswordProps {
    navigation: NavigationProp<any>;
}

const ForgetPassword: React.FC<ForgetPasswordProps> = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prevTime => prevTime - 1), 1000);
        } else if (timer) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handlePasswordReset = async () => {
        setLoading(true);
        setResetSent(false);
        setTimeLeft(60);

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
            <Text variant="headlineMedium" style={styles.title}>Forgot Password</Text>
            <TextInput
                mode="outlined"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                label="Enter your email"
                autoCapitalize="none"
                keyboardType="email-address"
            />
            {loading ? (
                <ActivityIndicator size="small" color="#6200ea" />
            ) : (
                <Button mode="contained" style={styles.button} onPress={handlePasswordReset}>Send Reset Link</Button>
            )}
            {resetSent && timeLeft > 0 && (
                <Text style={styles.timer}>Resend link in {timeLeft}s</Text>
            )}
            {resetSent && timeLeft === 0 && (
                <Button mode="text" onPress={handlePasswordReset}>Didn't receive the link? Resend here.</Button>
            )}
            <Button mode="text" onPress={() => navigation.navigate("Login")}>Back to Login</Button>
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
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginVertical: 4,
    },
    button: {
        marginVertical: 4,
    },
    timer: {
        marginTop: 10,
        textAlign: "center",
        color: "gray",
    },
});
