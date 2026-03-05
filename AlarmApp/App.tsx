import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';


interface AlarmSet {
  id: string;
  start: string;           
  end: string;
  interval: number;        // minutes
  count: number;           // num of alarms
  active: boolean;
}

export default function App() {
  const [alarms, setAlarms] = useState<AlarmSet[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [intervalMinutes, setIntervalMinutes] = useState<number>(10);

  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState<boolean>(false);

  const CreateIntervalAlarms = () => {
    let current = new Date(startTime);
    const end = new Date(endTime);
    const intervalMs = intervalMinutes * 60 * 1000;
    let count = 0;

    while (current <= end) {
      count++;
      current = new Date(current.getTime() + intervalMs);
    }

    {/*set alarm*/}
    const newAlarmSet: AlarmSet = {
      id: Date.now().toString(),
      start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      interval: intervalMinutes,
      count,
      active: true,
    };

    setAlarms((prev) => [...prev, newAlarmSet]);
    Alert.alert('Alarms Created!', `${count} alarms would be scheduled!`);
  };

  const toggleAlarmSet = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const deleteAlarmSet = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    Alert.alert('Deleted', 'Alarm set removed (simulation)');
  };

  const intervalOptions = [1, 2, 3, 5, 10, 15, 20, 30];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alarm Flow</Text>

      {/* Alarms List */}
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.alarmItem}
            onLongPress={() => deleteAlarmSet(item.id)}
          >
            <Switch
              value={item.active}
              onValueChange={() => toggleAlarmSet(item.id)}
            />
            {/* summarized alarm text */}
            <Text style={styles.alarmText}>
              Start Time: {item.start} {'\n'}
               End Time: {item.end} {'\n'}
               Interval: {item.interval} min 
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No alarms yet</Text>}
      />

      {/*Start time picker*/}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Start Time</Text>
        <Text style={styles.timeText}>
          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <TouchableOpacity onPress={() => setShowStartPicker(true)}>
          <Text style={styles.clickable}>Change Start</Text>
        </TouchableOpacity>
        {/* end time picker */}
        <Text style={styles.summaryLabel}>End Time</Text>
        <Text style={styles.timeText}>
          {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <TouchableOpacity onPress={() => setShowEndPicker(true)}>
          <Text style={styles.clickable}>Change End</Text>
        </TouchableOpacity>
        {/* interval picker */}
        <Text style={styles.summaryLabel}>Interval</Text>
        <Text style={styles.timeText}>Every {intervalMinutes} minutes</Text>
        <TouchableOpacity onPress={() => setShowIntervalPicker(true)}>
          <Text style={styles.clickable}>Change Interval</Text>
        </TouchableOpacity>
      </View>

      <Button
        title="Create Alarm Set"
        onPress={CreateIntervalAlarms}
        color="#4CAF50"
      />

      {/* Time Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={false}
          onChange={(event, selectedDate) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (selectedDate) setStartTime(selectedDate);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={false}
          onChange={(event, selectedDate) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (selectedDate) setEndTime(selectedDate);
          }}
        />
      )}

      {showIntervalPicker && (
        <View style={styles.intervalPicker}>
          {intervalOptions.map((min) => (
            <TouchableOpacity
              key={min}
              style={styles.intervalOption}
              onPress={() => {
                setIntervalMinutes(min);
                setShowIntervalPicker(false);
              }}
            >
              <Text style={{ fontSize: 18 }}>{min} minutes</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => setShowIntervalPicker(false)}
          >
            <Text style={{ color: 'red', textAlign: 'center' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginVertical: 20, textAlign: 'center' },
  alarmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  alarmText: { marginLeft: 12, fontSize: 16, flex: 1 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 },
  summary: {
    marginVertical: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryLabel: { fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  timeText: { fontSize: 18 },
  clickable: { color: '#2196F3', marginVertical: 4, fontWeight: '500' },
  intervalPicker: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  intervalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
});