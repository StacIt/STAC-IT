"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import axios from "axios"
import { Ionicons } from "@expo/vector-icons"

import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig"
import { doc, setDoc, getDoc } from "firebase/firestore"
import * as SMS from "expo-sms"
import type { NavigationProp } from "@react-navigation/native"

const validStates = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

interface CreateStackProps {
  navigation: NavigationProp<any>
}

const CreateStack: React.FC<CreateStackProps> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [stacName, setStacName] = useState("")
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [activities, setActivities] = useState([""])
  const [numberOfPeople, setNumberOfPeople] = useState("")
  const [budget, setBudget] = useState("")
  const [isPickerVisible, setPickerVisible] = useState(false)

  const [modelResponse, setModelResponse] = useState("")
  const [responseModalVisible, setResponseModalVisible] = useState(false)
  const [phoneNumbers, setPhoneNumbers] = useState("")

  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [stackData, setStackData] = useState<{ location: string; budget: string; preferences: string } | null>(null)
  const [preferences, setPreferences] = useState<string[]>([]);
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (modelResponse) {
      const parsedData = parseModelResponse(modelResponse);
      console.log("Updated Preferences:", parsedData.preferences);
      console.log("Updated Options:", parsedData.options);
      setPreferences(parsedData.preferences);
      setOptions(parsedData.options);
      setSelectedOptions({});
    }
  }, [modelResponse]);

  const fetchStackData = async () => {
    const user = FIREBASE_AUTH.currentUser
    if (user) {
      try {
        const docRef = doc(FIREBASE_DB, "stacks", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setStackData({
            location: data.location || "",
            budget: data.budget || "",
            preferences: data.preferences || "",
          })
          console.log("Fetched stack data:", data)
        } else {
          console.log("No such document!")
        }
      } catch (error) {
        console.error("Error fetching document:", error)
      }
    }
  }

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
    const lines = response.split("\n").map(line => line.trim());
    let preferences: string[] = [];
    let options: Record<string, string[]> = {};
    let currentPreference = "";

    lines.forEach(line => {
      if (line.startsWith("**") && line.endsWith("**")) {
        currentPreference = line.replace(/\*\*(.*?)\*\*/, "$1").trim();
        preferences.push(currentPreference);
        options[currentPreference] = [];
      }
      else if (line.startsWith("/") && line.includes("/")) {
        const matches = line.match(/\/([^\/]+)\//g);
        if (matches && currentPreference) {
          matches.forEach(match => {
            let optionName = match.replace(/\//g, "").trim();
            optionName = optionName.replace(/_/g, "");



            if (!options[currentPreference]) {
              options[currentPreference] = [];
            }
            options[currentPreference].push(optionName);
          });
        }
      }
    });
    console.log("Parsed Preferences:", preferences);
    console.log("Parsed Options:", options);

    return { preferences, options };
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

  const callBackendModel = async (message: string) => {
    console.log("Calling backend model...")
    try {
      console.log(message)
      const response = await axios.post("http://localhost:8000/chatbot/call-model/", new URLSearchParams({ message }), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
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
        const userInput = `Date: ${date.toDateString()}, Location: ${city}, ${state.toUpperCase()}, Preferences: ${preferences}, Budget: ${budget}`
        const response = await callBackendModel(userInput)
        console.log("Model Response:", response)

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

  const handleShare = async () => {
    try {
      const phoneNumbersArray = phoneNumbers.split(",").map((num) => num.trim())
      await SMS.sendSMSAsync(phoneNumbersArray, modelResponse)
      Alert.alert("Success", "Message sent to friends!")
    } catch (error) {
      Alert.alert("Error", "Failed to send message.")
      console.error("Error sharing STAC:", error)
    }
  }

  const handleFinalize = async () => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to finalize a STAC.");
      return;
    }

    const filteredOptions: Record<string, string[]> = {};
    Object.keys(selectedOptions).forEach(preference => {
      if (selectedOptions[preference].length > 0) {
        filteredOptions[preference] = selectedOptions[preference];
      }
    });

    if (Object.keys(filteredOptions).length === 0) {
      Alert.alert("Error", "You must select at least one activity before finalizing.");
      return;
    }

    try {
      const stackId = Date.now().toString();
      const finalizedStac = {
        userId: user.uid,
        stacName,
        selectedOptions: filteredOptions,
        date: date.toDateString(),
        startTime: startTime?.toISOString(),
        endTime: endTime?.toISOString(),
        location: `${city}, ${state.toUpperCase()}`,
        budget,
        numberOfPeople,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(FIREBASE_DB, "stacks", stackId), finalizedStac);
      Alert.alert("Success", "STAC finalized successfully!");
      setResponseModalVisible(false);
      navigation.navigate("Home");
    } catch (error) {
      console.error("Error finalizing STAC:", error);
      Alert.alert("Error", "Failed to finalize STAC");
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date
    setShowDatePicker(false)
    setDate(currentDate)
  }

  /**
   * Adds a new empty activity to the list of activities
   */
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

  const handleRefresh = async () => {
    if (!city || !state || activities.length === 0 || !budget) {
      Alert.alert("Error", "Please fill in all required fields before refreshing.")
      return
    }

    setIsLoading(true)
    try {
      const userInput = `Location: ${city}, ${state.toUpperCase()}, Preferences: ${activities.join(", ")}, Budget: ${budget}`
      const response = await callBackendModel(userInput)
      setModelResponse(response)
      Alert.alert("Success", "Model response refreshed!")
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
          // Here you would typically delete the STAC from your database
          // For now, we'll just close the modal and reset the form
          setResponseModalVisible(false)
          setModalVisible(false)
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
          Alert.alert("Success", "STAC deleted successfully!")
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          setStacName("")
          setStartTime(null)
          setEndTime(null)
          setCity("")
          setState("")
          setBudget("")
          setActivities([""])
          setNumberOfPeople("")
          setDate(new Date())
          setModalVisible(true)
        }}
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
            <ScrollView style={styles.formScrollView} contentContainerStyle={styles.scrollViewContent}>
              <TextInput style={styles.input} placeholder="STAC Name" value={stacName} onChangeText={setStacName} />

              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                <Text>{date.toDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />}

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
                    if (selectedTime) setStartTime(selectedTime)
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
                    }
                  }}
                />
              )}

              <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />

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
                style={[styles.footerButton, styles.submitButton, isLoading && styles.disabledButton]}
                onPress={handleCreateStack}
                disabled={isLoading}
              >
                <Text style={styles.footerButtonText}>{isLoading ? "Loading..." : "Submit"}</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{stacName || "Untitled STAC"}</Text>

            <View style={styles.responseContainer}>
              <ScrollView style={styles.responseScroll}>
                {preferences.length > 0 ? (
                  preferences.map((preference) => (
                    <View key={preference} style={styles.preferenceSection}>
                      <Text style={styles.preferenceTitle}>🌟 {preference}</Text>
                      {options[preference]?.length > 0 ? (
                        options[preference].map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={styles.checkboxContainer}
                            onPress={() => {
                              setSelectedOptions((prev) => {
                                const updated = { ...prev };
                                if (!updated[preference]) updated[preference] = [];
                                if (updated[preference].includes(option)) {
                                  updated[preference] = updated[preference].filter(o => o !== option);
                                } else {
                                  updated[preference] = [option]; // This line ensures only one option is selected
                                }
                                return updated;
                              });
                            }}
                          >
                            <Ionicons
                              name={selectedOptions[preference]?.includes(option) ? "checkbox" : "square-outline"}
                              size={24}
                              color="black"
                            />
                            <Text style={styles.checkboxLabel}>{option}</Text>
                          </TouchableOpacity>
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
              <TouchableOpacity style={styles.button} onPress={handleShare}>
                <Text style={styles.buttonText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleFinalize}>
                <Text style={styles.buttonText}>Finalize</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, isLoading ? styles.refreshingButton : styles.refreshButton]}
                onPress={handleRefresh}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>{isLoading ? "Refreshing..." : "Refresh"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default CreateStack

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    flexGrow: 1,
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
  noDataText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 20,
  },
  noOptionsText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 10,
  },
})