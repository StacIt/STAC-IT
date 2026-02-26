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
      <Text variant="headlineLarge" style={styles.title} numberOfLines={2} adjustsFontSizeToFit>
        Welcome to STAC-IT
      </Text>

      <Button mode="contained" onPress={() => navigation.navigate("Login")} contentStyle={styles.buttonContent} style={styles.button}>
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
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: platformColors.textPrimary,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: platformColors.accent,
    width: "70%",
  },
  buttonContent: {
    color: platformColors.white,
    paddingVertical: 8,
  },
});
