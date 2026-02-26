"use client"

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import StacForm from "../components/StacForm";
import type { NavigationProp } from "@react-navigation/native";

interface CreateStackProps {
  navigation: NavigationProp<any>;
}

const CreateStack: React.FC<CreateStackProps> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        style={styles.createButton}
        contentStyle={styles.buttonContent}
        onPress={() => {
          setModalVisible(true);
        }}
      >
        Create STAC
      </Button>

      <StacForm
        navigation={navigation}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  createButton: {
    width: "70%",
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default CreateStack;
