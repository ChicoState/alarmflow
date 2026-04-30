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
  Modal,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// local
import styles from "./styles.js"
import SOUND from "./Sound.tsx"


//TODO: convert repeats to singles
interface RepeatAlarm {
  id: string;
  start: string;           
  end: string;
  interval: number;        // minutes
  count: number;           // num of alarms
  active: boolean;
}
interface SingleAlarm {
  id: string;
  start: string;
  active: boolean;
}


export default function App() {
  const [rAlarms, setRepeatAlarms] = useState<RepeatAlarm[]>([]);
  const [sAlarms, setSingleAlarms] = useState<SingleAlarm[]>([]);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime]     = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  });
  
  const [intervalMinutes, setIntervalMinutes]           = useState<number>(10);
  const [showStartPicker, setShowStartPicker]           = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker]               = useState<boolean>(false);
  const [showIntervalPicker, setShowIntervalPicker]     = useState<boolean>(false);
  const [editingAlarmId, setEditingAlarmId]             = useState<string | null>(null);
  const [showAlarmModal, setShowAlarmModal]             = useState(false);
  const [intervalDropdownOpen, setIntervalDropdownOpen] = useState(false);

  //guard against overlapping alarms
  const lastFiredRef = React.useRef<Record<string, string>>({});

  // check every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // UPDATE CURRENT TIME
      setCurrentTime(now);

      // REPEAT ALARMS
      for (const set of rAlarms) {
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
  }, [rAlarms]);

  const [isLoaded, setIsLoaded] = useState(false);

  // save alarms
  useEffect(() => {
    if (!isLoaded) return;

    const saveAlarms = async () => {
      try { // save to alarms set
        await AsyncStorage.setItem('ALARMS', JSON.stringify(rAlarms));
      } catch (e) {
        console.log('Failed to save alarms', e);
      }
    };

    saveAlarms();
  }, [rAlarms, isLoaded]);

  // load alarms
  useEffect(() => {
    const loadAlarms = async () => {
      try { // load stored alarms set
        const stored = await AsyncStorage.getItem('ALARMS');
        if (stored !== null) {
          setRepeatAlarms(JSON.parse(stored));
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
    const newRepeatAlarm: RepeatAlarm = {
      id: Date.now().toString(),
      start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: endTime.toLocaleTimeString([],     { hour: '2-digit', minute: '2-digit' }),
      interval: intervalMinutes,
      count,
      active: true,
    };

    setRepeatAlarms((prev) => [...prev, newRepeatAlarm]);
    //Alert.alert('Alarms Created!', `${count} alarms would be scheduled!`);
  };

  const openEditRepeatAlarm = (alarm: RepeatAlarm) => {
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

    setShowAlarmModal(true);
  };

  const saveEditRepeatAlarm = () => {
    if (!editingAlarmId) return;

    let current = new Date(startTime);
    const end = new Date(endTime);
    const intervalMs = intervalMinutes * 60 * 1000;
    let count = 0;

    while (current <= end) {
      count++;
      current = new Date(current.getTime() + intervalMs);
    }

    setRepeatAlarms((prev) =>
      prev.map((a) =>
        a.id === editingAlarmId
          ? {
              ...a,
              start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              end: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              interval: intervalMinutes,
              count,
            }
          : a
      )
    );

    setEditingAlarmId(null);
    Alert.alert("Updated", "Alarm set updated.");
  };

  // Issues here -  something with ID string/integers.
  const toggleRepeatAlarm = (id: string) => {
    setRepeatAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };


  const confirmDeleteRepeatAlarm = (id: string) => {
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
                  setRepeatAlarms(prev => prev.filter(a => a.id !== id));
                  if (editingAlarmId === id) {
                    setEditingAlarmId(null);
                  }
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

      {/* rAlarms List */}
      <FlatList
        data={rAlarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.alarmItem}
            onPress={() => openEditRepeatAlarm(item)}
          >
            <Switch
              value={item.active}
              onValueChange={() => toggleRepeatAlarm(item.id)}
            />
            {/* summarized alarm text */}
            <Text style={styles.alarmText}>
              Start Time: {item.start} {'\n'}
              End Time: {item.end} {'\n'}
              Interval: {item.interval} min
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => confirmDeleteRepeatAlarm(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No alarms yet</Text>}
      />

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
                editingAlarmId ? saveEditRepeatAlarm() : CreateIntervalAlarms();
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

      {/*Start time picker*/}
      <View>
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

        {/* current time */}
        <Text style={styles.timeTitle}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>          

        {/* single alarm button */}
        <TouchableOpacity 
          style={styles.fabLeft}
          onPress={() => {
            setEditingAlarmId(null);
            setShowAlarmModal(true);
          }}
        > 
          <Image
            source={require('./assets/single_icon.png')}
            style={styles.buttonImageIcon}
          />
        </TouchableOpacity>
      
        {/* repeat alarm button */}
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
      
      </View>
    </View>
  );
}