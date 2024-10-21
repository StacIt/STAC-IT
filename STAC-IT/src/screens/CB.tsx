import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

const CB: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null); 

    const callBackendModel = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:8000/chatbot/call-model/', {});
            setData(response.data);
            Alert.alert('Model Response', response.data.message); 
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to call backend model.');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Call Backend Page</Text>
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
