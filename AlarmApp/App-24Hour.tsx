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
  Modal,              // overlay for edit form
  KeyboardAvoidingView, // keeps pickers visible
  Pressable,          // tap-to-dismiss
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// local
import styles from "./styles.js"
import editStyles from "./edit_styles.js"
import SOUND from "./Sound.tsx"


interface AlarmSet {
  id: string;
  start: string;           
  end: string;
  interval: number;        // minutes
  count: number;           // num of alarms
  active: boolean;
}


interface EditModalProps {
  visible: boolean;
  initialStart: Date;
  initialEnd: Date;
  initialInterval: number;
  use24Hour: boolean;        
  onSave: (start: Date, end: Date, interval: number) => void;
  onCancel: () => void;
}


function EditModal({
  visible,
  initialStart,
  initialEnd,
  initialInterval,
  use24Hour,               
  onSave,
  onCancel,
}: EditModalProps) {
  // copies of the three time pickers
  const [modalStart,    setModalStart]    = useState<Date>(initialStart);
  const [modalEnd,      setModalEnd]      = useState<Date>(initialEnd);
  const [modalInterval, setModalInterval] = useState<number>(initialInterval);

  const [showStartPicker,    setShowStartPicker]    = useState(false);
  const [showEndPicker,      setShowEndPicker]      = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

  // sync local state each time the modal opens with fresh values
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

  // the options for the slider
  const timeLocaleOpts = use24Hour
    ? { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false }
    : { hour: '2-digit' as const, minute: '2-digit' as const };

  return (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onCancel}
  >
    <Pressable style={editStyles.editBackdrop} onPress={onCancel}>
      <Pressable onPress={() => {}}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={editStyles.editCard}>

            <View style={editStyles.editHandle} />

            <Text style={editStyles.editTitle}>
              Edit Alarm Set
            </Text>

            {/* Start */}
            <Text style={editStyles.editLabel}>Start Time</Text>
            <TouchableOpacity
              style={editStyles.editInputBox}
              onPress={() => {
                setShowEndPicker(false);
                setShowIntervalPicker(false);
                setShowStartPicker(true);
              }}
            >
              <Text style={editStyles.editInputText}>
                {modalStart.toLocaleTimeString([], timeLocaleOpts)}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={modalStart}
                mode="time"
                is24Hour={use24Hour}
                onChange={(event, selectedDate) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (selectedDate) setModalStart(selectedDate);
                }}
              />
            )}

            {/* End */}
            <Text style={editStyles.editLabelSpacing}>End Time</Text>
            <TouchableOpacity
              style={editStyles.editInputBox}
              onPress={() => {
                setShowStartPicker(false);
                setShowIntervalPicker(false);
                setShowEndPicker(true);
              }}
            >
              <Text style={editStyles.editInputText}>
                {modalEnd.toLocaleTimeString([], timeLocaleOpts)}
              </Text>
            </TouchableOpacity>

            {showEndPicker && (
              <DateTimePicker
                value={modalEnd}
                mode="time"
                is24Hour={use24Hour}
                onChange={(event, selectedDate) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (selectedDate) setModalEnd(selectedDate);
                }}
              />
            )}

            {/* Interval */}
            <Text style={editStyles.editLabelSpacing}>Interval</Text>
            <TouchableOpacity
              style={editStyles.editInputBox}
              onPress={() => {
                setShowStartPicker(false);
                setShowEndPicker(false);
                setShowIntervalPicker((prev) => !prev);
              }}
            >
              <Text style={editStyles.editInputText}>
                Every {modalInterval} minutes
              </Text>
            </TouchableOpacity>

            {showIntervalPicker && (
              <View style={editStyles.editIntervalContainer}>
                {intervalOptions.map((min) => (
                  <TouchableOpacity
                    key={min}
                    onPress={() => {
                      setModalInterval(min);
                      setShowIntervalPicker(false);
                    }}
                    style={[
                      editStyles.editIntervalButton,
                      modalInterval === min && editStyles.editIntervalButtonActive
                    ]}
                  >
                    <Text
                      style={[
                        editStyles.editIntervalText,
                        modalInterval === min && editStyles.editIntervalTextActive
                      ]}
                    >
                      {min} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Buttons */}
            <View style={editStyles.editButtonRow}>
              <TouchableOpacity
                onPress={onCancel}
                style={[editStyles.editButton, editStyles.editCancelButton]}
              >
                <Text style={editStyles.editCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onSave(modalStart, modalEnd, modalInterval)}
                style={[editStyles.editButton, editStyles.editSaveButton]}
              >
                <Text style={editStyles.editSaveText}>Save Edit</Text>
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
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  // repeating alarms
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [intervalDropdownOpen, setIntervalDropdownOpen] = useState(false);
  
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

  const [isLoaded, setIsLoaded] = useState(false);

  // save alarms
  useEffect(() => {
    if (!isLoaded) return;

    const saveAlarms = async () => {
      try { // save to alarms set
        await AsyncStorage.setItem('ALARMS', JSON.stringify(alarms));
      } catch (e) {
        console.log('Failed to save alarms', e);
      }
    };

    saveAlarms();
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

  const CreateIntervalAlarms = () => {
    let current = new Date(startTime);
    const end = new Date(endTime);
    const intervalMs = intervalMinutes * 60 * 1000;
    let count = 0;

    while (current <= end) {
      count++;
      current = new Date(current.getTime() + intervalMs);
    }

    // {/*set alarm*/} //should not be in CreateIntervalAlarms
    const newAlarmSet: AlarmSet = {
      id: Date.now().toString(),
      start: startTime.toLocaleTimeString([], timeLocaleOpts),
      end: endTime.toLocaleTimeString([],     timeLocaleOpts),
      interval: intervalMinutes,
      count,
      active: true,
    };

    setAlarms((prev) => [...prev, newAlarmSet]);
    Alert.alert('Alarms Created!', `${count} alarms would be scheduled!`);
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
    setIntervalMinutes(alarm.interval);

    // also open the modal with this alarm's values
    setEditingAlarm(alarm);
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

  // modal save 
  const saveEditAlarmSetFromModal = (newStart: Date, newEnd: Date, newInterval: number) => {
    if (!editingAlarm) return;

    let current = new Date(newStart);
    const end = new Date(newEnd);
    const intervalMs = newInterval * 60 * 1000;
    let count = 0;

    while (current <= end) {
      count++;
      current = new Date(current.getTime() + intervalMs);
    }

    setAlarms((prev) =>
      prev.map((a) =>
        a.id === editingAlarm.id
          ? {
              ...a,
              start: newStart.toLocaleTimeString([], timeLocaleOpts),
              end:   newEnd.toLocaleTimeString([],   timeLocaleOpts),
              interval: newInterval,
              count,
            }
          : a
      )
    );

    setEditingAlarmId(null);
    setEditingAlarm(null);  // close modal
    Alert.alert("Updated", "Alarm set updated.");
  };

  // Issues here -  something with ID string/integers.
  const toggleAlarmSet = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
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
                onPress: () => {
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

  // derive Date objects from editingAlarm for the modal's initial values
  const editInitialStart = React.useMemo(() => {
    if (!editingAlarm) return new Date();
    const parts = editingAlarm.start.match(/(\d+):(\d+)\s?(AM|PM)?/i);
    if (!parts) return new Date();
    let h = Number(parts[1]);
    const m = Number(parts[2]);
    const p = parts[3]?.toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h  = 0;
    const d = new Date(); d.setHours(h, m, 0, 0); return d;
  }, [editingAlarm]);

  const editInitialEnd = React.useMemo(() => {
    if (!editingAlarm) return new Date();
    const parts = editingAlarm.end.match(/(\d+):(\d+)\s?(AM|PM)?/i);
    if (!parts) return new Date();
    let h = Number(parts[1]);
    const m = Number(parts[2]);
    const p = parts[3]?.toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h  = 0;
    const d = new Date(); d.setHours(h, m, 0, 0); return d;
  }, [editingAlarm]);

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
            {startTime.toLocaleTimeString([], timeLocaleOpts)}
          </Text>
        </TouchableOpacity>

        {/* end time picker */}
        <Text style={styles.summaryLabel}>End Time</Text>
        <TouchableOpacity onPress={() => setShowEndPicker(true)}>
          <Text style={styles.timeText}>
            {endTime.toLocaleTimeString([], timeLocaleOpts)}
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
        title={editingAlarmId ? "Save Edit" : "Create Alarm Set"}
        onPress={editingAlarmId ? saveEditAlarmSet : CreateIntervalAlarms}
        color="#4CAF50"
      />

      {/* Time Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={use24Hour}
          onChange={onStartTimeUpdate}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={use24Hour}
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

      {/* slides up over the screen when a alarm row is tapped */}
      <EditModal
        visible={editingAlarm !== null}
        initialStart={editInitialStart}
        initialEnd={editInitialEnd}
        initialInterval={editingAlarm?.interval ?? 10}
        use24Hour={use24Hour}
        onSave={saveEditAlarmSetFromModal}
        onCancel={() => {
          setEditingAlarm(null);
          setEditingAlarmId(null);
        }}
      />
    </View>
  );
}