"use client"
import type React from "react"
import { useState, useCallback, useRef } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Share } from "react-native"
import { type NavigationProp, useNavigation, useFocusEffect, useRoute, type RouteProp } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig"
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import StacForm from "../components/StacForm"
import { platformColors } from '../theme/platformColors';

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
    const [infoModalVisible, setInfoModalVisible] = useState(false)
    const infoScrollViewRef = useRef<ScrollView>(null)

    const handleShare = async (stac: Stac) => {
        try {
            let message = `Here's my STAC: ${stac.stacName}\nDate: ${stac.date}\nLocation: ${stac.location}`

            if (stac.detailedSelectedOptions) {
                for (const [preference, options] of Object.entries(stac.detailedSelectedOptions)) {
                    message += `\n\n🌟 ${preference}`
                    const timing = stac.preferenceTimings?.[preference]
                    if (timing) {
                        message += ` (${timing.start} - ${timing.end})`
                    }
                    for (const option of options) {
                        message += `\n- ${option.name}\n  ${option.description}\n  📍 ${option.location}`
                    }
                }
            }

            await Share.share({ message })
        } catch (error) {
            Alert.alert("Error", "Failed to share STAC")
        }
    }

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
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>STAC-IT</Text>
                    <TouchableOpacity style={styles.infoButton} onPress={() => setInfoModalVisible(true)}>
                        <Ionicons name="information-circle" size={28} color={platformColors.accent} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.activityButton} onPress={() => setCreateModalVisible(true)}>
                    <Text style={styles.buttonText}>Start New STAC</Text>
                </TouchableOpacity>

                <StacForm
                    navigation={navigation}
                    visible={createModalVisible}
                    onClose={() => setCreateModalVisible(false)}
                    onFinalize={fetchStacs}
                />

                {/* Info Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={infoModalVisible}
                    onRequestClose={() => setInfoModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.infoModalContent}>
                            <Text style={styles.infoModalTitle}>What is STAC?</Text>

                            <ScrollView
                                ref={infoScrollViewRef}
                                style={styles.infoScrollView}
                                contentContainerStyle={styles.infoScrollViewContent}
                            >
                                <Text style={styles.infoText}>
                                    STAC (Strategically Tailored Activity Coordination) is your all-in-one solution for planning fun
                                    activities with friends. No more endless group texts or complicated planning—just simple, streamlined
                                    social coordination.
                                </Text>

                                <Text style={styles.infoSectionTitle}>How It Works</Text>
                                <View style={styles.infoListItem}>
                                    <Text style={styles.infoListNumber}>1.</Text>
                                    <Text style={styles.infoListText}>
                                        <Text style={styles.infoBold}>Create a STAC</Text>
                                        {"\n"}Enter date, time, location, and what you want to do.
                                    </Text>
                                </View>

                                <View style={styles.infoListItem}>
                                    <Text style={styles.infoListNumber}>2.</Text>
                                    <Text style={styles.infoListText}>
                                        <Text style={styles.infoBold}>Get Smart Suggestions</Text>
                                        {"\n"}For each activity, STAC gives you 3 curated options based on your preferences.
                                    </Text>
                                </View>

                                <View style={styles.infoListItem}>
                                    <Text style={styles.infoListNumber}>3.</Text>
                                    <Text style={styles.infoListText}>
                                        <Text style={styles.infoBold}>Refine Your Plan</Text>
                                        {"\n"}Lock in your favorites. Refresh others until it's perfect.
                                    </Text>
                                </View>

                                <View style={styles.infoListItem}>
                                    <Text style={styles.infoListNumber}>4.</Text>
                                    <Text style={styles.infoListText}>
                                        <Text style={styles.infoBold}>Save & Share</Text>
                                        {"\n"}Save your plan and share it with friends—however you want.
                                    </Text>
                                </View>

                                <Text style={styles.infoSectionTitle}>Quick Start</Text>
                                <View style={styles.infoListItem}>
                                    <Text style={styles.infoListNumber}>1.</Text>
                                    <Text style={styles.infoListText}>Tap "Create a New STAC"</Text>
                                </View>

                                <View style={styles.infoListItem}>
                                    <Text style={styles.infoListNumber}>2.</Text>
                                    <Text style={styles.infoListText}>
                                        Fill in:
                                        {"\n"}- Name
                                        {"\n"}- Date & Time
                                        {"\n"}- City, State
                                        {"\n"}- Activity Preferences
                                        {"\n"}- Group Size & Budget
                                    </Text>
                                </View>

                                <View style={styles.infoListItem}>
                                    <Text style={styles.infoListNumber}>3.</Text>
                                    <Text style={styles.infoListText}>Review and refine the suggestions</Text>
                                </View>

                                <View style={styles.infoListItem}>
                                    <Text style={styles.infoListNumber}>4.</Text>
                                    <Text style={styles.infoListText}>Tap "Save" to finalize</Text>
                                </View>

                                <View style={styles.infoListItem}>
                                    <Text style={styles.infoListNumber}>5.</Text>
                                    <Text style={styles.infoListText}>Share your STAC plan with your crew!</Text>
                                </View>

                                <View style={{ height: 60 }} />
                            </ScrollView>

                            <View style={styles.infoModalFooter}>
                                <TouchableOpacity style={styles.closeInfoButton} onPress={() => setInfoModalVisible(false)}>
                                    <Text style={styles.closeInfoButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={stacDetailsModalVisible}
                    onRequestClose={() => setStacDetailsModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        {selectedStac && (
                            <View style={styles.modalContent}>
                                <TouchableOpacity style={{ alignSelf: "flex-start" }} onPress={() => setStacDetailsModalVisible(false)}>
                                    <Ionicons name="close-circle" size={34} color={platformColors.accent} />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>{selectedStac.stacName}</Text>
                                <Text style={styles.modalLabel}>Date: {selectedStac.date}</Text>
                                <Text style={styles.modalLabel}>Location: {selectedStac.location}</Text>
                                <Text style={styles.modalLabel}>Selected Activities:</Text>

                                <View style={styles.scrollViewWrapper}>
                                    <ScrollView style={styles.detailsScrollView} contentContainerStyle={styles.detailsScrollViewContent}>
                                        {selectedStac.selectedOptions &&
                                            (selectedStac.preferenceOrder || Object.keys(selectedStac.selectedOptions)).map((preference) => (
                                                <View key={preference} style={styles.preferenceSection}>
                                                    <View style={styles.preferenceHeaderContainer}>
                                                        <Text style={styles.preferenceTitle}>🌟 {preference}</Text>
                                                    </View>

                                                    {selectedStac.preferenceTimings && selectedStac.preferenceTimings[preference] && (
                                                        <View style={styles.preferenceTimingContainer}>
                                                            <Ionicons name="time-outline" size={14} color={platformColors.textSecondary} style={styles.timingIcon} />
                                                            <Text style={styles.preferenceTimingText}>
                                                                {selectedStac.preferenceTimings[preference].start} -{" "}
                                                                {selectedStac.preferenceTimings[preference].end}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {selectedStac.selectedOptions?.[preference]?.map((option) => {
                                                        const details = getOptionDetails(selectedStac, preference, option)
                                                        return (
                                                            <View key={option} style={styles.activityContainer}>
                                                                <TouchableOpacity style={styles.checkboxContainer}>
                                                                    <Ionicons name="checkbox" size={24} color={platformColors.accent} />
                                                                    <Text style={styles.checkboxLabel}>{option}</Text>
                                                                </TouchableOpacity>

                                                                {details.description && (
                                                                    <Text style={styles.activityDescription}>{details.description}</Text>
                                                                )}

                                                                {details.location && (
                                                                    <View style={styles.locationContainer}>
                                                                        <Ionicons name="location" size={16} color={platformColors.textSecondary} style={styles.locationIcon} />
                                                                        <Text style={styles.locationText}>{details.location}</Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                        )
                                                    })}
                                                </View>
                                            ))}
                                    </ScrollView>
                                </View>

                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => handleShare(selectedStac)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.shareButtonText}>Share</Text>
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
        </View>
    )
}

// Also update the StacDetailsScreen component's ScrollView for consistency
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
            <View style={styles.scrollViewWrapper}>
                <ScrollView style={styles.detailsScrollView} contentContainerStyle={styles.scrollViewContent}>
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
                                {(stac.preferenceOrder || Object.keys(stac.selectedOptions)).map((preference) => (
                                    <View key={preference} style={styles.preferenceSection}>
                                        <View style={styles.preferenceHeaderContainer}>
                                            <Text style={styles.preferenceTitle}>🌟 {preference}</Text>
                                        </View>

                                        {stac.preferenceTimings && stac.preferenceTimings[preference] && (
                                            <View style={styles.preferenceTimingContainer}>
                                                <Ionicons name="time-outline" size={14} color={platformColors.textSecondary} style={styles.timingIcon} />
                                                <Text style={styles.preferenceTimingText}>
                                                    {stac.preferenceTimings[preference].start} - {stac.preferenceTimings[preference].end}
                                                </Text>
                                            </View>
                                        )}

                                        {stac.selectedOptions?.[preference]?.map((option) => {
                                            const details = getOptionDetails(stac, preference, option)
                                            return (
                                                <View key={option} style={styles.activityContainer}>
                                                    <Text style={styles.activityName}>{option}</Text>
                                                    {details.description && <Text style={styles.activityDescription}>{details.description}</Text>}
                                                    {details.location && (
                                                        <View style={styles.locationContainer}>
                                                            <Ionicons name="location" size={16} color={platformColors.textSecondary} style={styles.locationIcon} />
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
            </View>
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
    container: {
        flex: 1,
        backgroundColor: platformColors.groupedBackground,
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        marginTop: 70,
        marginBottom: 20,
    },
    infoButton: {
        position: "absolute",
        right: 0,
        top: 5,
        padding: 5,
    },
    title: {
        fontSize: 36,
        fontWeight: "bold",
        color: platformColors.textPrimary,
        textAlign: "center",
    },
    section: {
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: "600",
        color: platformColors.neutralStrong,
        marginBottom: 10,
    },
    activityButton: {
        backgroundColor: platformColors.accent,
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
        backgroundColor: platformColors.neutralStrong,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
    },
    stacDetails: {
        color: platformColors.neutralSoft,
        fontSize: 12,
        marginTop: 4,
    },
    detailsContainer: {
        backgroundColor: platformColors.white,
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        color: platformColors.neutralStrong,
        marginTop: 10,
        marginBottom: 4,
    },
    modalText: {
        fontSize: 16,
        color: platformColors.textSecondary,
        marginBottom: 10,
    },
    closeButton: {
        backgroundColor: platformColors.accent,
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
        flex: 1,
        marginHorizontal: 5,
    },
    closeButtonText: {
        color: platformColors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    noStacsText: {
        textAlign: "center",
        color: platformColors.textSecondary,
        marginTop: 10,
        fontStyle: "italic",
    },
    createButton: {
        backgroundColor: platformColors.accent,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: platformColors.white,
        fontSize: 18,
    },
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
    infoModalContent: {
        flex: 1,
        backgroundColor: platformColors.white,
        margin: 20,
        borderRadius: 10,
        padding: 0,
        maxHeight: "80%",
        overflow: "hidden",
    },
    infoModalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: platformColors.textPrimary,
        textAlign: "center",
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: platformColors.opaqueSeparator,
    },
    infoScrollView: {
        flex: 1,
    },
    infoScrollViewContent: {
        padding: 20,
        paddingBottom: 20,
    },
    infoText: {
        fontSize: 16,
        color: platformColors.textPrimary,
        lineHeight: 22,
        marginBottom: 20,
    },
    infoSectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: platformColors.accent,
        marginTop: 10,
        marginBottom: 15,
    },
    infoListItem: {
        flexDirection: "row",
        marginBottom: 15,
        paddingLeft: 10,
    },
    infoListNumber: {
        fontSize: 16,
        fontWeight: "bold",
        color: platformColors.accent,
        width: 20,
    },
    infoListText: {
        fontSize: 16,
        color: platformColors.textPrimary,
        flex: 1,
        lineHeight: 22,
    },
    infoBold: {
        fontWeight: "bold",
    },
    infoModalFooter: {
        borderTopWidth: 1,
        borderTopColor: platformColors.opaqueSeparator,
        padding: 15,
    },
    closeInfoButton: {
        backgroundColor: platformColors.accent,
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: "center",
    },
    closeInfoButtonText: {
        color: platformColors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    modalTitle: {
        fontSize: 30,
        fontWeight: "bold",
        marginBottom: 10,
        color: platformColors.accent,
        textAlign: "center",
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 100,
    },
    detailsScrollViewContent: {
        paddingRight: 10,
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
        backgroundColor: platformColors.tertiaryBackground,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: platformColors.neutralSoft,
    },
    activityName: {
        fontSize: 16,
        fontWeight: "bold",
        color: platformColors.textPrimary,
    },
    activityDescription: {
        fontSize: 14,
        color: platformColors.textSecondary,
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
        color: platformColors.textSecondary,
        flex: 1,
    },
    deleteButton: {
        backgroundColor: platformColors.danger,
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
        flex: 1,
        marginHorizontal: 5,
    },
    deleteButtonText: {
        color: platformColors.white,
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
        flex: 1,
        flexWrap: "wrap",
    },
    preferenceTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 10,
        marginBottom: 5,
        color: platformColors.accent,
        flexWrap: "wrap", // Allow text to wrap
    },
    preferenceSection: {
        marginVertical: 10,
    },
    preferenceHeaderContainer: {
        flexDirection: "column", // Changed from row to column
        marginBottom: 2,
    },
    preferenceTimingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        marginLeft: 5, // Slight indent
    },
    timingIcon: {
        marginRight: 5,
    },
    preferenceTimingText: {
        fontSize: 14,
        color: platformColors.link,
        fontWeight: "500",
    },
    shareButton: {
        backgroundColor: platformColors.success,
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
        flex: 1,
        marginHorizontal: 5,
    },
    shareButtonText: {
        color: platformColors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    scrollViewWrapper: {
        flex: 1,
        borderWidth: 1,
        borderColor: platformColors.neutralSoft,
        borderRadius: 5,
        backgroundColor: platformColors.secondaryBackground,
        overflow: "hidden",
    },
    detailsScrollView: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
})

export { HomePage, StacDetailsScreen }
