import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
 } from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

export default function App() {
  const [alarmTime, setAlarmTime] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [alarmSet, setAlarmSet] = useState(false);

  // check every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (!alarmTime || !alarmSet) return;

      const now = new Date();
      if (now.getHours() === alarmTime?.getHours() && now.getMinutes() === alarmTime.getMinutes() && now.getSeconds() === 0) {
        Alert.alert("Wake up!!!");
        setAlarmSet(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alarmTime, alarmSet]);

  const onChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setAlarmTime(selectedDate);
      setAlarmSet(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Alarm App
      </Text>

      <Button title="Set Alarm" onPress={() => setShowPicker(true)}/>

      {alarmTime && (
        <Text style={styles.time}>
          Alarm set for:
          {alarmTime.toLocaleTimeString()}
        </Text>
      )}

      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={false}
          onChange={onChange}
        />
      )}
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
    fontSize: 30,
    marginBottom: 20,
  },

  time: {
    fontSize: 20,
    marginTop: 20,
  },
});