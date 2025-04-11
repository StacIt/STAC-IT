import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

interface LandingProps {
    navigation: NavigationProp<any>;
}

const Landing: React.FC<LandingProps> = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>
                Welcome to STAC-IT
            </Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate("Login")}
            >
                <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#6200ea',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
});

export default Landing;