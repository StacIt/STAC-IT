import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { NavigationProp, RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import * as SMS from 'expo-sms';

import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
}

const HomePage: React.FC<HomePageProps> = ({ navigation }) => {
    const route = useRoute<RouteProp<{ params: { refresh?: boolean } }>>();
    const [scheduledStacs, setScheduledStacs] = useState<Stac[]>([]);
    const [pastStacs, setPastStacs] = useState<Stac[]>([]);

    useEffect(() => {
        fetchStacs();
    }, []);

    useEffect(() => {
        if (route.params?.refresh) {
            fetchStacs();
        }
    }, [route.params?.refresh]);

    const fetchStacs = async () => {
        const user = FIREBASE_AUTH.currentUser;
        if (!user) return;
    
        try {
            const stacsRef = collection(FIREBASE_DB, 'stacks');
            const q = query(stacsRef, where('userId', '==', user.uid));
            
            const querySnapshot = await getDocs(q);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            
            const fetchedScheduledStacs: Stac[] = [];
            const fetchedPastStacs: Stac[] = [];
    
            querySnapshot.forEach((doc) => {
                const data = doc.data() as Stac;
                const stacDate = new Date(data.date);
                stacDate.setHours(0, 0, 0, 0);
    
                // Only include STACs with a `modelResponse`
                if (data.modelResponse) {
                    const stac = {
                        ...data,
                        id: doc.id
                    };
    
                    if (stacDate >= currentDate) {
                        fetchedScheduledStacs.push(stac);
                    } else {
                        fetchedPastStacs.push(stac);
                    }
                }
            });
    
            // Sort by date
            fetchedScheduledStacs.sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            fetchedPastStacs.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
    
            setScheduledStacs(fetchedScheduledStacs);
            setPastStacs(fetchedPastStacs);
            
            console.log('Fetched Stacs with Model Response:', {
                scheduled: fetchedScheduledStacs.length,
                past: fetchedPastStacs.length
            });
        } catch (error) {
            console.error("Error fetching stacs:", error);
            Alert.alert("Error", "Failed to load STACs");
        }
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

    const renderStacList = (stacs: Stac[], title: string, p0: boolean) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {stacs.length === 0 ? (
                <Text style={styles.noStacsText}>No {title.toLowerCase()} available</Text>
            ) : (
                stacs.map((stac) => (
                    <View key={stac.id} style={styles.stacContainer}>
                        <TouchableOpacity
                            style={styles.stacButton}
                            onPress={() => navigation.navigate('StacDetails', { stac })}
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
    

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>STAC-IT</Text>

            <TouchableOpacity
                style={styles.activityButton}
                onPress={() => navigation.navigate('MainTabs', { screen: "Create" })}
            >
                <Text style={styles.buttonText}>Start New STAC</Text>
            </TouchableOpacity>

            {renderStacList(scheduledStacs, "Scheduled STAC", false)}
            {renderStacList(pastStacs, "Past History", true)}
        </ScrollView>
    );
};

const StacDetailsScreen: React.FC = () => {
    const route = useRoute<RouteProp<{ params: { stac: Stac } }>>();
    const navigation = useNavigation();
    const { stac } = route.params;

    return (
        <ScrollView style={styles.container}>
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
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                <Text style={styles.closeButtonText}>Back to Home</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f0f2f5',
    },
    title: {
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
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    shareButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
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
});

export { HomePage, StacDetailsScreen };