import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import axios from 'axios';

const CB: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [userInput, setUserInput] = useState(''); // New state for user input

    const callBackendModel = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://10.0.2.2:8000/chatbot/call-model/',
                new URLSearchParams({ message: userInput }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            //setData(response.data);
            //Alert.alert('Model Response', response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to call backend model.');
        }
        //setLoading(false);
        console.log(response);
    };


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Call Backend Page</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your query"
                value={userInput}
                onChangeText={setUserInput}
            />
            {loading ? (
                <ActivityIndicator size="large" color="#6200ea" />
            ) : (
                <>
                    <TouchableOpacity style={styles.button} onPress={callBackendModel}>
                        <Text style={styles.buttonText}>Call Model</Text>
                    </TouchableOpacity>
                    {data && (
                        <Text style={styles.responseText}>Response: {JSON.stringify(data)}</Text>
                    )}
                </>
            )}
        </View>
    );
};

export default CB;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '80%',
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 20,
        borderRadius: 5,
    },
    button: {
        backgroundColor: '#6200ea',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
    },
    responseText: {
        marginTop: 20,
        fontSize: 16,
        color: 'gray',
    },
});
