import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Button,
    ScrollView,
    Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { doc, setDoc } from "firebase/firestore";

const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
    'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
    'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
    'WI', 'WY'
];

const CreateStack: React.FC = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [stacName, setStacName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [preferences, setPreferences] = useState('');
    const [budget, setBudget] = useState('');
    const [numberOfPeople, setNumberOfPeople] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const isValidTime = (time: string) => {
        const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return regex.test(time);
    };

    const validateForm = () => {
        if (
            !startTime || !endTime || !city || !state || !preferences ||
            !budget || !numberOfPeople
        ) {
            Alert.alert('Error', 'All fields are required.');
            return false;
        }
        if (!isValidTime(startTime) || !isValidTime(endTime)) {
            Alert.alert('Error', 'Please enter valid times in HH:MM format.');
            return false;
        }
        if (!validStates.includes(state.toUpperCase())) {
            Alert.alert('Error', 'Please enter a valid US state abbreviation.');
            return false;
        }
        if (isNaN(Number(budget)) || isNaN(Number(numberOfPeople))) {
            Alert.alert('Error', 'Budget and number of people must be numbers.');
            return false;
        }
        return true;
    };

    const handleCreateStack = () => {
        if (!validateForm()) return;
        console.log('Stack Name:', stacName);
        console.log('Start Time:', startTime);
        console.log('End Time:', endTime);
        console.log('Date:', date.toDateString());
        console.log('Location:', `${city}, ${state.toUpperCase()}`);
        console.log('Preferences:', preferences);
        console.log('Budget:', budget);
        console.log('Number of People:', numberOfPeople);

        setStacName('');
        setStartTime('');
        setEndTime('');
        setCity('');
        setState('');
        setPreferences('');
        setBudget('');
        setNumberOfPeople('');
        setModalVisible(false);

        const user = FIREBASE_AUTH.currentUser;
        if (user) {
            setDoc(doc(FIREBASE_DB, "stacks", user.uid), {
                stacName: stacName,
                startTime: startTime,
                endTime: endTime,
                date: date.toDateString(),
                location: `${city}, ${state.toUpperCase()}`,
                preferences: preferences,
                budget: budget,
                numberOfPeople: numberOfPeople,
            });

            Alert.alert('Success', 'Stack created successfully!');
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(false);
        setDate(currentDate);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.buttonText}>Create STAC</Text>
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalContent}>
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            <Text style={styles.modalTitle}>Create a New STAC</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="STAC Name"
                                value={stacName}
                                onChangeText={setStacName}
                            />

                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                style={[styles.input, styles.dateInput]}
                            >
                                <Text style={styles.dateText}>{date.toDateString()}</Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="default"
                                    onChange={onChangeDate}
                                />
                            )}

                            <TextInput
                                style={styles.input}
                                placeholder="Start Time (HH:MM)"
                                value={startTime}
                                onChangeText={setStartTime}
                                keyboardType="numeric"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="End Time (HH:MM)"
                                value={endTime}
                                onChangeText={setEndTime}
                                keyboardType="numeric"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="City"
                                value={city}
                                onChangeText={setCity}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="State (e.g., CA)"
                                value={state}
                                onChangeText={setState}
                                maxLength={2}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Preferences"
                                value={preferences}
                                onChangeText={setPreferences}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Budget"
                                value={budget}
                                onChangeText={setBudget}
                                keyboardType="numeric"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Number of People"
                                value={numberOfPeople}
                                onChangeText={setNumberOfPeople}
                                keyboardType="numeric"
                            />

                            <Button title="Submit" onPress={handleCreateStack} />
                            <Button
                                title="Cancel"
                                color="red"
                                onPress={() => setModalVisible(false)}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default CreateStack;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButton: {
        backgroundColor: '#6200ea',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    scrollContent: {
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        marginBottom: 10,
    },
    dateInput: {
        justifyContent: 'center',
    },
    dateText: {
        textAlign: 'center',
    },
});
