import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function VerifyEmailPage() {
  const navigation = useNavigation();

  const handleReturnToSignIn = () => {
    navigation.navigate('SignIn');
  };
  const handleContinueToQuestions = () => {
    navigation.navigate('SignUpQuestion');  // 导航到 SignUpQuestion 页面
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email Address</Text>
      <Text style={styles.description}>
        We've sent a verification link to your email. Please check your inbox and click the link to verify your account.
      </Text>
      <Button title="Return to Sign In" onPress={handleReturnToSignIn} />
      <Button title="Continue" onPress={handleContinueToQuestions} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fafad2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
