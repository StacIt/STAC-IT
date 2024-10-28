import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

interface HomePageProps {
    navigation: NavigationProp<any>;
}

interface Hangout {
    id: string;
    name: string;
    rating: number;
    description: string;
}

const HomePage: React.FC<HomePageProps> = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [hangouts, setHangouts] = useState<Hangout[]>([
        { id: '1', name: 'Hangout 1', rating: 4, description: 'Description of Hangout 1' },
        { id: '2', name: 'Hangout 2', rating: 3, description: 'Description of Hangout 2' },
    ]);

    const startNewActivity = () => {
        setLoading(true);

        setTimeout(() => {
            const newActivity: Hangout = {
                id: (hangouts.length + 1).toString(),
                name: `Hangout ${hangouts.length + 1}`,
                rating: Math.floor(Math.random() * 5) + 1,
                description: `Description of Hangout ${hangouts.length + 1}`,
            };
            setHangouts([...hangouts, newActivity]);
            setLoading(false);
        }, 2000);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>STAC-IT</Text>

            {/* activities */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activities</Text>
                <TouchableOpacity activeOpacity={0.7} style={styles.activityButton} onPress={startNewActivity}>
                    <Text style={styles.buttonText}>Start New Activity</Text>
                </TouchableOpacity>
            </View>

            {/* past history */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past History</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#6200ea" />
                ) : (
                    <FlatList
                        data={hangouts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.historyItem}>
                                <View>
                                    <Text style={styles.historyText}>{item.name}</Text>
                                    <Text style={styles.subText}>{item.description}</Text>
                                </View>
                                <Text style={[styles.rating, item.rating >= 4 ? styles.highRating : styles.lowRating]}>
                                    {'★'.repeat(item.rating)}
                                </Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </View>
    );
};

export default HomePage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingBottom: 80,
        backgroundColor: '#f0f2f5',
        justifyContent: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 40,
    },
    section: {
        marginVertical: 20,
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
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    historyText: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },
    subText: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    rating: {
        fontSize: 16,
        color: '#ffcc00',
        alignSelf: 'center',
    },
    highRating: {
        color: '#ffcc00',
    },
    lowRating: {
        color: '#ffcc00',
    },
});
