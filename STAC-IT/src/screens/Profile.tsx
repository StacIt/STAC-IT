import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Avatar, Button, Card, List, Text } from 'react-native-paper';

interface ProfileProps {
    navigation: NavigationProp<any>;
}

const ProfilePage: React.FC<ProfileProps> = ({ navigation }) => {
    const [profile, setProfile] = useState({
        name: 'Loading...',
        email: 'Loading...',
        avatar: 'https://via.placeholder.com/100'
    });

    const [achievements] = useState([
        { id: '1', title: 'Completed 10 Activities', icon: '🏅' },
        { id: '2', title: 'First 5 Hours Logged', icon: '⏱️' },
        { id: '3', title: 'Joined 1 Month Ago', icon: '🎉' },
    ]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const userId = FIREBASE_AUTH.currentUser?.uid;
            if (!userId) return;

            try {
                const userDocRef = doc(FIREBASE_DB, "users", userId);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setProfile({
                        name: userData.fullName || 'N/A',
                        email: userData.email || 'N/A',
                        avatar: 'https://via.placeholder.com/100'
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
            await signOut(FIREBASE_AUTH);
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.userInfo}>
                <Avatar.Image size={80} source={{ uri: profile.avatar }} />
                <Text variant="headlineSmall" style={styles.userName}>{profile.name}</Text>
                <Text style={styles.userEmail}>{profile.email}</Text>
            </View>

            <Card style={styles.section}>
                <Card.Title title="Account Settings" />
                <Card.Content>
                    <List.Item title="Edit Profile" left={(props) => <List.Icon {...props} icon="account-edit" />} />
                    <List.Item title="Change Password" left={(props) => <List.Icon {...props} icon="lock-reset" />} />
                    <List.Item title="Notification Settings" left={(props) => <List.Icon {...props} icon="bell-cog" />} />
                </Card.Content>
            </Card>

            <Card style={styles.section}>
                <Card.Title title="Achievements" />
                <Card.Content>
                    <FlatList
                        data={achievements}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.achievementItem}>
                                <Text style={styles.achievementIcon}>{item.icon}</Text>
                                <Text>{item.title}</Text>
                            </View>
                        )}
                    />
                </Card.Content>
            </Card>

            <Button mode="contained" style={styles.logoutButton} onPress={handleLogout}>Log Out</Button>
        </View>
    );
};

export default ProfilePage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    userInfo: {
        marginTop: 60,
        alignItems: 'center',
        marginBottom: 10,
    },
    userName: {
        marginTop: 12,
    },
    userEmail: {
        color: '#666',
        marginBottom: 10,
    },
    section: {
        marginVertical: 12,
    },
    achievementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    achievementIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    logoutButton: {
        marginTop: 20,
    },
});
