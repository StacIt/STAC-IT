import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    Button,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

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
    const [activities, setActivities] = useState(['']);
    const [numberOfPeople, setNumberOfPeople] = useState('');
    const [budget, setBudget] = useState('');
    const [isPickerVisible, setPickerVisible] = useState(false);

    const [modelResponse, setModelResponse] = useState('');
    const [responseModalVisible, setResponseModalVisible] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState('');

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
        const formattedHours = hours % 12 || 12;
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
            !startTime || !endTime || !city || !state || activities.length === 0 ||
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
                'http://10.0.2.2:8000/chatbot/call-model/',
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

        const preferences = activities.filter(a => a.trim() !== '').join(', ');

        const user = FIREBASE_AUTH.currentUser;
        if (user) {
            try {
                const stackId = Date.now().toString();

                await setDoc(doc(FIREBASE_DB, "stacks", stackId), {
                    userId: user.uid,
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
            const stackId = Date.now().toString();
            setDoc(doc(FIREBASE_DB, "stacks", stackId), {
                userId: user.uid,
                stacName,
                startTime: startTime?.toISOString(),
                endTime: endTime?.toISOString(),
                date: date.toDateString(),
                location: `${city}, ${state.toUpperCase()}`,
                preferences: activities.join(', '),
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

    const addActivity = () => {
        setActivities([...activities, '']);
    };

    const removeActivity = (index: number) => {
        if (index === 0) return;
        const newActivities = activities.filter((_, i) => i !== index);
        setActivities(newActivities);
    };

    const updateActivity = (text: string, index: number) => {
        const newActivities = [...activities];
        newActivities[index] = text;
        setActivities(newActivities);
    };

    const activityExamples = [
        'Grab a coffee',
        'Watch a movie',
        'Go biking',
        'Visit a park',
        'Attend local music event',
        'Try a new restaurant',
        'Visit a museum',
        'Go bowling'
    ];

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.buttonText}>Create STAC</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create a New STAC</Text>
                        <ScrollView style={styles.formScrollView}>
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

                            {activities.map((activity, index) => (
                                <View key={index} style={styles.activityContainer}>
                                    <TextInput
                                        style={styles.activityInput}
                                        placeholder={`Activity ${index + 1} (e.g., ${activityExamples[index % activityExamples.length]})`}
                                        value={activity}
                                        onChangeText={(text) => updateActivity(text, index)}
                                    />
                                    {index > 0 && (
                                        <TouchableOpacity onPress={() => removeActivity(index)} style={styles.iconButton}>
                                            <Ionicons name="remove-circle-outline" size={24} color="red" />
                                        </TouchableOpacity>
                                    )}
                                    {index === activities.length - 1 && (
                                        <TouchableOpacity onPress={addActivity} style={styles.iconButton}>
                                            <Ionicons name="add-circle-outline" size={24} color="green" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

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
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.footerButton, styles.submitButton]}
                                onPress={handleCreateStack}
                            >
                                <Text style={styles.footerButtonText}>Submit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.footerButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.footerButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={responseModalVisible}
                onRequestClose={() => setResponseModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <ScrollView>
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
                    </ScrollView>
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
        margin: 20,
        borderRadius: 10,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 10,
        maxHeight: '80%',
        flexDirection: 'column',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    formScrollView: {
        flexGrow: 1,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    footerButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    submitButton: {
        backgroundColor: '#6200ea',
        marginRight: 5,
    },
    cancelButton: {
        backgroundColor: 'red',
        marginLeft: 5,
    },
    footerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
    activityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    activityInput: {
        flex: 1,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
    },
    iconButton: {
        marginLeft: 10,
    },
});

