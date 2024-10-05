import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Landing from './src/screens/Landing';
import Login from './src/screens/Login';
import CreateAccount from './src/screens/CreateAccount';
import SignUpQuestions from './src/screens/SignUpQuestions';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing">
        <Stack.Screen 
          name="Landing" 
          component={Landing} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CreateAccount" 
          component={CreateAccount} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="SignUpQuestions"
          component={SignUpQuestions}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
