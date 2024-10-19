import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Button,
    ScrollView,
    Alert,
} from 'react-native';


const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
    'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
    'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
    'WI', 'WY'
];

const CreateStack: React.FC = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [preferences, setPreferences] = useState('');
    const [budget, setBudget] = useState('');

    const isValidTime = (time: string) => {
        const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return regex.test(time);
    };

    const validateForm = () => {
        if (!startTime || !endTime || !city || !state || !preferences || !budget) {
            Alert.alert('Error', 'All fields are required.');
            return false;
        }
        if (!isValidTime(startTime) || !isValidTime(endTime)) {
            Alert.alert('Error', 'Please enter valid times in HH:MM format.');
            return false;
        }
        if (!validStates.includes(state.toUpperCase())) {
            Alert.alert('Error', 'Please enter a valid US state abbreviation.');
            return false;
        }
        if (isNaN(Number(budget))) {
            Alert.alert('Error', 'Budget must be a number.');
            return false;
        }
        return true;
    };

    const handleCreateStack = () => {
        if (!validateForm()) return;

        console.log('Start Time:', startTime);
        console.log('End Time:', endTime);
        console.log('Location:', `${city}, ${state.toUpperCase()}`);
        console.log('Preferences:', preferences);
        console.log('Budget:', budget);

        
        setStartTime('');
        setEndTime('');
        setCity('');
        setState('');
        setPreferences('');
        setBudget('');
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => setModalVisible(true)}
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
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create a New STAC</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Start Time (HH:MM)"
                            value={startTime}
                            onChangeText={setStartTime}
                            keyboardType="numeric"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="End Time (HH:MM)"
                            value={endTime}
                            onChangeText={setEndTime}
                            keyboardType="numeric"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="City"
                            value={city}
                            onChangeText={setCity}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="State (e.g., CA)"
                            value={state}
                            onChangeText={setState}
                            maxLength={2} 
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Preferences"
                            value={preferences}
                            onChangeText={setPreferences}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Budget"
                            value={budget}
                            onChangeText={setBudget}
                            keyboardType="numeric"
                        />

                        <Button title="Submit" onPress={handleCreateStack} />
                        <Button
                            title="Cancel"
                            color="red"
                            onPress={() => setModalVisible(false)}
                        />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

export default CreateStack;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    createButton: {
        backgroundColor: '#6200ea',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        marginTop: 200,
        margin: 50,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        marginBottom: 10,
    },
});
