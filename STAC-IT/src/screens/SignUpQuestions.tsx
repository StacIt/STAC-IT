import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';

interface SignUpQuestionsProps {
    navigation: NavigationProp<any>;
}

import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { FIREBASE_DB } from "../../FirebaseConfig";

const SignUpQuestions: React.FC<SignUpQuestionsProps> = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState('');

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
        const currentDate = selectedDate || birthDate;
        setShowDatePicker(Platform.OS === 'ios');
        setBirthDate(currentDate);
    };

    const handleSubmit = async () => {
        if (!fullName || !gender) {
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
                        gender: gender,
                    },
                    { merge: true }
                );

                Alert.alert('Success', 'Sign-up questions submitted successfully!');
                navigation.navigate("MainTabs");  // Add this line
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

            <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
            />

            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <View style={styles.input}>
                    <Text>{birthDate.toLocaleDateString()}</Text>
                </View>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={birthDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            <RNPickerSelect
                onValueChange={(value) => setGender(value)}
                items={[
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' },
                    { label: 'Other', value: 'other' },
                ]}
                style={pickerSelectStyles}
                placeholder={{ label: 'Select Gender', value: null }}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={goBack}>
                <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
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
    input: {
        marginVertical: 10,
        height: 50,
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    button: {
        marginVertical: 20,
        backgroundColor: '#6200ea',
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 4,
        color: 'black',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 0.5,
        borderColor: 'purple',
        borderRadius: 8,
        color: 'black',
        paddingRight: 30,
    },
});
