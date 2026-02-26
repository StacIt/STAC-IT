import React from "react";
import { View, StyleSheet } from "react-native";
import { NavigationProp } from "@react-navigation/native";
import { Text, Button } from "react-native-paper";
import { platformColors } from '../theme/platformColors';

interface LandingProps {
  navigation: NavigationProp<any>;
}

const Landing: React.FC<LandingProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={{fontWeight: "bold"}}>
        Welcome to STAC-IT
      </Text>

      <Button mode="contained" onPress={() => navigation.navigate("Login")}>
        Get Started
      </Button>
    </View>
  );
};

export default Landing;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
});
