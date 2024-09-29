import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // 引入 react-native-picker/picker 库
import { useNavigation } from '@react-navigation/native';

export default function SignUpQuestion() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [preference, setPreference] = useState('');
  const [showGenderPicker, setShowGenderPicker] = useState(false); // 管理性别 Picker 显示状态
  const [showPreferencePicker, setShowPreferencePicker] = useState(false); // 管理活动偏好 Picker 显示状态

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up Questions</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={(text) => setName(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Birthday (MM/DD/YYYY)"
        value={birthday}
        onChangeText={(text) => setBirthday(text)}
      />

      <Text style={styles.label}>Gender</Text>
      {/* 显示控制按钮 */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowGenderPicker(!showGenderPicker)}
      >
        <Text style={styles.buttonText}>{gender || 'Select Gender'}</Text>
      </TouchableOpacity>
      {/* 性别 Picker */}
      {showGenderPicker && (
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => {
            setGender(itemValue);
            setShowGenderPicker(false); // 选择完成后隐藏 Picker
          }}
          style={styles.picker}
        >
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
      )}

      <Text style={styles.label}>Activity Preference</Text>
      {/* 显示控制按钮 */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowPreferencePicker(!showPreferencePicker)}
      >
        <Text style={styles.buttonText}>{preference || 'Select Preference'}</Text>
      </TouchableOpacity>
      {/* 活动偏好 Picker */}
      {showPreferencePicker && (
        <Picker
          selectedValue={preference}
          onValueChange={(itemValue) => {
            setPreference(itemValue);
            setShowPreferencePicker(false); // 选择完成后隐藏 Picker
          }}
          style={styles.picker}
        >
          <Picker.Item label="Indoor" value="Indoor" />
          <Picker.Item label="Outdoor" value="Outdoor" />
        </Picker>
      )}

      {/* 提交按钮 */}
      <View style={styles.footer}>
        <Button title="Submit" onPress={() => navigation.navigate('VerifyEmail')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd',
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  picker: {
    height: 150,
    width: '100%',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
});
