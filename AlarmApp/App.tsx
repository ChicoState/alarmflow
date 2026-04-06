import React, { useState, useEffect } from 'react';
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

import styles from "./styles.js"

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
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState<Date>(new Date());
  const [editEndTime, setEditEndTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  }); //---------------Added new edit function into these lines(above and below)-------------------
  const [editIntervalMinutes, setEditIntervalMinutes] = useState<number>(10);
  const [showEditStartPicker, setShowEditStartPicker] = useState<boolean>(false);
  const [showEditEndPicker, setShowEditEndPicker] = useState<boolean>(false);
  const [showEditIntervalPicker, setShowEditIntervalPicker] = useState<boolean>(false);

    //guard against overlapping alarms
    const lastFiredRef = React.useRef<Record<string, string>>({});

  // check every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

     for(const set of alarms){
         if(!set.active) continue;

         //fire only once per minute to avoid overlapping alarms
         if(now.getSeconds() !== 0) continue;

         if(nowStr === set.end){

             //checks the date so that alarm can fire each day
             const minuteKey = `${now.toDateString()} ${now.getHours()}:${now.getMinutes()}`;

             //guards against overlapping alarms and re-firing within the same minute
             if (lastFiredRef.current[set.id] !== minuteKey) {
                 lastFiredRef.current[set.id] = minuteKey;
                   Alert.alert("Alarm!!!!", `Alarm set ended at ${set.end}`);

             //option to turn off batch after endtime ring
             //setAlarms(prev => prev.map(a => (a.id === set.id ? { ...a, active: false } : a)) );
            }
        }
     }
    }, 1000);


    return () => clearInterval(interval);
  },[alarms]);

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

/*
  const deleteAlarmSet = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    Alert.alert('Deleted', 'Alarm set removed (simulation)');
  };
*/

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
                  Alert.alert("Deleted", "Alarm set removed.")
                },
            },
        ],
        {cancelable: true}
      );

    };
  // edit alarms
  const openEditAlarmSet = (alarm: AlarmSet) => {
    const today = new Date(); 
    const [startHourString, startMinuteString] = alarm.start.split(':'); 
    const [endHourString, endMinuteString] = alarm.end.split(':');

    const start = new Date(today);
    start.setHours(Number(startHourString), Number(startMinuteString), 0, 0); //edit start time

    const end = new Date(today);
    end.setHours(Number(endHourString), Number(endMinuteString), 0, 0); //edit end time

    // updates ui
    setEditingAlarmId(alarm.id);
    setEditStartTime(start);
    setEditEndTime(end);

    // makes sure edit pickers are closed at first
    setEditIntervalMinutes(alarm.interval);
    setShowEditStartPicker(false);
    setShowEditEndPicker(false);
    setShowEditIntervalPicker(false);
  };

  const saveEditAlarmSet = () => {
    if (!editingAlarmId) return;

    let current = new Date(editStartTime);
    const end = new Date(editEndTime);
    const intervalMs = editIntervalMinutes * 60 * 1000;
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
              start: editStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              end: editEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              interval: editIntervalMinutes,
              count,
            }
          : a
      )
    );

    setEditingAlarmId(null);
    setShowEditStartPicker(false);
    setShowEditEndPicker(false);
    setShowEditIntervalPicker(false);
    Alert.alert('Alarm Updated!', `${count} alarms would be scheduled!`);
  };

  const cancelEditAlarmSet = () => {
    setEditingAlarmId(null);
    setShowEditStartPicker(false);
    setShowEditEndPicker(false);
    setShowEditIntervalPicker(false);
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
            //onLongPress={() => confirmDeleteAlarmSet(item.id)}
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
              onPress={() => openEditAlarmSet(item)}
              style={{
                backgroundColor: '#2196F3',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                marginRight: 8,
              }}
              >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity //nested TouchableOpacity could conflict with onPress
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

      {editingAlarmId && (
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Editing Current Alarm</Text>

          <Text style={styles.summaryLabel}>Start Time</Text>
          <Text style={styles.timeText}>
            {editStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <TouchableOpacity onPress={() => setShowEditStartPicker(true)}>
            <Text style={styles.clickable}>Quick Edit Start</Text>
          </TouchableOpacity>

          <Text style={styles.summaryLabel}>End Time</Text>
          <Text style={styles.timeText}>
            {editEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <TouchableOpacity onPress={() => setShowEditEndPicker(true)}>
            <Text style={styles.clickable}>Quick Edit End</Text>
          </TouchableOpacity>

          <Text style={styles.summaryLabel}>Interval</Text>
          <Text style={styles.timeText}>Every {editIntervalMinutes} minutes</Text>
          <TouchableOpacity onPress={() => setShowEditIntervalPicker(true)}>
            <Text style={styles.clickable}>Quick Edit Interval</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 12, gap: 8 }}>
            <Button
              title="Save Edit"
              onPress={saveEditAlarmSet}
              color="#4CAF50"
            />
            <Button
              title="Cancel Edit"
              onPress={cancelEditAlarmSet}
              color="#9E9E9E"
            />
          </View>
        </View>
      )}

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

      {showEditStartPicker && (
        <DateTimePicker
          value={editStartTime}
          mode="time"
          is24Hour={false}
          onChange={(event, selectedDate) => {
            setShowEditStartPicker(Platform.OS === 'ios');
            if (selectedDate) setEditStartTime(selectedDate);
          }}
        />
      )}

      {showEditEndPicker && (
        <DateTimePicker
          value={editEndTime}
          mode="time"
          is24Hour={false}
          onChange={(event, selectedDate) => {
            setShowEditEndPicker(Platform.OS === 'ios');
            if (selectedDate) setEditEndTime(selectedDate);
          }}
        />
      )}

      {showEditIntervalPicker && (
        <View style={styles.intervalPicker}>
          {intervalOptions.map((min) => (
            <TouchableOpacity
              key={min}
              style={styles.intervalOption}
              onPress={() => {
                setEditIntervalMinutes(min);
                setShowEditIntervalPicker(false);
              }}
            >
              <Text style={{ fontSize: 18 }}>{min} minutes</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => setShowEditIntervalPicker(false)}
          >
            <Text style={{ color: 'red', textAlign: 'center' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
