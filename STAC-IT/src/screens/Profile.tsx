import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, FlatList } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface ProfileProps {
    navigation: NavigationProp<any>;
}

const ProfilePage: React.FC<ProfileProps> = ({ navigation }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [profile, setProfile] = useState({
        name: 'Loading...',
        email: 'Loading...',
        avatar: 'https://via.placeholder.com/100'
    });

    const [achievements, setAchievements] = useState([
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
                        avatar: 'https://via.placeholder.com/100' // or use another field if available in Firestore
                    });
                } else {
                    console.log("No such document!");
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

    const editProfile = () => {
        alert("Edit Profile");
    };

    const changePassword = () => {
        alert("Change Password");
    };

    const notificationSettings = () => {
        alert("Notification Settings");
    };

    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            {/* user info */}
            <View style={styles.userInfo}>
                <Image
                    source={{ uri: profile.avatar }}
                    style={styles.profileImage}
                />
                <Text style={[styles.userName, isDarkMode && styles.darkText]}>{profile.name}</Text>
                <Text style={[styles.userEmail, isDarkMode && styles.darkText]}>{profile.email}</Text>
            </View>

            {/* account settings */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Account Settings</Text>
                <TouchableOpacity style={styles.settingButton} onPress={editProfile}>
                    <Text style={styles.settingText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingButton} onPress={changePassword}>
                    <Text style={styles.settingText}>Change Password</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingButton} onPress={notificationSettings}>
                    <Text style={styles.settingText}>Notification Settings</Text>
                </TouchableOpacity>
            </View>

            {/* achievements */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Achievements</Text>
                <FlatList
                    data={achievements}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.achievementItem}>
                            <Text style={styles.achievementIcon}>{item.icon}</Text>
                            <Text style={[styles.achievementText, isDarkMode && styles.darkText]}>{item.title}</Text>
                        </View>
                    )}
                />
            </View>

            {/* logout button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
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
    darkContainer: {
        backgroundColor: '#333',
    },
    userInfo: {
        marginTop: 60,
        alignItems: 'center',
        marginBottom: 10,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 50,
        marginBottom: 15,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    darkText: {
        color: '#ffffff',
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    section: {
        marginVertical: 15,
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    settingButton: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingText: {
        fontSize: 16,
        color: '#6200ea',
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
    achievementText: {
        fontSize: 16,
        color: '#333',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
    },
    logoutButton: {
        marginTop: 30,
        backgroundColor: '#6200ea',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignSelf: 'center',
    },
    logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
