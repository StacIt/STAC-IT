import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function WelcomePage() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to STAC-IT</Text>
      <Button title="Sign Up" onPress={() => navigation.navigate('SignUp')} />
      <Button title="Sign In" onPress={() => navigation.navigate('SignIn')} />
      <View style={styles.footer}>
        <Text>Privacy Policy | Terms of Service</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
});
