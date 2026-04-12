// ------------------------------------ //
// IMPORTS                              //
// ------------------------------------ //
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



// local classes
import DATE from './Date.js';
import { 
  ALARM 
} from './Alarm.js';

// local stylesheets
import styles from "./styles.js";



interface AlarmSet {
  id: string;
  start: string;           
  end: string;
  interval: number;        // minutes
  count: number;           // num of alarms
  active: boolean;
}



export default function App() {
  const [alarms,    setAlarms]    = useState<AlarmSet[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime,   setEndTime]   = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [intervalMinutes,    setIntervalMinutes]    = useState<number>(10);
  const [showStartPicker,    setShowStartPicker]    = useState<boolean>(false);
  const [showEndPicker,      setShowEndPicker]      = useState<boolean>(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState<boolean>(false);

  //guard against overlapping alarms
  const lastFiredRef = React.useRef<Record<string, string>>({});

  // check every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      for(const set of alarms){
        if(!set.active) continue;

        console.log(set);

        //fire only once per minute to avoid overlapping alarms
        if(now.getSeconds() !== 0) continue;

        console.log("seconds == 0")

        // set end to string
        const set_end_str = set.end.toDigitTime();

        console.log(nowStr, set_end_str)

        if(nowStr === set_end_str){

          console.log("alarm ringing...");

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
  },[alarms]);

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
    const times     = [startTime, endTime];
    const interval  = intervalMinutes;

    const alarm = new ALARM(times, interval, true);

    // {/*set alarm*/} //should not be in CreateIntervalAlarms
    const newAlarmSet: AlarmSet = {
      id: Date.now().toString(),
      start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: endTime.toLocaleTimeString([],     { hour: '2-digit', minute: '2-digit' }),
      interval: intervalMinutes,
      count,
      active: true,
    };

    setAlarms((prev) => [...prev, newAlarmSet]);
    Alert.alert('Alarms Created!', `${count} alarms would be scheduled!`);
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
              Start Time: {item.start.toDigitTime()} {'\n'}
               End Time: {item.end.toDigitTime()} {'\n'}
               Interval: {item.min_interval} min 
            </Text>
            <TouchableOpacity //nested TouchableOpacity could conflict with onPress
            onPress={() => confirmDeleteAlarmSet(item.id)}
            style={styles.deleteButton}
            >
            <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No alarms yet</Text>}
      />

      {/*Start time picker*/}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Start Time</Text>
        <Text style={styles.timeText}>
          {startTime.toDigitTime()}
        </Text>
        <TouchableOpacity onPress={() => setShowStartPicker(true)}>
          <Text style={styles.clickable}>Change Start</Text>
        </TouchableOpacity>
        {/* end time picker */}
        <Text style={styles.summaryLabel}>End Time</Text>
        <Text style={styles.timeText}>
          {endTime.toDigitTime()}
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
            if (selectedDate) setStartTime(new DATE(selectedDate));
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
            if (selectedDate) setEndTime(new DATE(selectedDate));
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