import React, { useState } from 'react';
import { View, StyleSheet, Platform, Alert, Modal, TouchableOpacity } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Text, TextInput } from 'react-native-paper';

interface SignUpQuestionsProps {
    navigation: NavigationProp<any>;
}

import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { FIREBASE_DB } from "../../FirebaseConfig";

const SignUpQuestions: React.FC<SignUpQuestionsProps> = ({ navigation }) => {
    const showAlert = () => {
        Alert.alert(
            'Why are we asking you this?',
            "We collect your information to personalize your experience, improve our services, and ensure the app's security. Your privacy is our priority, and your data is used responsibly and securely. You can review or adjust your data anytime in the app's privacy settings.",
            [{ text: 'OK' }]
        );
    };
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState(new Date());
    const [tempDate, setTempDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const isAtLeast18 = (date: Date) => {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDifference = today.getMonth() - date.getMonth();
        const dayDifference = today.getDate() - date.getDate();

        return (
            age > 18 ||
            (age === 18 && (monthDifference > 0 || (monthDifference === 0 && dayDifference >= 0)))
        );
    };

    const handleDateChange = (_event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setTempDate(selectedDate);
        }
    };

    const confirmDate = () => {
        setBirthDate(tempDate);
        setShowDatePicker(false);
    };

    const cancelDateSelection = () => {
        setTempDate(birthDate);
        setShowDatePicker(false);
    };

    const handleSubmit = async () => {
        if (!fullName) {
            Alert.alert('Error', 'Please fill out all the fields.');
            return;
        }

        if (!isAtLeast18(birthDate)) {
            Alert.alert('Age Restriction', 'You must be at least 18 years old to sign up.');
            return;
        }

        const user = FIREBASE_AUTH.currentUser;

        if (user) {
            try {
                await setDoc(
                    doc(FIREBASE_DB, "users", user.uid),
                    {
                        fullName,
                        birthDate: birthDate.toISOString(),
                    },
                    { merge: true }
                );

                navigation.navigate("MainTabs");
            } catch (error) {
                Alert.alert('Error', 'Failed to save your data. Please try again.');
            }
        } else {
            Alert.alert('Error', 'User not logged in.');
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>Sign Up Questions</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    mode="outlined"
                    style={styles.input}
                    label="Enter your full name"
                    value={fullName}
                    onChangeText={setFullName}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <Button
                    mode="outlined"
                    style={styles.dateButton}
                    onPress={() => {
                        setTempDate(birthDate);
                        setShowDatePicker(true);
                    }}
                >
                    {birthDate.toLocaleDateString()}
                </Button>
            </View>

            <Button mode="contained" style={styles.button} onPress={handleSubmit}>Submit</Button>
            <Button mode="contained-tonal" style={styles.button} onPress={() => navigation.navigate('Login')}>Go Back</Button>
            <Button mode="text" onPress={showAlert}>Why are we asking you this?</Button>

            {showDatePicker && (
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={showDatePicker}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={cancelDateSelection}>
                                    <Text style={styles.cancelButton}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Select Date</Text>
                                <TouchableOpacity onPress={confirmDate}>
                                    <Text style={styles.doneButton}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                style={styles.datePicker}
                            />
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

export default SignUpQuestions;

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '500',
        color: '#333',
    },
    input: {},
    dateButton: {
        justifyContent: 'center',
    },
    button: {
        marginVertical: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        paddingBottom: Platform.OS === 'ios' ? 30 : 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        width: '100%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '500',
    },
    cancelButton: {
        color: '#007AFF',
        fontSize: 16,
    },
    doneButton: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    datePicker: {
        height: 200,
        width: '100%',
        alignSelf: 'center',
        justifyContent: 'center',
    },
});
