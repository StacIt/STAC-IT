import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import React, { useState } from 'react';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from '@firebase/auth';
import { NavigationProp } from '@react-navigation/native';

interface ForgetPasswordProps {
    navigation: NavigationProp<any>;
}

const ForgetPassword: React.FC<ForgetPasswordProps> = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePasswordReset = async () => {
        setLoading(true);

        try {
            // Check if email is registered
            const signInMethods = await fetchSignInMethodsForEmail(FIREBASE_AUTH, email);
            if (signInMethods.length === 0) {
                // No account found with this email
                Alert.alert("Email not registered", "No account found with this email. Please try again.");
                return;
            }

            // Send email to reset password
            await sendPasswordResetEmail(FIREBASE_AUTH, email);
            Alert.alert("Password Reset", "Check your email for a link to reset your password!");
            navigation.navigate("Login"); 
        } catch (error: any) {
            console.log(error);

            if (error.code === 'auth/invalid-email') {
                Alert.alert("Invalid Email", "Please enter a valid email address.");
            } else if (error.code === 'auth/user-disabled') {
                Alert.alert("Account Disabled", "This account has been disabled. Please contact support.");
            } else {
                Alert.alert("Password Reset Failed", "Please check your email and try again.");
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
});
