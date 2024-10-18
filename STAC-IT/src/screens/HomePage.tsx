import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomePage = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>HomePage</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default HomePage;