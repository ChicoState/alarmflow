import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import styles from "./styles.js"

// local
import SOUND from "./Sound.tsx"
import {
  SECOND,
  get_interval_time
} from "./Time.tsx"


import {
  createAlarmChannel,
  requestAlarmPermissions,
  scheduleAlarmSet,
  cancelAlarmSet,
  registerForegroundHandler,
} from './AlarmScheduler';

interface AlarmSet {
  id: string;
  start: string;           
  end: string;
  interval: number;        // minutes
  count: number;           // num of alarms
  active: boolean;
  notificationIds?: string[]; // Added for OS scheduling
}

function check_time(current_time: Date, alarm_time: Date): boolean {
  let CT: Date = current_time;    // current time
  let AT: Date = alarm_time;      // alarm time

  // alarm should go off when both times match
  if(CT.getHours() === AT.getHours()){
    if(CT.getMinutes() === AT.getMinutes()){
      return true;
    }
  }

  // the alarm should NOT go off when they are different
  return false;
}

export default function App() {
  const [alarms,    setAlarms]    = useState<AlarmSet[]>([]);
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

  //guard against overlapping alarms
  const lastFiredRef = React.useRef<Record<string, string>>({});

  const [isLoaded, setIsLoaded] = useState(false);


  useEffect(() => {
    const init = async () => {
      await createAlarmChannel();
      await requestAlarmPermissions();
    };
    init();

    // Register the foreground event handler so taps/dismissals stop the
    // looping alarm sound while the app is open. (Background events are
    // registered in index.js.)
    const unsubscribe = registerForegroundHandler();
    return unsubscribe;
  }, []);

  // save alarms
  useEffect(() => {
    if (!isLoaded) return;

    const handle = setTimeout(() => {
      AsyncStorage.setItem('ALARMS', JSON.stringify(alarms)).catch((e) =>
        console.log('Failed to save alarms', e)
      );
    }, 250);

    return () => clearTimeout(handle);
  }, [alarms, isLoaded]);

  // load alarms
  useEffect(() => {
    const loadAlarms = async () => {
      try { // load stored alarms set
        const stored = await AsyncStorage.getItem('ALARMS');
        if (stored !== null) {
          setAlarms(JSON.parse(stored));
        }
      } catch (e) {
        console.log('Failed to load alarms', e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadAlarms();
  }, []);

  const CreateIntervalAlarms = async () => {
    const allowed = await requestAlarmPermissions();
    if (!allowed) return;

    try {
      const { count, notificationIds } = await scheduleAlarmSet(
        startTime,
        endTime,
        intervalMinutes
      );

      // {/*set alarm*/} //should not be in CreateIntervalAlarms
      const newAlarmSet: AlarmSet = {
        id: Date.now().toString(),
        start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        end: endTime.toLocaleTimeString([],     { hour: '2-digit', minute: '2-digit' }),
        interval: intervalMinutes,
        count,
        active: true,
        notificationIds,
      };

      setAlarms((prev) => [...prev, newAlarmSet]);
      Alert.alert('Alarms Created!', `${count} alarms would be scheduled!`);
    } catch (e) {
      console.log('Failed to schedule alarms', e);
      Alert.alert('Error', 'Could not schedule alarms. Check permissions and try again.');
    }
  };

  const toggleAlarmSet = async (id: string) => {
    const target = alarms.find((a) => a.id === id);
    if (!target) return;

    if (target.active) {
      if (target.notificationIds) {
        await cancelAlarmSet(target.notificationIds);
      }
      setAlarms((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: false, notificationIds: [] } : a))
      );
    } else {
      const allowed = await requestAlarmPermissions();
      if (!allowed) return;

      // Create temporary dates based on the stored local time strings to reschedule
      const startDate = new Date();
      const [startHours, startMinutes] = target.start.split(/[: ]/);
      startDate.setHours(target.start.includes('PM') && startHours !== '12' ? parseInt(startHours) + 12 : parseInt(startHours), parseInt(startMinutes));
      
      const endDate = new Date();
      const [endHours, endMinutes] = target.end.split(/[: ]/);
      endDate.setHours(target.end.includes('PM') && endHours !== '12' ? parseInt(endHours) + 12 : parseInt(endHours), parseInt(endMinutes));

      const { notificationIds } = await scheduleAlarmSet(startDate, endDate, target.interval);
      setAlarms((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: true, notificationIds } : a))
      );
    }
  };


const confirmDeleteAlarmSet = (id: string) => {
    Alert.alert(
        "Delete alarm set?",
        "This will remove entire batch.",
        [
            {
                text: "Cancel", style: "cancel"},
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  const target = alarms.find((a) => a.id === id);
                  if (target && target.notificationIds) {
                    await cancelAlarmSet(target.notificationIds);
                  }
                  setAlarms(prev => prev.filter(a => a.id !== id));
                },
            },
        ],
        {cancelable: true}
      );

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
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => confirmDeleteAlarmSet(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No alarms yet</Text>}
      />

      {/*Start time picker*/}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Start Time</Text>
        <TouchableOpacity onPress={() => setShowStartPicker(true)}>
          <Text style={styles.timeText}>
            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {/* end time picker */}
        <Text style={styles.summaryLabel}>End Time</Text>
        <TouchableOpacity onPress={() => setShowEndPicker(true)}>
          <Text style={styles.timeText}>
            {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {/* interval picker */}
        <Text style={styles.summaryLabel}>Interval</Text>
        <TouchableOpacity
          onPress={() => setShowIntervalPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.timeText}>Every {intervalMinutes} minutes</Text>
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
              <Text style={styles.intervalText}>{min} minutes</Text>
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
