import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import * as SMS from 'expo-sms';
import { NavigationProp } from '@react-navigation/native';


const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
    'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
    'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
    'WI', 'WY'
];

interface CreateStackProps {
    navigation: NavigationProp<any>;
}

const CreateStack: React.FC<CreateStackProps> = ({ navigation }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [stacName, setStacName] = useState('');
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [preferences, setPreferences] = useState('');
    const [numberOfPeople, setNumberOfPeople] = useState('');
    const [budget, setBudget] = useState("");
    const [isPickerVisible, setPickerVisible] = useState(false);

    // model response and reponse modal visibility
    const [modelResponse, setModelResponse] = useState('');
    const [responseModalVisible, setResponseModalVisible] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState('');

    const openPicker = () => setPickerVisible(true);
    const closePicker = () => setPickerVisible(false);

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [stackData, setStackData] = useState<{ location: string, budget: string, preferences: string } | null>(null);


    useEffect(() => {
        fetchStackData();
    }, []);

    const fetchStackData = async () => {
        const user = FIREBASE_AUTH.currentUser;
        if (user) {
            try {
                const docRef = doc(FIREBASE_DB, "stacks", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStackData({
                        location: data.location || '',
                        budget: data.budget || '',
                        preferences: data.preferences || ''
                    });
                    console.log("Fetched stack data:", data);
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching document:", error);
            }
        }
    }
    const formatTime = (time: Date | null): string => {
        if (!time) return "Select Time";
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const ampm = hours >= 12 ? "pm" : "am";
        const formattedHours = hours % 12 || 12; // Convert to 12-hour format
        return `${formattedHours}:${minutes.toString().padStart(2, "0")}${ampm}`;
    };

    const validateEndTime = (selectedTime: Date) => {
        if (startTime && selectedTime < startTime) {
            Alert.alert("Error", "End Time cannot be earlier than Start Time.");
            return false;
        }
        return true;
    };

    const validateForm = () => {
        if (
            !startTime || !endTime || !city || !state || !preferences ||
            !budget || !numberOfPeople
        ) {
            Alert.alert('Error', 'All fields are required.');
            return false;
        }

        if (!validStates.includes(state.toUpperCase())) {
            Alert.alert('Error', 'Please enter a valid US state abbreviation.');
            return false;
        }
        return true;
    };

    const callBackendModel = async (message: string) => {
        console.log("Calling backend model...");
        try {
            console.log(message);
            const response = await axios.post(
                'http://localhost:8000/chatbot/call-model/',
                new URLSearchParams({ message }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            setModelResponse(response.data);
            setResponseModalVisible(true);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to call backend model.');
        }
    };

    const handleCreateStack = async () => {
        if (!validateForm()) return;
        let budgetCategory = "";
        const budgetValue = parseInt(budget, 10);

        if (budgetValue < 30) {
            budgetCategory = "cheap";
        } else if (budgetValue >= 30 && budgetValue <= 60) {
            budgetCategory = "moderate";
        } else if (budgetValue > 60) {
            budgetCategory = "expensive";
        } else {
            Alert.alert("Error", "Invalid budget value.");
            return;
        }

        const user = FIREBASE_AUTH.currentUser;
        if (user) {
            try {
                // Generate a unique document ID
                const stackId = Date.now().toString();

                // Create the stack document with the user's ID
                await setDoc(doc(FIREBASE_DB, "stacks", stackId), {
                    userId: user.uid, // Add this field
                    stacName,
                    startTime: startTime?.toISOString(),
                    endTime: endTime?.toISOString(),
                    date: date.toDateString(),
                    location: `${city}, ${state.toUpperCase()}`,
                    preferences,
                    budget: budgetCategory,
                    numberOfPeople,
                    createdAt: new Date().toISOString(),
                });

                Alert.alert('Success', 'Stack created successfully!');
                const userInput = `Location: ${city}, ${state.toUpperCase()}, Preferences: ${preferences}, Budget: ${budget}`;
                await callBackendModel(userInput);

            } catch (error) {
                console.error("Error saving document:", error);
                Alert.alert('Error', 'Failed to create STAC');
            }
        }
    };


    const handleShareWithFriends = async () => {
        try {
            const phoneNumbersArray = phoneNumbers.split(',').map(num => num.trim());
            await SMS.sendSMSAsync(phoneNumbersArray, modelResponse);
            Alert.alert("Success", "Message sent to friends!");
        } catch (error) {
            Alert.alert("Error", "Failed to send message.");
            console.error("Error sharing STAC:", error);
        }
    };

    const handleAddToList = () => {
        const user = FIREBASE_AUTH.currentUser;
        if (user) {
            // Update the document with the model response
            const stackId = Date.now().toString();
            setDoc(doc(FIREBASE_DB, "stacks", stackId), {
                userId: user.uid,
                stacName,
                startTime: startTime?.toISOString(),
                endTime: endTime?.toISOString(),
                date: date.toDateString(),
                location: `${city}, ${state.toUpperCase()}`,
                preferences,
                budget,
                numberOfPeople,
                modelResponse,
                createdAt: new Date().toISOString(),
            }, { merge: true });
        }

        navigation.navigate('MainTabs', {
            screen: 'Home',
            params: {
                refresh: true
            }
        });
        setResponseModalVisible(false);
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

            {/* Modal for creating a new STAC */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create a New STAC</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="STAC Name"
                            value={stacName}
                            onChangeText={setStacName}
                        />

                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={styles.input}
                        >
                            <Text>{date.toDateString()}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onChangeDate}
                            />
                        )}

                        {/* Start Time Picker */}
                        <TouchableOpacity
                            onPress={() => setShowStartTimePicker(true)}
                            style={styles.input}
                        >
                            <Text>{formatTime(startTime)}</Text>
                        </TouchableOpacity>
                        {showStartTimePicker && (
                            <DateTimePicker
                                value={startTime || new Date()}
                                mode="time"
                                is24Hour={false}
                                display="default"
                                onChange={(event, selectedTime) => {
                                    setShowStartTimePicker(false);
                                    if (selectedTime) setStartTime(selectedTime);
                                }}
                            />
                        )}

                        {/* End Time Picker */}
                        <TouchableOpacity
                            onPress={() => setShowEndTimePicker(true)}
                            style={styles.input}
                        >
                            <Text>{formatTime(endTime)}</Text>
                        </TouchableOpacity>
                        {showEndTimePicker && (
                            <DateTimePicker
                                value={endTime || new Date()}
                                mode="time"
                                is24Hour={false}
                                display="default"
                                onChange={(event, selectedTime) => {
                                    setShowEndTimePicker(false);
                                    if (selectedTime && validateEndTime(selectedTime)) {
                                        setEndTime(selectedTime);
                                    }
                                }}
                            />
                        )}

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
                            placeholder="Number of People"
                            value={numberOfPeople}
                            onChangeText={setNumberOfPeople}
                            keyboardType="numeric"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Budget ($maximum per person)"
                            value={budget}
                            onChangeText={setBudget}
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
            </Modal>

            {/* Modal for seeing the formatted model response */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={responseModalVisible}
                onRequestClose={() => setResponseModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Model Response</Text>

                        <ScrollView contentContainerStyle={styles.responseScrollView}>
                            <Text>{modelResponse}</Text>
                        </ScrollView>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter phone numbers, separated by commas"
                            value={phoneNumbers}
                            onChangeText={setPhoneNumbers}
                        />

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button} onPress={handleShareWithFriends}>
                                <Text style={styles.buttonText}>Share with Friends</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={handleAddToList}>
                                <Text style={styles.buttonText}>Add to List</Text>
                            </TouchableOpacity>
                        </View>

                        <Button title="Close" onPress={() => setResponseModalVisible(false)} />
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
        padding: 20,
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        marginTop: 125,
        margin: 50,
        padding: 20,
        borderRadius: 10,
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
    responseScrollView: {
        paddingVertical: 10,
        maxHeight: 600,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    button: {
        backgroundColor: '#6200ea',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
    },
});