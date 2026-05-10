import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Button,
  Image,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,                // overlay for edit form
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import styles from "./styles.js"

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
  const [intervalDropdownOpen, setIntervalDropdownOpen] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // repeat
  const [showAlarmModal, setShowAlarmModal] = useState(false);

  // single alarms
  const [alarmTime, setAlarmTime] = useState<Date>(new Date());
  const [showSingleAlarmPicker, setShowSingleAlarmPicker] = useState<boolean>(false);
  const [showSingleAlarmModal, setShowSingleAlarmModal] = useState(false);
  
  // current time
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // store the full alarm object being edited 
  // null means the modal is closed.
  const [editingAlarm, setEditingAlarm] = useState<AlarmSet | null>(null);

  // 24hour  toggle
  const [use24Hour, setUse24Hour] = useState<boolean>(false);

  const timeLocaleOpts = use24Hour
    ? { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false }
    : { hour: '2-digit' as const, minute: '2-digit' as const };

  //guard against overlapping alarms
  const lastFiredRef = React.useRef<Record<string, string>>({});

  // helper. parses a stored time string ("02:30 PM" or "14:30") into a Date
  const parseTimeString = (t: string): Date | null => {
    const parts = t.match(/(\d+):(\d+)\s?(AM|PM)?/i);
    if (!parts) return null;
    let h = Number(parts[1]);
    const m = Number(parts[2]);
    const p = parts[3]?.toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    const d = new Date(); d.setHours(h, m, 0, 0); return d;
  };

  // changes all existing alarm when switching modes
  const toggleUse24Hour = (val: boolean) => {
    const newOpts = val
      ? { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false }
      : { hour: '2-digit' as const, minute: '2-digit' as const };
    setAlarms((prev) =>
      prev.map((a) => {
        const startDate = parseTimeString(a.start);
        const endDate   = parseTimeString(a.end);
        return {
          ...a,
          start: startDate ? startDate.toLocaleTimeString([], newOpts) : a.start,
          end:   endDate   ? endDate.toLocaleTimeString([],   newOpts) : a.end,
        };
      })
    );
    setUse24Hour(val);
  };

  // load 24h preference
  useEffect(() => {
    AsyncStorage.getItem('USE_24_HOUR').then((val) => {
      if (val !== null) setUse24Hour(val === 'true');
    });
  }, []);

  // save 24h preference whenever it changes
  useEffect(() => {
    AsyncStorage.setItem('USE_24_HOUR', String(use24Hour));
  }, [use24Hour]);

  // check every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // set current time
      setCurrentTime(now);

      for (const set of alarms) {
        if (!set.active) continue;

        //fire only once per minute to avoid overlapping alarms
        if (now.getSeconds() !== 0) continue;

        if (nowStr === set.end) {

          //checks the date so that alarm can fire each day
          const minuteKey = `${now.toDateString()} ${now.getHours()}:${now.getMinutes()}`;

          //guards against overlapping alarms and re-firing within the same minute
          if (lastFiredRef.current[set.id] !== minuteKey) {
            lastFiredRef.current[set.id] = minuteKey;
            Alert.alert("Alarm!!!!", `Alarm set ended at ${set.end}`);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms]);

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

      const newAlarmSet: AlarmSet = {
        id: Date.now().toString(),
        start: startTime.toLocaleTimeString([], timeLocaleOpts),
        end: endTime.toLocaleTimeString([],     timeLocaleOpts),
        interval: intervalMinutes,
        count,
        active: true,
        notificationIds,
      };

      setAlarms((prev) => [...prev, newAlarmSet]);
      Alert.alert('Alarms Created!', `${count} alarms would be scheduled!`);
    } catch (e: any) {
      console.log('Failed to schedule alarms', e);

      Alert.alert('Error', String(e?.message ?? e));
    }
  };

  const CreateSingleAlarm = async () => {
    const allowed = await requestAlarmPermissions();
    if (!allowed) return;

    try {
      console.log(0);

      const { count, notificationIds } = await scheduleAlarmSet(
        startTime,
        startTime,
        1
      );

      console.log(1, count);

      const newAlarmSet: AlarmSet = {
        id: Date.now().toString(),
        start: alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        end: alarmTime.toLocaleTimeString([],     { hour: '2-digit', minute: '2-digit' }),
        interval: 0,
        count: 1,
        active: true,
        notificationIds,
      };

      console.log(2);

      setAlarms((prev) => [...prev, newAlarmSet]);
      Alert.alert('Alarms Created!', `${count} alarms would be scheduled!`);
    } catch (e: any) {
      console.log('Failed to schedule alarms', e);

      Alert.alert('Error', String(e?.message ?? e));
    }
  };

  const openEditAlarmSet = (alarm: AlarmSet) => {
    const today = new Date();
    // parse stored time
    const startParts = alarm.start.match(/(\d+):(\d+)\s?(AM|PM)?/i);
    const endParts = alarm.end.match(/(\d+):(\d+)\s?(AM|PM)?/i);

    if (!startParts || !endParts) {
      Alert.alert("Can't edit alarm!");
      return;
    }

    // gets the alarm's start time
    let startHour = Number(startParts[1]);
    const startMinute = Number(startParts[2]);
    const startPeriod = startParts[3]?.toUpperCase();
    // gets the alarm's end time
    let endHour = Number(endParts[1]);
    const endMinute = Number(endParts[2]);
    const endPeriod = endParts[3]?.toUpperCase();

    // had to do it like this or it breaks. conversion to 24hr time
    if (startPeriod === "PM" && startHour !== 12) startHour += 12;
    if (startPeriod === "AM" && startHour === 12) startHour = 0;

    if (endPeriod === "PM" && endHour !== 12) endHour += 12;
    if (endPeriod === "AM" && endHour === 12) endHour = 0;

    const start = new Date(today);
    start.setHours(startHour, startMinute, 0, 0);

    const end = new Date(today);
    end.setHours(endHour, endMinute, 0, 0);

    // set editing state
    setEditingAlarmId(alarm.id);
    setStartTime(start);
    setEndTime(end);

    // model choice
    if (startHour == endHour && startMinute == endMinute && alarm.interval == 0){
      // SINGLE ALARM
      setShowSingleAlarmModal(true);
    }
    else {
      // REPEATING ALARM
      // update interval ONLY on repeating alarm to prevent
      //   '0 min' interval bugs in single alarm
      setIntervalMinutes(alarm.interval);
      setShowAlarmModal(true);
    }
  };

  const saveEditAlarmSet = () => {
    if (!editingAlarmId) return;

    let current = new Date(startTime);
    const end = new Date(endTime);
    const intervalMs = intervalMinutes * 60 * 1000;
    let count = 0;

    while (current <= end) {
      count++;
      current = new Date(current.getTime() + intervalMs);
    }

    setAlarms((prev) =>
      prev.map((a) =>
        a.id === editingAlarmId
          ? {
              ...a,
              start: startTime.toLocaleTimeString([], timeLocaleOpts),
              end: endTime.toLocaleTimeString([], timeLocaleOpts),
              interval: intervalMinutes,
              count,
            }
          : a
      )
    );

    setEditingAlarmId(null);
    Alert.alert("Updated", "Alarm set updated.");
  };

  const saveEditSingleAlarm = () => {
    if (!editingAlarmId) return;

    let count = 1;
    let min_interval = 0;

    setAlarms((prev) =>
      prev.map((a) =>
        a.id === editingAlarmId
          ? {
              ...a,
              start: alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              end: alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              interval: min_interval,
              count: count,
            }
          : a
      )
    );

    setEditingAlarmId(null);
    Alert.alert("Updated", "Alarm set updated.");
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
            if (editingAlarmId === id) {
              setEditingAlarmId(null);
            }
            // close modal if the alarm being edited is deleted
            if (editingAlarm?.id === id) {
              setEditingAlarm(null);
            }
          },
        },
      ],
      {cancelable: true}
    );
  };

  const intervalOptions = [1, 2, 3, 5, 10, 15, 20, 30];
  

  // REPEATING ALARM
  const onStartTimeUpdate = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android'){
      setShowStartPicker(false);
    }
    if (selectedDate){
      setStartTime(selectedDate);
    }
  }, []);
  const onEndTimeUpdate = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android'){
      setShowEndPicker(false);
    }
    if (selectedDate){
      setEndTime(selectedDate);
    }
  }, []);
  // SINGLE ALARM
  const onSingleAlarmTimeUpdate = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android'){
      setShowSingleAlarmPicker(false);
    }
    if (selectedDate){
      setAlarmTime(selectedDate);
    }
  }, []);

  return (
    <View style={styles.container}>

      {/* 24h toggle added to top right */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.title}>Alarm Flow</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 12, color: '#888' }}>{use24Hour ? '24h' : '12h'}</Text>
          <Switch
            value={use24Hour}
            onValueChange={toggleUse24Hour}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
          />
        </View>
      </View>

      {/* Alarms List */}
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
              trackColor={{ false: 'grey', true: '#d6ecff' }}
              thumbColor={item.active ? '#2196f3' : '#d6ecff'}
            />
            {/* summarized alarm text */}
            <Text style={styles.alarmText}>
              {item.end === item.start ? (
                <>{'\n'}</>
              ) : (
                <>Start Time: {item.start} {'\n'}</>
              )}
              {item.end === item.start ? (
                <>Alarm Time: {item.start} {'\n'}</>
              ) : (
                <>End Time: {item.end} {'\n'}</>
              )}
              {item.interval === 0 ? ( 
                <></>
              ) : (
                <>Interval: {item.interval} min</>
              )}
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

      {/* REPEAT ALARM */}
      <Modal
        visible = {showAlarmModal}
        animationType = "slide"
        transparent = {true}
      >
        <View style = {styles.modalOverlay}>
          <View style = {styles.modalBox}>
            <Text style={styles.title}>
              {editingAlarmId ? "Edit Alarm" : "Create Alarm"}
            </Text>

            {/* start */}
            <Text style = {styles.summaryLabel}>Start Time</Text>
            <TouchableOpacity onPress = {() => setShowStartPicker(true)}>
              <Text style = {styles.timeText}>
                {startTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </TouchableOpacity>

            {/* end */}
            <Text style = {styles.summaryLabel}>End Time</Text>
            <TouchableOpacity onPress = {() => setShowEndPicker(true)}>
              <Text style = {styles.timeText}>
                {endTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </TouchableOpacity>

            {/* interval picker */}
            <Text style = {styles.summaryLabel}>Interval</Text>
            <TouchableOpacity
              onPress = {() => setIntervalDropdownOpen(!intervalDropdownOpen)}
              style = {styles.dropdownButton}
            >
              <Text style = {styles.timeText}>
                Every {intervalMinutes} minutes
              </Text>
            </TouchableOpacity>

            {intervalDropdownOpen && (
              <View style = {styles.dropdownBox}>
                {intervalOptions.map((min) => (
                  <TouchableOpacity
                    key = {min}
                    onPress = {() => {
                      setIntervalMinutes(min);
                      setIntervalDropdownOpen(false);
                    }}
                    style = {styles.dropdownItem}
                  >
                    <Text>{min} minutes</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Button
              title = {editingAlarmId ? "Save Edit" : "Create"}
              onPress={() => {
                editingAlarmId ? saveEditAlarmSet() : CreateIntervalAlarms();
                setShowAlarmModal(false);
              }}
            />

            <Button
              title = "Cancel"
              color = "red"
              onPress={() => setShowAlarmModal(false)}
            />
          </View>
        </View>
      </Modal>


      {/* SINGLE ALARM */}
      <Modal
        visible = {showSingleAlarmModal}
        animationType = "slide"
        transparent = {true}
      >
        <View style = {styles.modalOverlay}>
          <View style = {styles.modalBox}>
            <Text style={styles.title}>
              {editingAlarmId ? "Edit Alarm" : "Create Alarm"}
            </Text>

            {/* start */}
            <Text style = {styles.summaryLabel}>Alarm Time</Text>
            <TouchableOpacity onPress = {() => setShowSingleAlarmPicker(true)}>
              <Text style = {styles.timeText}>
                {alarmTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </TouchableOpacity>

            <Button
              title = {editingAlarmId ? "Save Edit" : "Create"}
              onPress={() => {
                editingAlarmId ? saveEditSingleAlarm() : CreateSingleAlarm();
                setShowSingleAlarmModal(false);
              }}
            />

            <Button
              title = "Cancel"
              color = "red"
              onPress={() => setShowSingleAlarmModal(false)}
            />
          </View>
        </View>
      </Modal>

      {/*Start time picker*/}
      <View style={styles.summary}>
        {/* Time Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={false}
            onChange={onStartTimeUpdate}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            is24Hour={false}
            onChange={onEndTimeUpdate}
          />
        )}
        {showSingleAlarmPicker && (
          <DateTimePicker
            value={alarmTime}
            mode="time"
            is24Hour={false}
            onChange={onSingleAlarmTimeUpdate}
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

        {/* Repeat button */}
        <TouchableOpacity 
          style={styles.fabRight}
          onPress={() => {
            setEditingAlarmId(null);
            setShowAlarmModal(true);
          }}
        > 
          <Image
            source={require('./assets/repeat_icon.png')}
            style={styles.buttonImageIcon}
          />
        </TouchableOpacity>

        {/* current time */}
        <Text style={styles.timeTitle}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text> 

        {/* Single button */}
        <TouchableOpacity 
          style={styles.fabLeft}
          onPress={() => {
            setEditingAlarmId(null);
            setShowSingleAlarmModal(true);
          }}
        > 
          <Image
            source={require('./assets/single_icon.png')}
            style={styles.buttonImageIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
