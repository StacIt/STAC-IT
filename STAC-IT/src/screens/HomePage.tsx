import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
    ActivityIndicator,
    Alert,
    Button,
} from 'react-native';
import { NavigationProp, RouteProp, useRoute } from '@react-navigation/native';

interface HomePageProps {
    navigation: NavigationProp<any>;
}

interface Stac {
    id: string;
    name: string;
    date: string;
}

const HomePage: React.FC<HomePageProps> = ({ navigation }) => {
    const route = useRoute<RouteProp<{ params: { stacName?: string, date?: string } }>>();
    const [scheduledStacs, setScheduledStacs] = useState<Stac[]>([]);
    const [pastStacs, setPastStacs] = useState<Stac[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStac, setSelectedStac] = useState<Stac | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (route.params?.stacName && route.params?.date) {
            const newStac: Stac = {
                id: Date.now().toString(),
                name: route.params.stacName,
                date: route.params.date,
            };
            
            const stacDate = new Date(route.params.date);
            const currentDate = new Date();

            if (stacDate > currentDate) {
                setScheduledStacs(prevStacs => [...prevStacs, newStac]);
            } else {
                setPastStacs(prevStacs => [...prevStacs, newStac]);
            }
        }
    }, [route.params?.stacName, route.params?.date]);

    const openModal = (stac: Stac) => {
        setSelectedStac(stac);
        setModalVisible(true);
    };

    const renderStacList = (stacs: Stac[], title: string) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {stacs.map((stac) => (
                <TouchableOpacity
                    key={stac.id}
                    activeOpacity={0.7}
                    style={styles.stacButton}
                    onPress={() => openModal(stac)}
                >
                    <Text style={styles.buttonText}>{stac.name}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>STAC-IT</Text>

            {renderStacList(scheduledStacs, "Scheduled STAC")}
            {renderStacList(pastStacs, "Past History")}

            <TouchableOpacity
                activeOpacity={0.7}
                style={styles.activityButton}
                onPress={() => navigation.navigate('MainTabs', { screen: "Create" })}
            >
                <Text style={styles.buttonText}>Start New STAC</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{selectedStac?.name}</Text>
                        <Text style={styles.modalText}>Date: {selectedStac?.date}</Text>
                        <Button title="Close" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default HomePage;

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
        marginBottom: 30,
    },
    section: {
        marginBottom: 20,
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
        marginTop: 20,
    },
    stacButton: {
        backgroundColor: '#4a4a4a',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        width: '80%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
    },
});

