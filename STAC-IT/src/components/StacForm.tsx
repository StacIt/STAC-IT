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
import { platformColors } from '../theme/platformColors';

interface Period {
    begin: Date;
    end: Date;
}

function makePeriod(date: Date, begin: Date | null, end: Date | null): Period {
    return {
        begin: new Date(date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        begin?.getHours(),
                        begin?.getMinutes()),
        end: new Date(date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                      end?.getHours(),
                      end?.getMinutes())
    };
}

interface StrPeriod {
    begin: string;
    end: string;
}

function fmtDateStr(ds: string): string {
    const d: Date = new Date(ds)
    return d.toLocaleTimeString([], {timeStyle: "short"})
}

function fmtStrPeriod(p: StrPeriod): StrPeriod {
    // console.log("HERE")
    // console.log(t)
    // var h = t.getHours()
    // const m = t.getMinutes()
    // const ampm = h >= 12 ? "pm" : "am"
    // h %= 12
    // return `${h}:${m.toString().padStart(2, "0")}${ampm}`
    return {
        begin: fmtDateStr(p.begin),
        end: fmtDateStr(p.end)
    };
}

interface StacRequest {
    city: string;
    state: string;
    activities: string[];
    budget: string;
    period: Period;
    numberOfPeople: string;
    keepOptions?: string;
}

interface Place {
    name: string;
    display_name: string;
    short_address: string;
}

interface Activity {
    name: string;
    description: string;
    location: Place;
}

interface ActivityOptions {
    label: string;
    options: Activity[];
    timing: StrPeriod;
}

interface Itinerary {
    activities: ActivityOptions[];
}

interface StacResponse {
  request_id: string;
  timestamp: string;
  itinerary: Itinerary;
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
}) => {
    const [stacName, setStacName] = useState(initialStacName)
    const [date, setDate] = useState(initialDate)
    const [startTime, setStartTime] = useState<Date | null>(initialStartTime)
    const [endTime, setEndTime] = useState<Date | null>(initialEndTime)
    const [city, setCity] = useState(initialCity)
    const [state, setState] = useState(initialState)
    const [activities, setActivities] = useState(initialActivities)
    const [numberOfPeople, setNumberOfPeople] = useState<number | null>(null)
    const [budget, setBudget] = useState<number | null>(null)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [tempDate, setTempDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState(false)
    const [showNumberPicker, setShowNumberPicker] = useState(false)

    const LoadingOverlay = () => {
        if (!isLoading) return null

        return (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={platformColors.accent} />
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
    const [preferenceTimings, setPreferenceTimings] = useState<Record<string, StrPeriod>>({})

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
            setNumberOfPeople(null)
            setBudget(null)
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

    const parseModelResponse = (response: StacResponse) => {
        try {
            const preferences: string[] = []
            const options: Record<string, string[]> = {}
            const descriptions: Record<string, string> = {}
            const locations: Record<string, string> = {}
            const preferenceTimings: Record<string, StrPeriod> = {}

            const activities: ActivityOptions[] = response.itinerary.activities

            activities.forEach((actOpts: ActivityOptions) => {
                const preference = actOpts.label
                preferences.push(preference)
                options[preference] = actOpts.options.map((option: Activity) => option.name)

                preferenceTimings[preference] = fmtStrPeriod(actOpts.timing);

                actOpts.options.forEach((option: Activity) => {
                    descriptions[option.name] = option.description
                    locations[option.name] = option.location.short_address
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

        if (budget === null || Number(budget) < 0) {
            Alert.alert("Error", "Your budget should be 0 or higher.")
            return false
        }
        if (numberOfPeople === null || numberOfPeople <= 0) {
            Alert.alert("Error", "Number of people must be a positive number.")
            return false
        }

        return true
    }

    const callBackendModel = async (message: StacRequest) => {
        try {
            const response = await axios.post<StacResponse>(
                "https://stac-1061792458880.us-east1.run.app/chatbot_api",
                message,
                { headers: { "Content-Type": "application/json" } }
            )
            return response.data
        } catch (error) {
            console.error(error)
            Alert.alert("Error", "Failed to call backend model.")
            throw error
        }
    }

    const handleCreateStack = async () => {
        setModelResponse("")
        setIsLoading(true)

        if (!validateForm()) {
            setIsLoading(false)
            return
        }

        //let budgetCategory = ""
        const budgetStr = String(budget ?? "0")
        const numPeopleStr = String(numberOfPeople ?? "1")

        const filtered_activities = activities.filter((a) => a.trim() !== "");
        const preferences = filtered_activities.join(", ")

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
                    budget: budgetStr,
                    numberOfPeople: numPeopleStr,
                    createdAt: new Date().toISOString(),
                })

                const userInput: StacRequest = {
                    city,
                    state: state.toUpperCase(),
                    activities: filtered_activities,
                    budget: budgetStr,
                    period: makePeriod(date, startTime, endTime),
                    numberOfPeople: numPeopleStr,
                    keepOptions: '',
                }
                const response: StacResponse = await callBackendModel(userInput)

                // Parse the response and update state
                const parsedData = parseModelResponse(response)
                setPreferences(parsedData.preferences)
                setOptions(parsedData.options)
                setDescriptions(parsedData.descriptions)
                setLocations(parsedData.locations)
                setPreferenceTimings(parsedData.preferenceTimings)

                setModelResponse(JSON.stringify(response))
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

            const prefsToUse = activities.filter((a) => a.trim() !== "")
            const selectedInfo = selectedPrefs.length > 0 ? ` (Keep these options: ${selectedPrefs})` : ""

            const userInput: StacRequest = {
                city,
                state: state.toUpperCase(),
                activities: prefsToUse,
                budget: String(budget ?? "0"),
                period: makePeriod(date, startTime, endTime),
                numberOfPeople: String(numberOfPeople ?? "1"),
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

            setModelResponse(JSON.stringify(response))
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
                    setBudget(null)
                    setActivities([""])
                    setNumberOfPeople(null)
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
    // const handleNumberOfPeopleChange = (text: string) => {
        // // Only allow numbers
        // if (/^\d*$/.test(text)) {
            // setNumberOfPeople(text)
        // }
    // }

    // Open number picker modal
    const openNumberPicker = () => {
        setShowNumberPicker(true)
    }

    // Select number from modal
    // const selectNumber = (num: number) => {
        // setNumberOfPeople(num.toString())
        // setShowNumberPicker(false)
    // }

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
                                                placeholderTextColor={platformColors.placeholder as string}
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
                                                placeholderTextColor={platformColors.placeholder as string}
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
                                                placeholderTextColor={platformColors.placeholder as string}
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
                                                placeholderTextColor={platformColors.placeholder as string}
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
                                                    <Ionicons name="remove-circle-outline" size={24} color={platformColors.danger} />
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
                                    <Text style={styles.budgetLabel}>Number of People</Text>
                                    <View style={styles.budgetOptionsContainer}>
                                        {[1, 2, 3].map((level) => (
                                            <TouchableOpacity
                                                key={level}
                                                style={[
                                                    styles.budgetOption,
                                                    numberOfPeople === level && styles.budgetOptionSelected
                                                ]}
                                                onPress={() => setNumberOfPeople(level)}
                                            >
                                                <Text style={[
                                                    styles.budgetOptionText,
                                                    numberOfPeople === level && styles.budgetOptionTextSelected
                                                ]}>
                                                    {level == 3 ? "3+" : String(level)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={styles.budgetLabel}>Budget</Text>
                                    <View style={styles.budgetOptionsContainer}>
                                        {[1, 2, 3].map((level) => (
                                            <TouchableOpacity
                                                key={level}
                                                style={[
                                                    styles.budgetOption,
                                                    budget === level && styles.budgetOptionSelected
                                                ]}
                                                onPress={() => setBudget(level)}
                                            >
                                                <Text style={[
                                                    styles.budgetOptionText,
                                                    budget === level && styles.budgetOptionTextSelected
                                                ]}>
                                                    {"$".repeat(level)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
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
                                                    <Ionicons name="time-outline" size={16} color={platformColors.textSecondary} style={styles.timingIcon} />
                                                    <Text style={styles.preferenceTimingText}>
                                                        {preferenceTimings[preference].begin} - {preferenceTimings[preference].end}
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
                                                                color={platformColors.black}
                                                            />
                                                            <Text style={styles.checkboxLabel}>{option}</Text>
                                                        </TouchableOpacity>

                                                        {descriptions[option] && (
                                                            <Text style={styles.activityDescription}>{descriptions[option]}</Text>
                                                        )}

                                                        {locations[option] && (
                                                            <View style={styles.locationContainer}>
                                                                <Ionicons name="location" size={16} color={platformColors.textSecondary} style={styles.locationIcon} />
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
        backgroundColor: platformColors.overlay,
        justifyContent: "center",
    },
    modalContent: {
        flex: 1,
        backgroundColor: platformColors.white,
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
        backgroundColor: platformColors.accent,
        paddingHorizontal: 20,
    },
    footerButtonText: {
        color: platformColors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    input: {
        width: "100%",
        height: 40,
        borderColor: platformColors.separator,
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        marginBottom: 10,
        justifyContent: "center",
    },
    inputText: {
        color: platformColors.black,
    },
    placeholderText: {
        color: platformColors.placeholder,
    },
    responseContainer: {
        flex: 1,
        marginVertical: 2,
        backgroundColor: platformColors.secondaryBackground,
        borderWidth: 1,
        borderColor: platformColors.neutralSoft,
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
        color: platformColors.neutral,
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
        color: platformColors.textSecondary,
        flexWrap: "wrap", // Add this to ensure text wraps properly
        flex: 1, // Add this to ensure the text takes available space
    },
    noOptionsText: {
        fontSize: 14,
        color: platformColors.textTertiary,
        marginLeft: 32,
    },
    noDataText: {
        fontSize: 16,
        color: platformColors.textTertiary,
        textAlign: "center",
        marginTop: 20,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 20,
    },
    button: {
        backgroundColor: platformColors.accent,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: platformColors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    deleteTextContainer: {
        marginTop: 15,
        alignItems: "center",
    },
    deleteText: {
        color: platformColors.danger,
        fontSize: 16,
        fontWeight: "bold",
    },
    disabledButton: {
        backgroundColor: platformColors.placeholder,
    },
    activityContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    activityInput: {
        flex: 1,
        height: 40,
        borderColor: platformColors.separator,
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        marginRight: 10,
    },
    iconButton: {
        padding: 5,
    },
    cancelText: {
        color: platformColors.danger,
        fontSize: 16,
        marginRight: 10,
    },
    optionDivider: {
        borderBottomColor: platformColors.opaqueSeparator,
        borderBottomWidth: 1,
        marginVertical: 5,
        marginLeft: 32,
    },
    refreshButton: {
        backgroundColor: platformColors.info,
    },
    refreshingButton: {
        backgroundColor: platformColors.placeholder,
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
        color: platformColors.textSecondary,
    },
    timeLabel: {
        fontSize: 16,
        color: platformColors.textSecondary,
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
        borderColor: platformColors.separator,
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
        color: platformColors.textSecondary,
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
        borderColor: platformColors.separator,
        borderRadius: 5,
        overflow: "hidden",
    },
    periodButton: {
        width: 45,
        padding: 6,
        alignItems: "center",
    },
    periodButtonActive: {
        backgroundColor: platformColors.highlight,
    },
    periodButtonText: {
        fontSize: 14,
    },
    periodButtonTextActive: {
        fontWeight: "bold",
        color: platformColors.accent,
    },
    datePickerModalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: platformColors.overlay,
    },
    datePickerModalContent: {
        backgroundColor: platformColors.white,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        padding: 10,
    },
    datePickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: platformColors.separator,
        paddingBottom: 10,
        marginBottom: 10,
    },
    datePickerButton: {
        padding: 10,
    },
    datePickerButtonText: {
        fontSize: 16,
        color: platformColors.accent,
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
        backgroundColor: platformColors.overlay,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    loadingText: {
        textAlign: "center",
        marginTop: 10,
        fontSize: 16,
        color: platformColors.accent,
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
        borderColor: platformColors.separator,
        borderRadius: 5,
        margin: 5,
        backgroundColor: platformColors.tertiaryBackground,
    },
    numberPickerButtonText: {
        fontSize: 20,
        fontWeight: "bold",
        color: platformColors.accent,
    },
    budgetInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: 40,
        borderColor: platformColors.separator,
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
        color: platformColors.textPrimary,
        textAlign: "center",
    },
    numberPickerCenterContainer: {
        width: "100%",
        alignItems: "center",
        marginTop: 10,
    },
    budgetLabel: {
    fontSize: 16,
    color: platformColors.textSecondary,
    marginBottom: 5,
    marginTop: 5,
    },
    budgetOptionsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    budgetOption: {
        flex: 1,
        marginHorizontal: 3,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: platformColors.separator,
        borderRadius: 5,
        alignItems: "center",
        backgroundColor: platformColors.tertiaryBackground,
    },
    budgetOptionSelected: {
        backgroundColor: platformColors.highlight,
        borderColor: platformColors.accent,
    },
    budgetOptionText: {
        fontSize: 16,
        color: platformColors.neutral,
        fontWeight: "500",
    },
    budgetOptionTextSelected: {
        color: platformColors.accent,
        fontWeight: "bold",
    },
})

export default StacForm
