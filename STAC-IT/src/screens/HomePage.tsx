import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Modal,
    TextInput
} from 'react-native';
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NavigationProp, RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SMS from 'expo-sms';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

interface HomePageProps {
    navigation: NavigationProp<any>;
}

interface Stac {
    id: string;
    userId: string;
    stacName: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    preferences: string;
    budget: string;
    numberOfPeople: string;
    modelResponse?: string;
    selectedOptions?: { [key: string]: string[] }; // Make selectedOptions optional
}

const HomePage: React.FC<HomePageProps> = ({ navigation }) => {

    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [activities, setActivities] = useState(['']);
    const [numberOfPeople, setNumberOfPeople] = useState('');
    const [budget, setBudget] = useState('');
    const [isLoading, setIsLoading] = useState(false)
    const [modelResponse, setModelResponse] = useState('');
    const [responseModalVisible, setResponseModalVisible] = useState(false);
    const [scheduledStacs, setScheduledStacs] = useState<Stac[]>([]);
    const [pastStacs, setPastStacs] = useState<Stac[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStac, setSelectedStac] = useState<Stac | null>(null);
    const [stacName, setStacName] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const handleStacPress = (stac: Stac) => {
        setSelectedStac(stac);
        setModalVisible(true);
    };

    const validStates = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

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

    const fetchStacs = useCallback(async () => {
        const user = FIREBASE_AUTH.currentUser;
        if (!user) return;

        try {
            const stacsRef = collection(FIREBASE_DB, 'stacks');
            const q = query(stacsRef, where('userId', '==', user.uid));

            const querySnapshot = await getDocs(q);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            const fetchedScheduledStacs: Stac[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data() as Stac;
                const stacDate = new Date(data.date);
                stacDate.setHours(0, 0, 0, 0);

                if (data.selectedOptions && Object.keys(data.selectedOptions).length > 0) {

                    const stac = { ...data, id: doc.id };

                    if (stacDate >= currentDate) {
                        fetchedScheduledStacs.push(stac);
                    }
                }
            });

            setScheduledStacs(fetchedScheduledStacs);
            console.log("Scheduled STACs:", fetchedScheduledStacs);
        } catch (error) {
            console.error("Error fetching stacs:", error);
            Alert.alert("Error", "Failed to load STACs");
        }
    }, []);


    useFocusEffect(
        useCallback(() => {
            fetchStacs();
        }, [fetchStacs])
    );
    const deleteStac = async (stacId: string) => {
        try {
            await deleteDoc(doc(FIREBASE_DB, "stacks", stacId));
            Alert.alert("Success", "STAC deleted successfully!");
            setModalVisible(false); // ✅ 关闭模态框
            fetchStacs(); // ✅ 重新加载 STAC
        } catch (error) {
            console.error("Error deleting STAC:", error);
            Alert.alert("Error", "Failed to delete STAC");
        }
    };

    const formatTime = (time: Date | null): string => {
        if (!time) return "Select Time";
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const ampm = hours >= 12 ? "pm" : "am";
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes.toString().padStart(2, "0")}${ampm}`;
    };
    const validateForm = () => {
        if (!startTime || !endTime || !city || !state || activities.length === 0 || !budget || !numberOfPeople) {
            Alert.alert("Error", "All fields are required.")
            return false
        }

        if (!validStates.includes(state.toUpperCase())) {
            Alert.alert("Error", "Please enter a valid US state abbreviation.")
            return false
        }
        return true
    }
    const handleCreateStack = async () => {
        setModelResponse("")
        setIsLoading(true)

        if (!validateForm()) {
            setIsLoading(false)
            return
        }
        let budgetCategory = ""
        const budgetValue = Number.parseInt(budget, 10)

        if (budgetValue < 30) {
            budgetCategory = "cheap"
        } else if (budgetValue >= 30 && budgetValue <= 60) {
            budgetCategory = "moderate"
        } else if (budgetValue > 60) {
            budgetCategory = "expensive"
        } else {
            Alert.alert("Error", "Invalid budget value.")
            return
        }

        const preferences = activities.filter((a) => a.trim() !== "").join(", ")

        const user = FIREBASE_AUTH.currentUser
        if (user) {
            try {
                const stackId = Date.now().toString()

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
                })
                const userInput = `Date: ${date.toDateString()}, Location: ${city}, ${state.toUpperCase()}, Preferences: ${preferences}, Budget: ${budget}`
                const response = await callBackendModel(userInput)

                setModelResponse(response)
                setResponseModalVisible(true)
                setModalVisible(false)
            } catch (error) {
                console.error("Error:", error)
                Alert.alert("Error", "Failed to create STAC")
            } finally {
                setIsLoading(false)
            }
        }
    }
    const callBackendModel = async (message: string) => {
        console.log("Calling backend model...")
        try {
            console.log(message)
            const response = await axios.post("http://10.0.2.2:8000/chatbot/call-model/", new URLSearchParams({ message }), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            })
            return response.data
        } catch (error) {
            console.error(error)
            Alert.alert("Error", "Failed to call backend model.")
        }
    }
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

    const handleShareWithFriends = async (stac: Stac) => {
        try {
            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable) {
                const message = `
STAC Plan: ${stac.stacName}
Date: ${stac.date}
Time: ${new Date(stac.startTime).toLocaleTimeString()} - ${new Date(stac.endTime).toLocaleTimeString()}
Location: ${stac.location}
Preferences: ${stac.preferences}
Budget: ${stac.budget}
Number of People: ${stac.numberOfPeople}

Recommendations:
${stac.modelResponse || 'No recommendations available'}
                `.trim();

                const { result } = await SMS.sendSMSAsync([], message);
                if (result === 'sent') {
                    Alert.alert('Success', 'STAC shared successfully!');
                }
            } else {
                Alert.alert('Error', 'SMS is not available on this device');
            }
        } catch (error) {
            console.error('Error sharing STAC:', error);
            Alert.alert('Error', 'Failed to share STAC');
        }
    };


    const renderStacList = (stacs: Stac[], title: string) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {stacs.length === 0 ? (
                <Text style={styles.noStacsText}>No {title.toLowerCase()} available</Text>
            ) : (
                stacs.map((stac) => (
                    <View key={stac.id} style={styles.stacContainer}>
                        <TouchableOpacity
                            style={styles.stacButton}
                            onPress={() => handleStacPress(stac)}
                        >
                            <Text style={styles.buttonText}>{stac.stacName}</Text>
                            <Text style={styles.stacDetails}>
                                {new Date(stac.date).toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>

                    </View>
                ))
            )}
        </View>
    );
    const validateEndTime = (selectedTime: Date) => {
        if (startTime && selectedTime < startTime) {
            Alert.alert("Error", "End Time cannot be earlier than Start Time.")
            return false
        }
        return true
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>STAC-IT</Text>

            <TouchableOpacity
                style={styles.activityButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.buttonText}>Start New STAC</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                {selectedStac && (
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{selectedStac.stacName}</Text>
                        <Text>Date: {selectedStac.date}</Text>
                        <Text>Location: {selectedStac.location}</Text>
                        <Text>Selected Activities:</Text>
                        <ScrollView>
                            {Object.keys(selectedStac.selectedOptions).map((preference) => (
                                <View key={preference}>
                                    <Text style={styles.preferenceTitle}>🌟 {preference}</Text>
                                    {selectedStac.selectedOptions[preference].map((option) => (
                                        <TouchableOpacity key={option} style={styles.checkboxContainer}>
                                            <Ionicons name="checkbox" size={24} color="black" />
                                            <Text style={styles.checkboxLabel}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => deleteStac(selectedStac.id)}
                            >
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Modal>




            {renderStacList(scheduledStacs, "Scheduled STAC")}
            {renderStacList(pastStacs, "Past History")}
        </ScrollView>
    );
};

const StacDetailsScreen: React.FC = () => {
    const route = useRoute<RouteProp<{ params: { stac: Stac; onDelete: () => void } }>>();
    const navigation = useNavigation();
    const { stac, onDelete } = route.params;

    const handleDelete = async () => {
        Alert.alert(
            "Delete STAC",
            "Are you sure you want to delete this STAC?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Delete the model response entry
                            await deleteDoc(doc(FIREBASE_DB, "stacks", stac.id));

                            // Query to find the original stack creation entry
                            const stacsRef = collection(FIREBASE_DB, 'stacks');
                            const q = query(stacsRef,
                                where('userId', '==', stac.userId),
                                where('stacName', '==', stac.stacName),
                                where('date', '==', stac.date)
                            );
                            const querySnapshot = await getDocs(q);

                            // Delete the original stack creation entry if found
                            querySnapshot.forEach(async (document) => {
                                if (document.id !== stac.id) {
                                    await deleteDoc(doc(FIREBASE_DB, "stacks", document.id));
                                }
                            });

                            Alert.alert("Success", "STAC deleted successfully");
                            onDelete(); // Call the onDelete function to refresh the HomePage
                            navigation.goBack();
                        } catch (error) {
                            console.error("Error deleting STAC:", error);
                            Alert.alert("Error", "Failed to delete STAC");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={styles.modalTitle}>{stac.stacName}</Text>
                <View style={styles.detailsContainer}>
                    <Text style={styles.modalLabel}>Date:</Text>
                    <Text style={styles.modalText}>{stac.date}</Text>

                    <Text style={styles.modalLabel}>Time:</Text>
                    <Text style={styles.modalText}>
                        {`${new Date(stac.startTime).toLocaleTimeString()} - ${new Date(stac.endTime).toLocaleTimeString()}`}
                    </Text>

                    <Text style={styles.modalLabel}>Location:</Text>
                    <Text style={styles.modalText}>{stac.location}</Text>

                    <Text style={styles.modalLabel}>Preferences:</Text>
                    <Text style={styles.modalText}>{stac.preferences}</Text>

                    <Text style={styles.modalLabel}>Budget:</Text>
                    <Text style={styles.modalText}>{stac.budget}</Text>

                    <Text style={styles.modalLabel}>Number of People:</Text>
                    <Text style={styles.modalText}>{stac.numberOfPeople}</Text>

                    <Text style={styles.modalLabel}>Recommendations:</Text>
                    <Text style={styles.modalText}>{stac.modelResponse || 'No recommendations available'}</Text>
                </View>
            </ScrollView>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.buttonText}>Delete STAC</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeButtonText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({

    title: {
        marginTop: 70,
        fontSize: 36,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    section: {
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#4a4a4a',
        marginBottom: 10,
    },

    activityButton: {
        backgroundColor: '#6200ea',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    stacContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    stacButton: {
        backgroundColor: '#4a4a4a',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
    },
    stacDetails: {
        color: '#ddd',
        fontSize: 12,
        marginTop: 4,
    },
    shareButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginLeft: 10,
    },

    shareButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },

    detailsContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4a4a4a',
        marginTop: 10,
    },
    modalText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },

    closeButton: {
        backgroundColor: '#6200ea',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },

    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noStacsText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 10,
        fontStyle: 'italic',

    },




    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f0f2f5'
    },
    createButton: {
        backgroundColor: "#6200ea",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: "white",
        fontSize: 18,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
    },
    modalContent: {
        flex: 1,
        backgroundColor: "white",
        margin: 20,
        borderRadius: 10,
        padding: 20,
        maxHeight: "80%",
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    formScrollView: {
        height: 400,
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 100,
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    footerButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: "center",
    },
    submitButton: {
        backgroundColor: "#6200ea",
        marginRight: 5,
    },
    cancelButton: {
        backgroundColor: "red",
        marginLeft: 5,
    },
    footerButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    input: {
        width: "100%",
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        marginBottom: 10,
    },
    responseContainer: {
        flex: 1,
        marginVertical: 2,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
    },
    responseScroll: {
        flex: 1,
        padding: 10,
    },
    responseText: {
        fontSize: 16,
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 10,
    },
    button: {
        backgroundColor: "#6200ea",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
        alignItems: "center",
    },
    activityContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        flexShrink: 0,
    },
    activityInput: {
        flex: 1,
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
    },
    iconButton: {
        marginLeft: 10,
    },
    disabledButton: {
        opacity: 0.5,
    },
    refreshButton: {
        backgroundColor: "#4CAF50",
    },
    refreshingButton: {
        backgroundColor: "#9E9E9E",
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    }



});

export { HomePage, StacDetailsScreen };