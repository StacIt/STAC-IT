"use client"

import { useEffect } from "react"
import type React from "react"
import { useState, useCallback } from "react"
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
} from "react-native"
import { type NavigationProp, useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig"
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import StacForm from "../components/StacForm"

interface HomePageProps {
    navigation: NavigationProp<any>
}

interface Timing {
    start: string
    end: string
}

interface Stac {
    id: string
    userId: string
    stacName: string
    date: string
    startTime: string
    endTime: string
    location: string
    preferences: string
    budget: string
    numberOfPeople: string
    modelResponse?: string
    selectedOptions?: { [key: string]: string[] }
    detailedSelectedOptions?: {
        [key: string]: Array<{
            name: string
            description: string
            location: string
        }>
    }
    preferenceTimings?: {
        [key: string]: {
            start: string
            end: string
        }
    }
}

const HomePage: React.FC<HomePageProps> = ({ navigation }) => {
    const [scheduledStacs, setScheduledStacs] = useState<Stac[]>([])
    const [pastStacs, setPastStacs] = useState<Stac[]>([])
    const [selectedStac, setSelectedStac] = useState<Stac | null>(null)
    const [stacDetailsModalVisible, setStacDetailsModalVisible] = useState(false)
    const [createModalVisible, setCreateModalVisible] = useState(false)

    const fetchStacs = useCallback(async () => {
        const user = FIREBASE_AUTH.currentUser
        if (!user) return

        try {
            const stacsRef = collection(FIREBASE_DB, "stacks")
            const q = query(stacsRef, where("userId", "==", user.uid))

            const querySnapshot = await getDocs(q)
            const currentDate = new Date()
            currentDate.setHours(0, 0, 0, 0)

            const fetchedScheduledStacs: Stac[] = []
            const fetchedPastStacs: Stac[] = []

            querySnapshot.forEach((doc) => {
                const data = doc.data() as Stac
                if (!data.date) return

                const stacDate = new Date(data.date)
                stacDate.setHours(0, 0, 0, 0)

                if (
                    (data.selectedOptions && Object.keys(data.selectedOptions).length > 0) ||
                    (data.detailedSelectedOptions && Object.keys(data.detailedSelectedOptions).length > 0)
                ) {
                    const stac = { ...data, id: doc.id }

                    if (stacDate >= currentDate) {
                        fetchedScheduledStacs.push(stac)
                    } else {
                        fetchedPastStacs.push(stac)
                    }
                }
            })

            setScheduledStacs(fetchedScheduledStacs)
            setPastStacs(fetchedPastStacs)
        } catch (error) {
            console.error("Error fetching stacs:", error)
            Alert.alert("Error", "Failed to load STACs")
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            fetchStacs()
        }, [fetchStacs]),
    )

    const deleteStac = async (stacId: string) => {
        try {
            await deleteDoc(doc(FIREBASE_DB, "stacks", stacId))
            Alert.alert("Success", "STAC deleted successfully!")
            setStacDetailsModalVisible(false)
            fetchStacs()
        } catch (error) {
            console.error("Error deleting STAC:", error)
            Alert.alert("Error", "Failed to delete STAC")
        }
    }

    const handleStacPress = (stac: Stac) => {
        setSelectedStac(stac)
        setStacDetailsModalVisible(true)
    }

    const getOptionDetails = (stac: Stac, preference: string, optionName: string) => {
        if (stac.detailedSelectedOptions && stac.detailedSelectedOptions[preference]) {
            const option = stac.detailedSelectedOptions[preference].find((opt) => opt.name === optionName)
            if (option) {
                return {
                    description: option.description || "",
                    location: option.location || "",
                }
            }
        }
        return { description: "", location: "" }
    }

    const renderStacList = (stacs: Stac[], title: string) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {stacs.length === 0 ? (
                <Text style={styles.noStacsText}>No {title.toLowerCase()} available</Text>
            ) : (
                stacs.map((stac) => (
                    <View key={stac.id} style={styles.stacContainer}>
                        <TouchableOpacity style={styles.stacButton} onPress={() => handleStacPress(stac)}>
                            <Text style={styles.buttonText}>{stac.stacName}</Text>
                            <Text style={styles.stacDetails}>{new Date(stac.date).toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </View>
    )

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.title}>STAC-IT</Text>

            <TouchableOpacity
                style={styles.activityButton}
                onPress={() => setCreateModalVisible(true)}
            >
                <Text style={styles.buttonText}>Start New STAC</Text>
            </TouchableOpacity>

            <StacForm
                navigation={navigation}
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onFinalize={fetchStacs}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={stacDetailsModalVisible}
                onRequestClose={() => setStacDetailsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    {selectedStac && (
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{selectedStac.stacName}</Text>
                            <Text style={styles.modalLabel}>Date: {selectedStac.date}</Text>
                            <Text style={styles.modalLabel}>Location: {selectedStac.location}</Text>
                            <Text style={styles.modalLabel}>Selected Activities:</Text>
                            <ScrollView>
                                {selectedStac.selectedOptions &&
                                    Object.keys(selectedStac.selectedOptions).map((preference) => (
                                        <View key={preference} style={styles.preferenceSection}>
                                            <View style={styles.preferenceHeaderContainer}>
                                                <Text style={styles.preferenceTitle}>🌟 {preference}</Text>
                                                {selectedStac.preferenceTimings && selectedStac.preferenceTimings[preference] && (
                                                    <View style={styles.preferenceTimingContainer}>
                                                        <Ionicons name="time-outline" size={14} color="#666" style={styles.timingIcon} />
                                                        <Text style={styles.preferenceTimingText}>
                                                            {selectedStac.preferenceTimings[preference].start} -{" "}
                                                            {selectedStac.preferenceTimings[preference].end}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {selectedStac.selectedOptions?.[preference]?.map((option) => {
                                                const details = getOptionDetails(selectedStac, preference, option)
                                                return (
                                                    <View key={option} style={styles.activityContainer}>
                                                        <TouchableOpacity style={styles.checkboxContainer}>
                                                            <Ionicons name="checkbox" size={24} color="#6200ea" />
                                                            <Text style={styles.checkboxLabel}>{option}</Text>
                                                        </TouchableOpacity>

                                                        {details.description && (
                                                            <Text style={styles.activityDescription}>{details.description}</Text>
                                                        )}

                                                        {details.location && (
                                                            <View style={styles.locationContainer}>
                                                                <Ionicons name="location" size={16} color="#666" style={styles.locationIcon} />
                                                                <Text style={styles.locationText}>{details.location}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                )
                                            })}
                                        </View>
                                    ))}
                            </ScrollView>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setStacDetailsModalVisible(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => deleteStac(selectedStac.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.deleteButtonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>

            {renderStacList(scheduledStacs, "Scheduled STAC")}
            {renderStacList(pastStacs, "Past History")}
        </ScrollView>
    )
}

const StacDetailsScreen: React.FC = () => {
    const route = useRoute<RouteProp<{ params: { stac: Stac; onDelete: () => void } }>>()
    const navigation = useNavigation()
    const { stac, onDelete } = route.params

    const handleDelete = async () => {
        Alert.alert("Delete STAC", "Are you sure you want to delete this STAC?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteDoc(doc(FIREBASE_DB, "stacks", stac.id))
                        const stacsRef = collection(FIREBASE_DB, "stacks")
                        const q = query(
                            stacsRef,
                            where("userId", "==", stac.userId),
                            where("stacName", "==", stac.stacName),
                            where("date", "==", stac.date),
                        )
                        const querySnapshot = await getDocs(q)

                        querySnapshot.forEach(async (document) => {
                            if (document.id !== stac.id) {
                                await deleteDoc(doc(FIREBASE_DB, "stacks", document.id))
                            }
                        })

                        Alert.alert("Success", "STAC deleted successfully")
                        onDelete()
                        navigation.goBack()
                    } catch (error) {
                        console.error("Error deleting STAC:", error)
                        Alert.alert("Error", "Failed to delete STAC")
                    }
                },
            },
        ])
    }

    const getOptionDetails = (stac: Stac, preference: string, optionName: string) => {
        if (stac.detailedSelectedOptions && stac.detailedSelectedOptions[preference]) {
            const option = stac.detailedSelectedOptions[preference].find((opt) => opt.name === optionName)
            if (option) {
                return {
                    description: option.description || "",
                    location: option.location || "",
                }
            }
        }
        return { description: "", location: "" }
    }

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

                    {stac.selectedOptions && Object.keys(stac.selectedOptions).length > 0 && (
                        <>
                            <Text style={styles.modalLabel}>Selected Activities:</Text>
                            {Object.keys(stac.selectedOptions).map((preference) => (
                                <View key={preference} style={styles.preferenceSection}>
                                    <View style={styles.preferenceHeaderContainer}>
                                        <Text style={styles.preferenceTitle}>🌟 {preference}</Text>
                                        {stac.preferenceTimings && stac.preferenceTimings[preference] && (
                                            <View style={styles.preferenceTimingContainer}>
                                                <Ionicons name="time-outline" size={14} color="#666" style={styles.timingIcon} />
                                                <Text style={styles.preferenceTimingText}>
                                                    {stac.preferenceTimings[preference].start} - {stac.preferenceTimings[preference].end}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {stac.selectedOptions?.[preference]?.map((option) => {
                                        const details = getOptionDetails(stac, preference, option)
                                        return (
                                            <View key={option} style={styles.activityContainer}>
                                                <Text style={styles.activityName}>{option}</Text>
                                                {details.description && <Text style={styles.activityDescription}>{details.description}</Text>}
                                                {details.location && (
                                                    <View style={styles.locationContainer}>
                                                        <Ionicons name="location" size={16} color="#666" style={styles.locationIcon} />
                                                        <Text style={styles.locationText}>{details.location}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )
                                    })}
                                </View>
                            ))}
                        </>
                    )}
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
    )
}

const styles = StyleSheet.create({
    title: {
        marginTop: 70,
        fontSize: 36,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 20,
    },
    section: {
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: "600",
        color: "#4a4a4a",
        marginBottom: 10,
    },
    activityButton: {
        backgroundColor: "#6200ea",
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 20,
    },
    stacContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    stacButton: {
        backgroundColor: "#4a4a4a",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
    },
    stacDetails: {
        color: "#ddd",
        fontSize: 12,
        marginTop: 4,
    },
    shareButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginLeft: 10,
    },
    shareButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
    detailsContainer: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        color: "#4a4a4a",
        marginTop: 10,
        marginBottom: 4,
    },
    modalText: {
        fontSize: 16,
        color: "#666",
        marginBottom: 10,
    },
    closeButton: {
        backgroundColor: "#6200ea",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
        flex: 1,
        marginHorizontal: 5,
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    noStacsText: {
        textAlign: "center",
        color: "#666",
        marginTop: 10,
        fontStyle: "italic",
    },
    container: {
        padding: 20,
        backgroundColor: "#f0f2f5",
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
        fontSize: 30,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#6200ea",
        textAlign: "center",
    },
    scrollView: {
        flex: 1,
        backgroundColor: "#f0f2f5",
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 100,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 10,
    },
    activityContainer: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: "#f9f9f9",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    activityName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    activityDescription: {
        fontSize: 14,
        color: "#666",
        marginTop: 5,
        marginBottom: 5,
        paddingLeft: 5,
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },
    locationIcon: {
        marginRight: 5,
    },
    locationText: {
        fontSize: 14,
        color: "#666",
        flex: 1,
    },
    deleteButton: {
        backgroundColor: "#dc3545",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
        flex: 1,
        marginHorizontal: 5,
    },
    deleteButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: "500",
    },
    preferenceTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 10,
        marginBottom: 5,
        color: "#6200ea",
    },
    preferenceSection: {
        marginVertical: 10,
    },
    preferenceHeaderContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    preferenceTimingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 10,
    },
    timingIcon: {
        marginRight: 5,
    },
    preferenceTimingText: {
        fontSize: 14,
        color: "#007bff",
        fontWeight: "500",
    },
})

export { HomePage, StacDetailsScreen }