import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView } from "react-native";
import {
    Text,
    Card,
    Avatar,
    List,
    Divider,
    Button,
    Switch,
    useTheme,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    getAuth,
    signOut,
} from "@react-native-firebase/auth";
import {
    doc,
    collection,
    getDoc,
    getFirestore,
} from "@react-native-firebase/firestore";
import { useStyles, StyleProps } from "@/styling";
import { useAuth } from "@/contexts";
import { router } from "expo-router";

export default function Profile() {
    const { styles, theme, insets } = useStyles(styling);
    const [profile, setProfile] = useState({
        name: "Loading...",
        email: "Loading...",
        avatar: "https://via.placeholder.com/100",
    });
    const { user } = useAuth();
    const db = getFirestore();

    const achievements = [
        { id: "1", title: "Completed 10 Activities", icon: "🏅" },
        { id: "2", title: "First 5 Hours Logged", icon: "⏱️" },
        { id: "3", title: "Joined 1 Month Ago", icon: "🎉" },
    ];

    useEffect(() => {
        const fetchUserProfile = async () => {
            const userId = user.uid;

            try {
                const userDocRef = doc(db, "users", userId);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();

                    setProfile({
                        name: userData.fullName || "N/A",
                        email: userData.email || "N/A",
                        avatar: "https://via.placeholder.com/100",
                    });
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };

        fetchUserProfile();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(getAuth());
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            {/* user info */}
            <Card style={styles.card}>
                <Card.Content style={null}>
                    <Avatar.Image size={90} source={{ uri: profile.avatar }} />

                    <Text variant="headlineSmall" style={styles.userName}>
                        {profile.name}
                    </Text>

                    <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.onSurfaceVariant }}
                    >
                        {profile.email}
                    </Text>
                </Card.Content>
            </Card>

            {/* account settings */}
            <Card style={styles.card}>
                <Card.Title title="Account Settings" />

                <Card.Content>
                    <List.Item
                        title="Edit Profile"
                        left={(props) => (
                            <List.Icon {...props} icon="account-edit" />
                        )}
                        onPress={() => alert("Edit Profile")}
                    />

                    <Divider />

                    <List.Item
                        title="Change Password"
                        left={(props) => (
                            <List.Icon {...props} icon="lock-reset" />
                        )}
                        onPress={() => alert("Change Password")}
                    />

                    <Divider />

                    <List.Item
                        title="Notification Settings"
                        left={(props) => (
                            <List.Icon {...props} icon="bell-outline" />
                        )}
                        onPress={() => alert("Notification Settings")}
                    />

                    <Divider />
                </Card.Content>
            </Card>

            {/* achievements */}
            <Card style={styles.card}>
                <Card.Title title="Achievements" />

                <Card.Content>
                    {achievements.map((item) => (
                        <List.Item
                            key={item.id}
                            title={item.title}
                            left={() => <Text style={null}>{item.icon}</Text>}
                        />
                    ))}
                </Card.Content>
            </Card>

            {/* logout button */}
            <Button
                mode="outlined"
                onPress={handleLogout}
                style={styles.logoutButton}
                contentStyle={{ paddingVertical: 6 }}
            >
                Log Out
            </Button>
        </ScrollView>
    );
}

const styling = ({ theme, insets }: StyleProps) => {
    return StyleSheet.create({
        container: {
            paddingTop: insets.top,
            padding: 16,
        },
        card: {
            marginBottom: 16,
            borderRadius: 16,
        },
        userInfo: {
            alignItems: "center",
        },
        userName: {
            marginTop: 12,
        },
        achievementIcon: {
            fontSize: 20,
            marginRight: 8,
            alignSelf: "center",
        },
        logoutButton: {
            marginTop: 20,
            borderRadius: 12,
        },
    });
};