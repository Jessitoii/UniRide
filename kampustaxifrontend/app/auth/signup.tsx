'use client';

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Button as RNButton,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  SegmentedButtons,
} from 'react-native-paper';
import api from '../../config/api';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import universities from '../../constants/Universities';
import DropDownPicker from 'react-native-dropdown-picker';

const SignupScreen = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    gender: '',
    birthDate: new Date(),
    university: '',
    faculty: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Add state for dropdown open status
  const [universityOpen, setUniversityOpen] = useState(false);
  const [facultyOpen, setFacultyOpen] = useState(false);

  const validateStep1 = () => {
    if (!formData.name || !formData.surname || !formData.gender || !formData.birthDate) {
      setError('Please fill in all fields');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
      return;
    } 
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep1()) return;

    setLoading(true);
    setError('');

    const response = await api.post('/api/auth/signup', formData);
    
    if (response.error) {
      setError(response.error);
    } else {
      router.push('/auth/validate-email');
    }
    
    setLoading(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.birthDate;
    setShowDatePicker(Platform.OS === 'ios');
    setFormData({ ...formData, birthDate: currentDate });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStep1 = () => (
    <>
      <TextInput
        mode="outlined"
        label="Name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        style={styles.input}
      />

      <TextInput
        mode="outlined"
        label="Surname"
        value={formData.surname}
        onChangeText={(text) => setFormData({ ...formData, surname: text })}
        style={styles.input}
      />

      <SegmentedButtons
        value={formData.gender}
        onValueChange={value => setFormData({ ...formData, gender: value })}
        buttons={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' },
        ]}
        style={styles.segmentedButton}
      />

      <RNButton
        title={formData.birthDate ? formatDate(formData.birthDate) : 'Select Birth Date'}
        onPress={() => setShowDatePicker(true)}
      />

      {showDatePicker && (
        <DateTimePicker
          value={formData.birthDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1950, 0, 1)}
        />
      )}

      <RNButton title="Next" onPress={handleNext} />
    </>
  );

  const renderStep2 = () => (
    <View>
      <Text>Step 2: University Information</Text>
      <DropDownPicker
        open={universityOpen}
        value={formData.university}
        items={universities.map((uni) => ({ label: uni.name, value: uni.name }))}
        setOpen={setUniversityOpen}
        setValue={(callback) => setFormData((prev) => ({ ...prev, university: callback(prev.university) }))}
        containerStyle={{ height: 40 }}
        style={{ backgroundColor: '#fafafa', zIndex: 1 }}
        listItemContainerStyle={{ backgroundColor: '#fafafa'}}
      />
      <DropDownPicker
        open={facultyOpen}
        value={formData.faculty}
        items={
          universities.find((uni) => uni.name === formData.university)?.faculties.map((faculty) => ({
            label: faculty.name,
            value: faculty.name,
          })) || []
        }
        setOpen={setFacultyOpen}
        setValue={(callback) => setFormData((prev) => ({ ...prev, faculty: callback(prev.faculty) }))}
        containerStyle={{ height: 40 }}
        style={{ backgroundColor: '#fafafa', zIndex:0}}
        listItemContainerStyle={{ backgroundColor: '#fafafa' }}
      />
      <RNButton title="Next" onPress={handleNext} />
      <RNButton title="Back" onPress={handleBack} />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
        <Text variant="titleMedium" style={styles.subtitle}>{`Step ${step} of 3`}</Text>

        {step === 1 && renderStep1()}

        {step === 2 && renderStep2()}

        {step === 3 && (
          <View>
            <Text>Step 3: Account Information</Text>
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
            />
            <RNButton title="Submit" onPress={handleSubmit} />
            <RNButton title="Back" onPress={handleBack} />
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginVertical: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 15,
  },
  segmentedButton: {
    marginBottom: 15,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 15,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 15,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 15,
  },
});

export default SignupScreen; 