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

interface CreateAccountProps {
    navigation: NavigationProp<any>;
}

const CreateAccount: React.FC<CreateAccountProps> = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const auth = FIREBASE_AUTH;

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Send verification email
            await sendEmailVerification(user);
            alert("Check your email for a verification link. If it doesn't arrive in 5 minutes, check your spam folder.");
            
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
});
