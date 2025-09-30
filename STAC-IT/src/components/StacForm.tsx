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
    ActivityIndicator,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import axios from "axios"
import { Ionicons } from "@expo/vector-icons"
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig"
import { doc, setDoc } from "firebase/firestore"
import * as SMS from "expo-sms"
import type { NavigationProp } from "@react-navigation/native"

interface StacRequest {
    date: string
    city: string
    state: string
    preferences: string
    budget: string
    timePeriod: {
        start: string
        end: string
    }
    numberOfPeople: string
    keepOptions?: string
}

interface StacResponse {
  request_id: string;
  timestamp: string;
  preferences: {
    preference: string;
    options: {
      name: string;
      activity_description: string;
      location: string;
      timing: {
        start: string;
        end: string;
      };
      open_hours: string;
    }[];
  }[];
}

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

interface TimeInputState {
    hour: string
    minute: string
    period: "AM" | "PM"
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
    const [tempDate, setTempDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState(false)
    const [showNumberPicker, setShowNumberPicker] = useState(false)

    const LoadingOverlay = () => {
        if (!isLoading) return null

        return (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#6200ea" />
                <Text style={styles.loadingText}>Contain your excitement while I build you a cool Stac...</Text>
            </View>
        )
    }

    const [modelResponse, setModelResponse] = useState("")
    const [responseModalVisible, setResponseModalVisible] = useState(false)
    const [phoneNumbers, setPhoneNumbers] = useState("")
    const [preferences, setPreferences] = useState<string[]>([])
    const [options, setOptions] = useState<Record<string, string[]>>({})
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
    const [descriptions, setDescriptions] = useState<Record<string, string>>({})
    const [locations, setLocations] = useState<Record<string, string>>({})
    const [preferenceTimings, setPreferenceTimings] = useState<Record<string, Timing>>({})

    // Custom time input states
    const [startTimeInput, setStartTimeInput] = useState<TimeInputState>({
        hour: "",
        minute: "",
        period: "AM",
    })

    const [endTimeInput, setEndTimeInput] = useState<TimeInputState>({
        hour: "",
        minute: "",
        period: "PM",
    })

    // Refs for time input fields
    const startHourRef = useRef<TextInput>(null)
    const startMinuteRef = useRef<TextInput>(null)
    const endHourRef = useRef<TextInput>(null)
    const endMinuteRef = useRef<TextInput>(null)

    useEffect(() => {
        if (visible) {
            setStacName("")
            setDate(new Date())
            setTempDate(new Date())
            setStartTime(null)
            setEndTime(null)
            setCity("")
            setState("")
            setActivities([""])
            setNumberOfPeople("")
            setBudget("")
            setModelResponse("")
            setOptions({})
            setSelectedOptions({})
            setPreferences([])
            setDescriptions({})
            setLocations({})
            setPreferenceTimings({})

            // Reset time inputs
            setStartTimeInput({
                hour: "",
                minute: "",
                period: "AM",
            })

            setEndTimeInput({
                hour: "",
                minute: "",
                period: "PM",
            })
        }
    }, [visible])

    // Update Date objects when time inputs change
    useEffect(() => {
        if (startTimeInput.hour && startTimeInput.minute) {
            const newDate = new Date()
            let hours = Number.parseInt(startTimeInput.hour, 10)

            // Convert to 24-hour format
            if (startTimeInput.period === "PM" && hours < 12) {
                hours += 12
            } else if (startTimeInput.period === "AM" && hours === 12) {
                hours = 0
            }

            newDate.setHours(hours)
            newDate.setMinutes(Number.parseInt(startTimeInput.minute, 10))
            setStartTime(newDate)
        } else {
            // If either hour or minute is empty, set startTime to null
            setStartTime(null)
        }
    }, [startTimeInput])

    useEffect(() => {
        if (endTimeInput.hour && endTimeInput.minute) {
            const newDate = new Date()
            let hours = Number.parseInt(endTimeInput.hour, 10)

            // Convert to 24-hour format
            if (endTimeInput.period === "PM" && hours < 12) {
                hours += 12
            } else if (endTimeInput.period === "AM" && hours === 12) {
                hours = 0
            }

            newDate.setHours(hours)
            newDate.setMinutes(Number.parseInt(endTimeInput.minute, 10))
            setEndTime(newDate)

            // Validate time order when end time changes
            if (startTime) {
                validateTimeOrder()
            }
        } else {
            // If either hour or minute is empty, set endTime to null
            setEndTime(null)
        }
    }, [endTimeInput])

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

        if (budget === "" || Number(budget) < 0) {
            Alert.alert("Error", "Your budget should be 0 or higher.")
            return false
        }
        if (isNaN(Number(numberOfPeople)) || Number(numberOfPeople) <= 0) {
            Alert.alert("Error", "Number of people must be a positive number.")
            return false
        }

        return true
    }

    const callBackendModel = async (message: StacRequest) => {
        try {
            const response = await axios.post(
                "https://stac-1061792458880.us-east1.run.app/chatbot_api",
                message,
                {
                    headers: { "Content-Type": "application/json" },
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

                const userInput: StacRequest = {
                    date: date.toDateString(),
                    city,
                    state: state.toUpperCase(),
                    preferences,
                    budget,
                    timePeriod: {
                        start: formatTime(startTime),
                        end: formatTime(endTime),
                    },
                    numberOfPeople,
                    keepOptions: '',
                }
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
        preferences.forEach((preference) => {
            if (selectedOptions[preference]?.length > 0) {
                filteredOptions[preference] = selectedOptions[preference]
            }
        })

        if (Object.keys(filteredOptions).length === 0) {
            Alert.alert("Error", "You must select at least one activity before finalizing.")
            return
        }

        const detailedSelectedOptions: Record<string, Array<{ name: string; description: string; location: string }>> = {}
        preferences.forEach((preference) => {
            if (filteredOptions[preference]) {
                detailedSelectedOptions[preference] = filteredOptions[preference].map((option) => ({
                    name: option,
                    description: descriptions[option] || "",
                    location: locations[option] || "",
                }))
            }
        })

        try {
            const stackId = Date.now().toString()
            const finalizedStac = {
                preferenceOrder: preferences,
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
            
            const userInput: BackendModelPayload = {
                date: date.toDateString(),
                city,
                state: state.toUpperCase(),
                preferences: prefsToUse,
                budget,
                timePeriod: {
                    start: formatTime(startTime),
                    end: formatTime(endTime),
                },
                numberOfPeople,
                keepOptions: selectedInfo || '',
            }
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
                },
            },
        ])
    }

    const dismissKeyboard = () => {
        Keyboard.dismiss()
    }

    // Handle time input changes
    const handleTimeInputChange = (value: string, field: "hour" | "minute", timeType: "start" | "end") => {
        // Only allow digits
        if (!/^\d*$/.test(value)) {
            return
        }

        if (field === "hour") {
            // Validate hour (1-12)
            if (value !== "" && (Number.parseInt(value, 10) < 1 || Number.parseInt(value, 10) > 12)) {
                return
            }

            if (timeType === "start") {
                setStartTimeInput((prev) => ({
                    ...prev,
                    hour: value,
                    // Default minute to "00" if it's empty and hour is being set
                    minute: prev.minute === "" ? "00" : prev.minute,
                }))
            } else {
                setEndTimeInput((prev) => ({
                    ...prev,
                    hour: value,
                    // Default minute to "00" if it's empty and hour is being set
                    minute: prev.minute === "" ? "00" : prev.minute,
                }))
            }
        } else if (field === "minute") {
            // Validate minute (0-59)
            if (value !== "" && (Number.parseInt(value, 10) < 0 || Number.parseInt(value, 10) > 59)) {
                return
            }

            if (timeType === "start") {
                setStartTimeInput((prev) => ({ ...prev, minute: value }))
            } else {
                setEndTimeInput((prev) => ({ ...prev, minute: value }))
            }
        }
    }

    // Handle period selection (AM/PM)
    const handlePeriodChange = (period: "AM" | "PM", timeType: "start" | "end") => {
        if (timeType === "start") {
            setStartTimeInput((prev) => ({ ...prev, period }))
            // Validate time order after a short delay to allow state to update
            setTimeout(() => {
                if (startTime && endTime) {
                    validateTimeOrder()
                }
            }, 100)
        } else {
            setEndTimeInput((prev) => ({ ...prev, period }))
            // Validate time order after a short delay to allow state to update
            setTimeout(() => {
                if (startTime && endTime) {
                    validateTimeOrder()
                }
            }, 100)
        }
    }

    // Format time input with leading zeros when field is blurred
    const handleTimeInputBlur = (field: "hour" | "minute", timeType: "start" | "end") => {
        if (timeType === "start") {
            if (field === "hour" && startTimeInput.hour.length === 1) {
                setStartTimeInput((prev) => ({ ...prev, hour: startTimeInput.hour.padStart(2, "0") }))
            } else if (field === "minute" && startTimeInput.minute.length === 1) {
                setStartTimeInput((prev) => ({ ...prev, minute: startTimeInput.minute.padStart(2, "0") }))
            }
        } else {
            if (field === "hour" && endTimeInput.hour.length === 1) {
                setEndTimeInput((prev) => ({ ...prev, hour: endTimeInput.hour.padStart(2, "0") }))
            } else if (field === "minute" && endTimeInput.minute.length === 1) {
                setEndTimeInput((prev) => ({ ...prev, minute: endTimeInput.minute.padStart(2, "0") }))
            }
        }

        // Validate end time is after start time when both are set
        validateTimeOrder()
    }

    // Validate that end time is after start time
    const validateTimeOrder = () => {
        if (startTime && endTime) {
            if (endTime < startTime) {
                Alert.alert("Error", "End time cannot be earlier than start time.")
                return false
            }
        }
        return true
    }

    // Handle number of people input validation
    const handleNumberOfPeopleChange = (text: string) => {
        // Only allow numbers
        if (/^\d*$/.test(text)) {
            setNumberOfPeople(text)
        }
    }

    // Open number picker modal
    const openNumberPicker = () => {
        setShowNumberPicker(true)
    }

    // Select number from modal
    const selectNumber = (num: number) => {
        setNumberOfPeople(num.toString())
        setShowNumberPicker(false)
    }

    return (
        <>
            {/* Create STAC Modal */}
            <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <TouchableWithoutFeedback onPress={dismissKeyboard}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <LoadingOverlay />
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
                                        blurOnSubmit={true}
                                    />

                                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                                        <Text>{date.toDateString()}</Text>
                                    </TouchableOpacity>

                                    {/* Custom Date Picker Modal */}
                                    <Modal
                                        animationType="slide"
                                        transparent={true}
                                        visible={showDatePicker}
                                        onRequestClose={() => setShowDatePicker(false)}
                                    >
                                        <View style={styles.datePickerModalContainer}>
                                            <View style={styles.datePickerModalContent}>
                                                <View style={styles.datePickerHeader}>
                                                    <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(false)}>
                                                        <Text style={styles.datePickerButtonText}>Cancel</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.datePickerButton}
                                                        onPress={() => {
                                                            setDate(tempDate)
                                                            setShowDatePicker(false)
                                                        }}
                                                    >
                                                        <Text style={[styles.datePickerButtonText, styles.datePickerDoneButton]}>Done</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <DateTimePicker
                                                    value={tempDate}
                                                    mode="date"
                                                    display="spinner"
                                                    onChange={(event, selectedDate) => {
                                                        if (selectedDate) setTempDate(selectedDate)
                                                    }}
                                                    style={styles.datePicker}
                                                />
                                            </View>
                                        </View>
                                    </Modal>

                                    {/* Custom Start Time Input */}
                                    <Text style={styles.timeLabel}>Starting time</Text>
                                    <View style={styles.timeInputContainer}>
                                        <View style={styles.timeInputBox}>
                                            <TextInput
                                                ref={startHourRef}
                                                style={styles.timeInput}
                                                placeholder="08"
                                                placeholderTextColor="#aaa"
                                                value={startTimeInput.hour}
                                                onChangeText={(value) => handleTimeInputChange(value, "hour", "start")}
                                                onBlur={() => handleTimeInputBlur("hour", "start")}
                                                keyboardType="number-pad"
                                                maxLength={2}
                                            />
                                            <Text style={styles.timeInputLabel}>Hour</Text>
                                        </View>

                                        <Text style={styles.timeSeparator}>:</Text>

                                        <View style={styles.timeInputBox}>
                                            <TextInput
                                                ref={startMinuteRef}
                                                style={styles.timeInput}
                                                placeholder="00"
                                                placeholderTextColor="#aaa"
                                                value={startTimeInput.minute}
                                                onChangeText={(value) => handleTimeInputChange(value, "minute", "start")}
                                                onBlur={() => handleTimeInputBlur("minute", "start")}
                                                keyboardType="number-pad"
                                                maxLength={2}
                                            />
                                            <Text style={styles.timeInputLabel}>Minute</Text>
                                        </View>

                                        <View style={styles.periodContainer}>
                                            <TouchableOpacity
                                                style={[styles.periodButton, startTimeInput.period === "AM" && styles.periodButtonActive]}
                                                onPress={() => handlePeriodChange("AM", "start")}
                                            >
                                                <Text
                                                    style={[
                                                        styles.periodButtonText,
                                                        startTimeInput.period === "AM" && styles.periodButtonTextActive,
                                                    ]}
                                                >
                                                    AM
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.periodButton, startTimeInput.period === "PM" && styles.periodButtonActive]}
                                                onPress={() => handlePeriodChange("PM", "start")}
                                            >
                                                <Text
                                                    style={[
                                                        styles.periodButtonText,
                                                        startTimeInput.period === "PM" && styles.periodButtonTextActive,
                                                    ]}
                                                >
                                                    PM
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Custom End Time Input */}
                                    <Text style={styles.timeLabel}>End time</Text>
                                    <View style={styles.timeInputContainer}>
                                        <View style={styles.timeInputBox}>
                                            <TextInput
                                                ref={endHourRef}
                                                style={styles.timeInput}
                                                placeholder="05"
                                                placeholderTextColor="#aaa"
                                                value={endTimeInput.hour}
                                                onChangeText={(value) => handleTimeInputChange(value, "hour", "end")}
                                                onBlur={() => handleTimeInputBlur("hour", "end")}
                                                keyboardType="number-pad"
                                                maxLength={2}
                                            />
                                            <Text style={styles.timeInputLabel}>Hour</Text>
                                        </View>

                                        <Text style={styles.timeSeparator}>:</Text>

                                        <View style={styles.timeInputBox}>
                                            <TextInput
                                                ref={endMinuteRef}
                                                style={styles.timeInput}
                                                placeholder="00"
                                                placeholderTextColor="#aaa"
                                                value={endTimeInput.minute}
                                                onChangeText={(value) => handleTimeInputChange(value, "minute", "end")}
                                                onBlur={() => handleTimeInputBlur("minute", "end")}
                                                keyboardType="number-pad"
                                                maxLength={2}
                                            />
                                            <Text style={styles.timeInputLabel}>Minute</Text>
                                        </View>

                                        <View style={styles.periodContainer}>
                                            <TouchableOpacity
                                                style={[styles.periodButton, endTimeInput.period === "AM" && styles.periodButtonActive]}
                                                onPress={() => handlePeriodChange("AM", "end")}
                                            >
                                                <Text
                                                    style={[
                                                        styles.periodButtonText,
                                                        endTimeInput.period === "AM" && styles.periodButtonTextActive,
                                                    ]}
                                                >
                                                    AM
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.periodButton, endTimeInput.period === "PM" && styles.periodButtonActive]}
                                                onPress={() => handlePeriodChange("PM", "end")}
                                            >
                                                <Text
                                                    style={[
                                                        styles.periodButtonText,
                                                        endTimeInput.period === "PM" && styles.periodButtonTextActive,
                                                    ]}
                                                >
                                                    PM
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <TextInput
                                        ref={cityRef}
                                        style={styles.input}
                                        placeholder="City"
                                        value={city}
                                        onChangeText={setCity}
                                        blurOnSubmit={true}
                                    />

                                    <TextInput
                                        ref={stateRef}
                                        style={styles.input}
                                        placeholder="State (e.g., CA)"
                                        value={state}
                                        onChangeText={setState}
                                        maxLength={2}
                                        blurOnSubmit={true}
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
                                                placeholder={`Activity ${index + 1} (e.g., ${activityExamples[index % activityExamples.length]
                                                    })`}
                                                value={activity}
                                                onChangeText={(text) => updateActivity(text, index)}
                                                blurOnSubmit={true}
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

                                    {/* Number of People Input */}
                                    <TouchableOpacity style={styles.input} onPress={openNumberPicker}>
                                        <Text style={numberOfPeople ? styles.inputText : styles.placeholderText}>
                                            {numberOfPeople ? `Number of People: ${numberOfPeople}` : "Number of People (required)"}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Number Picker Modal */}
                                    <Modal
                                        animationType="slide"
                                        transparent={true}
                                        visible={showNumberPicker}
                                        onRequestClose={() => setShowNumberPicker(false)}
                                    >
                                        <View style={styles.datePickerModalContainer}>
                                            <View style={styles.datePickerModalContent}>
                                                <View style={styles.datePickerHeader}>
                                                    <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowNumberPicker(false)}>
                                                        <Text style={styles.datePickerButtonText}>Cancel</Text>
                                                    </TouchableOpacity>
                                                    <Text style={styles.numberPickerTitle}>Number of People</Text>
                                                    <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowNumberPicker(false)}>
                                                        <Text style={styles.datePickerButtonText}>Done</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <View style={styles.numberPickerContainer}>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                                        <TouchableOpacity
                                                            key={num}
                                                            style={styles.numberPickerButton}
                                                            onPress={() => selectNumber(num)}
                                                        >
                                                            <Text style={styles.numberPickerButtonText}>{num}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                    <View style={styles.numberPickerCenterContainer}>
                                                        <TouchableOpacity style={styles.numberPickerButton} onPress={() => selectNumber(10)}>
                                                            <Text style={styles.numberPickerButtonText}>10</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </Modal>

                                    <View style={styles.budgetInputContainer}>
                                        <Text style={styles.dollarSign}>$</Text>
                                        <TextInput
                                            ref={budgetRef}
                                            style={styles.budgetInput}
                                            placeholder="Budget (maximum per person)"
                                            value={budget}
                                            onChangeText={(text) => {
                                                // Only allow numbers
                                                if (/^\d*$/.test(text)) {
                                                    setBudget(text)
                                                }
                                            }}
                                            keyboardType="numeric"
                                            returnKeyType="done"
                                            blurOnSubmit={true}
                                        />
                                    </View>

                                    <View style={{ height: 100 }} />
                                </ScrollView>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            dismissKeyboard()
                                            onClose()
                                        }}
                                    >
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
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
                        <LoadingOverlay />
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
        alignItems: "center",
        marginTop: 20,
    },
    footerButton: {
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: "center",
    },
    submitButton: {
        backgroundColor: "#6200ea",
        paddingHorizontal: 20,
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
        justifyContent: "center",
    },
    inputText: {
        color: "#000",
    },
    placeholderText: {
        color: "#aaa",
    },
    responseContainer: {
        flex: 1,
        marginVertical: 2,
        backgroundColor: "#f5f5f5",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5,
        overflow: "hidden", // This prevents content from spilling outside
    },
    responseScroll: {
        flex: 1,
        padding: 10, // Move padding from container to scroll to fix scrollbar position
    },
    preferenceSection: {
        marginBottom: 15,
    },
    preferenceTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 16,
        flexWrap: "wrap", // Add this to ensure text wraps properly
        flex: 1, // Add this to ensure the text takes available space
    },
    activityDescription: {
        fontSize: 14,
        color: "#555",
        marginLeft: 32,
        marginBottom: 5,
        flexWrap: "wrap", // Add this to ensure text wraps properly
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 32,
        marginBottom: 5,
    },
    locationIcon: {
        marginRight: 5,
    },
    locationText: {
        fontSize: 14,
        color: "#666",
        flexWrap: "wrap", // Add this to ensure text wraps properly
        flex: 1, // Add this to ensure the text takes available space
    },
    noOptionsText: {
        fontSize: 14,
        color: "#777",
        marginLeft: 32,
    },
    noDataText: {
        fontSize: 16,
        color: "#888",
        textAlign: "center",
        marginTop: 20,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 20,
    },
    button: {
        backgroundColor: "#6200ea",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    deleteTextContainer: {
        marginTop: 15,
        alignItems: "center",
    },
    deleteText: {
        color: "red",
        fontSize: 16,
        fontWeight: "bold",
    },
    disabledButton: {
        backgroundColor: "#aaa",
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
        marginRight: 10,
    },
    iconButton: {
        padding: 5,
    },
    cancelText: {
        color: "red",
        fontSize: 16,
        marginRight: 10,
    },
    optionDivider: {
        borderBottomColor: "#eee",
        borderBottomWidth: 1,
        marginVertical: 5,
        marginLeft: 32,
    },
    refreshButton: {
        backgroundColor: "#2196F3",
    },
    refreshingButton: {
        backgroundColor: "#aaa",
    },
    preferenceTimingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 32,
        marginBottom: 5,
    },
    timingIcon: {
        marginRight: 5,
    },
    preferenceTimingText: {
        fontSize: 14,
        color: "#666",
    },
    timeLabel: {
        fontSize: 16,
        color: "#666",
        marginBottom: 5,
        marginTop: 5,
    },
    timeInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
    },
    timeInputBox: {
        width: 70,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 5,
        alignItems: "center",
    },
    timeInput: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        width: "100%",
    },
    timeInputLabel: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
    },
    timeSeparator: {
        fontSize: 24,
        fontWeight: "bold",
        marginHorizontal: 5,
        alignSelf: "center",
    },
    periodContainer: {
        marginLeft: 5,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        overflow: "hidden",
    },
    periodButton: {
        width: 45,
        padding: 6,
        alignItems: "center",
    },
    periodButtonActive: {
        backgroundColor: "#e0e0ff",
    },
    periodButtonText: {
        fontSize: 14,
    },
    periodButtonTextActive: {
        fontWeight: "bold",
        color: "#6200ea",
    },
    datePickerModalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    datePickerModalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        padding: 10,
    },
    datePickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingBottom: 10,
        marginBottom: 10,
    },
    datePickerButton: {
        padding: 10,
    },
    datePickerButtonText: {
        fontSize: 16,
        color: "#6200ea",
    },
    datePickerDoneButton: {
        fontWeight: "bold",
    },
    datePicker: {
        height: 200,
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    loadingText: {
        textAlign: "center",
        marginTop: 10,
        fontSize: 16,
        color: "#6200ea",
        fontWeight: "bold",
    },
    numberPickerContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        padding: 10,
    },
    numberPickerButton: {
        width: "30%",
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        margin: 5,
        backgroundColor: "#f8f8f8",
    },
    numberPickerButtonText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#6200ea",
    },
    budgetInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
        paddingLeft: 10,
    },
    dollarSign: {
        fontSize: 16,
        fontWeight: "bold",
        marginRight: 5,
    },
    budgetInput: {
        flex: 1,
        height: 40,
    },
    numberPickerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
    },
    numberPickerCenterContainer: {
        width: "100%",
        alignItems: "center",
        marginTop: 10,
    },
})

export default StacForm
