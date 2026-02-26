"use client"

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import StacForm from "../components/StacForm";
import type { NavigationProp } from "@react-navigation/native";
import { platformColors } from '../theme/platformColors';

interface CreateStackProps {
  navigation: NavigationProp<any>;
}

const CreateStack: React.FC<CreateStackProps> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          setModalVisible(true);
        }}
      >
        <Text style={styles.buttonText}>Create STAC</Text>
      </TouchableOpacity>

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
    backgroundColor: platformColors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: platformColors.white,
    fontSize: 18,
  },
});

export default CreateStack;