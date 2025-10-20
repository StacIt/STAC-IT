import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert, Modal } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

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

    const handleDateChange = (event: any, selectedDate?: Date) => {
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
                        fullName: fullName,
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

    const goBack = () => {
        navigation.navigate('Login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign Up Questions</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    value={fullName}
                    onChangeText={setFullName}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                    style={styles.input}
                    onPress={() => {
                        setTempDate(birthDate);
                        setShowDatePicker(true);
                    }}
                >
                    <Text>{birthDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={goBack}>
                <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={showAlert} style={styles.infobutton}>
                <Text style={styles.infobuttonText}>Why are we asking you this?</Text>
            </TouchableOpacity>

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
                                testID ="date-picker"
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
        fontSize: 24,
        fontWeight: 'bold',
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
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    infobutton: {
        marginVertical: 10,
        backgroundColor: 'transparent',
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 10,
        borderColor: 'gray',
    },
    infobuttonText: {
        color: 'gray',
        fontSize: 16,
    },
    button: {
        marginVertical: 10,
        backgroundColor: '#6200ea',
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
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