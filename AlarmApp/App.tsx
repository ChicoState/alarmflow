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
  Modal,                // overlay for edit form
  KeyboardAvoidingView, // keeps pickers visible
  Pressable,            // tap-to-dismiss
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
  notificationIds?: string[];
}

function check_time(current_time: Date, alarm_time: Date): boolean {
  let CT: Date = current_time;
  let AT: Date = alarm_time;

  if (CT.getHours() === AT.getHours()) {
    if (CT.getMinutes() === AT.getMinutes()) {
      return true;
    }
  }

  return false;
}

interface EditModalProps {
  visible: boolean;
  initialStart: Date;
  initialEnd: Date;
  initialInterval: number;
  onSave: (start: Date, end: Date, interval: number) => void;
  onCancel: () => void;
}

function EditModal({
  visible,
  initialStart,
  initialEnd,
  initialInterval,
  onSave,
  onCancel,
}: EditModalProps) {
  const [modalStart, setModalStart]       = useState<Date>(initialStart);
  const [modalEnd, setModalEnd]           = useState<Date>(initialEnd);
  const [modalInterval, setModalInterval] = useState<number>(initialInterval);

  const [showStartPicker, setShowStartPicker]       = useState(false);
  const [showEndPicker, setShowEndPicker]           = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalStart(initialStart);
      setModalEnd(initialEnd);
      setModalInterval(initialInterval);
      setShowStartPicker(false);
      setShowEndPicker(false);
      setShowIntervalPicker(false);
    }
  }, [visible, initialStart, initialEnd, initialInterval]);

  const intervalOptions = [1, 2, 3, 5, 10, 15, 20, 30];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <Pressable style={styles.editBackdrop} onPress={onCancel}>
        <Pressable onPress={() => {}}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.editCard}>

              <View style={styles.editHandle} />

              <Text style={styles.editTitle}>Edit Alarm Set</Text>

              {/* Start */}
              <Text style={styles.editLabel}>Start Time</Text>
              <TouchableOpacity
                style={styles.editInputBox}
                onPress={() => {
                  setShowEndPicker(false);
                  setShowIntervalPicker(false);
                  setShowStartPicker(true);
                }}
              >
                <Text style={styles.editInputText}>
                  {modalStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>

              {showStartPicker && (
                <DateTimePicker
                  value={modalStart}
                  mode="time"
                  is24Hour={false}
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (selectedDate) setModalStart(selectedDate);
                  }}
                />
              )}

              {/* End */}
              <Text style={styles.editLabelSpacing}>End Time</Text>
              <TouchableOpacity
                style={styles.editInputBox}
                onPress={() => {
                  setShowStartPicker(false);
                  setShowIntervalPicker(false);
                  setShowEndPicker(true);
                }}
              >
                <Text style={styles.editInputText}>
                  {modalEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>

              {showEndPicker && (
                <DateTimePicker
                  value={modalEnd}
                  mode="time"
                  is24Hour={false}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (selectedDate) setModalEnd(selectedDate);
                  }}
                />
              )}

              {/* Interval */}
              <Text style={styles.editLabelSpacing}>Interval</Text>
              <TouchableOpacity
                style={styles.editInputBox}
                onPress={() => {
                  setShowStartPicker(false);
                  setShowEndPicker(false);
                  setShowIntervalPicker((prev) => !prev);
                }}
              >
                <Text style={styles.editInputText}>
                  Every {modalInterval} minutes
                </Text>
              </TouchableOpacity>

              {showIntervalPicker && (
                <View style={styles.editIntervalContainer}>
                  {intervalOptions.map((min) => (
                    <TouchableOpacity
                      key={min}
                      onPress={() => {
                        setModalInterval(min);
                        setShowIntervalPicker(false);
                      }}
                      style={[
                        styles.editIntervalButton,
                        modalInterval === min && styles.editIntervalButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.editIntervalText,
                          modalInterval === min && styles.editIntervalTextActive,
                        ]}
                      >
                        {min} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Buttons */}
              <View style={styles.editButtonRow}>
                <TouchableOpacity
                  onPress={onCancel}
                  style={[styles.editButton, styles.editCancelButton]}
                >
                  <Text style={styles.editCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onSave(modalStart, modalEnd, modalInterval)}
                  style={[styles.editButton, styles.editSaveButton]}
                >
                  <Text style={styles.editSaveText}>Save Edit</Text>
                </TouchableOpacity>
              </View>

            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


export default function App() {
  const [alarms, setAlarms]       = useState<AlarmSet[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime]     = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [intervalMinutes, setIntervalMinutes]       = useState<number>(10);
  const [showStartPicker, setShowStartPicker]       = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker]           = useState<boolean>(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState<boolean>(false);

  // The full alarm object being edited. null = modal closed.
  const [editingAlarm, setEditingAlarm] = useState<AlarmSet | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);


  useEffect(() => {
    const init = async () => {
      await createAlarmChannel();
      await requestAlarmPermissions();
    };
    init();

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
      try {
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

      const newAlarmSet: AlarmSet = {
        id: Date.now().toString(),
        start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        end:   endTime.toLocaleTimeString([],   { hour: '2-digit', minute: '2-digit' }),
        interval: intervalMinutes,
        count,
        active: true,
        notificationIds,
      };

      setAlarms((prev) => [...prev, newAlarmSet]);
      Alert.alert('Alarms Created!', `${count} alarms scheduled!`);
    } catch (e) {
      console.log('Failed to schedule alarms', e);
      Alert.alert('Error', 'Could not schedule alarms.');
    }
  };

  const openEditAlarmSet = (alarm: AlarmSet) => {
    setEditingAlarm(alarm);
  };

  const saveEditAlarmSetFromModal = async (
    newStart: Date,
    newEnd: Date,
    newInterval: number
  ) => {
    if (!editingAlarm) return;

    if (editingAlarm.notificationIds) {
      await cancelAlarmSet(editingAlarm.notificationIds);
    }

    try {
      const { count, notificationIds } = await scheduleAlarmSet(
        newStart,
        newEnd,
        newInterval
      );

      setAlarms((prev) =>
        prev.map((a) =>
          a.id === editingAlarm.id
            ? {
                ...a,
                start: newStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                end:   newEnd.toLocaleTimeString([],   { hour: '2-digit', minute: '2-digit' }),
                interval: newInterval,
                count,
                notificationIds,
                active: true,
              }
            : a
        )
      );

      setEditingAlarm(null);
      Alert.alert('Updated', 'Alarm set updated and rescheduled.');
    } catch (e) {
      Alert.alert('Error', 'Failed to reschedule alarms.');
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
        prev.map((a) =>
          a.id === id ? { ...a, active: false, notificationIds: [] } : a
        )
      );
    } else {
      const allowed = await requestAlarmPermissions();
      if (!allowed) return;

      const startParts = target.start.match(/(\d+):(\d+)\s?(AM|PM)?/i);
      const endParts   = target.end.match(/(\d+):(\d+)\s?(AM|PM)?/i);
      if (!startParts || !endParts) return;

      const parseTimeToDate = (parts: RegExpMatchArray) => {
        let h = Number(parts[1]);
        const m = Number(parts[2]);
        const p = parts[3]?.toUpperCase();
        if (p === 'PM' && h !== 12) h += 12;
        if (p === 'AM' && h === 12) h = 0;
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
      };

      const { notificationIds } = await scheduleAlarmSet(
        parseTimeToDate(startParts),
        parseTimeToDate(endParts),
        target.interval
      );

      setAlarms((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, active: true, notificationIds } : a
        )
      );
    }
  };

  const confirmDeleteAlarmSet = (id: string) => {
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
            if (target && target.notificationIds) {
              await cancelAlarmSet(target.notificationIds);
            }
            setAlarms((prev) => prev.filter((a) => a.id !== id));
            if (editingAlarm?.id === id) {
              setEditingAlarm(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const editInitialStart = React.useMemo(() => {
    if (!editingAlarm) return new Date();
    const parts = editingAlarm.start.match(/(\d+):(\d+)\s?(AM|PM)?/i);
    if (!parts) return new Date();
    let h = Number(parts[1]);
    const m = Number(parts[2]);
    const p = parts[3]?.toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }, [editingAlarm]);

  const editInitialEnd = React.useMemo(() => {
    if (!editingAlarm) return new Date();
    const parts = editingAlarm.end.match(/(\d+):(\d+)\s?(AM|PM)?/i);
    if (!parts) return new Date();
    let h = Number(parts[1]);
    const m = Number(parts[2]);
    const p = parts[3]?.toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }, [editingAlarm]);

  const intervalOptions = [1, 2, 3, 5, 10, 15, 20, 30];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alarm Flow</Text>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.alarmItem}
            onPress={() => openEditAlarmSet(item)}
          >
            <Switch
              value={item.active}
              onValueChange={() => toggleAlarmSet(item.id)}
            />
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

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Start Time</Text>
        <TouchableOpacity onPress={() => setShowStartPicker(true)}>
          <Text style={styles.timeText}>
            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        <Text style={styles.summaryLabel}>End Time</Text>
        <TouchableOpacity onPress={() => setShowEndPicker(true)}>
          <Text style={styles.timeText}>
            {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
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

      {/* Edit Modal — slides up over the screen when an alarm row is tapped */}
      <EditModal
        visible={editingAlarm !== null}
        initialStart={editInitialStart}
        initialEnd={editInitialEnd}
        initialInterval={editingAlarm?.interval ?? 10}
        onSave={saveEditAlarmSetFromModal}
        onCancel={() => setEditingAlarm(null)}
      />
    </View>
  );
}