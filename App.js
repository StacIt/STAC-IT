import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomePage from './src/components/WelcomePage';
import SignUpPage from './src/components/SignUpPage';
import SignInPage from './src/components/SignInPage';
import VerifyEmailPage from './src/components/VerifyEmailPage';
//import "./src/styles.css";
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="STAC-IT">
        <Stack.Screen name="STAC-IT" component={WelcomePage} />
        <Stack.Screen name="SignUp" component={SignUpPage} />
        <Stack.Screen name="SignIn" component={SignInPage} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
