import React, { useState, useEffect, useCallback } from 'react';
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

import styles from './styles.js';

// local
import {
  AlarmSet,
  createAlarmChannel,
  requestAlarmPermissions,
  scheduleAlarmSet,
  cancelAlarmSet,
} from './AlarmScheduler';


const STORAGE_KEY = 'ALARMS';


export default function App() {
  const [alarms, setAlarms]                       = useState<AlarmSet[]>([]);
  const [startTime, setStartTime]                 = useState<Date>(new Date());
  const [endTime, setEndTime]                     = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [intervalMinutes, setIntervalMinutes]     = useState<number>(10);
  const [showStartPicker, setShowStartPicker]     = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker]         = useState<boolean>(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState<boolean>(false);
  const [isLoaded, setIsLoaded]                   = useState(false);


  // ─── INIT: channel + permissions + load persisted alarms ───
  useEffect(() => {
    const init = async () => {
      // Create the notification channel (no-op on iOS)
      await createAlarmChannel();

      // Request all OS-level permissions
      await requestAlarmPermissions();

      // Load persisted alarms from disk
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setAlarms(JSON.parse(stored));
        }
      } catch (e) {
        console.log('Failed to load alarms', e);
      } finally {
        setIsLoaded(true);
      }
    };

    init();
  }, []);


  // ─── PERSIST alarms to disk whenever they change ───
  useEffect(() => {
    if (!isLoaded) return;

    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
      } catch (e) {
        console.log('Failed to save alarms', e);
      }
    };

    persist();
  }, [alarms, isLoaded]);


  // ─── CREATE alarm set (OS-level scheduling) ───
  const CreateIntervalAlarms = useCallback(async () => {
    // Re-check permissions before scheduling
    const allowed = await requestAlarmPermissions();
    if (!allowed) return;

    try {
      const { count, notificationIds } = await scheduleAlarmSet(
        startTime,
        endTime,
        intervalMinutes
      );

      const newAlarmSet: AlarmSet = {
        id: Date.now().toString(),
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        interval: intervalMinutes,
        count,
        active: true,
        notificationIds,
      };

      setAlarms((prev) => [...prev, newAlarmSet]);

      const startLabel = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endLabel   = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      Alert.alert(
        'Alarms Scheduled',
        `${notificationIds.length} alarm(s) set from ${startLabel} to ${endLabel}.\nThey will fire even if the app is closed.`
      );
    } catch (e) {
      console.log('Failed to schedule alarms', e);
      Alert.alert('Error', 'Could not schedule alarms. Check permissions and try again.');
    }
  }, [startTime, endTime, intervalMinutes]);


  // ─── TOGGLE alarm set on/off ───
  const toggleAlarmSet = useCallback(async (id: string) => {
    const target = alarms.find((a) => a.id === id);
    if (!target) return;

    if (target.active) {
      // Deactivate — cancel OS triggers
      await cancelAlarmSet(target.notificationIds);
      setAlarms((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, active: false, notificationIds: [] } : a
        )
      );
    } else {
      // Reactivate — re-schedule from stored times
      const allowed = await requestAlarmPermissions();
      if (!allowed) return;

      const startDate = new Date(target.start);
      const endDate   = new Date(target.end);
      const { notificationIds } = await scheduleAlarmSet(
        startDate,
        endDate,
        target.interval
      );
      setAlarms((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, active: true, notificationIds } : a
        )
      );
    }
  }, [alarms]);


  // ─── DELETE alarm set ───
  const confirmDeleteAlarmSet = useCallback((id: string) => {
    Alert.alert(
      'Delete alarm set?',
      'This will remove entire batch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const target = alarms.find((a) => a.id === id);
            if (target) {
              await cancelAlarmSet(target.notificationIds);
            }
            setAlarms((prev) => prev.filter((a) => a.id !== id));
          },
        },
      ],
      { cancelable: true }
    );
  }, [alarms]);


  // ─── HELPERS ───
  const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const intervalOptions = [1, 2, 3, 5, 10, 15, 20, 30];


  // ─── RENDER ───
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alarm Flow</Text>

      {/* Alarms List */}
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.alarmItem}>
            <Switch
              value={item.active}
              onValueChange={() => toggleAlarmSet(item.id)}
            />
            <Text style={styles.alarmText}>
              Start Time: {formatTime(item.start)} {'\n'}
              End Time: {formatTime(item.end)} {'\n'}
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
        ListEmptyComponent={
          <Text style={styles.emptyText}>No alarms yet</Text>
        }
      />

      {/* Time controls */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Start Time</Text>
        <TouchableOpacity onPress={() => setShowStartPicker(true)}>
          <Text style={styles.timeText}>{formatTime(startTime)}</Text>
        </TouchableOpacity>

        <Text style={styles.summaryLabel}>End Time</Text>
        <TouchableOpacity onPress={() => setShowEndPicker(true)}>
          <Text style={styles.timeText}>{formatTime(endTime)}</Text>
        </TouchableOpacity>

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
