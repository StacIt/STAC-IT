"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import axios from "axios"
import { Ionicons } from "@expo/vector-icons"
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig"
import { doc, setDoc } from "firebase/firestore"
import * as SMS from "expo-sms"
import type { NavigationProp } from "@react-navigation/native"

interface Timing {
    start: string
    end: string
}

interface StacFormProps {
    navigation: NavigationProp<any>
    visible: boolean
    onClose: () => void
    onFinalize?: () => void
    initialStacName?: string
    initialDate?: Date
    initialStartTime?: Date | null
    initialEndTime?: Date | null
    initialCity?: string
    initialState?: string
    initialActivities?: string[]
    initialNumberOfPeople?: string
    initialBudget?: string
}

const validStates = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
]

const activityExamples = [
    "Grab a coffee",
    "Watch a movie",
    "Go biking",
    "Visit a park",
    "Attend local music event",
    "Try a new restaurant",
    "Visit a museum",
    "Go bowling",
]

const StacForm: React.FC<StacFormProps> = ({
    navigation,
    visible,
    onClose,
    onFinalize,
    initialStacName = "",
    initialDate = new Date(),
    initialStartTime = null,
    initialEndTime = null,
    initialCity = "",
    initialState = "",
    initialActivities = [""],
    initialNumberOfPeople = "",
    initialBudget = "",
}) => {
    const [stacName, setStacName] = useState(initialStacName)
    const [date, setDate] = useState(initialDate)
    const [startTime, setStartTime] = useState<Date | null>(initialStartTime)
    const [endTime, setEndTime] = useState<Date | null>(initialEndTime)
    const [city, setCity] = useState(initialCity)
    const [state, setState] = useState(initialState)
    const [activities, setActivities] = useState(initialActivities)
    const [numberOfPeople, setNumberOfPeople] = useState(initialNumberOfPeople)
    const [budget, setBudget] = useState(initialBudget)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showStartTimePicker, setShowStartTimePicker] = useState(false)
    const [showEndTimePicker, setShowEndTimePicker] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [modelResponse, setModelResponse] = useState("")
    const [responseModalVisible, setResponseModalVisible] = useState(false)
    const [phoneNumbers, setPhoneNumbers] = useState("")
    const [preferences, setPreferences] = useState<string[]>([])
    const [options, setOptions] = useState<Record<string, string[]>>({})
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
    const [descriptions, setDescriptions] = useState<Record<string, string>>({})
    const [locations, setLocations] = useState<Record<string, string>>({})
    const [preferenceTimings, setPreferenceTimings] = useState<Record<string, Timing>>({})
    useEffect(() => {
        if (visible) {
            setStacName("");
            setDate(new Date());
            setStartTime(null);
            setEndTime(null);
            setCity("");
            setState("");
            setActivities([""]);
            setNumberOfPeople("");
            setBudget("");
            setModelResponse("");
            setOptions({});
            setSelectedOptions({});
            setPreferences([]);
            setDescriptions({});
            setLocations({});
            setPreferenceTimings({});
        }
    }, [visible]);

    // Create refs for each input field
    const stacNameRef = useRef<TextInput>(null)
    const cityRef = useRef<TextInput>(null)
    const stateRef = useRef<TextInput>(null)
    const activityRefs = useRef<Array<TextInput | null>>([])
    const numberOfPeopleRef = useRef<TextInput>(null)
    const budgetRef = useRef<TextInput>(null)

    const scrollViewRef = useRef<ScrollView>(null)

    const formatTime = (time: Date | null): string => {
        if (!time) return "Select Time"
        const hours = time.getHours()
        const minutes = time.getMinutes()
        const ampm = hours >= 12 ? "pm" : "am"
        const formattedHours = hours % 12 || 12
        return `${formattedHours}:${minutes.toString().padStart(2, "0")}${ampm}`
    }

    const validateEndTime = (selectedTime: Date) => {
        if (startTime && selectedTime < startTime) {
            Alert.alert("Error", "End Time cannot be earlier than Start Time.")
            return false
        }
        return true
    }

    const parseModelResponse = (response: string) => {
        try {
            let cleanResponse = response.trim()
            if (cleanResponse.startsWith("```json") && cleanResponse.endsWith("```")) {
                cleanResponse = cleanResponse.slice(7, -3).trim()
            }
            const jsonData = typeof cleanResponse === "string" ? JSON.parse(cleanResponse) : cleanResponse

            const preferences: string[] = []
            const options: Record<string, string[]> = {}
            const descriptions: Record<string, string> = {}
            const locations: Record<string, string> = {}
            const preferenceTimings: Record<string, Timing> = {}

            jsonData.preferences.forEach((preferenceObj: any) => {
                const preference = preferenceObj.preference
                preferences.push(preference)
                options[preference] = preferenceObj.options.map((option: any) => option.name)

                if (preferenceObj.options.length > 0 && preferenceObj.options[0].timing) {
                    preferenceTimings[preference] = {
                        start: preferenceObj.options[0].timing.start || "",
                        end: preferenceObj.options[0].timing.end || "",
                    }
                }

                preferenceObj.options.forEach((option: any) => {
                    descriptions[option.name] = option.activity_description
                    locations[option.name] = option.location || ""
                })
            })

            return { preferences, options, descriptions, locations, preferenceTimings }
        } catch (error) {
            console.error("Error parsing model response:", error)
            return {
                preferences: [],
                options: {},
                descriptions: {},
                locations: {},
                preferenceTimings: {},
            }
        }
    }

    const validateForm = () => {
        if (!startTime || !endTime || !city || !state || activities.length === 0 || !budget || !numberOfPeople) {
            Alert.alert("Error", "All fields are required.")
            return false
        }

        if (!validStates.includes(state.toUpperCase())) {
            Alert.alert("Error", "Please enter a valid US state abbreviation.")
            return false
        }

        if (isNaN(Number(budget)) || Number(budget) <= 0) {
            Alert.alert("Error", "Budget must be a positive number.")
            return false
        }
        if (isNaN(Number(numberOfPeople)) || Number(numberOfPeople) <= 0) {
            Alert.alert("Error", "Number of people must be a positive number.")
            return false
        }

        return true
    }

    const callBackendModel = async (message: string) => {
        try {
            const response = await axios.post(
                "https://stac-it-backend.onrender.com/chatbot/call-model/",
                new URLSearchParams({ message }),
                {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                },
            )
            return response.data
        } catch (error) {
            console.error(error)
            Alert.alert("Error", "Failed to call backend model.")
        }
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

                const userInput = `Date: ${date.toDateString()}, Location: ${city}, ${state.toUpperCase()}, Preferences: ${preferences}, Budget: ${budget}, Time period: ${formatTime(startTime)} - ${formatTime(endTime)}, Number of people: ${numberOfPeople}`
                const response = await callBackendModel(userInput)

                // Parse the response and update state
                const parsedData = parseModelResponse(response)
                setPreferences(parsedData.preferences)
                setOptions(parsedData.options)
                setDescriptions(parsedData.descriptions)
                setLocations(parsedData.locations)
                setPreferenceTimings(parsedData.preferenceTimings)

                setModelResponse(response)
                setResponseModalVisible(true)
                onClose()
            } catch (error) {
                console.error("Error:", error)
                Alert.alert("Error", "Failed to create STAC")
            } finally {
                setIsLoading(false)
            }
        }
    }

    const handleShare = async () => {
        try {
            const phoneNumbersArray = phoneNumbers.split(",").map((num) => num.trim())
            await SMS.sendSMSAsync(phoneNumbersArray, modelResponse)
        } catch (error) {
            Alert.alert("Error", "Failed to send message.")
            console.error("Error sharing STAC:", error)
        }
    }

    const handleFinalize = async () => {
        const user = FIREBASE_AUTH.currentUser
        if (!user) {
            Alert.alert("Error", "You must be logged in to finalize a STAC.")
            return
        }

        const filteredOptions: Record<string, string[]> = {}
        Object.keys(selectedOptions).forEach((preference) => {
            if (selectedOptions[preference].length > 0) {
                filteredOptions[preference] = selectedOptions[preference]
            }
        })

        if (Object.keys(filteredOptions).length === 0) {
            Alert.alert("Error", "You must select at least one activity before finalizing.")
            return
        }

        const detailedSelectedOptions: Record<string, Array<{ name: string; description: string; location: string }>> = {}
        Object.keys(filteredOptions).forEach((preference) => {
            detailedSelectedOptions[preference] = filteredOptions[preference].map((option) => ({
                name: option,
                description: descriptions[option] || "",
                location: locations[option] || "",
            }))
        })

        try {
            const stackId = Date.now().toString()
            const finalizedStac = {
                userId: user.uid,
                stacName,
                selectedOptions: filteredOptions,
                detailedSelectedOptions,
                preferenceTimings,
                date: date.toDateString(),
                startTime: startTime?.toISOString(),
                endTime: endTime?.toISOString(),
                location: `${city}, ${state.toUpperCase()}`,
                budget,
                numberOfPeople,
                createdAt: new Date().toISOString(),
            }

            await setDoc(doc(FIREBASE_DB, "stacks", stackId), finalizedStac)
            setResponseModalVisible(false)
            if (onFinalize) onFinalize()
            navigation.navigate("Home")
        } catch (error) {
            console.error("Error finalizing STAC:", error)
            Alert.alert("Error", "Failed to finalize STAC")
        }
    }

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date
        setShowDatePicker(false)
        setDate(currentDate)
    }

    const addActivity = () => {
        setActivities([...activities, ""])
    }

    const removeActivity = (index: number) => {
        if (index === 0) return
        const newActivities = activities.filter((_, i) => i !== index)
        setActivities(newActivities)
    }

    const updateActivity = (text: string, index: number) => {
        const newActivities = [...activities]
        newActivities[index] = text
        setActivities(newActivities)
    }

    const handleRefresh = async () => {
        if (!city || !state || activities.length === 0 || !budget) {
            Alert.alert("Error", "Please fill in all required fields before refreshing.")
            return
        }

        setIsLoading(true)
        try {
            const selectedPrefs = Object.keys(selectedOptions)
                .filter((pref) => selectedOptions[pref].length > 0)
                .map((pref) => `${pref}: ${selectedOptions[pref].join(", ")}`)
                .join("; ")

            const prefsToUse = activities.filter((a) => a.trim() !== "").join(", ")
            const selectedInfo = selectedPrefs.length > 0 ? ` (Keep these options: ${selectedPrefs})` : ""

            const userInput = `Date: ${date.toDateString()}, Location: ${city}, ${state.toUpperCase()}, Preferences: ${prefsToUse}${selectedInfo}, Budget: ${budget}, Time period: ${formatTime(startTime)} - ${formatTime(endTime)}, Number of people: ${numberOfPeople}`
            const response = await callBackendModel(userInput)

            // Parse the response and update state
            const parsedData = parseModelResponse(response)
            setPreferences(parsedData.preferences)
            setOptions(parsedData.options)
            setDescriptions(parsedData.descriptions)
            setLocations(parsedData.locations)
            setPreferenceTimings(parsedData.preferenceTimings)

            setModelResponse(response)
        } catch (error) {
            console.error("Error refreshing model response:", error)
            Alert.alert("Error", "Failed to refresh model response.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = () => {
        Alert.alert("Delete STAC", "Are you sure you want to delete this STAC?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Delete",
                onPress: () => {
                    setResponseModalVisible(false)
                    onClose()
                    setStacName("")
                    setStartTime(null)
                    setEndTime(null)
                    setCity("")
                    setState("")
                    setBudget("")
                    setActivities([""])
                    setNumberOfPeople("")
                    setDate(new Date())
                    setModelResponse("")
                    setOptions({})
                    setSelectedOptions({})
                    setPreferences([])
                    setDescriptions({})
                    setLocations({})
                    setPreferenceTimings({})
                    Alert.alert("Success", "STAC deleted successfully!")
                },
            },
        ])
    }

    const dismissKeyboard = () => {
        Keyboard.dismiss()
    }

    // Function to focus the next input field
    const focusNextInput = (nextRef: React.RefObject<TextInput> | null) => {
        if (nextRef && nextRef.current) {
            nextRef.current.focus()
        }
    }

    return (
        <>
            {/* Create STAC Modal */}
            <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <TouchableWithoutFeedback onPress={dismissKeyboard}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Create a New STAC</Text>

                                <ScrollView
                                    ref={scrollViewRef}
                                    style={styles.formScrollView}
                                    contentContainerStyle={styles.scrollViewContent}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <TextInput
                                        ref={stacNameRef}
                                        style={styles.input}
                                        placeholder="STAC Name"
                                        value={stacName}
                                        onChangeText={setStacName}
                                        returnKeyType="next"
                                        onSubmitEditing={() => setShowDatePicker(true)}
                                        blurOnSubmit={false}
                                    />

                                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                                        <Text>{date.toDateString()}</Text>
                                    </TouchableOpacity>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={date}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                onChangeDate(event, selectedDate)
                                                setShowStartTimePicker(true)
                                            }}
                                        />
                                    )}

                                    <TouchableOpacity onPress={() => setShowStartTimePicker(true)} style={styles.input}>
                                        <Text>{formatTime(startTime)}</Text>
                                    </TouchableOpacity>
                                    {showStartTimePicker && (
                                        <DateTimePicker
                                            value={startTime || new Date()}
                                            mode="time"
                                            is24Hour={false}
                                            display="default"
                                            onChange={(event, selectedTime) => {
                                                setShowStartTimePicker(false)
                                                if (selectedTime) {
                                                    setStartTime(selectedTime)
                                                    setShowEndTimePicker(true)
                                                }
                                            }}
                                        />
                                    )}

                                    <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={styles.input}>
                                        <Text>{formatTime(endTime)}</Text>
                                    </TouchableOpacity>
                                    {showEndTimePicker && (
                                        <DateTimePicker
                                            value={endTime || new Date()}
                                            mode="time"
                                            is24Hour={false}
                                            display="default"
                                            onChange={(event, selectedTime) => {
                                                setShowEndTimePicker(false)
                                                if (selectedTime && validateEndTime(selectedTime)) {
                                                    setEndTime(selectedTime)
                                                    cityRef.current?.focus()
                                                }
                                            }}
                                        />
                                    )}

                                    <TextInput
                                        ref={cityRef}
                                        style={styles.input}
                                        placeholder="City"
                                        value={city}
                                        onChangeText={setCity}
                                        returnKeyType="next"
                                        onSubmitEditing={() => focusNextInput(stateRef)}
                                        blurOnSubmit={false}
                                    />

                                    <TextInput
                                        ref={stateRef}
                                        style={styles.input}
                                        placeholder="State (e.g., CA)"
                                        value={state}
                                        onChangeText={setState}
                                        maxLength={2}
                                        returnKeyType="next"
                                        onSubmitEditing={() => {
                                            if (activityRefs.current[0]) {
                                                activityRefs.current[0]?.focus()
                                            }
                                        }}
                                        blurOnSubmit={false}
                                    />

                                    {activities.map((activity, index) => (
                                        <View key={index} style={styles.activityContainer}>
                                            <TextInput
                                                ref={(ref) => {
                                                    // Initialize the array if needed
                                                    if (!activityRefs.current) {
                                                        activityRefs.current = []
                                                    }
                                                    // Store the ref at this index
                                                    activityRefs.current[index] = ref
                                                }}
                                                style={styles.activityInput}
                                                placeholder={`Activity ${index + 1} (e.g., ${activityExamples[index % activityExamples.length]})`}
                                                value={activity}
                                                onChangeText={(text) => updateActivity(text, index)}
                                                returnKeyType={index === activities.length - 1 ? "next" : "done"}
                                                onSubmitEditing={() => {
                                                    if (index === activities.length - 1) {
                                                        // If it's the last activity, focus on number of people
                                                        focusNextInput(numberOfPeopleRef)
                                                    } else {
                                                        // Otherwise focus on the next activity
                                                        focusNextInput(
                                                            activityRefs.current[index + 1] ? { current: activityRefs.current[index + 1] } : null,
                                                        )
                                                    }
                                                }}
                                                blurOnSubmit={false}
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
                                        ref={numberOfPeopleRef}
                                        style={styles.input}
                                        placeholder="Number of People"
                                        value={numberOfPeople}
                                        onChangeText={setNumberOfPeople}
                                        returnKeyType="next"
                                        onSubmitEditing={() => focusNextInput(budgetRef)}
                                        blurOnSubmit={false}
                                    />

                                    <TextInput
                                        ref={budgetRef}
                                        style={styles.input}
                                        placeholder="Budget ($maximum per person)"
                                        value={budget}
                                        onChangeText={setBudget}
                                        returnKeyType="done"
                                        onSubmitEditing={() => {
                                            dismissKeyboard()
                                            if (!isLoading) {
                                                handleCreateStack()
                                            }
                                        }}
                                    />

                                    <View style={{ height: 100 }} />
                                </ScrollView>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={[styles.footerButton, styles.submitButton, isLoading && styles.disabledButton]}
                                        onPress={() => {
                                            dismissKeyboard()
                                            handleCreateStack()
                                        }}
                                        disabled={isLoading}
                                    >
                                        <Text style={styles.footerButtonText}>{isLoading ? "Loading..." : "Submit"}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.footerButton, styles.cancelButton]}
                                        onPress={() => {
                                            dismissKeyboard()
                                            onClose()
                                        }}
                                    >
                                        <Text style={styles.footerButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            {/* Response Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={responseModalVisible}
                onRequestClose={() => setResponseModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{stacName || "Untitled STAC"}</Text>
                        <View style={styles.responseContainer}>
                            <ScrollView style={styles.responseScroll}>
                                {preferences.length > 0 ? (
                                    preferences.map((preference) => (
                                        <View key={preference} style={styles.preferenceSection}>
                                            <Text style={styles.preferenceTitle}>🌟 {preference}</Text>

                                            {preferenceTimings[preference] && (
                                                <View style={styles.preferenceTimingContainer}>
                                                    <Ionicons name="time-outline" size={16} color="#666" style={styles.timingIcon} />
                                                    <Text style={styles.preferenceTimingText}>
                                                        {preferenceTimings[preference].start} - {preferenceTimings[preference].end}
                                                    </Text>
                                                </View>
                                            )}

                                            {options[preference]?.length > 0 ? (
                                                options[preference].map((option) => (
                                                    <View key={option}>
                                                        <TouchableOpacity
                                                            style={styles.checkboxContainer}
                                                            onPress={() => {
                                                                setSelectedOptions((prev) => {
                                                                    const updated = { ...prev }
                                                                    if (!updated[preference]) updated[preference] = []
                                                                    if (updated[preference].includes(option)) {
                                                                        updated[preference] = updated[preference].filter((o) => o !== option)
                                                                    } else {
                                                                        updated[preference] = [option]
                                                                    }
                                                                    return updated
                                                                })
                                                            }}
                                                        >
                                                            <Ionicons
                                                                name={selectedOptions[preference]?.includes(option) ? "checkbox" : "square-outline"}
                                                                size={24}
                                                                color="black"
                                                            />
                                                            <Text style={styles.checkboxLabel}>{option}</Text>
                                                        </TouchableOpacity>

                                                        {descriptions[option] && (
                                                            <Text style={styles.activityDescription}>{descriptions[option]}</Text>
                                                        )}

                                                        {locations[option] && (
                                                            <View style={styles.locationContainer}>
                                                                <Ionicons name="location" size={16} color="#666" style={styles.locationIcon} />
                                                                <Text style={styles.locationText}>{locations[option]}</Text>
                                                            </View>
                                                        )}

                                                        <View style={styles.optionDivider} />
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.noOptionsText}>No options available</Text>
                                            )}
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noDataText}>No preferences detected</Text>
                                )}
                            </ScrollView>
                        </View>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, isLoading ? styles.refreshingButton : styles.refreshButton]}
                                onPress={handleRefresh}
                                disabled={isLoading}
                            >
                                <Text style={styles.buttonText}>{isLoading ? "Refreshing..." : "Refresh"}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={handleFinalize}>
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={handleDelete} style={styles.deleteTextContainer}>
                            <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
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
        flexGrow: 1,
        paddingBottom: 20,
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
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    activityContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
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
        backgroundColor: "#dc3545",
    },
    preferenceSection: {
        marginVertical: 10,
    },
    preferenceTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 5,
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 16,
    },
    noOptionsText: {
        fontSize: 16,
        color: "gray",
        textAlign: "center",
        marginTop: 10,
    },
    noDataText: {
        fontSize: 16,
        color: "gray",
        textAlign: "center",
        marginTop: 20,
    },
    activityDescription: {
        fontSize: 14,
        color: "#666",
        marginLeft: 34,
        marginTop: 5,
        marginBottom: 10,
        paddingRight: 10,
    },
    locationContainer: {
        flexDirection: "row",
        marginLeft: 34,
        marginTop: 5,
        marginBottom: 10,
        alignItems: "center",
    },
    locationIcon: {
        marginRight: 5,
    },
    locationText: {
        fontSize: 14,
        color: "#666",
        flex: 1,
    },
    preferenceTimingContainer: {
        flexDirection: "row",
        marginLeft: 5,
        marginTop: 5,
        marginBottom: 10,
        alignItems: "center",
    },
    timingIcon: {
        marginRight: 5,
    },
    preferenceTimingText: {
        fontSize: 14,
        color: "#007bff",
        fontWeight: "500",
    },
    optionDivider: {
        height: 1,
        backgroundColor: "#e0e0e0",
        marginVertical: 10,
        marginLeft: 34,
    },
    deleteTextContainer: {
        alignItems: "center",
        marginTop: 10,
        padding: 5,
    },
    deleteText: {
        color: "#dc3545",
        fontSize: 16,
        fontWeight: "bold",
    },
})

export default StacForm